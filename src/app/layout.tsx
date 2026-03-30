import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CartProvider } from '@/components/cart/CartContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'BEAUTÉ LUXE | Salon de Beauté Premium Paris',
  description: 'Découvrez nos services beauté haut de gamme: soins visage, manucure, massage, coupe cheveux. Salon professionnel luxe à Paris.',
  keywords: 'salon de beauté, soins visage, manucure, massage, coupe cheveux, beauté professionnel, Paris',
  viewport: 'width=device-width, initial-scale=1.0',
  robots: 'index, follow',
  authors: [{ name: 'BEAUTÉ LUXE' }],
  openGraph: {
    title: 'BEAUTÉ LUXE | Salon de Beauté Premium',
    description: 'Services de beauté professionnels et luxueux',
    type: 'website',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#c9a961" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <CartProvider>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh'
          }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              {children}
            </main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
