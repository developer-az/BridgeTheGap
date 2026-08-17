import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { AuthProvider } from '@/components/AuthProvider';
import { SiteShell } from '@/components/SiteShell';
import './globals.css';

const geistSans = localFont({
  src: './fonts/geist-sans-variable.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/geist-mono-variable.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
});

const cormorant = localFont({
  src: [
    { path: './fonts/cormorant-garamond-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/cormorant-garamond-600.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bridge The Gap',
  description: 'Plan the visit before you have to rush. Schedules, travel, and the dates that matter — for two people in two places.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
