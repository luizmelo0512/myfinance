'use client';

import { useLedgerDetail } from '@/src/actions/ledger/ledger-action';
import { useCreateTransaction } from '@/src/actions/transaction/transaction-action';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  TransactionType,
} from '@/src/typedef/Ledger/ledger.interface';
import { cn } from '@utils';
import {
  ArrowLeft,
  Loader2,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

interface CreateTransactionFormData {
  amount: string;
  type: TransactionType;
  description: string;
}

interface LedgerDetailScreenProps {
  ledgerId: string;
}

const LedgerDetailScreen = ({ ledgerId }: LedgerDetailScreenProps) => {
  const [ledger, setLedger] = useState<LedgerWithBalance | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { fetchLedger, loading } = useLedgerDetail();
  const { createTransaction, loading: creating } = useCreateTransaction();

  const { control, handleSubmit, reset, setValue } =
    useForm<CreateTransactionFormData>({
      defaultValues: {
        amount: '',
        type: TransactionType.DEBT,
        description: '',
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
    });
    if (result) {
      reset();
      setDialogOpen(false);
      loadLedger();
    }
  };

  if (loading && !ledger) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_var(--primary)]" />
        <p className="text-primary font-mono animate-pulse">
          CARREGANDO DETALHES...
        </p>
      </div>
    );
  }

  if (!ledger) {
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

  const totalDebt = ledger.transactions
    .filter((t) => t.type === TransactionType.DEBT)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPayments = ledger.transactions
    .filter((t) => t.type === TransactionType.PAYMENT)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={loadLedger}
            disabled={loading}
            className="border-border hover:border-primary/50 w-full sm:w-auto"
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-2', loading && 'animate-spin')}
            />
            Atualizar
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/80 shadow-[0_0_15px_-3px_var(--primary)] w-full sm:w-auto mt-2 sm:mt-0">
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

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-[0_0_20px_-12px_var(--primary)] transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Saldo
              </span>
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <p
              className={cn(
                'text-2xl font-bold font-mono tracking-tighter',
                ledger.balance > 0
                  ? 'text-destructive'
                  : ledger.balance < 0
                    ? 'text-emerald-500'
                    : 'text-foreground',
              )}
            >
              {ledger.balance.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-[0_0_20px_-12px_var(--primary)] transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Total em Dívidas
              </span>
              <TrendingUp className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold font-mono tracking-tighter text-destructive">
              {totalDebt.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-[0_0_20px_-12px_var(--primary)] transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Total Pago
              </span>
              <TrendingDown className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold font-mono tracking-tighter text-emerald-500">
              {totalPayments.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Lançamentos
          </CardTitle>
          <CardDescription>
            Histórico de todas as transações desta dívida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ledger.transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum lançamento registrado ainda.
              </p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Lançamento
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {ledger.transactions
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors gap-3 sm:gap-0"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          transaction.type === TransactionType.DEBT
                            ? 'bg-destructive/10'
                            : 'bg-emerald-500/10',
                        )}
                      >
                        {transaction.type === TransactionType.DEBT ? (
                          <TrendingUp className="w-5 h-5 text-destructive" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate block">
                            {transaction.description || 'Sem descrição'}
                          </span>
                          <Badge
                            variant={
                              transaction.type === TransactionType.DEBT
                                ? 'destructive'
                                : 'default'
                            }
                            className="text-[10px] flex-shrink-0"
                          >
                            {transaction.type === TransactionType.DEBT
                              ? 'Dívida'
                              : 'Pagamento'}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {new Date(transaction.createdAt).toLocaleDateString(
                            'pt-BR',
                            {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'font-mono font-bold text-lg',
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
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { LedgerDetailScreen };
