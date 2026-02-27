import { AuthProvider } from '@/src/contexts/AuthContext';
import { SITE_CONFIG } from '@lib/config';
import type { Metadata, Viewport } from 'next';
import '../globals.css';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  manifest: '/manifest.json', // Importante!
  other: {
    'mobile-web-app-capable': 'yes',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_CONFIG.title,
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthProvider>{children}</AuthProvider>;
}
