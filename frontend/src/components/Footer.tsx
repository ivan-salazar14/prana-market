"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Sparkles,
  MessageCircle,
  Mail,
  MapPin,
  Heart,
  CreditCard,
  Lock,
} from "lucide-react";
import { COSMETIC_TAXONOMY } from "@/types/category";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[var(--border-subtle)] text-[var(--text-main)] pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* VALUE PROPOSITION STRIP (LUXURY CARDS)                                   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 mb-12 border-b border-[var(--border-subtle)]">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--surface-base)] border border-[var(--border-subtle)]">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-tint)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-[var(--text-main)]">
                Envíos a Todo Colombia
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Exprés local y cobertura nacional con transportadoras certificadas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--surface-base)] border border-[var(--border-subtle)]">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-muted)] text-[var(--secondary)] flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-[var(--text-main)]">
                100% Original & Certificado
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Cosméticos y marcas de alta calidad garantizados.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--surface-base)] border border-[var(--border-subtle)]">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-tint)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-[var(--text-main)]">
                Pagos Seguros Wompi & Nequi
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                PSE, Tarjetas, Bancolombia, Nequi Push/QR y Stripe.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--surface-base)] border border-[var(--border-subtle)]">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-muted)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-[var(--text-main)]">
                Asesoría Personalizada
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Atención experta en belleza directo por WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN FOOTER LINKS & INFORMATION                                          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand Presentation */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-heading text-2xl font-bold tracking-tight text-[var(--text-main)]">
                Prana <span className="text-[var(--primary)] font-serif italic">Market</span>
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
              Tu destino editorial de belleza, cuidado facial y bienestar en Colombia.
              Descubre las mejores fórmulas, tonos y tendencias con una experiencia de compra diseñada para consentirte.
            </p>

            {/* Direct WhatsApp CTA */}
            <div className="pt-2">
              <a
                href="https://wa.me/573001234567?text=Hola%20Prana%20Market,%20necesito%20asesoría%20con%20un%20producto"
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba5a] transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hablar con una Asesora de Belleza</span>
              </a>
            </div>
          </div>

          {/* Categorías Principales */}
          <div>
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-4 font-heading">
              Categorías
            </h3>
            <ul className="space-y-2.5 text-sm">
              {COSMETIC_TAXONOMY.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/catalog"
                  className="text-[var(--primary)] font-semibold hover:underline"
                >
                  Ver todo el Catálogo →
                </Link>
              </li>
            </ul>
          </div>

          {/* Ayuda & Seguimiento */}
          <div>
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-4 font-heading">
              Atención & Pedidos
            </h3>
            <ul className="space-y-2.5 text-sm text-[var(--text-muted)]">
              <li>
                <Link href="/orders" className="hover:text-[var(--primary)] transition-colors">
                  Mis Pedidos
                </Link>
              </li>
              <li>
                <Link href="/rastreo" className="hover:text-[var(--primary)] transition-colors">
                  Rastreo de Guía
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-[var(--primary)] transition-colors">
                  Tiempos & Tarifas de Envío
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[var(--primary)] transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Habeas Data Colombia */}
          <div>
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-4 font-heading">
              Marco Legal & Confianza
            </h3>
            <ul className="space-y-2.5 text-xs text-[var(--text-muted)]">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--secondary)]" />
                <span>Tratamiento de Datos (Ley 1581/2012)</span>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--primary)] transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--primary)] transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-[var(--primary)] transition-colors">
                  Garantías y Devoluciones
                </Link>
              </li>
              <li className="pt-2 text-[11px] text-[var(--text-subtle)]">
                Superintendencia de Industria y Comercio (SIC)
              </li>
            </ul>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PAYMENT BADGES & COPYRIGHT STRIP                                         */}
        {/* ========================================================================= */}
        <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <span>© {currentYear} Prana Market. Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-[var(--primary)] fill-[var(--primary)]" />
            <span>para Colombia. Todos los derechos reservados.</span>
          </div>

          {/* Payment Methods Cluster */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider mr-1">
              Pagos Seguros:
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#20002C] text-[#FF2A82] font-black text-[11px] tracking-tight">
              NEQUI
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#2D3282] text-white font-bold text-[11px]">
              WOMPI
            </span>
            <span className="px-2 py-1 rounded-md bg-[var(--surface-muted)] text-[var(--text-main)] font-bold text-[11px] border border-[var(--border-subtle)]">
              PSE
            </span>
            <span className="px-2 py-1 rounded-md bg-[var(--surface-muted)] text-[var(--text-main)] font-bold text-[11px] border border-[var(--border-subtle)]">
              Bancolombia
            </span>
            <span className="px-2 py-1 rounded-md bg-[var(--surface-muted)] text-[var(--text-main)] font-bold text-[11px] border border-[var(--border-subtle)]">
              Tarjetas Débito / Crédito
            </span>
            <span className="px-2 py-1 rounded-md bg-[#635BFF] text-white font-bold text-[11px]">
              Stripe
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
