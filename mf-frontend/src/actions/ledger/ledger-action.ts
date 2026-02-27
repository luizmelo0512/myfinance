import { useFetch } from '@/src/hooks/useFetch';
import {
  CreateLedgerRequest,
  Ledger,
  LedgerWithBalance,
} from '@/src/typedef/Ledger/ledger.interface';
import { useCallback } from 'react';
import { toast } from 'sonner';

// Hook para listar todas as dívidas
export function useLedgerList() {
  const { execute, loading, error, reset } = useFetch<Ledger[]>();

  const fetchLedgers = useCallback(async (): Promise<Ledger[] | null> => {
    try {
      return await execute('/ledger');
    } catch {
      toast.error('Erro ao buscar dívidas.');
      return null;
    }
  }, [execute]);

  return { fetchLedgers, loading, error, reset };
}

// Hook para buscar detalhes de uma dívida com saldo
export function useLedgerDetail() {
  const { execute, loading, error, reset } = useFetch<LedgerWithBalance>();

  const fetchLedger = useCallback(
    async (id: string): Promise<LedgerWithBalance | null> => {
      try {
        return await execute(`/ledger/${id}`);
      } catch {
        toast.error('Erro ao buscar detalhes da dívida.');
        return null;
      }
    },
    [execute],
  );

  return { fetchLedger, loading, error, reset };
}

// Hook para criar uma nova dívida
export function useCreateLedger() {
  const { execute, loading, error, reset } = useFetch<Ledger>();

  const createLedger = useCallback(
    async (data: CreateLedgerRequest): Promise<Ledger | null> => {
      try {
        const response = await execute('/ledger', {
          method: 'POST',
          body: data,
        });
        if (response) {
          toast.success('Dívida criada com sucesso!');
        }
        return response;
      } catch {
        toast.error('Erro ao criar dívida.');
        return null;
      }
    },
    [execute],
  );

  return { createLedger, loading, error, reset };
}
