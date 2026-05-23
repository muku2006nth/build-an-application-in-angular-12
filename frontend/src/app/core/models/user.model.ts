export type UserRole = 'General User' | 'Admin';

export interface LoginRequest {
  userId: string;
  password: string;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  role: UserRole;
  department: string;
  accessLevel: string;
  active: boolean;
  lastLoginAt?: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}

export interface UserRecord {
  id: string;
  title: string;
  category: string;
  ownerUserId: string;
  ownerName: string;
  accessLevel: string;
  status: string;
  sensitivity: string;
  updatedAt: string;
}

export interface RecordsResponse {
  records: UserRecord[];
  scope: string;
}

export interface ManagedUser extends UserProfile {
  createdAt: string;
}

export interface UserMutation {
  userId: string;
  displayName: string;
  password?: string;
  role: UserRole;
  department: string;
  accessLevel: string;
  active: boolean;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  performedBy: string;
  targetUserId: string;
  details: string;
}

export type TaskStatus   = 'Completed' | 'In Progress' | 'Pending' | 'Overdue' | 'Cancelled';
export type TaskPriority = 'Critical'  | 'High'        | 'Medium'  | 'Low';

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
  score?: number;
  createdAt: string;
}

export interface PerformanceStats {
  totalTasks: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  cancelled: number;
  onTimeRate: number;
  avgScore: number;
  completionRate: number;
  streak: number;
}

export interface ActivityEntry {
  timestamp: string;
  action: string;
  details: string;
}

export interface EmployeeProfile {
  user: ManagedUser;
  stats: PerformanceStats;
  tasks: TaskRecord[];
  recentActivity: ActivityEntry[];
}
