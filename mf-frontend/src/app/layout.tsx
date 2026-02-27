import { SITE_CONFIG } from '@lib/config';
import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { Toaster } from '../components/ui/sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className="dark">
      <body className={`${geistSans.className} antialiased`}>
        <Toaster richColors />
        {children}
      </body>
    </html>
  );
}
