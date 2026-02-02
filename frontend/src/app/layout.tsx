import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://prana-market-production.up.railway.app'),
  title: {
    default: "Prana Make up - Belleza y Sofisticación | Maquillaje y Cosméticos",
    template: "%s | Prana Make up"
  },
  description: "Descubre la mejor selección de productos de maquillaje y cosméticos en Prana Make up. Belleza y sofisticación en cada detalle. Envío a todo Colombia.",
  keywords: ["maquillaje", "cosméticos", "belleza", "makeup", "productos de belleza", "cosmética", "maquillaje Colombia", "tienda de maquillaje", "prana makeup"],
  authors: [{ name: "Prana Make up" }],
  creator: "Prana Make up",
  publisher: "Prana Make up",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "/",
    siteName: "Prana Make up",
    title: "Prana Make up - Belleza y Sofisticación",
    description: "Descubre la mejor selección de productos de maquillaje y cosméticos. Belleza y sofisticación en cada detalle.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Prana Make up - Productos de Belleza",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prana Make up - Belleza y Sofisticación",
    description: "Descubre la mejor selección de productos de maquillaje y cosméticos. Belleza y sofisticación en cada detalle.",
    images: ["/og-image.jpg"],
    creator: "@pranamakeup",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    // yandex: 'yandex-verification-code',
    // bing: 'bing-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CartProvider>
            <Navbar />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
