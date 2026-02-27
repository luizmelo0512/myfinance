'use client';

import { useUserAction } from '@/src/actions/user/user-action';
import { User } from '@/src/typedef/User/user.interface';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { userAction } = useUserAction();

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await userAction();
      setUser(userData);
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userAction]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
