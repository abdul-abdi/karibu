import './globals.css';
import { ThemeProvider } from '../components/providers/theme-provider';
import { AppProvider } from '../components/providers/app-provider';
import { ToastProvider } from '../components/providers/toast-provider';
import Header from '../components/ui/header';
import Footer from '../components/ui/footer';
import { AIAssistant } from '../components/ui/ai-assistant';
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://karibu.vercel.app'),
  title: 'Karibu - Smart Contract Analyzer for Hedera',
  description: 'Analyze, deploy, and interact with smart contracts on Hedera Testnet with zero setup, AI assistance, and no wallet required.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/images/logo-icon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Karibu - Smart Contract Analyzer for Hedera',
    description: 'Analyze, deploy, and interact with smart contracts on Hedera Testnet with zero setup, AI assistance, and no wallet required.',
    url: 'https://karibu.vercel.app',
    siteName: 'Karibu',
    images: [
      {
        url: '/favicon.svg',
        width: 200,
        height: 200,
        alt: 'Karibu Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Karibu - Smart Contract Analyzer for Hedera',
    description: 'Analyze, deploy, and interact with smart contracts on Hedera Testnet with zero setup, AI assistance, and no wallet required.',
    images: ['/favicon.svg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="theme-color" content="#7c3aed" />
      </head>
      <body>
        <ThemeProvider defaultTheme="system">
          <AppProvider>
            <ToastProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
              </div>
              <AIAssistant />
            </ToastProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 