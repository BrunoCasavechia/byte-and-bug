import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { api, readSession, toSession, writeSession } from './lib/api.js';

// ---------- Toasts (Sonner, the toast library used by shadcn/ui) ----------
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const show = useCallback((message, type = 'success', ms = 4000) => {
    const fn = { success: toast.success, error: toast.error, info: toast.info }[type] || toast;
    fn(message, { duration: ms });
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <Toaster
        position="bottom-right"
        closeButton
        toastOptions={{ unstyled: true, classNames: { toast: 'toast', success: 'toast--success', error: 'toast--error', info: 'toast--info', closeButton: 'toast__close', title: 'toast__title' } }}
      />
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);

// ---------- Auth ----------
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  useEffect(() => {
    const sync = () => setSession(readSession());
    window.addEventListener('bb:session', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('bb:session', sync); window.removeEventListener('storage', sync); };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    writeSession(toSession(data));
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const s = readSession();
    writeSession(null);
    if (s?.refreshToken) await api('/auth/logout', { method: 'POST', body: { refreshToken: s.refreshToken } }).catch(() => {});
  }, []);

  const value = useMemo(() => ({ session, user: session?.user || null, login, logout }), [session, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

// ---------- Cart ----------
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [pulse, setPulse] = useState(0);
  const prevCount = useRef(0);

  const refresh = useCallback(async () => {
    if (!readSession()) { setCart(null); return null; }
    try { const c = await api('/cart'); setCart(c); return c; } catch { return null; }
  }, []);

  useEffect(() => { refresh(); }, [user?.id, refresh]);

  useEffect(() => {
    const n = cart?.itemCount || 0;
    if (n > prevCount.current) setPulse((p) => p + 1);
    prevCount.current = n;
  }, [cart?.itemCount]);

  const value = useMemo(() => ({ cart, setCart, refresh, pulse }), [cart, refresh, pulse]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
