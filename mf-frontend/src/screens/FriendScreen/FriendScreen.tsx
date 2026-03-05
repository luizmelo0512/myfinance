'use client';

import { Skeleton } from '@/src/components/ui/skeleton';

import { useLinkFriend, useListFriends } from '@/src/actions/friend/friend-action';
import { useLedgerList } from '@/src/actions/ledger/ledger-action';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Ledger, TransactionType } from '@/src/typedef/Ledger/ledger.interface';
import { User } from '@/src/typedef/User/user.interface';
import { cn } from '@utils';
import { ArrowRight, Loader2, Plus, RefreshCw, UserPlus, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface FriendWithBalance extends User {
  balance: number;
}

export const FriendScreen = () => {
  const { listAllFriends, loading: loadingFriends } = useListFriends();
  const { fetchLedgers, loading: loadingLedgers } = useLedgerList();
  const { linkFriendByEmail, loading: linking } = useLinkFriend();
  
  const [friends, setFriends] = useState<FriendWithBalance[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [fabOpen, setFabOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [fetchedFriends, fetchedLedgers] = await Promise.all([
      listAllFriends(),
      fetchLedgers()
    ]);

    if (fetchedFriends && fetchedLedgers) {
      // Calcular saldo por amigo
      const friendsWithBalances = fetchedFriends.map(friend => {
        let friendBalance = 0;
        
        // Procurar todas as dívidas onde este amigo é o alvo (targetName match or some participant ID logic)
        // Como o backend salva friend.id e a UI usa o participantId na criação, vamos buscar pelo ID nas transações/ledgers
        fetchedLedgers.forEach(ledger => {
          // If the ledger is directly associated with the friend (using participantId context if available, or targetName as fallback if they match exactly)
          // Na nossa criação de ledger, nós salvamos targetName. Se a gente seleciona um amigo, idealmente salva targetName = amigo.name.
          // Para ser exato num MVP, vamos somar onde targetName == friend.name
          if (ledger.targetName === friend.name) {
            friendBalance += ledger.transactions.reduce((acc, t) => {
              return t.type === TransactionType.DEBT
                ? acc + Number(t.amount)
                : acc - Number(t.amount);
            }, 0);
          }
        });

        return {
          ...friend,
          balance: friendBalance
        };
      });

      setFriends(friendsWithBalances);
    }
    setInitialLoading(false);
  }, [listAllFriends, fetchLedgers]);

  useEffect(() => {
    let ignore = false;
    if (!ignore) loadData();
    return () => { ignore = true; };
  }, [loadData]);

  const handleLinkFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendEmail || !newFriendEmail.includes('@')) {
      toast.error('Digite um e-mail válido para vincular.');
      return;
    }

    const success = await linkFriendByEmail(newFriendEmail);
    if (success) {
      toast.success('Amigo vinculado com sucesso!');
      setDialogOpen(false);
      setNewFriendEmail('');
      loadData();
    } else {
      toast.error('Não foi possível vincular. Verifique o e-mail inserido.');
    }
  };

  const loading = loadingFriends || loadingLedgers;

  if (initialLoading || (loading && friends.length === 0)) {
    return (
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="hidden sm:flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border/40 bg-card/60 p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
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
            Amigos
          </h2>
          <p className="text-muted-foreground">
            Gerencie suas conexões e veja o saldo de quem deve quem.
          </p>
        </div>
        <div className="hidden sm:flex flex-row gap-2 w-auto">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary transition-all"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Atualizar
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_-3px_var(--primary)]">
                <UserPlus className="w-4 h-4 mr-2" />
                Vincular Amigo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Vincular Novo Amigo</DialogTitle>
                <DialogDescription>
                  Informe o e-mail exato do usuário que já possui conta no sistema para conectar suas agendas.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLinkFriend}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail do Amigo</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemplo@email.com"
                      value={newFriendEmail}
                      onChange={(e) => setNewFriendEmail(e.target.value)}
                      disabled={linking}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setNewFriendEmail('');
                    }}
                    disabled={linking}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={linking}>
                    {linking ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Vincular
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Amigos */}
      {friends.length === 0 ? (
        <Card className="border-dashed border-2 border-border/40 bg-background/30 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Você ainda não vinculou nenhum amigo
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Conecte-se com outras pessoas para dividir e organizar dívidas facilmente.
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Amigo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {friends.map((friend) => (
            <Link key={friend.id} href={`/friends/${friend.id}`} prefetch={false}>
              <Card className="h-full rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all pointer-events-none" />
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <CardTitle className="text-lg font-bold min-w-0 pr-2 group-hover:text-primary transition-colors">
                      <span className="block truncate">{friend.name}</span>
                    </CardTitle>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardDescription className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate block font-medium">{friend.email}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center justify-between mt-2 mb-2">
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1">Saldo Consolidado</p>
                      <p
                        className={cn(
                          'text-2xl font-extrabold tracking-tight',
                          friend.balance > 0
                            ? 'text-destructive'
                            : friend.balance < 0
                              ? 'text-emerald-500'
                              : 'text-foreground',
                        )}
                      >
                        {friend.balance.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                    </div>
                  </div>
                  {friend.balance !== 0 && (
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                      {friend.balance > 0 ? "Ele te deve" : "Você deve a ele"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
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
              <UserPlus className="w-4 h-4" /> Vincular Amigo
            </button>
            <button
              onClick={() => { loadData(); setFabOpen(false); }}
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
