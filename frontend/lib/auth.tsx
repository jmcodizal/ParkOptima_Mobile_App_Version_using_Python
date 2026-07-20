import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

type AuthContextValue = {
  isAuthenticated: boolean;
  userId: number | null;
  role: string | null;
  signIn: (userId?: number, role?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      isAuthenticated,
      userId,
      role,
      signIn: async (nextUserId?: number, nextRole?: string) => {
        const resolvedUserId = nextUserId ?? userId;
        const resolvedRole = nextRole ?? role ?? 'attendant';
        setUserId(resolvedUserId ?? null);
        setRole(resolvedRole ?? null);
        setIsAuthenticated(Boolean(resolvedUserId));
      },
      signOut: async () => {
        setUserId(null);
        setRole(null);
        setIsAuthenticated(false);
      },
    }),
    [isAuthenticated, userId, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
