'use client';

import { useLedgerList } from '@/src/actions/ledger/ledger-action';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  Ledger,
  Transaction,
  TransactionType,
} from '@/src/typedef/Ledger/ledger.interface';
import { cn } from '@utils';
import {
  ArrowRight,
  HandCoins,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

const HomeScreen = () => {
  const { user, loading: authLoading } = useAuth();
  const { fetchLedgers, loading: ledgersLoading } = useLedgerList();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);

  const loadData = useCallback(async () => {
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

  // Calcular totais baseados nos dados reais
  const { totalBalance, totalDebt, totalPayments, recentTransactions } =
    useMemo(() => {
      let debt = 0;
      let payments = 0;
      const allTransactions: (Transaction & { ledgerTitle: string })[] = [];

      ledgers.forEach((ledger) => {
        ledger.transactions.forEach((t) => {
          if (t.type === TransactionType.DEBT) {
            debt += Number(t.amount);
          } else {
            payments += Number(t.amount);
          }
          allTransactions.push({ ...t, ledgerTitle: ledger.title });
        });
      });

      // Ordenar por data mais recente e pegar os últimos 5
      allTransactions.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      return {
        totalBalance: debt - payments,
        totalDebt: debt,
        totalPayments: payments,
        recentTransactions: allTransactions.slice(0, 5),
      };
    }, [ledgers]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_var(--primary)]" />
        <p className="text-primary font-mono animate-pulse">
          CARREGANDO SISTEMA...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header do Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Bem vindo de volta,{' '}
            <span className="text-primary">{user?.name}</span>.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          disabled={ledgersLoading}
          className="border-border hover:border-primary/50 w-full sm:w-auto"
        >
          <RefreshCw
            className={cn('w-4 h-4 mr-2', ledgersLoading && 'animate-spin')}
          />
          Atualizar Dados
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <CardSummary
          title="Saldo Devedor"
          value={totalBalance.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
          icon={<Wallet className="text-primary" />}
          color={
            totalBalance > 0
              ? 'text-destructive'
              : totalBalance < 0
                ? 'text-emerald-500'
                : 'text-foreground'
          }
          trend={`${ledgers.length} dívida(s) ativa(s)`}
        />
        <CardSummary
          title="Total em Dívidas"
          value={totalDebt.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
          icon={<TrendingUp className="text-destructive" />}
          color="text-destructive"
        />
        <CardSummary
          title="Total Pago"
          value={totalPayments.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
          icon={<TrendingDown className="text-emerald-500" />}
          color="text-emerald-500"
        />
      </div>

      {/* Dívidas Ativas */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <HandCoins className="text-primary w-5 h-5" />
            Dívidas Ativas
          </h3>
          <Link href="/ledgers">
            <Button variant="ghost" size="sm" className="text-primary">
              Ver Todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {ledgers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <HandCoins className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              Nenhuma dívida registrada.
            </p>
            <Link href="/ledgers">
              <Button variant="outline" className="mt-3" size="sm">
                Criar Primeira Dívida
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ledgers.slice(0, 6).map((ledger) => {
              const balance = ledger.transactions.reduce((acc, t) => {
                return t.type === TransactionType.DEBT
                  ? acc + Number(t.amount)
                  : acc - Number(t.amount);
              }, 0);
              return (
                <Link
                  key={ledger.id}
                  href={`/ledgers/${ledger.id}`}
                  prefetch={false}
                >
                  <div className="p-4 rounded-lg border border-border/50 bg-background/50 hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground truncate">
                        {ledger.title}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {ledger.targetName}
                    </p>
                    <p
                      className={cn(
                        'text-lg font-bold font-mono',
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
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Transações Recentes */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Wallet className="text-primary w-5 h-5" />
          Lançamentos Recentes
        </h3>
        {recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              Nenhum lançamento registrado ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((t) => (
              <div
                key={t.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors gap-3 sm:gap-0"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      t.type === TransactionType.DEBT
                        ? 'bg-destructive/10'
                        : 'bg-emerald-500/10',
                    )}
                  >
                    {t.type === TransactionType.DEBT ? (
                      <TrendingUp className="w-4 h-4 text-destructive" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate block">
                          {t.description || 'Sem descrição'}
                        </span>
                        <Badge variant="outline" className="text-[10px] flex-shrink-0">
                          {t.ledgerTitle}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 block">
                      {new Date(t.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    'font-mono font-bold',
                    t.type === TransactionType.DEBT
                      ? 'text-destructive'
                      : 'text-emerald-500',
                  )}
                >
                  {t.type === TransactionType.DEBT ? '+' : '-'}{' '}
                  {Number(t.amount).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-componente de Card para organização
const CardSummary = ({
  title,
  value,
  icon,
  trend,
  color = 'text-foreground',
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}) => (
  <div className="p-6 rounded-xl border border-border bg-card hover:shadow-[0_0_20px_-12px_var(--primary)] transition-all">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      {icon}
    </div>
    <div className={cn('text-2xl font-bold tracking-tighter', color)}>
      {value}
    </div>
    {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
  </div>
);

export { HomeScreen };
