'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

type SimpleUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  user: SimpleUser | null;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readCookie(name: string) {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || '';
  return '';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SimpleUser | null>(null);

  useEffect(() => {
    // We cannot read HttpOnly cookies directly; use presence of a non-HttpOnly mirror for demo or rely on server redirects.
    // For this mock, we read non-sensitive info (name/email) from cookies we set for demo purposes.
    const email = readCookie('user_email');
    const firstName = readCookie('user_first_name');
    const lastName = readCookie('user_last_name');
    const userId = readCookie('user_id');
    const isLoggedIn = Boolean(readCookie('access_token'));

    if (isLoggedIn && email) {
      setUser({ id: userId || '1', email, firstName, lastName });
    } else {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(user),
      user,
      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        if (typeof window !== 'undefined')
          window.location.href = '/auth/sign-in';
      }
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
