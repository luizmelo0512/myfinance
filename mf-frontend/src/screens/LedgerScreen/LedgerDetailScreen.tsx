'use client';

import { Skeleton } from '@/src/components/ui/skeleton';

import { useLedgerDetail, useDeleteLedger } from '@/src/actions/ledger/ledger-action';
import { useCreateTransaction, useDeleteTransaction } from '@/src/actions/transaction/transaction-action';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
} from '@/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Textarea } from '@/src/components/ui/textarea';
import {
  LedgerWithBalance,
  Transaction,
  TransactionType,
} from '@/src/typedef/Ledger/ledger.interface';
import { cn } from '@utils';
import {
  ArrowLeft,
  Calendar,
  Download,
  Filter,
  Info,
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CreateTransactionFormData {
  amount: string;
  type: TransactionType;
  description: string;
  transactionDate: string;
}

interface LedgerDetailScreenProps {
  ledgerId: string;
}

const LedgerDetailScreen = ({ ledgerId }: LedgerDetailScreenProps) => {
  const [ledger, setLedger] = useState<LedgerWithBalance | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [infoTransaction, setInfoTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmTxn, setDeleteConfirmTxn] = useState<Transaction | null>(null);
  const [deleteConfirmLedger, setDeleteConfirmLedger] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMinValue, setFilterMinValue] = useState('');
  const [filterMaxValue, setFilterMaxValue] = useState('');

  const router = useRouter();
  const { fetchLedger, loading } = useLedgerDetail();
  const { createTransaction, loading: creating } = useCreateTransaction();
  const { deleteTransaction, loading: deletingTxn } = useDeleteTransaction();
  const { deleteLedger, loading: deletingLedger } = useDeleteLedger();

  const { control, handleSubmit, reset, setValue } =
    useForm<CreateTransactionFormData>({
      defaultValues: {
        amount: '',
        type: TransactionType.DEBT,
        description: '',
        transactionDate: new Date().toISOString().split('T')[0],
      },
    });

  const loadLedger = useCallback(async () => {
    const data = await fetchLedger(ledgerId);
    if (data) setLedger(data);
  }, [fetchLedger, ledgerId]);

  useEffect(() => {
    let ignore = false;
    fetchLedger(ledgerId).then((data) => {
      if (!ignore && data) setLedger(data);
      if (!ignore) setInitialLoading(false);
    }).catch(() => {
      if (!ignore) setInitialLoading(false);
    });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerId]);

  const onSubmitTransaction = async (data: CreateTransactionFormData) => {
    const result = await createTransaction({
      amount: parseFloat(data.amount),
      type: data.type,
      description: data.description || undefined,
      ledgerId,
      transactionDate: data.transactionDate || undefined,
    });
    if (result) {
      reset({
        amount: '',
        type: TransactionType.DEBT,
        description: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });
      setDialogOpen(false);
      loadLedger();
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deleteConfirmTxn) return;
    const success = await deleteTransaction(deleteConfirmTxn.id);
    if (success) {
      setDeleteConfirmTxn(null);
      loadLedger();
    }
  };

  const handleDeleteLedger = async () => {
    const success = await deleteLedger(ledgerId);
    if (success) {
      router.push('/ledgers');
    }
  };

  const hasActiveFilters = (filterType && filterType !== 'ALL') || filterDateFrom || filterDateTo || filterMinValue || filterMaxValue;

  const filteredTransactions = useMemo(() => {
    if (!ledger) return [];
    return ledger.transactions.filter((t) => {
      if (filterType && filterType !== 'ALL' && t.type !== filterType) return false;
      const tDate = new Date(t.transactionDate || t.createdAt);
      if (filterDateFrom && tDate < new Date(filterDateFrom)) return false;
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (tDate > to) return false;
      }
      const amt = Number(t.amount);
      if (filterMinValue && amt < parseFloat(filterMinValue)) return false;
      if (filterMaxValue && amt > parseFloat(filterMaxValue)) return false;
      return true;
    });
  }, [ledger, filterType, filterDateFrom, filterDateTo, filterMinValue, filterMaxValue]);

  const clearFilters = () => {
    setFilterType('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterMinValue('');
    setFilterMaxValue('');
  };

  const totalDebt = filteredTransactions
    .filter((t) => t.type === TransactionType.DEBT)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPayments = filteredTransactions
    .filter((t) => t.type === TransactionType.PAYMENT)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const filteredBalance = totalDebt - totalPayments;

  if (initialLoading || (loading && !ledger)) {
    return (
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="hidden sm:flex gap-2">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-border/40 bg-card/60 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-36" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/60 p-6 space-y-4">
          <Skeleton className="h-5 w-44" />
          {[1, 2, 3, 4].map((i) => (
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

  if (!ledger && !initialLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Dívida não encontrada.</p>
        <Link href="/ledgers">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  const generateSpecificPDF = () => {
    if (!ledger) return;

    const doc = new jsPDF();

    // ------- BRANDED HEADER -------
    doc.setFillColor(88, 80, 236);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255);
    doc.text('MyFinance', 14, 18);
    doc.setFontSize(11);
    doc.text(`Extrato: ${ledger.title}`, 14, 27);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 140, 27);
    doc.text(`Contraparte: ${ledger.targetName}`, 140, 20);

    // ------- SUMMARY CARDS -------
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Resumo da Conta', 14, 48);

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
    const isDebt = filteredBalance > 0;
    doc.setTextColor(isDebt ? 220 : 34, isDebt ? 38 : 197, isDebt ? 38 : 94);
    doc.setFontSize(13);
    doc.text(Math.abs(filteredBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 144, 70);

    // ------- FILTER INFO -------
    if (hasActiveFilters) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      const filters: string[] = [];
      if (filterType) filters.push(`Tipo: ${filterType === 'DEBT' ? 'Dívidas' : 'Pagamentos'}`);
      if (filterDateFrom) filters.push(`De: ${new Date(filterDateFrom).toLocaleDateString('pt-BR')}`);
      if (filterDateTo) filters.push(`Até: ${new Date(filterDateTo).toLocaleDateString('pt-BR')}`);
      if (filterMinValue) filters.push(`Min: R$ ${filterMinValue}`);
      if (filterMaxValue) filters.push(`Max: R$ ${filterMaxValue}`);
      doc.text(`Filtros: ${filters.join(' | ')}`, 14, 83);
    }

    // ------- TABLE -------
    doc.setTextColor(0);
    doc.setFontSize(12);
    const tableStartY = hasActiveFilters ? 90 : 85;
    doc.text('Extrato Detalhado', 14, tableStartY);

    const sortedTransactions = [...filteredTransactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const tableData = sortedTransactions.map((t) => [
      new Date(t.transactionDate || t.createdAt).toLocaleDateString('pt-BR'),
      t.description || 'Sem descrição',
      t.type === TransactionType.DEBT ? 'Dívida' : 'Pagamento',
      t.createdByName || '—',
      `${t.type === TransactionType.DEBT ? '+' : '-'} ${Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    ]);

    autoTable(doc, {
      startY: tableStartY + 4,
      head: [['Data', 'Descrição', 'Tipo', 'Registrado por', 'Valor']],
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

    doc.save(`Extrato_${ledger.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0">
        <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
          <Link href="/ledgers" className="flex-shrink-0">
            <Button variant="ghost" size="icon" className="hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate block">
              {ledger.title}
            </h2>
            <p className="text-muted-foreground truncate block">
              Contraparte:{' '}
              <span className="text-primary">{ledger.targetName}</span>
            </p>
          </div>
        </div>
        {/* Desktop action buttons — hidden on mobile */}
        <div className="hidden sm:flex flex-row gap-2 w-auto mt-0">
          <Button
            variant="outline"
            onClick={generateSpecificPDF}
            className="border-border/50 bg-background/50 backdrop-blur-sm hover:border-emerald-500/50 hover:text-emerald-500 transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            onClick={loadLedger}
            disabled={loading}
            className="border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary transition-all"
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-2', loading && 'animate-spin')}
            />
            Atualizar
          </Button>

          {/* Botão Excluir Dívida */}
          <Dialog open={deleteConfirmLedger} onOpenChange={setDeleteConfirmLedger}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Dívida
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-destructive">Excluir Dívida</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir &quot;{ledger.title}&quot;? Todos os lançamentos serão excluídos permanentemente. Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmLedger(false)}
                  disabled={deletingLedger}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteLedger}
                  disabled={deletingLedger}
                >
                  {deletingLedger ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Confirmar Exclusão
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Botão Novo Lançamento */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/80 shadow-[0_0_15px_-3px_var(--primary)]">
                <Plus className="w-4 h-4 mr-2" />
                Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Lançamento</DialogTitle>
                <DialogDescription>
                  Adicione uma nova dívida ou pagamento a &quot;{ledger.title}
                  &quot;.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmitTransaction)}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Controller
                      name="amount"
                      control={control}
                      rules={{
                        required: 'Informe o valor',
                        min: {
                          value: 0.01,
                          message: 'Valor deve ser maior que 0',
                        },
                      }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0,00"
                          disabled={creating}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Controller
                      name="type"
                      control={control}
                      rules={{ required: 'Selecione o tipo' }}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(val) =>
                            setValue('type', val as TransactionType)
                          }
                          disabled={creating}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TransactionType.DEBT}>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-destructive" />
                                Dívida
                              </div>
                            </SelectItem>
                            <SelectItem value={TransactionType.PAYMENT}>
                              <div className="flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-emerald-500" />
                                Pagamento
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Data da movimentação */}
                  <div className="space-y-2">
                    <Label htmlFor="transactionDate">
                      Data da Movimentação
                    </Label>
                    <Controller
                      name="transactionDate"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="transactionDate"
                          type="date"
                          disabled={creating}
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pode ser retroativa. A data de inserção no sistema será registrada automaticamente.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Descrição{' '}
                      <span className="text-muted-foreground text-xs">
                        (opcional)
                      </span>
                    </Label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          id="description"
                          placeholder="Ex: Empréstimo para compra de material..."
                          disabled={creating}
                          rows={3}
                        />
                      )}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      reset();
                    }}
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      'Registrar'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros de Transações — antes dos cards */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/30 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Filtros de Lançamentos</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-[10px]">
                {filteredTransactions.length} resultado{filteredTransactions.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{showFilters ? 'Ocultar' : 'Mostrar'}</span>
        </button>
        {showFilters && (
          <div className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  Tipo
                </Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos os Tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os Tipos</SelectItem>
                    <SelectItem value="DEBT">Apenas Dívidas</SelectItem>
                    <SelectItem value="PAYMENT">Apenas Pagamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Data Início
                </Label>
                <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Data Fim
                </Label>
                <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Faixa de Valores (R$)</Label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Mín" value={filterMinValue} onChange={(e) => setFilterMinValue(e.target.value)} className="h-9" />
                  <Input type="number" placeholder="Máx" value={filterMaxValue} onChange={(e) => setFilterMaxValue(e.target.value)} className="h-9" />
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive hover:text-destructive">
                <X className="w-3 h-3 mr-1" /> Limpar Filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all pointer-events-none" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Saldo
              </span>
              <div className="p-2.5 rounded-xl bg-background/50 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p
              className={cn(
                'text-3xl font-extrabold tracking-tight',
                filteredBalance > 0
                  ? 'text-destructive'
                  : filteredBalance < 0
                    ? 'text-emerald-500'
                    : 'text-foreground',
              )}
            >
              {filteredBalance.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground mt-1">
                {filteredTransactions.length} de {ledger.transactions.length} lançamentos
              </p>
            )}
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
              {totalDebt.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
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
              {totalPayments.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Transações */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 relative z-10">
              <Wallet className="w-5 h-5 text-primary" />
              Lançamentos
              {hasActiveFilters && (
                <span className="text-sm font-normal text-muted-foreground">({filteredTransactions.length} de {ledger.transactions.length})</span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground relative z-10 mt-1">
              Histórico de todas as transações desta dívida.
            </p>
          </div>
          <div className="relative z-10">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {hasActiveFilters ? 'Nenhum lançamento corresponde aos filtros.' : 'Nenhum lançamento registrado ainda.'}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" /> Limpar Filtros
                  </Button>
                ) : (
                  <Button className="mt-4 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Lançamento
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions
                  .sort(
                    (a, b) =>
                      new Date(b.transactionDate || b.createdAt).getTime() -
                      new Date(a.transactionDate || a.createdAt).getTime(),
                  )
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-background/40 backdrop-blur-sm border border-border/40 hover:border-primary/40 hover:shadow-md transition-all gap-3 sm:gap-0 group"
                    >
                      <div className="flex items-center gap-4 overflow-hidden flex-1 min-w-0">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105',
                            transaction.type === TransactionType.DEBT
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-emerald-500/10 text-emerald-500',
                          )}
                        >
                          {transaction.type === TransactionType.DEBT ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground truncate block group-hover:text-primary transition-colors">
                              {transaction.description || 'Sem descrição'}
                            </span>
                            <Badge
                              variant={
                                transaction.type === TransactionType.DEBT
                                  ? 'destructive'
                                  : 'default'
                              }
                              className="text-[10px] flex-shrink-0 shadow-sm"
                            >
                              {transaction.type === TransactionType.DEBT
                                ? 'Dívida'
                                : 'Pagamento'}
                            </Badge>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground mt-1 block">
                            {new Date(transaction.transactionDate || transaction.createdAt).toLocaleDateString(
                              'pt-BR',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              },
                            )}
                            {transaction.createdByName && (
                              <span className="ml-2 text-primary/70">• por {transaction.createdByName}</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
                        {/* Info Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => setInfoTransaction(transaction)}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirmTxn(transaction)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <span
                          className={cn(
                            'font-extrabold text-xl tracking-tight whitespace-nowrap',
                            transaction.type === TransactionType.DEBT
                              ? 'text-destructive'
                              : 'text-emerald-500',
                          )}
                        >
                          {transaction.type === TransactionType.DEBT ? '+' : '-'}{' '}
                          {Number(transaction.amount).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== MODAL: INFO TRANSAÇÃO ===== */}
      <Dialog open={!!infoTransaction} onOpenChange={(open) => !open && setInfoTransaction(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Detalhes do Lançamento
            </DialogTitle>
          </DialogHeader>
          {infoTransaction && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Tipo</p>
                  <Badge variant={infoTransaction.type === TransactionType.DEBT ? 'destructive' : 'default'}>
                    {infoTransaction.type === TransactionType.DEBT ? 'Dívida' : 'Pagamento'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Valor</p>
                  <p className={cn(
                    'text-lg font-bold',
                    infoTransaction.type === TransactionType.DEBT ? 'text-destructive' : 'text-emerald-500'
                  )}>
                    {Number(infoTransaction.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Descrição</p>
                <p className="text-sm">{infoTransaction.description || 'Sem descrição'}</p>
              </div>

              <div className="border-t border-border/50 pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-semibold">
                  Auditoria
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">📅 Data da Movimentação</p>
                    <p className="text-sm font-medium">
                      {new Date(infoTransaction.transactionDate || infoTransaction.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">🕐 Inserido no Sistema</p>
                    <p className="text-sm font-medium">
                      {new Date(infoTransaction.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">👤 Registrado Por</p>
                    <p className="text-sm font-medium">{infoTransaction.createdByName || 'Desconhecido'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">🔑 ID do Usuário</p>
                    <p className="text-xs font-mono text-muted-foreground break-all">{infoTransaction.createdById || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-3">
                <p className="text-xs text-muted-foreground">
                  ID da Transação: <span className="font-mono">{infoTransaction.id}</span>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoTransaction(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL: CONFIRMAR EXCLUSÃO TRANSAÇÃO ===== */}
      <Dialog open={!!deleteConfirmTxn} onOpenChange={(open) => !open && setDeleteConfirmTxn(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Lançamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este lançamento de{' '}
              <strong>
                {deleteConfirmTxn && Number(deleteConfirmTxn.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmTxn(null)} disabled={deletingTxn}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction} disabled={deletingTxn}>
              {deletingTxn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        {fabOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end animate-in slide-in-from-bottom-4 fade-in duration-200">
            <button
              onClick={() => { setDialogOpen(true); setFabOpen(false); }}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full py-2.5 px-5 shadow-lg text-sm font-medium whitespace-nowrap min-w-[200px] justify-center"
            >
              <Plus className="w-4 h-4" /> Novo Lançamento
            </button>
            <button
              onClick={() => { generateSpecificPDF(); setFabOpen(false); }}
              className="flex items-center gap-2 bg-card text-foreground border border-border/50 rounded-full py-2.5 px-5 shadow-lg text-sm font-medium whitespace-nowrap min-w-[200px] justify-center"
            >
              <Download className="w-4 h-4" /> Exportar PDF
            </button>
            <button
              onClick={() => { loadLedger(); setFabOpen(false); }}
              className="flex items-center gap-2 bg-card text-foreground border border-border/50 rounded-full py-2.5 px-5 shadow-lg text-sm font-medium whitespace-nowrap min-w-[200px] justify-center"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Atualizar
            </button>
            <button
              onClick={() => { setDeleteConfirmLedger(true); setFabOpen(false); }}
              className="flex items-center gap-2 bg-card text-destructive border border-destructive/30 rounded-full py-2.5 px-5 shadow-lg text-sm font-medium whitespace-nowrap min-w-[200px] justify-center"
            >
              <Trash2 className="w-4 h-4" /> Excluir Dívida
            </button>
          </div>
        )}
        {fabOpen && (
          <div className="fixed inset-0 z-[-1]" onClick={() => setFabOpen(false)} />
        )}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300',
            fabOpen
              ? 'bg-muted text-foreground rotate-45'
              : 'bg-primary text-primary-foreground shadow-[0_0_20px_-3px_var(--primary)]'
          )}
        >
          {fabOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
};

export { LedgerDetailScreen };
