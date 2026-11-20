// Thin fetch wrapper. Knows about tokens: sends the access token, and when the
// API answers 401 TOKEN_EXPIRED it tries /auth/refresh once and repeats the call
// (only if "auto-refresh" is on). Tokens live in localStorage so Playwright's
// storage_state can reuse a logged-in session.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3333').replace(/\/$/, '');

const KEY = 'bb.session';

export function readSession() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}
export function writeSession(session) {
  if (session) localStorage.setItem(KEY, JSON.stringify(session));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('bb:session'));
}

export function autoRefreshEnabled() {
  return localStorage.getItem('bb.autoRefresh') !== 'false';
}
export function setAutoRefresh(on) {
  localStorage.setItem('bb.autoRefresh', on ? 'true' : 'false');
}

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message || `Erro ${status}`);
    this.status = status;
    this.code = body?.error?.code;
    this.details = body?.error?.details || [];
  }
  // { "shipping.cpf": "CPF inválido", ... }
  fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

export const assetUrl = (url) => (url?.startsWith('/uploads') ? `${API_URL}${url}` : url);

let refreshing = null;

async function refreshTokens() {
  const session = readSession();
  if (!session?.refreshToken) return false;
  refreshing ??= fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) return false;
      const data = await res.json();
      writeSession(toSession(data));
      return true;
    })
    .finally(() => { refreshing = null; });
  return refreshing;
}

export const toSession = (data) => ({
  accessToken: data.accessToken,
  refreshToken: data.refreshToken,
  expiresAt: Date.now() + data.expiresIn * 1000,
  user: data.user,
});

export async function api(path, { method = 'GET', body, form, retry = true } = {}) {
  const session = readSession();
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (res.ok) return data;

  const err = new ApiError(res.status, data);
  if (res.status === 401 && err.code === 'TOKEN_EXPIRED') {
    if (retry && autoRefreshEnabled() && (await refreshTokens())) {
      return api(path, { method, body, form, retry: false });
    }
    writeSession(null);
    window.dispatchEvent(new CustomEvent('bb:expired'));
  }
  throw err;
}

export const brl = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

export const formatDate = (iso) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
