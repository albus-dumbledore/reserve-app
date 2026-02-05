import './globals.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import QuoteRitual from './components/QuoteRitual';
import MainNav from './components/MainNav';

export const metadata: Metadata = {
  title: 'Reservé',
  description: 'A quiet, physical-book-first reading room with a monthly edition and timed sessions.',
  applicationName: 'Reservé',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8f6f2'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Script id="theme-script" strategy="beforeInteractive">
          {`(function(){
            try {
              var stored = localStorage.getItem('reserve:theme');
              var theme = stored ? JSON.parse(stored) : 'light';
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              }
            } catch (e) {}
          })();`}
        </Script>
        <MainNav />
        <QuoteRitual />
        {children}
      </body>
    </html>
  );
}
