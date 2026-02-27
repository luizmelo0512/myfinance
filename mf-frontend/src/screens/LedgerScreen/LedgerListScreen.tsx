'use client';

import { useLedgerList } from '@/src/actions/ledger/ledger-action';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';

import { Ledger, TransactionType } from '@/src/typedef/Ledger/ledger.interface';
import { cn } from '@utils';
import { ArrowRight, HandCoins, Plus, RefreshCw, Users } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import DialogNewLedger from './DialogNewLedger';

const LedgerListScreen = () => {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { fetchLedgers, loading } = useLedgerList();

  const loadLedgers = useCallback(async () => {
    const data = await fetchLedgers();
    if (data) setLedgers(data);
  }, [fetchLedgers]);

  useEffect(() => {
    let ignore = false;
    fetchLedgers().then((data) => {
      if (!ignore && data) setLedgers(data);
    });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateBalance = (ledger: Ledger): number => {
    return ledger.transactions.reduce((acc, t) => {
      return t.type === TransactionType.DEBT
        ? acc + Number(t.amount)
        : acc - Number(t.amount);
    }, 0);
  };

  if (loading && ledgers.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_var(--primary)]" />
        <p className="text-primary font-mono animate-pulse">
          CARREGANDO DÍVIDAS...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Dívidas
          </h2>
          <p className="text-muted-foreground">
            Gerencie todas as suas dívidas e empréstimos.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={loadLedgers}
            disabled={loading}
            className="border-border hover:border-primary/50 w-full sm:w-auto"
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-2', loading && 'animate-spin')}
            />
            Atualizar
          </Button>
          <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
            <DialogNewLedger
              dialogOpen={dialogOpen}
              setDialogOpen={setDialogOpen}
              loadLedgers={loadLedgers}
            />
          </div>
        </div>
      </div>

      {/* Lista de Ledgers */}
      {ledgers.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <HandCoins className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma dívida encontrada
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Comece criando sua primeira dívida para acompanhar.
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Dívida
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ledgers.map((ledger) => {
            const balance = calculateBalance(ledger);
            return (
              <Link
                key={ledger.id}
                href={`/ledgers/${ledger.id}`}
                prefetch={false}
              >
                <Card className="hover:shadow-[0_0_20px_-12px_var(--primary)] transition-all cursor-pointer border-border hover:border-primary/40">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-semibold min-w-0 pr-2 pb-1">
                        <span className="block truncate">{ledger.title}</span>
                      </CardTitle>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                    <CardDescription className="flex items-center gap-1 min-w-0">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate block">{ledger.targetName}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Saldo</p>
                        <p
                          className={cn(
                            'text-xl font-bold font-mono',
                            balance > 0
                              ? 'text-destructive'
                              : balance < 0
                                ? 'text-emerald-500'
                                : 'text-foreground',
                          )}
                        >
                          {balance.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Lançamentos
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {ledger.transactions.length}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">
                      Criado em{' '}
                      {new Date(ledger.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export { LedgerListScreen };
