'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState
} from 'react';

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

// Helper functions for localStorage (for httpOnly cookie compatibility)
function setUserData(user: SimpleUser | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('user_data', JSON.stringify(user));
  } else {
    localStorage.removeItem('user_data');
  }
}

function getUserData(): SimpleUser | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('user_data');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Check if user is authenticated by verifying access_token cookie exists
// We can't read httpOnly cookies directly, so we use a server endpoint
async function checkAuthStatus(): Promise<boolean> {
  try {
    const response = await fetch('/api/v2/auth/getUserInfo', {
      method: 'GET',
      credentials: 'include' // Include cookies
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [currentClassId, setCurrentClassId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const syncUserFromStorage = useCallback(() => {
    const storedUser = getUserData();

    if (storedUser) {
      setUser(storedUser);
      setIsInitialized(true);
      return;
    }

    // No stored user, check if access_token cookie exists via server endpoint
    checkAuthStatus()
      .then((isLoggedIn) => {
        if (isLoggedIn) {
          // User has valid token but no stored data, fetch user info
          return fetch('/api/v2/core/users/me/')
            .then((res) => res.json())
            .then((data) => {
              const user: SimpleUser = {
                id: String(data.user_id || data.id),
                email: data.user_email || data.email,
                firstName: data.user_fname || data.first_name || '',
                lastName: data.user_lname || data.last_name || '',
                role: (data.user_role || data.role || 'student') as UserRole
              };
              setUser(user);
              setUserData(user); // Cache in localStorage
            })
            .catch(() => setUser(null));
        }
        return undefined;
      })
      .finally(() => {
        setIsInitialized(true);
      });
  }, []);

  // Read user info from localStorage - run on mount
  // Note: We use localStorage because user cookies are now httpOnly for security
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
          if (transformedClasses.length > 0 && !currentClassId) {
            setCurrentClassId(transformedClasses[0].classId);
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
        setUserData(null); // Clear localStorage
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
