import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  LoginPayload,
  PublicRecord,
  PublicUser,
  StoredRecord,
  StoredUser,
  UserMutationPayload,
  UserRole
} from '../types';

interface XmlDatabase {
  users: StoredUser[];
  records: StoredRecord[];
}

interface RawDatabaseDocument {
  database?: {
    users?: {
      user?: RawUser | RawUser[];
    };
    records?: {
      record?: RawRecord | RawRecord[];
    };
  };
}

type RawUser = Omit<StoredUser, 'active'> & {
  active: boolean | string;
};

type RawRecord = StoredRecord;

export class XmlStore {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true
  });

  private readonly builder = new XMLBuilder({
    format: true,
    ignoreAttributes: false,
    suppressEmptyNode: true
  });

  constructor(private readonly filePath: string) {}

  async authenticate(payload: LoginPayload): Promise<PublicUser | null> {
    const database = await this.readDatabase();
    const normalizedUserId = payload.userId.trim().toLowerCase();
    const user = database.users.find((candidate) => (
      candidate.userId.toLowerCase() === normalizedUserId
      && candidate.password === payload.password
      && candidate.role === payload.role
      && candidate.active
    ));

    if (!user) {
      return null;
    }

    user.lastLoginAt = new Date().toISOString();
    await this.writeDatabase(database);
    return this.toPublicUser(user);
  }

  async findActiveUser(userId: string, role: UserRole): Promise<PublicUser | null> {
    const database = await this.readDatabase();
    const user = database.users.find((candidate) => (
      candidate.userId === userId
      && candidate.role === role
      && candidate.active
    ));

    return user ? this.toPublicUser(user) : null;
  }

  async listUsers(): Promise<PublicUser[]> {
    const database = await this.readDatabase();
    return database.users
      .map((user) => this.toPublicUser(user))
      .sort((left, right) => left.displayName.localeCompare(right.displayName));
  }

  async getRecordsFor(user: PublicUser): Promise<{ records: PublicRecord[]; scope: string }> {
    const database = await this.readDatabase();
    const visibleRecords = user.role === 'Admin'
      ? database.records
      : database.records.filter((record) => (
        record.ownerUserId === user.userId || record.accessLevel === 'Public'
      ));

    return {
      records: visibleRecords.map((record) => this.toPublicRecord(record, database.users)),
      scope: user.role === 'Admin'
        ? 'Admin view: all records in the XML database.'
        : 'General User view: owned records plus public records.'
    };
  }

  async createUser(payload: UserMutationPayload): Promise<PublicUser> {
    const database = await this.readDatabase();
    this.assertValidRole(payload.role);
    this.assertUserIsUnique(database.users, payload.userId);

    const now = new Date().toISOString();
    const newUser: StoredUser = {
      id: `usr-${Date.now()}`,
      userId: payload.userId.trim(),
      password: payload.password ?? '',
      displayName: payload.displayName.trim(),
      role: payload.role,
      department: payload.department.trim(),
      accessLevel: payload.accessLevel.trim(),
      active: Boolean(payload.active),
      createdAt: now,
      lastLoginAt: ''
    };

    database.users.push(newUser);
    await this.writeDatabase(database);
    return this.toPublicUser(newUser);
  }

  async updateUser(id: string, payload: UserMutationPayload): Promise<PublicUser | null> {
    const database = await this.readDatabase();
    this.assertValidRole(payload.role);
    const user = database.users.find((candidate) => candidate.id === id);

    if (!user) {
      return null;
    }

    this.assertUserIsUnique(database.users.filter((candidate) => candidate.id !== id), payload.userId);

    user.userId = payload.userId.trim();
    user.displayName = payload.displayName.trim();
    user.role = payload.role;
    user.department = payload.department.trim();
    user.accessLevel = payload.accessLevel.trim();
    user.active = Boolean(payload.active);

    if (payload.password) {
      user.password = payload.password;
    }

    await this.writeDatabase(database);
    return this.toPublicUser(user);
  }

  async deleteUser(id: string): Promise<boolean> {
    const database = await this.readDatabase();
    const nextUsers = database.users.filter((candidate) => candidate.id !== id);

    if (nextUsers.length === database.users.length) {
      return false;
    }

    database.users = nextUsers;
    await this.writeDatabase(database);
    return true;
  }

  private async readDatabase(): Promise<XmlDatabase> {
    const xml = await fs.readFile(this.filePath, 'utf8');
    const parsed = this.parser.parse(xml) as RawDatabaseDocument;
    const users = toArray(parsed.database?.users?.user).map((user) => normalizeUser(user));
    const records = toArray(parsed.database?.records?.record).map((record) => ({ ...record }));

    return {
      users,
      records
    };
  }

  private async writeDatabase(database: XmlDatabase): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const xml = this.builder.build({
      database: {
        users: {
          user: database.users.map((user) => ({
            ...user,
            active: String(user.active)
          }))
        },
        records: {
          record: database.records
        }
      }
    });

    await fs.writeFile(this.filePath, xml, 'utf8');
  }

  private toPublicUser(user: StoredUser): PublicUser {
    return {
      id: user.id,
      userId: user.userId,
      displayName: user.displayName,
      role: user.role,
      department: user.department,
      accessLevel: user.accessLevel,
      active: user.active,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };
  }

  private toPublicRecord(record: StoredRecord, users: StoredUser[]): PublicRecord {
    const owner = users.find((user) => user.userId === record.ownerUserId);

    return {
      ...record,
      ownerName: owner?.displayName ?? 'Unassigned'
    };
  }

  private assertValidRole(role: UserRole): void {
    if (role !== 'General User' && role !== 'Admin') {
      throw new Error('Role must be General User or Admin.');
    }
  }

  private assertUserIsUnique(users: StoredUser[], userId: string): void {
    const normalizedUserId = userId.trim().toLowerCase();
    const duplicate = users.some((candidate) => candidate.userId.toLowerCase() === normalizedUserId);

    if (duplicate) {
      throw new Error('User ID already exists.');
    }
  }
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function normalizeUser(user: RawUser): StoredUser {
  return {
    ...user,
    active: user.active === true || user.active === 'true'
  };
}
