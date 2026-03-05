/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface UseFetchOptions<TBody = any> {
  method?: HttpMethod;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  body?: TBody;
}

interface UseFetchReturn<TResponse> {
  error: ApiErrorResponse | Error | null;
  loading: boolean;
  execute: (
    endpoint: string,
    options?: UseFetchOptions,
  ) => Promise<TResponse | null>;
  reset: () => void;
}

interface ApiErrorResponse {
  code: string;
  message: string;
  details?: any;
}

const DEFAULT_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
};

function useFetch<TResponse = any>(): UseFetchReturn<TResponse> {
  const [error, setError] = useState<ApiErrorResponse | Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const execute = useCallback(
    async (
      endpoint: string,
      options?: UseFetchOptions,
    ): Promise<TResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        // Usando proxy via Next.js rewrites — cookies são first-party
        const mergedOptions: RequestInit = {
          method: options?.method || 'GET',
          credentials: 'include',
          headers: {
            ...DEFAULT_HEADERS,
            ...options?.headers,
          },
        };

        if (
          options?.body &&
          mergedOptions.method !== 'GET' &&
          mergedOptions.method !== 'DELETE'
        ) {
          mergedOptions.body = JSON.stringify(options.body);
        }

        // Requisições vão para /api/... do próprio frontend (proxy rewrite para o backend)
        const url = `/api${endpoint}`;

        console.log('Request:', {
          url,
          method: mergedOptions.method,
          next: { revalidate: 60 },
        });

        const response = await fetch(url, mergedOptions);

        if (!response.ok) {
          let errorData: ApiErrorResponse;
          try {
            errorData = await response.json();
          } catch (err) {
            console.warn('Failed to parse error response as JSON', err);
            errorData = {
              code: 'UNKNOWN_ERROR',
              message: `HTTP ${response.status}: ${response.statusText}`,
            };
          }
          setError(errorData);
          throw errorData;
        }

        // Suporte para 204 No Content
        if (response.status === 204) return null;

        let result: TResponse;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          result = (await response.text()) as TResponse;
        }

        return result;
      } catch (err: any) {
        const formattedError = err.code
          ? err
          : new Error(
              err instanceof Error ? err.message : 'Falha na requisição',
            );

        setError(formattedError);
        throw formattedError;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return { error, loading, execute, reset };
}

export { useFetch };
export type { HttpMethod, UseFetchOptions, UseFetchReturn };
