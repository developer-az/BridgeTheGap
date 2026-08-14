import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import { SiteShell } from '@/components/SiteShell';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
