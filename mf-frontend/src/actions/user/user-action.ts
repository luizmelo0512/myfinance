import { useFetch } from '@/src/hooks/useFetch';
import { User } from '@/src/typedef/User/user.interface';
import { useCallback } from 'react';

interface UserResponse {
  user: User;
}

interface UsersListResponse {
  users: User[];
}

export function useUserAction() {
  const { execute, loading, error, reset } = useFetch<UserResponse>();

  const userAction = useCallback(async (): Promise<User | null> => {
    const response = await execute('/users/me');

    return response?.user || null;
  }, [execute]);

  return {
    userAction,
    loading,
    error,
    reset,
  };
}

export function useListUsers() {
  const { execute, loading, error, reset } = useFetch<UsersListResponse>();

  const listAllUsers = useCallback(async (): Promise<User[] | null> => {
    const response = await execute('/users/listUsers');

    return response?.users || null;
  }, [execute]);

  return {
    listAllUsers,
    loading,
    error,
    reset,
  };
}
