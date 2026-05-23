/**
 * Normalises an HTTP error response into a human-readable message string.
 * Eliminates the repeated `error.error?.message ?? 'fallback'` pattern.
 */
export function extractApiError(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (typeof error === 'object' && error !== null) {
    const typed = error as { error?: { message?: string }; message?: string };
    return typed.error?.message ?? typed.message ?? fallback;
  }
  return fallback;
}
