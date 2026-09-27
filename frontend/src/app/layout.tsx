import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.pranamarket.store"),
  title: {
    default: "Prana Market | Belleza, Salud y Bienestar - Cosméticos & Cuidado Personal",
    template: "%s | Prana Market",
  },
  description: "Descubre la exclusiva colección de cosméticos, cuidado facial y bienestar en Prana Market. Envíos exprés locales y cobertura nacional en Colombia.",
  keywords: [
    "maquillaje colombia",
    "cosméticos",
    "skincare",
    "cuidado facial",
    "labiales",
    "belleza",
    "prana market",
    "tienda de maquillaje colombia",
    "wompi",
    "nequi",
  ],
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
    title: "Prana Market | Belleza, Salud y Bienestar",
    description: "Cosméticos de lujo, cuidado de la piel y bienestar personal con envíos a todo Colombia.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Prana Market - Rose & Champagne Luxury Beauty",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prana Market | Belleza y Cuidado Personal",
    description: "Cosméticos de lujo, cuidado de la piel y bienestar personal con envíos a todo Colombia.",
    images: ["/og-image.jpg"],
    creator: "@pranamarket",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-[var(--surface-base)] text-[var(--text-main)] font-sans antialiased selection:bg-[var(--accent-tint)] selection:text-[var(--primary)]">
        <AuthProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
