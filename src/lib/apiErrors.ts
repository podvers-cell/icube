/**
 * An error whose message is written for the customer and is safe to return over the API.
 *
 * Everything else — Firestore failures, index errors, provider internals — must be logged
 * server-side and answered with a generic message, so route handlers can tell the two apart
 * instead of echoing `err.message` and leaking internals.
 */
export class ClientFacingError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ClientFacingError";
    this.status = status;
  }
}

export function isClientFacingError(error: unknown): error is ClientFacingError {
  return error instanceof ClientFacingError;
}

/**
 * Resolve any thrown value into a safe `{ message, status }` pair, logging the detail for
 * anything that was not deliberately written for the customer.
 */
export function toApiError(
  scope: string,
  error: unknown,
  fallback = "Something went wrong. Please try again."
): { message: string; status: number } {
  if (isClientFacingError(error)) {
    return { message: error.message, status: error.status };
  }
  console.error(`[${scope}]`, error);
  return { message: fallback, status: 500 };
}
