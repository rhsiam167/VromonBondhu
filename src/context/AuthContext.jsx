import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, setAuthToken } from '../services/apiClient';

/**
 * AUTH CONTEXT
 * ------------
 * Real accounts, stored by the backend:
 *   register → POST /api/auth/register
 *   login    → POST /api/auth/login
 *   who am I → GET  /api/auth/me   (used to restore the session after a refresh)
 *
 * The login token (JWT) is kept in localStorage so a page refresh doesn't log
 * you out, and is attached to every API request by services/apiClient.js.
 * Nobody is logged in until they register or log in themselves.
 */
const AuthContext = createContext(null);
const TOKEN_KEY = 'vromonbondhu.token';

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // storage blocked (e.g. private mode) — just stay logged out
  }
}

function storeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage blocked — the session still works until the page is closed
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True right after the user logs out on purpose (logged-in-only pages then go to the
  // landing page instead of asking them to log in again).
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  // True while we check a stored token with the backend (avoids a flash of "logged out").
  const [checkingSession, setCheckingSession] = useState(() => Boolean(readStoredToken()));

  // On first load, restore the session from a stored token.
  useEffect(() => {
    const token = readStoredToken();
    if (!token) return;
    setAuthToken(token);
    apiRequest('/api/auth/me')
      .then((me) => setUser(me))
      .catch(() => {
        // Expired or invalid token → start logged out.
        setAuthToken(null);
        storeToken(null);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  function startSession({ accessToken, user: account }) {
    setAuthToken(accessToken);
    storeToken(accessToken);
    setJustLoggedOut(false);
    setUser(account);
  }

  /** Throws an ApiError with a readable message if the email/password is wrong. */
  async function login({ email, password }) {
    startSession(await apiRequest('/api/auth/login', { method: 'POST', body: { email, password } }));
  }

  /** Throws an ApiError with a readable message (e.g. email already used). */
  async function register({ name, email, password }) {
    startSession(await apiRequest('/api/auth/register', { method: 'POST', body: { name, email, password } }));
  }

  function logout() {
    setAuthToken(null);
    storeToken(null);
    setJustLoggedOut(true);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: user !== null, checkingSession, justLoggedOut, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Use inside any component: const { user, login } = useAuth(); */
export function useAuth() {
  return useContext(AuthContext);
}
