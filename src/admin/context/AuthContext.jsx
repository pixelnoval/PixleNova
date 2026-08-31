import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, tokenStorage } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Three possible states: 'loading' | 'authenticated' | 'unauthenticated'
  const [status, setStatus] = useState('loading');
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();

  // Restore session from stored token on mount
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    authApi.me()
      .then((res) => {
        setAdmin(res.data.admin);
        setStatus('authenticated');
      })
      .catch(() => {
        tokenStorage.clear();
        setStatus('unauthenticated');
      });
  }, []);

  // Listen for 401 events dispatched by the API client
  useEffect(() => {
    function handleUnauthorized() {
      setAdmin(null);
      setStatus('unauthenticated');
      navigate('/admin/login', { replace: true });
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    tokenStorage.set(res.data.token);
    setAdmin(res.data.admin);
    setStatus('authenticated');
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Swallow — token is cleared regardless
    }
    tokenStorage.clear();
    setAdmin(null);
    setStatus('unauthenticated');
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ status, admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — throws if used outside AuthProvider */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
