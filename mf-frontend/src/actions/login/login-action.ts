// actions/authActions.ts
import { useFetch } from '@/src/hooks/useFetch';
import { User } from '@/src/typedef/User/user.interface';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface CreateAccountRequest {
  name?: string;
  email: string;
  password: string;
}

export function useLoginAction() {
  const { loading, error, reset, execute } = useFetch<LoginResponse>();

  const loginAction = useCallback(
    async (param: LoginRequest): Promise<LoginResponse | null | undefined> => {
      try {
        const response = await execute('/auth/sign-in/email', {
          method: 'POST',
          body: { email: param.email, password: param.password },
        });

        // O cookie de autenticação é setado automaticamente pelo backend
        // via Set-Cookie header (httpOnly)

        return response;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        switch (err.code) {
          case 'INVALID_EMAIL':
            toast.error('O e-mail informado é inválido.');
            break;
          case 'INVALID_EMAIL_OR_PASSWORD':
            toast.error(
              'Email ou senha inválidos. Por favor, verifique suas credenciais.',
            );
            break;
          case 'INVALID_CREDENTIALS':
            toast.error(
              'Credenciais inválidas. Por favor, verifique seu email e senha.',
            );
            break;
          case 'USER_NOT_FOUND':
            toast.error(
              'Usuário não encontrado. Por favor, verifique seu email.',
            );
            break;
          default:
            toast.error('Erro ao realizar login, contate o suporte.');
        }
        return undefined;
      }
    },
    [execute],
  );

  return {
    loginAction,
    loading,
    error,
    reset,
  };
}

export function useLogoutAction() {
  const { execute, loading, error } = useFetch<void>();
  const router = useRouter();

  const logoutAction = useCallback(async (): Promise<void | null> => {
    try {
      await execute('/auth/sign-out', {
        method: 'POST',
      });
      // O cookie é removido automaticamente pelo backend
      toast.success('Usuário Deslogado com Sucesso!');
      router.replace('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, redirecionar para login
      router.replace('/login');
    }
  }, [execute, router]);

  return {
    logoutAction,
    loading,
    error,
  };
}

export function useCreateAccount() {
  const { loading, error, reset, execute } = useFetch<LoginResponse>();

  const createAccount = useCallback(
    async (
      param: CreateAccountRequest,
    ): Promise<LoginResponse | null | undefined> => {
      console.log('Criando conta com os seguintes dados:', param);
      try {
        const response = await execute('/auth/sign-up/email', {
          method: 'POST',
          body: param,
        });

        // O cookie de autenticação é setado automaticamente pelo backend

        return response;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        switch (err.code) {
          case 'INVALID_EMAIL':
            toast.error('O e-mail informado é inválido.');
            break;
          case 'INVALID_EMAIL_OR_PASSWORD':
            toast.error(
              'Email ou senha inválidos. Por favor, verifique suas credenciais.',
            );
            break;
          case 'INVALID_CREDENTIALS':
            toast.error(
              'Credenciais inválidas. Por favor, verifique seu email e senha.',
            );
            break;
          case 'USER_NOT_FOUND':
            toast.error(
              'Usuário não encontrado. Por favor, verifique seu email.',
            );
            break;
          default:
            toast.error('Erro ao realizar login, contate o suporte.');
        }
        return undefined;
      }
    },
    [execute],
  );

  return {
    createAccount,
    loading,
    error,
    reset,
  };
}
