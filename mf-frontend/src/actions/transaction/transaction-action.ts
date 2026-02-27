import { useFetch } from '@/src/hooks/useFetch';
import {
  CreateTransactionRequest,
  Transaction,
} from '@/src/typedef/Ledger/ledger.interface';
import { useCallback } from 'react';
import { toast } from 'sonner';

// Hook para criar uma nova transação
export function useCreateTransaction() {
  const { execute, loading, error, reset } = useFetch<Transaction>();

  const createTransaction = useCallback(
    async (data: CreateTransactionRequest): Promise<Transaction | null> => {
      try {
        const response = await execute('/transactions', {
          method: 'POST',
          body: data,
        });
        if (response) {
          toast.success('Lançamento registrado com sucesso!');
        }
        return response;
      } catch {
        toast.error('Erro ao registrar lançamento.');
        return null;
      }
    },
    [execute],
  );

  return { createTransaction, loading, error, reset };
}
