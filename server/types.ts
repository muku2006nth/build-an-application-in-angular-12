import { Request } from 'express';

export type UserRole = 'General User' | 'Admin';

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
