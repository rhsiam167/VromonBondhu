/**
 * API CLIENT — the one place that talks to the backend.
 *
 * - The backend address comes from VITE_API_BASE_URL (see .env.example at the
 *   project root), defaulting to http://localhost:8000.
 * - After login, the JWT is attached to every request as
 *   "Authorization: Bearer <token>".
 * - Every failure becomes an ApiError with a readable `message`:
 *     status 0      → the server couldn't be reached (network)
 *     status 4xx    → the backend's own message (e.g. "Incorrect email or password.")
 *     status 5xx    → a server error
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

// The login token. AuthContext keeps it in sync with localStorage.
let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isNetworkOrServerError() {
    return this.status === 0 || this.status >= 500;
  }
}

/**
 * Call the backend. `path` starts with /api/...
 * Returns the parsed JSON (or null for an empty 204 response).
 */
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Could not reach the server. Is the backend running?');
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Not JSON (e.g. a proxy error page) — handled below.
  }

  if (!response.ok) {
    const error = data?.error;
    throw new ApiError(
      response.status,
      error?.code || (response.status >= 500 ? 'server_error' : 'request_failed'),
      error?.message || 'Something went wrong. Please try again.',
      error?.details || []
    );
  }
  return data;
}
