import fs from 'node:fs/promises';
import path from 'node:path';
import {
  EmployeeProfile,
  PerformanceStats,
  PublicUser,
  TaskPriority,
  TaskRecord,
  TaskStatus
} from '../types';
import { AuditLog } from './audit-log';

// ── Seed data per user (deterministic, no randomness so the UI is stable) ───

const TASK_TEMPLATES: Record<string, { title: string; description: string; category: string; priority: TaskPriority }[]> = {
  'general': [
    { title: 'Onboard Q2 enterprise clients',        description: 'Complete onboarding checklist for 12 new enterprise accounts in Q2.', category: 'Operations', priority: 'High'     },
    { title: 'Resolve open support escalations',     description: 'Clear backlog of 8 escalated tickets before end of sprint.', category: 'Support', priority: 'Critical' },
    { title: 'Update SLA documentation',             description: 'Revise SLA documentation to reflect new response-time policies.', category: 'Documentation', priority: 'Medium' },
    { title: 'Quarterly customer health review',     description: 'Prepare health score report for all top-tier accounts.', category: 'Operations', priority: 'High'     },
    { title: 'Training: Advanced CRM workflows',     description: 'Complete internal CRM training module for Q2 certification.', category: 'Training', priority: 'Low'      },
    { title: 'Customer feedback analysis',           description: 'Analyse Q1 NPS results and create an action plan.', category: 'Analytics', priority: 'Medium' },
    { title: 'Renewal pipeline prep',               description: 'Prepare renewal deck for 6 accounts due in June.', category: 'Sales Ops', priority: 'High'     },
    { title: 'Internal audit response — CS team',   description: 'Collate evidence and answer audit queries for CS department.', category: 'Compliance', priority: 'Critical' },
  ],
  'analyst': [
    { title: 'Risk model re-calibration',            description: 'Recalibrate credit risk model with Q1 actuals.', category: 'Risk', priority: 'Critical' },
    { title: 'Monthly risk exception report',        description: 'Compile monthly exception register and present to risk committee.', category: 'Reporting', priority: 'High'     },
    { title: 'Stress-test scenario modelling',       description: 'Run three additional stress scenarios per regulator guidance.', category: 'Analytics', priority: 'High'     },
    { title: 'Data lineage mapping',                 description: 'Document data lineage for all tier-1 risk metrics.', category: 'Governance', priority: 'Medium' },
    { title: 'Counterparty exposure dashboard',      description: 'Build live dashboard tracking counterparty exposure limits.', category: 'Analytics', priority: 'High'     },
    { title: 'Regulatory submission — ICAAP',        description: 'Finalise and submit internal capital adequacy assessment.', category: 'Compliance', priority: 'Critical' },
    { title: 'Python ETL pipeline optimisation',     description: 'Reduce nightly ETL run time by at least 30 pct.', category: 'Engineering', priority: 'Medium' },
    { title: 'Peer review: credit scoring model v3', description: 'Conduct structured peer review of v3 scoring model.', category: 'Risk', priority: 'Low'      },
  ],
  'admin': [
    { title: 'Platform quarterly access review',     description: 'Review and certify all user access rights for Q2.', category: 'Security', priority: 'Critical' },
    { title: 'Incident response runbook update',     description: 'Update IR runbook for new cloud infra layout.', category: 'Operations', priority: 'High'     },
    { title: 'Vendor security assessment',           description: 'Complete security questionnaire for 3 new SaaS vendors.', category: 'Compliance', priority: 'High'     },
    { title: 'Deploy monitoring stack upgrade',      description: 'Upgrade Prometheus + Grafana to latest stable release.', category: 'Engineering', priority: 'Medium' },
    { title: 'SOC 2 Type II prep',                   description: 'Coordinate evidence collection for upcoming SOC 2 audit.', category: 'Compliance', priority: 'Critical' },
    { title: 'DR drill — failover test',             description: 'Execute scheduled DR failover drill and document results.', category: 'Operations', priority: 'High'     },
    { title: 'Team OKR mid-cycle review',            description: 'Facilitate mid-cycle OKR review sessions with all sub-teams.', category: 'Leadership', priority: 'Medium' },
    { title: 'Pipeline cost optimisation review',    description: 'Identify cloud spend reduction opportunities in Q2 budget.', category: 'Finance', priority: 'Low'      },
  ]
};

const DEFAULT_TASKS: { title: string; description: string; category: string; priority: TaskPriority }[] = [
  { title: 'Complete onboarding setup',  description: 'Finish all onboarding steps for the workspace.', category: 'General', priority: 'High'   },
  { title: 'Profile review',             description: 'Review and update your user profile details.', category: 'General', priority: 'Low'    },
  { title: 'Team sync participation',    description: 'Attend weekly team sync and contribute updates.', category: 'General', priority: 'Medium' },
  { title: 'Document review',            description: 'Review assigned documentation before the deadline.', category: 'General', priority: 'Medium' },
];

