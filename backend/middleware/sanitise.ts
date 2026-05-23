import { NextFunction, Request, Response } from 'express';

/**
 * Recursively trims all string values in a plain-object body.
 * Eliminates the manual .trim() calls scattered across route handlers.
 */
export function sanitiseBody(request: Request, _response: Response, next: NextFunction): void {
  if (request.body && typeof request.body === 'object') {
    request.body = deepTrim(request.body) as Record<string, unknown>;
  }

  next();
}

function deepTrim(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.map(deepTrim);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, deepTrim(val)])
    );
  }

  return value;
}
