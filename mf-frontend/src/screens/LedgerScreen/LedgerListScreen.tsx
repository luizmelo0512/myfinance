'use client';

import { Skeleton } from '@/src/components/ui/skeleton';

import { useLedgerList, useAcceptLedger, useRejectLedger } from '@/src/actions/ledger/ledger-action';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';

import { Ledger, LedgerStatus, TransactionType } from '@/src/typedef/Ledger/ledger.interface';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@utils';
import { ArrowRight, Check, HandCoins, Plus, RefreshCw, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DialogNewLedger from './DialogNewLedger';
import { Badge } from '@/src/components/ui/badge';

const LedgerListScreen = () => {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending_balance' | 'settled' | 'pending_approval'>('all');
  const [initialLoading, setInitialLoading] = useState(true);

  const { user } = useAuth();
  const { acceptLedger, loading: accepting } = useAcceptLedger();
  const { rejectLedger, loading: rejecting } = useRejectLedger();

  const { fetchLedgers, loading } = useLedgerList();

  const loadLedgers = useCallback(async () => {
    const data = await fetchLedgers();
    if (data) setLedgers(data);
  }, [fetchLedgers]);

  useEffect(() => {
    let ignore = false;
    fetchLedgers().then((data) => {
      if (!ignore && data) setLedgers(data);
      if (!ignore) setInitialLoading(false);
    }).catch(() => {
      if (!ignore) setInitialLoading(false);
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

  if (initialLoading || (loading && ledgers.length === 0)) {
    return (
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="hidden sm:flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border/40 bg-card/60 p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-7 w-28" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-8" />
                </div>
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-24 sm:pb-8">
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
        <div className="hidden sm:flex flex-row gap-2 w-auto">
          <Button
            variant="outline"
            onClick={loadLedgers}
            disabled={loading}
            className="border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary transition-all"
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-2', loading && 'animate-spin')}
            />
            Atualizar
          </Button>
          <div className="w-auto">
            <DialogNewLedger
              dialogOpen={dialogOpen}
              setDialogOpen={setDialogOpen}
              loadLedgers={loadLedgers}
            />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      {ledgers.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all' as const, label: 'Todas' },
            { key: 'pending_approval' as const, label: `Pendentes${ledgers.filter(l => l.status === LedgerStatus.PENDING).length > 0 ? ` (${ledgers.filter(l => l.status === LedgerStatus.PENDING).length})` : ''}` },
            { key: 'pending_balance' as const, label: 'Com Saldo Pendente' },
            { key: 'settled' as const, label: 'Quites' },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key)}
              className={cn(
                'transition-all rounded-xl',
                filter === f.key
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary',
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>
      )}

      {/* Lista de Ledgers */}
      {ledgers.length === 0 ? (
        <Card className="border-dashed border-2 border-border/40 bg-background/30 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <HandCoins className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma dívida encontrada
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Comece criando sua primeira dívida com um amigo para acompanhar quem deve quem.
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Dívida
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ledgers
            .filter((ledger) => {
              if (filter === 'all') return true;
              if (filter === 'pending_approval') return ledger.status === LedgerStatus.PENDING;
              // For balance filters, only show accepted ledgers
              const balance = calculateBalance(ledger);
              if (filter === 'pending_balance') return ledger.status === LedgerStatus.ACCEPTED && balance !== 0;
              return ledger.status === LedgerStatus.ACCEPTED && balance === 0;
            })
            .map((ledger) => {
            const balance = calculateBalance(ledger);
            return (
              <Link
                key={ledger.id}
                href={`/ledgers/${ledger.id}`}
                prefetch={false}
              >
                <Card className="h-full rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all pointer-events-none" />
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <CardTitle className="text-lg font-bold min-w-0 pr-2 group-hover:text-primary transition-colors">
                        <span className="block truncate">{ledger.title}</span>
                      </CardTitle>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardDescription className="flex items-center gap-1.5 min-w-0">
                      <Users className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                      <span className="truncate block font-medium">{ledger.targetName}</span>
                      {ledger.status === LedgerStatus.PENDING ? (
                        <Badge variant="outline" className="text-[10px] ml-auto flex-shrink-0 border-amber-500/50 text-amber-500 bg-amber-500/10">
                          Pendente
                        </Badge>
                      ) : ledger.status === LedgerStatus.REJECTED ? (
                        <Badge variant="destructive" className="text-[10px] ml-auto flex-shrink-0">
                          Recusada
                        </Badge>
                      ) : (
                        <Badge
                          variant={balance === 0 ? 'default' : 'destructive'}
                          className="text-[10px] ml-auto flex-shrink-0"
                        >
                          {balance === 0 ? 'Quite' : balance > 0 ? 'Devendo' : 'A receber'}
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-center justify-between mt-2 mb-4">
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1">Saldo</p>
                        <p
                          className={cn(
                            'text-2xl font-extrabold tracking-tight',
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
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                          Lançamentos
                        </p>
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-background/50 border border-border/50 text-base font-bold text-foreground">
                          {ledger.transactions.length}
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 mt-2 border-t border-border/30">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        Criado em{' '}
                        {new Date(ledger.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {/* Accept/Reject buttons for pending ledgers where user is participant */}
                    {ledger.status === LedgerStatus.PENDING && ledger.participantId === user?.id && (
                      <div className="pt-3 mt-3 border-t border-border/30 flex gap-2" onClick={(e) => e.preventDefault()}>
                        <Button
                          size="sm"
                          onClick={async (e) => {
                            e.preventDefault();
                            const ok = await acceptLedger(ledger.id);
                            if (ok) loadLedgers();
                          }}
                          disabled={accepting || rejecting}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Aceitar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async (e) => {
                            e.preventDefault();
                            const ok = await rejectLedger(ledger.id);
                            if (ok) loadLedgers();
                          }}
                          disabled={accepting || rejecting}
                          className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 text-xs"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Recusar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        {fabOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end animate-in slide-in-from-bottom-4 fade-in duration-200">
            <button
              onClick={() => { setDialogOpen(true); setFabOpen(false); }}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full py-2.5 px-5 shadow-lg text-sm font-medium whitespace-nowrap min-w-[180px] justify-center"
            >
              <Plus className="w-4 h-4" /> Nova Dívida
            </button>
            <button
              onClick={() => { loadLedgers(); setFabOpen(false); }}
              className="flex items-center gap-2 bg-card text-foreground border border-border/50 rounded-full py-2.5 px-5 shadow-lg text-sm font-medium whitespace-nowrap min-w-[180px] justify-center"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Atualizar
            </button>
          </div>
        )}
        {fabOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setFabOpen(false)} />}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300',
            fabOpen ? 'bg-muted text-foreground rotate-45' : 'bg-primary text-primary-foreground shadow-[0_0_20px_-3px_var(--primary)]'
          )}
        >
          {fabOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
};

export { LedgerListScreen };
