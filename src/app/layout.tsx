import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ClientHydrationGuard } from '@/components/providers/ClientHydrationGuard';

export const metadata: Metadata = {
  title: 'Council of Minds — Multi-Agent Exploration Studio',
  description: 'A local-first, privacy-focused studio for multi-agent reasoning and personal dilemma deconstruction.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClientHydrationGuard>{children}</ClientHydrationGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
