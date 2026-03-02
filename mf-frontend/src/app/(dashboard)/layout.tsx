import { AppSidebar } from '@/src/components/sidebar/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/src/components/ui/sidebar';
import { AuthProvider } from '@/src/contexts/AuthContext';
import '../globals.css';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex min-h-screen w-full flex-col">
          {/* Header Mobile / Desktop */}
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 shadow-sm md:px-6">
            <SidebarTrigger className="-ml-2" />
            <span className="text-lg font-semibold tracking-tight md:hidden">MyFinance</span>
          </header>
          
          {/* Conteúdo Principal */}
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </AuthProvider>
  );
}
