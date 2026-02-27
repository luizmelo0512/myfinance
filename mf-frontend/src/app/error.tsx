'use client';

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center text-center space-y-6 max-w-lg">
        <div className="rounded-full bg-destructive/10 p-6">
          <AlertTriangle
            size={80}
            className="text-destructive"
            strokeWidth={1.5}
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Algo deu errado!
          </h1>
          <p className="text-muted-foreground text-lg">
            Desculpe o transtorno. Ocorreu um erro inesperado ao processar sua
            solicitação no sistema.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 rounded-md bg-muted p-4 text-left overflow-auto max-w-full">
              <code className="text-xs text-destructive">{error.message}</code>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            onClick={() => reset()}
            variant="default"
            className="gap-2 px-8 py-6 text-lg"
          >
            <RefreshCw size={20} className="animate-spin-slow" />
            Tentar novamente
          </Button>

          {/* Voltar para Home */}
          <Button asChild variant="outline" className="gap-2 py-6 text-lg">
            <Link href="/dashboard">
              <Home size={20} />
              Ir para o Início
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-4">
          Se o problema persistir, entre em contato com o suporte.
        </p>
      </div>

      <div className="fixed -z-10 h-full w-full overflow-hidden opacity-10">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-destructive/20 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-destructive/20 blur-[120px]" />
      </div>
    </div>
  );
}
