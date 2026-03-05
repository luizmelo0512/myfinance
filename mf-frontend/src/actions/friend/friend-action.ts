import { useFetch } from '@/src/hooks/useFetch';
import { User } from '@/src/typedef/User/user.interface';
import { useCallback } from 'react';

// Reusa a interface User do frontend que normalmente tem id, name, email, etc.
interface FriendsListResponse {
  friends: User[];
}

interface LinkFriendResponse {
  message: string;
  friend: any;
}

export function useListFriends() {
  const { execute, loading, error, reset } = useFetch<FriendsListResponse>();

  const listAllFriends = useCallback(async (): Promise<User[] | null> => {
    const response = await execute('/friends');
    return response?.friends || null;
  }, [execute]);

  return {
    listAllFriends,
    loading,
    error,
    reset,
  };
}

export function useLinkFriend() {
  const { execute, loading, error, reset } = useFetch<LinkFriendResponse>();

  const linkFriendByEmail = useCallback(
    async (email: string): Promise<boolean> => {
      const response = await execute('/friends/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { email },
      });

      return !!response; 
    },
    [execute],
  );

  return {
    linkFriendByEmail,
    loading,
    error,
    reset,
  };
}