// Statuses assigned deterministically by task index to create a realistic spread
const STATUS_SPREAD: TaskStatus[] = [
  'Completed', 'Completed', 'Completed', 'In Progress',
  'Overdue', 'Pending', 'Completed', 'Cancelled'
];

// Scores for completed tasks (deterministic by index)
const SCORES = [92, 88, 95, 78, 85, 91, 72, 89];

function daysBefore(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysAhead(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

export class TaskStore {
  private readonly tasksPath: string;

  constructor(dataDir: string) {
    this.tasksPath = path.join(dataDir, 'tasks.json');
  }

  async getEmployeeProfile(user: PublicUser, auditLog: AuditLog): Promise<EmployeeProfile> {
    const tasks = await this.getTasksForUser(user);
    const stats = this.computeStats(tasks);

    // Pull the last 10 audit events involving this user
    const allAudit = await auditLog.readAll();
    const recentActivity = allAudit
      .filter((e) => e.targetUserId === user.userId || e.performedBy === user.userId)
      .slice(-10)
      .reverse()
      .map((e) => ({ timestamp: e.timestamp, action: e.action, details: e.details }));

    return { user, stats, tasks, recentActivity };
  }

  private async getTasksForUser(user: PublicUser): Promise<TaskRecord[]> {
    // Try loading persisted tasks first
    try {
      const raw = await fs.readFile(this.tasksPath, 'utf8');
      const all = JSON.parse(raw) as TaskRecord[];
      const userTasks = all.filter((t) => t.assignedUserId === user.userId);
      if (userTasks.length > 0) return userTasks;
    } catch {
      // file doesn't exist yet — seed it below
    }

    // Seed all users' tasks on first call
    return this.seedAndSave(user);
  }

  private async seedAndSave(requestedUser: PublicUser): Promise<TaskRecord[]> {
    // Build tasks for all known users so file is populated completely
    const allUsers = Object.keys(TASK_TEMPLATES);
    const allTasks: TaskRecord[] = [];

    for (const userId of allUsers) {
      const templates = TASK_TEMPLATES[userId] ?? DEFAULT_TASKS;
      templates.forEach((tpl, i) => {
        const status = STATUS_SPREAD[i % STATUS_SPREAD.length];
        const isCompleted = status === 'Completed';
        const isOverdue   = status === 'Overdue';

        allTasks.push({
          id:              `tsk-${userId}-${i + 1}`,
          title:           tpl.title,
          description:     tpl.description,
          category:        tpl.category,
          status,
          priority:        tpl.priority,
          assignedUserId:  userId,
          assignedByUserId:'admin',
          dueDate:         isOverdue   ? daysBefore(3 + i)  : daysAhead(5 + i * 3),
          completedAt:     isCompleted ? daysBefore(1 + i)  : undefined,
          score:           isCompleted ? SCORES[i % SCORES.length] : undefined,
          createdAt:       daysBefore(30 - i * 2)
        });
      });
    }

    await fs.mkdir(path.dirname(this.tasksPath), { recursive: true });
    await fs.writeFile(this.tasksPath, JSON.stringify(allTasks, null, 2), 'utf8');

    return allTasks.filter((t) => t.assignedUserId === requestedUser.userId);
  }

  private computeStats(tasks: TaskRecord[]): PerformanceStats {
    const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s).length;

    const completed   = byStatus('Completed');
    const inProgress  = byStatus('In Progress');
    const pending     = byStatus('Pending');
    const overdue     = byStatus('Overdue');
    const cancelled   = byStatus('Cancelled');
    const total       = tasks.length;

    const scoredTasks = tasks.filter((t) => typeof t.score === 'number');
    const avgScore    = scoredTasks.length > 0
      ? Math.round(scoredTasks.reduce((s, t) => s + (t.score ?? 0), 0) / scoredTasks.length)
      : 0;

    // On-time = completed before or on dueDate
    const onTimeTasks = tasks.filter(
      (t) => t.status === 'Completed' && t.completedAt && t.completedAt <= t.dueDate
    ).length;
    const onTimeRate    = completed > 0 ? Math.round((onTimeTasks / completed) * 100)    : 0;
    const completionRate = total    > 0 ? Math.round((completed   / total)      * 100)   : 0;

    // Streak: consecutive completed tasks counting from most recent
    let streak = 0;
    const sorted = [...tasks]
      .filter((t) => t.status === 'Completed' || t.status === 'Overdue')
      .sort((a, b) => (b.completedAt ?? b.dueDate).localeCompare(a.completedAt ?? a.dueDate));
    for (const t of sorted) {
      if (t.status === 'Completed') { streak++; } else { break; }
    }

    return { totalTasks: total, completed, inProgress, pending, overdue, cancelled, onTimeRate, avgScore, completionRate, streak };
  }
}
