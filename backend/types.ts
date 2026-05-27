import { Request } from 'express';

export type UserRole = 'General User' | 'Admin' | 'Super Admin';

export interface StoredUser {
  id: string;
  userId: string;
  password: string;
  displayName: string;
  role: UserRole;
  department: string;
  accessLevel: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface PublicUser {
  id: string;
  userId: string;
  displayName: string;
  role: UserRole;
  department: string;
  accessLevel: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface StoredRecord {
  id: string;
  title: string;
  category: string;
  ownerUserId: string;
  accessLevel: string;
  status: string;
  sensitivity: string;
  updatedAt: string;
}

export interface PublicRecord extends StoredRecord {
  ownerName: string;
}

export interface LoginPayload {
  userId: string;
  password: string;
  role: UserRole;
}

export interface UserMutationPayload {
  userId: string;
  displayName: string;
  password?: string;
  role: UserRole;
  department: string;
  accessLevel: string;
  active: boolean;
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
  issuedAt: string;
}

export interface AuthenticatedRequest extends Request {
  user?: PublicUser;
}

export type TaskStatus = 'Completed' | 'In Progress' | 'Pending' | 'Overdue' | 'Cancelled';
export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedUserId: string;
  assignedByUserId: string;
  dueDate: string;
  completedAt?: string;
  score?: number;          // 1-100 quality score for completed tasks
  createdAt: string;
}

export interface PerformanceStats {
  totalTasks: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  cancelled: number;
  onTimeRate: number;      // percentage 0-100
  avgScore: number;        // average quality score 0-100
  completionRate: number;  // percentage 0-100
  streak: number;          // consecutive on-time completions
}

export interface EmployeeProfile {
  user: PublicUser;
  stats: PerformanceStats;
  tasks: TaskRecord[];
  recentActivity: AuditSummary[];
}

export interface AuditSummary {
  timestamp: string;
  action: string;
  details: string;
}
