'use client';

import { useAuth } from '@/src/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { ThemeToggle } from '@/src/components/theme-toggle';
import { useLedgerList } from '@/src/actions/ledger/ledger-action';
import { useListFriends } from '@/src/actions/friend/friend-action';
import { Mail, User, Shield, HandCoins, Users, Moon, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

export const SettingsScreen = () => {
  const { user, loading: authLoading } = useAuth();
  const { fetchLedgers } = useLedgerList();
  const { listAllFriends } = useListFriends();
  const [ledgerCount, setLedgerCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    fetchLedgers().then((data) => {
      if (data) setLedgerCount(data.length);
    });
    listAllFriends().then((data) => {
      if (data) setFriendCount(data.length);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-primary font-mono animate-pulse">CARREGANDO...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h2>
        <p className="text-muted-foreground">Gerencie seu perfil e preferências do sistema.</p>
      </div>

      {/* Profile Card */}
      <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{user?.name}</p>
              <p className="text-sm text-muted-foreground font-normal">{user?.email}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-background/40 border border-border/40">
              <Mail className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">E-mail</p>
                <p className="font-medium truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-background/40 border border-border/40">
              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                <p className="font-medium text-emerald-500">Conta Ativa</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300 group">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
                <HandCoins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-extrabold">{ledgerCount}</p>
                <p className="text-sm text-muted-foreground">Dívidas cadastradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300 group">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-3xl font-extrabold">{friendCount}</p>
                <p className="text-sm text-muted-foreground">Amigos conectados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preferences */}
      <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Preferências</CardTitle>
          <CardDescription>Personalize a aparência do sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-border/40">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Tema</p>
                <p className="text-sm text-muted-foreground">Alternar entre modo claro e escuro</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="rounded-2xl border border-destructive/30 bg-card/60 backdrop-blur-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis da conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              document.cookie = 'access_token=; Max-Age=0; path=/';
              window.location.href = '/login';
            }}
            className="shadow-lg shadow-destructive/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
