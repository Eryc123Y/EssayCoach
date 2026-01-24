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
  const [isInitialized, setIsInitialized] = useState(false);

  // Read user info from cookies - run on mount and when cookies might change
  useEffect(() => {
    function readUserFromCookies() {
      const email = readCookie('user_email');
      const firstName = readCookie('user_first_name');
      const lastName = readCookie('user_last_name');
      const userId = readCookie('user_id');
      const userRole = readCookie('user_role') as UserRole || 'student';
      // Check both access_token cookie and other user cookies to determine login status
      const hasAccessToken = Boolean(readCookie('access_token'));
      const hasUserCookies = email && userRole;

      // User is logged in if they have access_token OR have user cookies (reliable indicator)
      const isLoggedIn = hasAccessToken || hasUserCookies;

      if (isLoggedIn && email) {
        setUser({ id: userId || '1', email, firstName, lastName, role: userRole });
      } else {
        setUser(null);
      }
      setIsInitialized(true);
    }

    // Read user on mount
    readUserFromCookies();

    // Set up an interval to check for cookie changes (e.g., after login)
    const intervalId = setInterval(readUserFromCookies, 500);

    return () => clearInterval(intervalId);
  }, []);

  // Fetch user's accessible classes - run when user is set
  useEffect(() => {
    // Only fetch classes if AuthContext is initialized and user exists
    if (!isInitialized || !user) return;

    async function fetchClasses() {
      try {
        // Get token from cookie
        const token = readCookie('access_token');
        
        const response = await fetch('/api/v1/core/users/me/classes/', {
          headers: {
            'Authorization': `Token ${token}`
          }
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
