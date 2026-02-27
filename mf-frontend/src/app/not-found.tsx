'use client';

import { ArrowLeft, FileQuestion, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center text-center space-y-6 max-w-md">
        <div className="rounded-full bg-primary/10 p-6">
          <FileQuestion
            size={80}
            className="text-primary animate-pulse"
            strokeWidth={1.5}
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-extrabold tracking-tighter text-foreground">
            404
          </h1>
          <h2 className="text-2xl font-semibold tracking-tight">
            Página não encontrada
          </h2>
          <p className="text-muted-foreground text-base">
            Ops! A página que você está procurando sumiu no mapa ou nunca
            existiu.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button asChild variant="default" className="gap-2 px-8">
            <Link href="/dashboard">
              <Home size={18} />
              Voltar para o Início
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <button onClick={() => window.history.back()}>
              <ArrowLeft size={18} />
              Voltar anterior
            </button>
          </Button>
        </div>
      </div>

      <div className="fixed -z-10 h-full w-full overflow-hidden opacity-20">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[120px]" />
      </div>
    </div>
  );
}
