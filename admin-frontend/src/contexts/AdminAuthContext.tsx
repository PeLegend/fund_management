import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AdminAuthContextType {
  token: string | null;
  adminEmail: string | null;
  login: (token: string, email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('admin_token'),
  );
  const [adminEmail, setAdminEmail] = useState<string | null>(
    () => localStorage.getItem('admin_email'),
  );

  const login = useCallback((newToken: string, email: string) => {
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_email', email);
    setToken(newToken);
    setAdminEmail(email);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    setToken(null);
    setAdminEmail(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ token, adminEmail, login, logout, isAuthenticated: !!token }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
