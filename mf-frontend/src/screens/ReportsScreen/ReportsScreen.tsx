'use client';

import { Skeleton } from '@/src/components/ui/skeleton';

import { useLedgerList } from '@/src/actions/ledger/ledger-action';
import { useListFriends } from '@/src/actions/friend/friend-action';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  Ledger,
  Transaction,
  TransactionType,
} from '@/src/typedef/Ledger/ledger.interface';
import { User } from '@/src/typedef/User/user.interface';
import { cn } from '@utils';
import {
  Calendar,
  Download,
  Filter,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  AlertTriangle,
  X,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Fixed vibrant colors for charts - works in both light and dark themes
const COLOR_DEBT = '#ef4444';
const COLOR_PAYMENT = '#22c55e';
const COLOR_BLUE = '#3b82f6';
const COLOR_AMBER = '#f59e0b';
const COLOR_VIOLET = '#8b5cf6';
const PIE_COLORS = [COLOR_DEBT, COLOR_PAYMENT, COLOR_BLUE, COLOR_AMBER, COLOR_VIOLET];

type ExtendedTxn = Transaction & { ledgerTitle: string; targetName: string };

export const ReportsScreen = () => {
  const { user } = useAuth();
  const { fetchLedgers, loading } = useLedgerList();
  const { listAllFriends } = useListFriends();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Filter state
  const [filterPerson, setFilterPerson] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'DEBT' | 'PAYMENT'>('ALL');
  const [filterMinValue, setFilterMinValue] = useState<string>('');
  const [filterMaxValue, setFilterMaxValue] = useState<string>('');
  const [filterLedger, setFilterLedger] = useState<string>('');

  useEffect(() => {
    fetchLedgers().then((data) => {
      if (data) setLedgers(data);
    });
    listAllFriends().then((data) => {
      if (data) setFriends(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get unique people from ledgers
  const uniqueTargets = useMemo(() => {
    const names = new Set<string>();
    ledgers.forEach((l) => names.add(l.targetName));
    return Array.from(names).sort();
  }, [ledgers]);

  // ALL transactions - flattened
  const allTransactions = useMemo<ExtendedTxn[]>(() => {
    const txns: ExtendedTxn[] = [];
    ledgers.forEach((ledger) => {
      ledger.transactions.forEach((t) => {
        txns.push({ ...t, ledgerTitle: ledger.title, targetName: ledger.targetName });
      });
    });
    txns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return txns;
  }, [ledgers]);

  // FILTERED transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      // Person filter
      if (filterPerson && t.targetName !== filterPerson) return false;
      // Ledger filter
      if (filterLedger && t.ledgerTitle !== filterLedger) return false;
      // Date range
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        if (new Date(t.createdAt) < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo + 'T23:59:59');
        if (new Date(t.createdAt) > to) return false;
      }
      // Type filter
      if (filterType !== 'ALL' && t.type !== filterType) return false;
      // Value range
      const amount = Number(t.amount);
      if (filterMinValue && amount < Number(filterMinValue)) return false;
      if (filterMaxValue && amount > Number(filterMaxValue)) return false;
      return true;
    });
  }, [allTransactions, filterPerson, filterLedger, filterDateFrom, filterDateTo, filterType, filterMinValue, filterMaxValue]);

  // Computed metrics from filtered data
  const metrics = useMemo(() => {
    let debt = 0;
    let payments = 0;
    const monthMap: Record<string, { month: string; Dividas: number; Pagamentos: number }> = {};
    const personMap: Record<string, { name: string; Dividas: number; Pagamentos: number }> = {};
    let bigDebt: { title: string; balance: number } | null = null;
    let oldUnpaid: { title: string; date: string } | null = null;

    // Per-ledger stats for biggest debt / oldest unpaid
    const ledgerStats: Record<string, { title: string; debt: number; pay: number; oldestDate: string }> = {};

    filteredTransactions.forEach((t) => {
      const amount = Number(t.amount);
      if (t.type === TransactionType.DEBT) {
        debt += amount;
      } else {
        payments += amount;
      }

      // Monthly
      const d = new Date(t.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { month: label, Dividas: 0, Pagamentos: 0 };
      if (t.type === TransactionType.DEBT) monthMap[key].Dividas += amount;
      else monthMap[key].Pagamentos += amount;

      // Per person
      if (!personMap[t.targetName]) personMap[t.targetName] = { name: t.targetName.length > 12 ? t.targetName.substring(0, 12) + '...' : t.targetName, Dividas: 0, Pagamentos: 0 };
      if (t.type === TransactionType.DEBT) personMap[t.targetName].Dividas += amount;
      else personMap[t.targetName].Pagamentos += amount;

      // Per ledger for biggest/oldest
      if (!ledgerStats[t.ledgerId]) ledgerStats[t.ledgerId] = { title: t.ledgerTitle, debt: 0, pay: 0, oldestDate: t.createdAt };
      if (t.type === TransactionType.DEBT) {
        ledgerStats[t.ledgerId].debt += amount;
        if (new Date(t.createdAt) < new Date(ledgerStats[t.ledgerId].oldestDate)) {
          ledgerStats[t.ledgerId].oldestDate = t.createdAt;
        }
      } else {
        ledgerStats[t.ledgerId].pay += amount;
      }
    });

    // Find biggest & oldest
    Object.values(ledgerStats).forEach((ls) => {
      const balance = ls.debt - ls.pay;
      if (balance > 0 && (!bigDebt || balance > bigDebt.balance)) {
        bigDebt = { title: ls.title, balance };
      }
      if (balance > 0 && (!oldUnpaid || new Date(ls.oldestDate) < new Date(oldUnpaid.date))) {
        oldUnpaid = { title: ls.title, date: ls.oldestDate };
      }
    });

    const paid = payments;
    const pending = Math.max(0, debt - payments);

    return {
      totalDebt: debt,
      totalPayments: payments,
      totalBalance: debt - payments,
      pieData: [
        { name: 'Pago', value: paid },
        { name: 'Pendente', value: pending },
      ],
      monthlyData: Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v),
      personData: Object.values(personMap),
      biggestDebt: bigDebt as { title: string; balance: number } | null,
      oldestUnpaid: oldUnpaid as { title: string; date: string } | null,
      lastTransaction: filteredTransactions[0] || null,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const clearFilters = () => {
    setFilterPerson('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterType('ALL');
    setFilterMinValue('');
    setFilterMaxValue('');
    setFilterLedger('');
  };

  const hasActiveFilters = filterPerson || filterDateFrom || filterDateTo || filterType !== 'ALL' || filterMinValue || filterMaxValue || filterLedger;

  // ====== PDF GENERATION ======
  const generateReportPDF = () => {
    if (!user) return;
    const doc = new jsPDF();

    // ------- BRANDED HEADER -------
    doc.setFillColor(88, 80, 236);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255);
    doc.text('MyFinance', 14, 18);
    doc.setFontSize(11);
    doc.text('Relatório Financeiro', 14, 27);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 140, 20);
    doc.text(`Usuário: ${user.name}`, 140, 27);

    // Active filters info
    let filterY = 33;
    const activeFilters: string[] = [];
    if (filterPerson) activeFilters.push(`Pessoa: ${filterPerson}`);
    if (filterLedger) activeFilters.push(`Conta: ${filterLedger}`);
    if (filterDateFrom || filterDateTo) activeFilters.push(`Período: ${filterDateFrom || '...'} a ${filterDateTo || '...'}`);
    if (filterType !== 'ALL') activeFilters.push(`Tipo: ${filterType === 'DEBT' ? 'Dívidas' : 'Pagamentos'}`);
    if (filterMinValue || filterMaxValue) activeFilters.push(`Valores: R$${filterMinValue || '0'} - R$${filterMaxValue || '∞'}`);
    if (activeFilters.length > 0) {
      doc.setFontSize(7);
      doc.setTextColor(220);
      doc.text(`Filtros: ${activeFilters.join(' | ')}`, 14, filterY);
    }

    // ------- SUMMARY CARDS -------
    let y = 48;
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Resumo', 14, y);
    y += 4;

    doc.setFontSize(10);
    doc.setDrawColor(200);
    // Card 1
    doc.roundedRect(14, y, 55, 22, 3, 3, 'S');
    doc.setTextColor(100);
    doc.text('Total Dívidas', 18, y + 8);
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(13);
    doc.text(metrics.totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 18, y + 18);
    // Card 2
    doc.setFontSize(10);
    doc.roundedRect(77, y, 55, 22, 3, 3, 'S');
    doc.setTextColor(100);
    doc.text('Total Pago', 81, y + 8);
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(13);
    doc.text(metrics.totalPayments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 81, y + 18);
    // Card 3
    doc.setFontSize(10);
    doc.roundedRect(140, y, 55, 22, 3, 3, 'S');
    doc.setTextColor(100);
    doc.text('Saldo', 144, y + 8);
    const isDebt = metrics.totalBalance > 0;
    doc.setTextColor(isDebt ? 220 : 34, isDebt ? 38 : 197, isDebt ? 38 : 94);
    doc.setFontSize(13);
    doc.text(Math.abs(metrics.totalBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 144, y + 18);

    y += 30;

    // Additional KPIs
    doc.setTextColor(80);
    doc.setFontSize(9);
    if (metrics.biggestDebt) {
      doc.text(`Maior dívida ativa: ${metrics.biggestDebt.title} — ${metrics.biggestDebt.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, y);
      y += 5;
    }
    if (metrics.oldestUnpaid) {
      doc.text(`Dívida mais antiga: ${metrics.oldestUnpaid.title} — desde ${new Date(metrics.oldestUnpaid.date).toLocaleDateString('pt-BR')}`, 14, y);
      y += 5;
    }
    doc.text(`Total de transações: ${metrics.transactionCount}`, 14, y);
    y += 8;

    // ------- PER-PERSON BREAKDOWN TABLE -------
    if (metrics.personData.length > 0) {
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.text('Resumo por Pessoa', 14, y);
      y += 4;

      const personTableData = metrics.personData.map(p => [
        p.name,
        p.Dividas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        p.Pagamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        (p.Dividas - p.Pagamentos).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Pessoa', 'Dívidas', 'Pagamentos', 'Saldo']],
        body: personTableData,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 250] },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ------- TRANSACTIONS TABLE -------
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text('Extrato Detalhado', 14, y);
    y += 4;

    const tableData = filteredTransactions.map((t) => [
      new Date(t.createdAt).toLocaleDateString('pt-BR'),
      t.targetName,
      t.ledgerTitle,
      t.description || 'Sem descrição',
      t.type === TransactionType.DEBT ? 'Dívida' : 'Pagamento',
      `${t.type === TransactionType.DEBT ? '+' : '-'} ${Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Data', 'Pessoa', 'Conta', 'Descrição', 'Tipo', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [88, 80, 236], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      styles: { fontSize: 7, cellPadding: 3 },
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

    const ts = new Date().getTime();
    doc.save(`Relatorio_MyFinance_${ts}.pdf`);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-0 space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="hidden sm:flex gap-2">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-border/40 bg-card/80 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-xl" />
              </div>
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/40 bg-card/60 p-6 space-y-4">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/60 p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-0 space-y-6 animate-in fade-in duration-500 pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Relatórios</h2>
          <p className="text-muted-foreground">
            Análise financeira com filtros avançados.
            {hasActiveFilters && (
              <span className="ml-2 text-primary font-semibold">({metrics.transactionCount} transações filtradas)</span>
            )}
          </p>
        </div>
        <div className="hidden sm:flex gap-2 w-auto">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-xl border-border/50"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
          <Button
            onClick={generateReportPDF}
            disabled={filteredTransactions.length === 0}
            className="bg-primary text-primary-foreground hover:bg-primary/80 shadow-lg shadow-primary/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </div>

      {/* ===== FILTER PANEL ===== */}
      {showFilters && (
        <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                Filtros Avançados
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive hover:text-destructive/80 rounded-xl">
                  <X className="w-4 h-4 mr-1" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* Person filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3" /> Pessoa
                </Label>
                <select
                  value={filterPerson}
                  onChange={(e) => setFilterPerson(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="">Todas as Pessoas</option>
                  {uniqueTargets.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Ledger filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Conta
                </Label>
                <select
                  value={filterLedger}
                  onChange={(e) => setFilterLedger(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="">Todas as Contas</option>
                  {ledgers.map((l) => (
                    <option key={l.id} value={l.title}>{l.title}</option>
                  ))}
                </select>
              </div>

              {/* Type filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Tipo</Label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'ALL' | 'DEBT' | 'PAYMENT')}
                  className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="ALL">Todos os Tipos</option>
                  <option value="DEBT">Apenas Dívidas</option>
                  <option value="PAYMENT">Apenas Pagamentos</option>
                </select>
              </div>

              {/* Date range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Período
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="rounded-xl text-xs"
                    placeholder="De"
                  />
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="rounded-xl text-xs"
                    placeholder="Até"
                  />
                </div>
              </div>

              {/* Value range */}
              <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Faixa de Valores (R$)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={filterMinValue}
                    onChange={(e) => setFilterMinValue(e.target.value)}
                    placeholder="Mínimo"
                    className="rounded-xl"
                    min={0}
                  />
                  <Input
                    type="number"
                    value={filterMaxValue}
                    onChange={(e) => setFilterMaxValue(e.target.value)}
                    placeholder="Máximo"
                    className="rounded-xl"
                    min={0}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300 group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground uppercase tracking-wider">Saldo Devedor</span>
              <div className="p-2 rounded-xl bg-background/50 group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className={cn('text-2xl font-extrabold', metrics.totalBalance > 0 ? 'text-destructive' : 'text-emerald-500')}>
              {metrics.totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300 group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground uppercase tracking-wider">Maior Dívida</span>
              <div className="p-2 rounded-xl bg-background/50 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            </div>
            <p className="text-lg font-bold truncate">{metrics.biggestDebt?.title || '—'}</p>
            {metrics.biggestDebt && (
              <p className="text-sm text-destructive font-semibold">
                {metrics.biggestDebt.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300 group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground uppercase tracking-wider">Último Lançamento</span>
              <div className="p-2 rounded-xl bg-background/50 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
            {metrics.lastTransaction ? (
              <>
                <p className="text-lg font-bold truncate">{metrics.lastTransaction.description || 'Sem descrição'}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(metrics.lastTransaction.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300 group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground uppercase tracking-wider">Dívida Mais Antiga</span>
              <div className="p-2 rounded-xl bg-background/50 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            {metrics.oldestUnpaid ? (
              <>
                <p className="text-lg font-bold truncate">{metrics.oldestUnpaid.title}</p>
                <p className="text-sm text-muted-foreground">
                  Desde {new Date(metrics.oldestUnpaid.date).toLocaleDateString('pt-BR')}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Nenhuma pendente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* PIE CHART */}
        <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-emerald-500" />
            Percentual Pago vs Pendente
          </h3>
          {metrics.pieData.every(d => d.value === 0) ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Sem dados para os filtros aplicados.</div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics.pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px', padding: '8px 14px' }}
                    formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* AREA CHART */}
        <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Evolução Mensal
          </h3>
          {metrics.monthlyData.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Sem dados para os filtros aplicados.</div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradDebt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLOR_DEBT} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLOR_DEBT} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPay" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLOR_PAYMENT} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLOR_PAYMENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px', padding: '8px 14px' }}
                    formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="Dividas" name="Dívidas" stroke={COLOR_DEBT} fillOpacity={1} fill="url(#gradDebt)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Pagamentos" stroke={COLOR_PAYMENT} fillOpacity={1} fill="url(#gradPay)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* BAR CHART — per person */}
      <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Dívidas vs Pagamentos por Pessoa
        </h3>
        {metrics.personData.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Sem dados para os filtros aplicados.</div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.personData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px', padding: '8px 14px' }}
                  formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Dividas" name="Dívidas" fill={COLOR_DEBT} radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Pagamentos" fill={COLOR_PAYMENT} radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Recent transactions preview */}
      {filteredTransactions.length > 0 && (
        <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Últimas Transações ({Math.min(filteredTransactions.length, 10)} de {filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredTransactions.slice(0, 10).map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-accent/50 transition-colors border-b border-border/20 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      t.type === TransactionType.DEBT ? 'bg-red-500' : 'bg-emerald-500'
                    )} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.description || t.ledgerTitle}</p>
                      <p className="text-xs text-muted-foreground">{t.targetName} • {new Date(t.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm font-bold whitespace-nowrap ml-2',
                    t.type === TransactionType.DEBT ? 'text-destructive' : 'text-emerald-500'
                  )}>
                    {t.type === TransactionType.DEBT ? '+' : '-'}
                    {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        {fabOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end animate-in slide-in-from-bottom-4 fade-in duration-200">
            <button
              onClick={() => { setShowFilters(!showFilters); setFabOpen(false); }}
              className="flex items-center gap-2 bg-card text-foreground border border-border/50 rounded-full py-2.5 px-5 shadow-lg text-sm font-medium whitespace-nowrap min-w-[200px] justify-center"
            >
              <Filter className="w-4 h-4" /> {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
            <button
              onClick={() => { generateReportPDF(); setFabOpen(false); }}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full py-2.5 px-5 shadow-lg text-sm font-medium whitespace-nowrap min-w-[200px] justify-center"
            >
              <Download className="w-4 h-4" /> Gerar PDF
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
