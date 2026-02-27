'use client';

import { useLoginAction } from '@/src/actions/login/login-action';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { useAuth } from '@/src/contexts/AuthContext';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { SITE_CONFIG } from '@lib/config';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginScreen = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });
  const message = useSearchParams().get('message');

  const router = useRouter();

  const { loginAction, loading } = useLoginAction();
  const { refreshUser } = useAuth();

  const submitLogin = async (data: LoginFormData) => {
    const resp = await loginAction(data);

    if (resp) {
      await refreshUser();
      toast.success(`Bem Vindo de volta ${resp.user.name}!`);
      router.push('/dashboard');
    }
  };

  useEffect(() => {
    if (message === 'session_expired') {
      toast.error('Sua sessão expirou. Por favor, faça login novamente.');
    }
  }, [message]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center tracking-tight text-foreground">
            {SITE_CONFIG.title.toUpperCase()}
          </CardTitle>
          <CardDescription className="text-center">
            Faça login para continuar
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(submitLogin)}>
          <CardContent>
            <div className="space-y-4">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="email"
                      placeholder="Digite seu email"
                      disabled={loading}
                      className="pl-10 focus-visible:ring-primary/10"
                    />
                  )}
                />
              </div>
            </div>
            <div className="space-y-4 mt-4">
              <Label>Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="password"
                      placeholder="Digite sua senha"
                      type={showPassword ? 'text' : 'password'}
                      disabled={loading}
                      className="pl-10 focus-visible:ring-primary/10"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-3 top-2.5 flex items-center justify-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/70 shadow-[0_0_15px_-3px_var(--primary)] transition-all font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </Button>

            <Button
              variant="outline"
              type="button"
              disabled={loading}
              onClick={() => {
                router.push('/sing-up');
              }}
              className="w-full border-accent/50 text-accent hover:bg-accent/10 hover:border-accent transition-all"
            >
              Criar Nova Conta
            </Button>

            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest mt-2">
              Todos os Direitos Reservados a © LHM Group
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export { LoginScreen };
