import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const restoreSession = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('parkoptima:userId');
      const storedRole = await AsyncStorage.getItem('parkoptima:role');
      if (storedUserId) {
        setUserId(Number(storedUserId));
        setRole(storedRole || 'attendant');
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.warn('Failed to restore auth session', error);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      userId,
      role,
      signIn: async (nextUserId?: number, nextRole?: string) => {
        const resolvedUserId = nextUserId ?? userId;
        const resolvedRole = nextRole ?? role ?? 'attendant';
        if (resolvedUserId) {
          await AsyncStorage.setItem('parkoptima:userId', String(resolvedUserId));
          await AsyncStorage.setItem('parkoptima:role', resolvedRole);
        }
        setUserId(resolvedUserId ?? null);
        setRole(resolvedRole ?? null);
        setIsAuthenticated(Boolean(resolvedUserId));
      },
      signOut: async () => {
        await AsyncStorage.removeItem('parkoptima:userId');
        await AsyncStorage.removeItem('parkoptima:role');
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
