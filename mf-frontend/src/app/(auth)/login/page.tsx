'use client'; // Necessário para componentes interativos no App Router

import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import { LoginScreen } from '../../../screens/LoginScreen';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <span className="ml-2 text-primary font-mono">INICIALIZANDO...</span>
        </div>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
