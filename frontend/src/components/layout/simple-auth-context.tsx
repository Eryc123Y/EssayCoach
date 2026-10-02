'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState
} from 'react';
import { clearUserData, readUserData, storeUserData } from '@/lib/user-data-storage';

export type UserRole = 'student' | 'lecturer' | 'admin';

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

type AuthCheck =
  | { status: 'authenticated'; user: SimpleUser }
  | { status: 'unauthenticated' }
  | { status: 'unknown' };

function toSimpleUser(data: any): SimpleUser {
  return {
    id: String(data.user_id || data.id),
    email: data.user_email || data.email,
    firstName: data.user_fname || data.first_name || '',
    lastName: data.user_lname || data.last_name || '',
    role: (data.user_role || data.role || 'student') as UserRole
  };
}

// We can't read httpOnly cookies directly, so we ask a server endpoint, which
// also says who the cookies belong to. Only an explicit 401/403 counts as
// signed out; network errors are unknown.
async function checkAuthStatus(): Promise<AuthCheck> {
  try {
    const response = await fetch('/api/v2/auth/getUserInfo', {
      method: 'GET',
      credentials: 'include' // Include cookies
    });
    if (response.ok) {
      const payload = await response.json();
      const data = payload?.data ?? payload;
      return data ? { status: 'authenticated', user: toSimpleUser(data) } : { status: 'unknown' };
    }
    if (response.status === 401 || response.status === 403) return { status: 'unauthenticated' };
    return { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [currentClassId, setCurrentClassId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const syncUserFromStorage = useCallback(() => {
    const storedUser = readUserData<SimpleUser>();

    if (storedUser) {
      // Render the cached user immediately, then reconcile with the cookies:
      // drop it if the session is gone (a session-only sign-in after the
      // browser closed) and replace it if another tab signed in as someone else.
      setUser(storedUser);
      setIsInitialized(true);
      checkAuthStatus().then((check) => {
        if (check.status === 'unauthenticated') {
          clearUserData();
          setUser(null);
        } else if (check.status === 'authenticated' && check.user.id !== storedUser.id) {
          // Persistence of the other sign-in is unknown, so cache only for this tab.
          storeUserData(check.user, false);
          setUser(check.user);
        }
      });
      return;
    }

    // No stored user, check whether the cookie session is valid via the server.
    checkAuthStatus()
      .then((check) => {
        if (check.status === 'authenticated') {
          setUser(check.user);
          // Persistence is unknown here, so cache only for this tab.
          storeUserData(check.user, false);
        }
      })
      .finally(() => {
        setIsInitialized(true);
      });
  }, []);

  // Read cached user info on mount; auth cookies are httpOnly.
  useEffect(() => {
    syncUserFromStorage();
  }, [syncUserFromStorage]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleAuthUserUpdated = () => {
      syncUserFromStorage();
    };

    window.addEventListener('essaycoach:user-updated', handleAuthUserUpdated);

    return () => {
      window.removeEventListener('essaycoach:user-updated', handleAuthUserUpdated);
    };
  }, [syncUserFromStorage]);

  // Fetch user's accessible classes - run when user is set
  useEffect(() => {
    // Only fetch classes if AuthContext is initialized and user exists
    if (!isInitialized || !user) return;

    async function fetchClasses() {
      try {
        // Browser will automatically include httpOnly cookies with credentials: 'include'
        const response = await fetch('/api/v2/core/users/me/classes/', {
          credentials: 'include' // Include httpOnly cookies
        });

        if (response.ok) {
          const data = await response.json();
          const classList = data.results || data;

          // Transform API response to match ClassInfo interface (classId instead of class_id)
          const transformedClasses: ClassInfo[] = Array.isArray(classList)
            ? classList.map((cls: any) => ({
                classId: cls.class_id,
                unitName: cls.unit_name,
                unitCode: cls.unit_code,
                classSize: cls.class_size
              }))
            : [];

          setClasses(transformedClasses);

          // Set first class as current if none selected
          if (transformedClasses.length > 0) {
            setCurrentClassId((selectedClassId) => selectedClassId ?? transformedClasses[0].classId);
          }
        } else if (response.status === 401) {
          // Unauthorized - redirect to login
          console.warn('Unauthorized access to classes API');
        }
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      }
    }

    fetchClasses();
  }, [user, isInitialized]);

  const currentClass = useMemo(() => {
    return (
      classes.find((c) => c.classId === currentClassId) || classes[0] || null
    );
  }, [classes, currentClassId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(user),
      user,
      classes,
      currentClass,
      setCurrentClass: (classId: number) => setCurrentClassId(classId),
      logout: async () => {
        await fetch('/api/v2/auth/logout', { method: 'POST' });
        clearUserData();
        if (typeof window !== 'undefined')
          window.location.href = '/auth/sign-in';
      }
    }),
    [user, classes, currentClass]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
