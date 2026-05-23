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
