'use client';

import { Skeleton } from '@/src/components/ui/skeleton';

import { useListFriends } from '@/src/actions/friend/friend-action';
import { useLedgerList } from '@/src/actions/ledger/ledger-action';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Ledger, TransactionType, Transaction } from '@/src/typedef/Ledger/ledger.interface';
import { User } from '@/src/typedef/User/user.interface';
import { cn } from '@utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowLeft, ArrowRight, Download, HandCoins, Loader2, Plus, RefreshCw, TrendingDown, TrendingUp, User as UserIcon, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, useMemo } from 'react';

interface FriendDetailScreenProps {
  friendId: string;
}

export const FriendDetailScreen = ({ friendId }: FriendDetailScreenProps) => {
  const { listAllFriends, loading: loadingFriends } = useListFriends();
  const { fetchLedgers, loading: loadingLedgers } = useLedgerList();
  
  const [friend, setFriend] = useState<User | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [friendLedgers, setFriendLedgers] = useState<Ledger[]>([]);

  const loadData = useCallback(async () => {
    const [fetchedFriends, fetchedLedgers] = await Promise.all([
      listAllFriends(),
      fetchLedgers()
    ]);

    if (fetchedFriends && fetchedLedgers) {
      const foundFriend = fetchedFriends.find(f => f.id === friendId);
      if (foundFriend) {
        setFriend(foundFriend);
        // Filtrar dívidas que este amigo participa
        // Atualmente associamos pelo `targetName` igual ao `friend.name`
        const filteredLedgers = fetchedLedgers.filter(l => l.targetName === foundFriend.name);
        setFriendLedgers(filteredLedgers);
      }
    }
  }, [listAllFriends, fetchLedgers, friendId]);

  useEffect(() => {
    let ignore = false;
    if (!ignore) loadData();
    return () => { ignore = true; };
  }, [loadData]);

  const loading = loadingFriends || loadingLedgers;

  const { totalBalance, totalDebt, totalPayments, allTransactions } = useMemo(() => {
    let debt = 0;
    let payments = 0;
    const transactions: (Transaction & { ledgerTitle: string, ledgerId: string })[] = [];

    friendLedgers.forEach(ledger => {
      ledger.transactions.forEach(t => {
        if (t.type === TransactionType.DEBT) debt += Number(t.amount);
        else payments += Number(t.amount);

        transactions.push({ ...t, ledgerTitle: ledger.title, ledgerId: ledger.id });
      });
    });

    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      totalBalance: debt - payments,
      totalDebt: debt,
      totalPayments: payments,
      allTransactions: transactions
    };
  }, [friendLedgers]);

  const generatePDF = () => {
    if (!friend) return;

    const doc = new jsPDF();
    
    // ------- BRANDED HEADER -------
    doc.setFillColor(88, 80, 236);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255);
    doc.text('MyFinance', 14, 18);
    doc.setFontSize(11);
    doc.text(`Extrato: ${friend.name}`, 14, 27);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 140, 27);
    doc.text(`E-mail: ${friend.email}`, 140, 20);

    // ------- SUMMARY CARDS -------
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Resumo do Amigo', 14, 48);

    doc.setFontSize(10);
    doc.setDrawColor(200);
    doc.roundedRect(14, 52, 55, 22, 3, 3, 'S');
    doc.setTextColor(100);
    doc.text('Total Dívidas', 18, 60);
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(13);
    doc.text(totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 18, 70);

    doc.setFontSize(10);
    doc.roundedRect(77, 52, 55, 22, 3, 3, 'S');
    doc.setTextColor(100);
    doc.text('Total Pago', 81, 60);
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(13);
    doc.text(totalPayments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 81, 70);

    doc.setFontSize(10);
    doc.roundedRect(140, 52, 55, 22, 3, 3, 'S');
    doc.setTextColor(100);
    doc.text('Saldo', 144, 60);
    const isDebt = totalBalance > 0;
    doc.setTextColor(isDebt ? 220 : 34, isDebt ? 38 : 197, isDebt ? 38 : 94);
    doc.setFontSize(13);
    doc.text(Math.abs(totalBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 144, 70);

    // ------- TABLE -------
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Extrato Detalhado', 14, 88);

    const tableData = allTransactions.map(t => [
      new Date(t.createdAt).toLocaleDateString('pt-BR'),
      t.ledgerTitle,
      t.description || 'Sem descrição',
      t.type === TransactionType.DEBT ? 'Dívida' : 'Pagamento',
      `${t.type === TransactionType.DEBT ? '+' : '-'} ${Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
    ]);

    autoTable(doc, {
      startY: 92,
      head: [['Data', 'Conta', 'Descrição', 'Tipo', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [88, 80, 236], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      styles: { fontSize: 8, cellPadding: 4 },
    });

    // ------- FOOTER -------
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Gerado por MyFinance — ${new Date().toLocaleString('pt-BR')} — Página ${i} de ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10,
      );
    }

    doc.save(`Extrato_${friend.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  };

  if (loading && !friend) {
    return (
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="hidden sm:flex gap-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-border/40 bg-card/60 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/60 p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!friend && !loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <UserIcon className="w-16 h-16 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Amigo não encontrado.</p>
        <Link href="/friends">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0">
        <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
          <Link href="/friends" className="flex-shrink-0">
            <Button variant="ghost" size="icon" className="hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate block">
              {friend?.name}
            </h2>
            <p className="text-muted-foreground truncate block">
              {friend?.email}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex flex-row gap-2 w-auto">
          <Button
            variant="outline"
            onClick={generatePDF}
            disabled={loading || allTransactions.length === 0}
            className="border-border/50 bg-background/50 backdrop-blur-sm hover:border-emerald-500/50 hover:text-emerald-500 transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>

          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary transition-all"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all pointer-events-none" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Saldo Consolidado
              </span>
              <div className="p-2.5 rounded-xl bg-background/50 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p
              className={cn(
                'text-3xl font-extrabold tracking-tight',
                totalBalance > 0
                  ? 'text-destructive'
                  : totalBalance < 0
                    ? 'text-emerald-500'
                    : 'text-foreground',
              )}
            >
              {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-destructive/10 hover:border-destructive/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-destructive/20 transition-all pointer-events-none" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total em Dívidas
              </span>
              <div className="p-2.5 rounded-xl bg-background/50 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-destructive" />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-destructive">
              {totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Pago
              </span>
              <div className="p-2.5 rounded-xl bg-background/50 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform">
                <TrendingDown className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-emerald-500">
              {totalPayments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
      {/* Dívidas do Amigo */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl relative overflow-hidden h-fit">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <HandCoins className="text-primary w-5 h-5" />
              Dívidas com {friend?.name}
            </h3>
          </div>

          {friendLedgers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <HandCoins className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">Nenhuma dívida direta encontrada.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {friendLedgers.map((ledger) => {
                const balance = ledger.transactions.reduce((acc, t) => {
                  return t.type === TransactionType.DEBT
                    ? acc + Number(t.amount)
                    : acc - Number(t.amount);
                }, 0);
                return (
                  <Link key={ledger.id} href={`/ledgers/${ledger.id}`} prefetch={false}>
                    <div className="p-4 rounded-xl border border-border/40 bg-background/40 backdrop-blur-md hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {ledger.title}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                      <p
                        className={cn(
                          'text-lg font-extrabold',
                          balance > 0 ? 'text-destructive' : balance < 0 ? 'text-emerald-500' : 'text-foreground'
                        )}
                      >
                        {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Histórico Consolidado */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl relative overflow-hidden h-fit">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
        <div className="p-6 relative z-10">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Wallet className="text-primary w-5 h-5" />
            Extrato Consolidado
          </h3>
          {allTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wallet className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">Sem histórico de transações.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allTransactions.map((t) => (
                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-background/40 backdrop-blur-sm border border-border/40 hover:border-primary/40 hover:shadow-md transition-all gap-3 sm:gap-0 group">
                  <div className="flex items-center gap-4 overflow-hidden">
                     <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105',
                          t.type === TransactionType.DEBT
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-emerald-500/10 text-emerald-500',
                        )}
                      >
                        {t.type === TransactionType.DEBT ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate block group-hover:text-primary transition-colors text-sm">
                            {t.description || 'Sem descrição'}
                          </span>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0 shadow-sm hidden sm:flex">
                            {t.ledgerTitle}
                          </Badge>
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground mt-1 block">
                          {new Date(t.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </span>
                      </div>
                  </div>
                  <span
                      className={cn(
                        'font-extrabold text-base tracking-tight mt-1 sm:mt-0',
                        t.type === TransactionType.DEBT ? 'text-destructive' : 'text-emerald-500'
                      )}
                    >
                      {t.type === TransactionType.DEBT ? '+' : '-'}{' '}
                      {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        {fabOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end animate-in slide-in-from-bottom-4 fade-in duration-200">
            <button
              onClick={() => { generatePDF(); setFabOpen(false); }}
              className="flex items-center gap-2 bg-card text-foreground border border-border/50 rounded-full py-2.5 px-5 shadow-lg text-sm font-medium whitespace-nowrap min-w-[180px] justify-center"
            >
              <Download className="w-4 h-4" /> Exportar PDF
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
