import fs from 'node:fs/promises';
import path from 'node:path';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  performedBy: string;
  targetUserId: string;
  details: string;
}

export class AuditLog {
  private readonly filePath: string;

  constructor(dataDir: string) {
    this.filePath = path.join(dataDir, 'audit.json');
  }

  async append(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
    const entries = await this.readAll();
    const full: AuditEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };

    entries.push(full);

    // Keep only the most recent 500 entries to prevent unbounded growth
    const trimmed = entries.slice(-500);
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(trimmed, null, 2), 'utf8');
    console.log(`[AUDIT] ${full.timestamp} | ${full.action} | by=${full.performedBy} | target=${full.targetUserId}`);
    return full;
  }

  async readAll(): Promise<AuditEntry[]> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(raw) as AuditEntry[];
    } catch {
      return [];
    }
  }
}
