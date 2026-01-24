'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

type UserRole = 'student' | 'lecturer' | 'admin';

type SimpleUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

type ClassInfo = {
  classId: number;
  unitName: string;
  unitCode: string;
  classSize: number;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  user: SimpleUser | null;
  classes: ClassInfo[];
  currentClass: ClassInfo | null;
  setCurrentClass: (classId: number) => void;
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
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [currentClassId, setCurrentClassId] = useState<number | null>(null);

  useEffect(() => {
    // Read basic user info from cookies
    const email = readCookie('user_email');
    const firstName = readCookie('user_first_name');
    const lastName = readCookie('user_last_name');
    const userId = readCookie('user_id');
    const userRole = readCookie('user_role') as UserRole || 'student';
    const isLoggedIn = Boolean(readCookie('access_token'));

    if (isLoggedIn && email) {
      setUser({ id: userId || '1', email, firstName, lastName, role: userRole });
    } else {
      setUser(null);
    }
  }, []);

  // Fetch user's accessible classes
  useEffect(() => {
    async function fetchClasses() {
      try {
        const response = await fetch('/api/v1/users/me/classes/');
        if (response.ok) {
          const data = await response.json();
          setClasses(data.results || data);

          // Set first class as current if none selected
          if (data.results?.length > 0 && !currentClassId) {
            setCurrentClassId(data.results[0].class_id);
          } else if (Array.isArray(data) && data.length > 0 && !currentClassId) {
            setCurrentClassId(data[0].class_id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      }
    }

    if (user) {
      fetchClasses();
    }
  }, [user]);

  const currentClass = useMemo(() => {
    return classes.find(c => c.classId === currentClassId) || classes[0] || null;
  }, [classes, currentClassId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(user),
      user,
      classes,
      currentClass,
      setCurrentClass: (classId: number) => setCurrentClassId(classId),
      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        if (typeof window !== 'undefined')
          window.location.href = '/auth/sign-in';
      }
    }),
    [user, classes, currentClass, currentClassId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
