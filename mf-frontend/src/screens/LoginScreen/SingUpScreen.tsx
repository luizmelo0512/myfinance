'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Lock, Mail, User2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useCreateAccount } from '@/src/actions/login/login-action';
import { useAuth } from '@/src/contexts/AuthContext';
import { SITE_CONFIG } from '@lib/config';

import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';

// 1. Schema de Validação (Movido para fora do componente para evitar re-render)
const newUserSchema = z
  .object({
    name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type NewUserFormData = z.infer<typeof newUserSchema>;

const SignUpScreen = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { createAccount, loading } = useCreateAccount();
  const { refreshUser } = useAuth();

  // 2. Configuração do Form com Resolver
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const submitSignUp = async (data: NewUserFormData) => {
    // if (
    //   errors.name ||
    //   errors.email ||
    //   errors.password ||
    //   errors.confirmPassword
    // )
    //   return;
    const resp = await createAccount(data);
    if (resp) {
      await refreshUser();
      toast.success(`Seja muito bem-vindo, ${resp.user.name}!`);
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      {/* Efeito Cyberpunk Glow */}
      <div className="absolute w-72 h-72 bg-primary/5 rounded-full blur-[120px] -z-10" />

      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center tracking-tighter text-foreground">
            {SITE_CONFIG.title.toUpperCase()}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Crie sua conta para começar a usar o My Finance
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(submitSignUp)}>
          <CardContent className="space-y-4">
            {/* Campo: Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="name"
                      placeholder="Seu nome completo"
                      className={`pl-10 focus-visible:ring-primary/20 ${errors.name ? 'border-destructive' : ''}`}
                    />
                  )}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Campo: Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="email"
                      placeholder="email@exemplo.com"
                      className={`pl-10 focus-visible:ring-primary/20 ${errors.email ? 'border-destructive' : ''}`}
                    />
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo: Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="No mínimo 6 caracteres"
                      className={`pl-10 pr-10 focus-visible:ring-primary/20 ${errors.password ? 'border-destructive' : ''}`}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Campo: Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      className={`pl-10 pr-10 focus-visible:ring-primary/20 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    />
                  )}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_-3px_var(--primary)] transition-all font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Finalizar Cadastro'
              )}
            </Button>

            <Button
              variant="ghost"
              type="button"
              onClick={() => router.push('/login')}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Já tenho uma conta
            </Button>

            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-[0.2em] mt-4">
              © {new Date().getFullYear()} LHM Group
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignUpScreen;
