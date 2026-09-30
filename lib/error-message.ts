// Supabase's errors (PostgrestError, AuthError, StorageError, ...) are
// plain objects with a `message` field — they don't extend the built-in
// Error class. `error instanceof Error` is false for them, so falling back
// to String(error) prints the useless "[object Object]". This checks for
// a `message` field first, regardless of what kind of object it is.
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return String(error);
}
