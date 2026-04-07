import './globals.css';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Sentinel Protocol — WhatsApp Spam Guard',
    template: '%s | Sentinel Protocol',
  },
  description: 'Autonomous spam detection for university WhatsApp groups. Detects trading, adult, gambling & academic fraud spam using AI. Community-powered reporting and admin panel.',
  keywords: ['whatsapp', 'spam detection', 'university', 'bot', 'moderation', 'anti-spam', 'sentinel protocol'],
  authors: [{ name: 'Alperen Adatepe' }],
  creator: 'Alperen Adatepe',
  metadataBase: new URL('https://whatsapp-spam-guard.vercel.app'),
  openGraph: {
    title: 'Sentinel Protocol — WhatsApp Spam Guard',
    description: 'Autonomous spam detection for university WhatsApp groups. AI-powered moderation with community reporting.',
    url: 'https://whatsapp-spam-guard.vercel.app',
    siteName: 'Sentinel Protocol',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sentinel Protocol — WhatsApp Spam Guard',
    description: 'Autonomous spam detection for university WhatsApp groups.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
