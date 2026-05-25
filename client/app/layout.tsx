import type { Metadata } from 'next';
import { Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LinguaBook Pro — AI-Powered Book Translator & Marketplace',
  description:
    "LinguaBook Pro — AI yordamida kitoblarni istalgan tilga tarjima qiling, o'qing va daromad toping. PDF, EPUB, TXT formatlarni qo'llab-quvvatlaydi.",
  keywords: ['kitob tarjima', 'AI translator', 'book translator', 'LinguaBook', 'uzbek books'],
  authors: [{ name: 'LinguaBook Pro' }],
  openGraph: {
    title: 'LinguaBook Pro — AI Book Translator',
    description: 'AI yordamida kitoblarni tarjima qiling va daromad toping',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${sora.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
