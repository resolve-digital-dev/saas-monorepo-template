import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { getRequestLocale } from './lib/locale';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], display: 'swap' });

export const metadata: Metadata = {
  title: 'ResolveDigital Landing',
  description: 'Landing page for ResolveDigital SaaS',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolved per request - see app/lib/locale.ts for why paraglide's
  // `getLocale()` cannot be used from a server component here.
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
