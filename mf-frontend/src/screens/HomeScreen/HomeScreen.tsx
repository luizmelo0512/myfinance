'use client';

import { Skeleton } from '@/src/components/ui/skeleton';

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
import { ArrowRight, Download, HandCoins, Loader2, Plus, RefreshCw, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const HomeScreen = () => {
  const { user, loading: authLoading } = useAuth();
  const { fetchLedgers, loading: ledgersLoading } = useLedgerList();
  const [fabOpen, setFabOpen] = useState(false);
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
  const { totalBalance, totalDebt, totalPayments, recentTransactions, allTransactions, chartData } =
    useMemo(() => {
      let debt = 0;
      let payments = 0;
      const allTransactions: (Transaction & { ledgerTitle: string })[] = [];

      // Prepara dados para o gráfico de barras
      const chartDataMap: Record<string, { name: string; Dividas: number; Pagamentos: number }> = {};

      ledgers.forEach((ledger) => {
        let ledgerDebt = 0;
        let ledgerPayment = 0;

        ledger.transactions.forEach((t) => {
          if (t.type === TransactionType.DEBT) {
            debt += Number(t.amount);
            ledgerDebt += Number(t.amount);
          } else {
            payments += Number(t.amount);
            ledgerPayment += Number(t.amount);
          }
          allTransactions.push({ ...t, ledgerTitle: ledger.title });
        });
        
        // Adiciona itens ao Chart se tiver alguma transação
        if (ledgerDebt > 0 || ledgerPayment > 0) {
           chartDataMap[ledger.id] = {
             name: ledger.title.length > 15 ? ledger.title.substring(0, 15) + '...' : ledger.title,
             Dividas: ledgerDebt,
             Pagamentos: ledgerPayment
           };
        }
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
        allTransactions, // Exportado pro PDF
        chartData: Object.values(chartDataMap)
      };
    }, [ledgers]);

  const generateGlobalPDF = () => {
    if (!user) return;
    
    const doc = new jsPDF();

    // ------- BRANDED HEADER -------
    doc.setFillColor(88, 80, 236);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255);
    doc.text('MyFinance', 14, 18);
    doc.setFontSize(11);
    doc.text('Extrato Global', 14, 27);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 140, 27);
    doc.text(`Usuário: ${user.name}`, 140, 20);

    // ------- SUMMARY CARDS -------
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Resumo Global', 14, 48);

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

    const tableData = allTransactions.map((t: Transaction & { ledgerTitle: string }) => [
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

    doc.save(`Extrato_Global_${new Date().getTime()}.pdf`);
  };

  if (authLoading) {
    return (
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="hidden sm:flex gap-2">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-border/40 bg-card/60 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/60 p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-24 sm:pb-8">
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
        <div className="hidden sm:flex flex-row gap-2 w-auto">
          <Button
            variant="outline"
            onClick={generateGlobalPDF}
            disabled={ledgersLoading || ledgers.length === 0}
            className="border-border/50 bg-background/50 backdrop-blur-sm hover:border-emerald-500/50 hover:text-emerald-500 transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Extrato Global (PDF)
          </Button>
          <Button
            variant="outline"
            onClick={loadData}
            disabled={ledgersLoading}
            className="border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary transition-all"
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-2', ledgersLoading && 'animate-spin')}
            />
            Atualizar
          </Button>
        </div>
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
      
      {/* Gráfico do Mês */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mt-32 pointer-events-none" />
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6 relative z-10">
           Visão Geral das Contas (Receitas vs Despesas)
        </h3>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground text-sm">
            Nenhum dado transacional disponível.
          </div>
        ) : (
          <div className="h-[300px] w-full mt-4 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `R$ ${val}`} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: 14, fontWeight: 600 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar dataKey="Dividas" name="Lançamentos/Deveres" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Pagamentos" name="Pagamentos/Haveres" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
      {/* Dívidas Ativas */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="flex items-center justify-between mb-6 relative z-10">
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
              const balance = ledger.transactions.reduce((acc: number, t: Transaction) => {
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
                  <div className="p-5 rounded-xl border border-border/40 bg-background/40 backdrop-blur-md hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {ledger.title}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
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
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 relative z-10">
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
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-background/40 backdrop-blur-sm border border-border/40 hover:border-primary/40 hover:shadow-md transition-all gap-3 sm:gap-0 group relative z-10"
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
                        <span className="font-medium text-foreground truncate block group-hover:text-primary transition-colors">
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
      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        {fabOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end animate-in slide-in-from-bottom-4 fade-in duration-200">
            <button
              onClick={() => { generateGlobalPDF(); setFabOpen(false); }}
              className="flex items-center gap-2 bg-card text-foreground border border-border/50 rounded-full py-2.5 px-5 shadow-lg text-sm font-medium whitespace-nowrap min-w-[200px] justify-center"
            >
              <Download className="w-4 h-4" /> Extrato Global (PDF)
            </button>
            <button
              onClick={() => { loadData(); setFabOpen(false); }}
              className="flex items-center gap-2 bg-card text-foreground border border-border/50 rounded-full py-2.5 px-5 shadow-lg text-sm font-medium whitespace-nowrap min-w-[200px] justify-center"
            >
              <RefreshCw className={cn('w-4 h-4', ledgersLoading && 'animate-spin')} /> Atualizar
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
  <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all pointer-events-none" />
    <div className="flex items-center justify-between mb-4 relative z-10">
      <span className="text-md font-medium text-muted-foreground">{title}</span>
      <div className="p-2.5 rounded-xl bg-background/50 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </div>
    <div className={cn('text-3xl font-extrabold tracking-tight relative z-10', color)}>
      {value}
    </div>
    {trend && <p className="text-sm font-medium text-muted-foreground mt-2 relative z-10">{trend}</p>}
  </div>
);

export { HomeScreen };
