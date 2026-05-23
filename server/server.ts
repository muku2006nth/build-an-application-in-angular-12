import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import os from 'node:os';
import path from 'node:path';

import { createAdminRoutes } from './routes/admin.routes';
import { createAuthMiddleware } from './middleware/auth';
import { createAuthRoutes } from './routes/auth.routes';
import { createRecordRoutes } from './routes/records.routes';
import { requestId } from './middleware/request-id';
import { sanitiseBody } from './middleware/sanitise';
import { XmlStore } from './storage/xml-store';
import { AuditLog } from './storage/audit-log';
import { TaskStore } from './storage/task-store';

const app = express();
const port = Number(process.env['PORT'] ?? 3000);
const dataDir = path.join(process.cwd(), 'server', 'data');
const dataFilePath = path.join(dataDir, 'users.xml');
const store = new XmlStore(dataFilePath);
const auditLog = new AuditLog(dataDir);
const taskStore = new TaskStore(dataDir);
const authMiddleware = createAuthMiddleware(store);
const startedAt = Date.now();

app.use(cors({
  origin: [
    'http://127.0.0.1:4200',
    'http://localhost:4200',
    'http://127.0.0.1:4201',
    'http://localhost:4201'
  ]
}));
app.use(requestId);
app.use(express.json());
app.use(sanitiseBody);

app.get('/api/health', (_request: Request, response: Response) => {
  const uptimeSec = Math.floor((Date.now() - startedAt) / 1000);
  response.json({
    status: 'ok',
    storage: 'local-xml',
    dataFile: dataFilePath,
    uptimeSeconds: uptimeSec,
    nodeVersion: process.version,
    platform: os.platform(),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024)
  });
});

app.use('/api', createAuthRoutes(store, authMiddleware, auditLog));
app.use('/api', createRecordRoutes(store, authMiddleware));
app.use('/api', createAdminRoutes(store, authMiddleware, auditLog, taskStore));

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  const statusCode = error.message.includes('already exists') || error.message.includes('Role must')
    ? 400
    : 500;

  response.status(statusCode).json({
    message: statusCode === 500 ? 'Unexpected API error.' : error.message
  });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Role Access API listening at http://127.0.0.1:${port}`);
});
