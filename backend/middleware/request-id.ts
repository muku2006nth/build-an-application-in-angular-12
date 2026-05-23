import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Assigns a unique X-Request-Id header to every inbound request and mirrors it
 * on the outbound response. This is a standard cloud/API observability pattern
 * that allows individual requests to be traced through logs.
 */
export function requestId(request: Request, response: Response, next: NextFunction): void {
  const id = (request.headers['x-request-id'] as string | undefined) ?? randomUUID();
  request.headers['x-request-id'] = id;
  response.setHeader('X-Request-Id', id);
  next();
}
