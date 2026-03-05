import { useCreateLedger } from '@/src/actions/ledger/ledger-action';
import { useLinkFriend, useListFriends } from '@/src/actions/friend/friend-action';
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
import { toast } from 'sonner';
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
    watch,
    formState: { errors },
  } = useForm<CreateLedgerFormData>({
    resolver: zodResolver(ledgerSchema),
    defaultValues: { title: '', targetName: '', participantId: '' },
  });
  const selectedParticipantId = watch('participantId');
  const { createLedger, loading: creating } = useCreateLedger();
  const { loading, listAllFriends } = useListFriends();
  const { linkFriendByEmail, loading: linking } = useLinkFriend();
  const [friends, setFriends] = useState<User[]>([]);
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [selectedUserLabel, setSelectedUserLabel] = useState<string>('');
  const dialogRef = useRef<HTMLDivElement>(null);

  // Criar mapa de nomes duplicados
  const nameCount = friends.reduce(
    (acc, user) => {
      acc[user.name] = (acc[user.name] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Criar labels únicos e mapa label -> id
  const userItems = friends.map((user) => {
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

  const fetchFriends = async () => {
    const friendsList = await listAllFriends();
    if (friendsList) {
      setFriends(friendsList);
    }
  };

  const handleLinkFriend = async () => {
    if (!searchEmail || !searchEmail.includes('@')) {
      toast.error('Digite um e-mail válido para vincular.');
      return;
    }

    const success = await linkFriendByEmail(searchEmail);
    if (success) {
      toast.success('Amigo vinculado com sucesso!');
      await fetchFriends();
      // Em um cenário real, poderíamos já selecionar o amigo retornado da API
    } else {
      toast.error('Não foi possível vincular. Verifique o e-mail inserido.');
    }
  };

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
    if (dialogOpen) {
      fetchFriends();
      setSearchEmail('');
    }
  }, [dialogOpen]);

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
                    className={`${errors.targetName ? 'border-destructive' : ''} ${selectedParticipantId ? 'bg-muted opacity-80 cursor-not-allowed' : ''}`}
                    disabled={creating || !!selectedParticipantId}
                  />
                )}
              />
              {selectedParticipantId && (
                 <p className="text-[11px] text-muted-foreground mt-1">
                   Nome vinculado automaticamente ao amigo selecionado.
                 </p>
              )}
              {errors.targetName && !selectedParticipantId && (
                <p className="text-[11px] text-destructive">
                  {errors.targetName.message}
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
                  
                  // Se escolheu um amigo da lista, trava o targetName para ser igual ao label dele
                  if (userId) {
                    setValue('targetName', label);
                  } else {
                    setValue('targetName', '');
                  }
                }}
              >
                <ComboboxInput 
                  placeholder="Buscar suas conexões..." 
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <ComboboxContent container={dialogRef}>
                  <ComboboxEmpty className="flex flex-col items-center justify-center p-4 gap-2 text-center text-sm text-muted-foreground hidden group-data-[empty]/combobox-content:flex">
                    Nenhuma conexão correspondente encontrada.
                    {searchEmail.includes('@') && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleLinkFriend}
                        disabled={linking}
                        className="mt-2 w-full"
                      >
                        {linking ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Vincular contato: {searchEmail}
                      </Button>
                    )}
                  </ComboboxEmpty>
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
