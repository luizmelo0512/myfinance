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
        <main className="w-full">
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </AuthProvider>
  );
}
