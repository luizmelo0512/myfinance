import { useCreateLedger } from '@/src/actions/ledger/ledger-action';
import { useListUsers } from '@/src/actions/user/user-action';
import { Button } from '@/src/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/src/components/ui/combobox';
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
import { User } from '@/src/typedef/User/user.interface';
import { zodResolver } from '@hookform/resolvers/zod';

import { Loader2, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';

const ledgerSchema = z
  .object({
    title: z.string().min(4, 'O título deve ter no mínimo 4 caracteres'),
    targetName: z.string().min(1, 'O nome da contraparte é obrigatório'),
    participantId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.participantId) {
        return !!data.targetName && data.targetName.length > 0;
      }
      return true;
    },
    {
      message: 'Informe o apelido da pessoa vinculada',
      path: ['targetName'],
    },
  );

type CreateLedgerFormData = z.infer<typeof ledgerSchema>;

interface DialogNewLedgerProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  loadLedgers: () => Promise<void>;
}

export default function DialogNewLedger({
  dialogOpen,
  setDialogOpen,
  loadLedgers,
}: DialogNewLedgerProps) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateLedgerFormData>({
    resolver: zodResolver(ledgerSchema),
    defaultValues: { title: '', targetName: '', participantId: '' },
  });
  const { createLedger, loading: creating } = useCreateLedger();
  const { loading, listAllUsers } = useListUsers();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserLabel, setSelectedUserLabel] = useState<string>('');
  const dialogRef = useRef<HTMLDivElement>(null);

  // Criar mapa de nomes duplicados
  const nameCount = users.reduce(
    (acc, user) => {
      acc[user.name] = (acc[user.name] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Criar labels únicos e mapa label -> id
  const userItems = users.map((user) => {
    const hasDuplicate = nameCount[user.name] > 1;
    const label =
      hasDuplicate && user.email ? `${user.name} (${user.email})` : user.name;
    return { label, id: user.id };
  });

  const labelToIdMap = userItems.reduce(
    (acc, item) => {
      acc[item.label] = item.id;
      return acc;
    },
    {} as Record<string, string>,
  );

  const onSubmitCreate = async (data: CreateLedgerFormData) => {
    const result = await createLedger({
      title: data.title,
      targetName: data.targetName,
      participantId: data.participantId || undefined,
    });
    if (result) {
      reset();
      setSelectedUserLabel('');
      setDialogOpen(false);
      loadLedgers();
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const usersList = await listAllUsers();
      if (usersList) {
        setUsers(usersList);
      }
    };
    fetchUsers();
  }, [listAllUsers]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/80 shadow-[0_0_15px_-3px_var(--primary)]">
          <Plus className="w-4 h-4 mr-2" />
          Nova Dívida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" ref={dialogRef}>
        <DialogHeader>
          <DialogTitle>Criar Nova Dívida</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar uma nova dívida ou empréstimo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitCreate)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="title"
                    placeholder="Ex: Empréstimo, Aluguel..."
                    className={`${errors.title ? 'border-destructive' : ''}`}
                    disabled={creating}
                  />
                )}
              />
              {errors.title && (
                <p className="text-[11px] text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetName">Nome da Contraparte</Label>
              <Controller
                name="targetName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="targetName"
                    placeholder="Ex: João, Pai, Empresa..."
                    className={`${errors.targetName ? 'border-destructive' : ''}`}
                    disabled={creating}
                  />
                )}
              />
              {errors.title && (
                <p className="text-[11px] text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="participantId">
                Selecione o Participante{' '}
                <span className="text-muted-foreground text-xs">
                  (opcional)
                </span>
              </Label>
              <Combobox
                items={userItems.map((item) => item.label)}
                value={selectedUserLabel}
                onValueChange={(val: string | null) => {
                  const label = val || '';
                  setSelectedUserLabel(label);
                  const userId = labelToIdMap[label] || '';
                  setValue('participantId', userId);
                }}
              >
                <ComboboxInput placeholder="Buscar participante..." />
                <ComboboxContent container={dialogRef}>
                  <ComboboxEmpty>Nenhum usuário encontrado.</ComboboxEmpty>
                  <ComboboxList>
                    {(label) => (
                      <ComboboxItem key={label} value={label}>
                        {label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                reset();
                setSelectedUserLabel('');
              }}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Dívida'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
