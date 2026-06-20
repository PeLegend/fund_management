import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AuthContextType {
  customerCode: string | null;
  customerName: string | null;
  login: (code: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customerCode, setCustomerCode] = useState<string | null>(
    () => localStorage.getItem('customer_code'),
  );
  const [customerName, setCustomerName] = useState<string | null>(
    () => localStorage.getItem('customer_name'),
  );

  const login = useCallback((code: string, name: string) => {
    localStorage.setItem('customer_code', code);
    localStorage.setItem('customer_name', name);
    setCustomerCode(code);
    setCustomerName(name);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('customer_code');
    localStorage.removeItem('customer_name');
    setCustomerCode(null);
    setCustomerName(null);
  }, []);

  return (
    <AuthContext.Provider value={{ customerCode, customerName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
