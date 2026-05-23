import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import path from 'node:path';

import { createAdminRoutes } from './routes/admin.routes';
import { createAuthMiddleware } from './middleware/auth';
import { createAuthRoutes } from './routes/auth.routes';
import { createRecordRoutes } from './routes/records.routes';
import { XmlStore } from './storage/xml-store';

const app = express();
const port = Number(process.env['PORT'] ?? 3000);
const dataFilePath = path.join(process.cwd(), 'server', 'data', 'users.xml');
const store = new XmlStore(dataFilePath);
const authMiddleware = createAuthMiddleware(store);

app.use(cors({
  origin: [
    'http://127.0.0.1:4200',
    'http://localhost:4200'
  ]
}));
app.use(express.json());

app.get('/api/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    storage: 'local-xml',
    dataFile: dataFilePath
  });
});

app.use('/api', createAuthRoutes(store, authMiddleware));
app.use('/api', createRecordRoutes(store, authMiddleware));
app.use('/api', createAdminRoutes(store, authMiddleware));

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
