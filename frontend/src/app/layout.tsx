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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pranamarket.store'),
  title: {
    default: "Prana Market - Belleza, Salud y Bienestar | Tienda Online",
    template: "%s | Prana Market"
  },
  description: "Encuentra lo mejor en belleza, salud y cuidado personal en Prana Market. Productos de alta calidad para tu bienestar. Envío a todo Colombia.",
  keywords: ["belleza", "salud", "bienestar", "cuidado personal", "maquillaje", "cosméticos", "beauty", "health", "productos de belleza", "productos de salud", "prana market", "tienda online Colombia"],
  authors: [{ name: "Prana Market" }],
  creator: "Prana Market",
  publisher: "Prana Market",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "/",
    siteName: "Prana Market",
    title: "Prana Market - Belleza, Salud y Bienestar",
    description: "Tu destino para productos de belleza, salud y cuidado personal. Calidad y bienestar en cada detalle.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Prana Market - Belleza y Salud",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prana Market - Belleza, Salud y Bienestar",
    description: "Tu destino para productos de belleza, salud y cuidado personal. Calidad y bienestar en cada detalle.",
    images: ["/og-image.jpg"],
    creator: "@pranamarket",
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
