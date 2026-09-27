"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Eye,
  Smile,
  HeartHandshake,
  Wand2,
  Gift,
  ChevronDown,
  X,
  ArrowRight,
  Flame,
} from "lucide-react";
import { COSMETIC_TAXONOMY, ProductCategory } from "@/types/category";

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Eye,
  Smile,
  HeartHandshake,
  Wand2,
  Gift,
};

interface CategoryNavProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function CategoryNav({
  mobileOpen = false,
  onCloseMobile,
}: CategoryNavProps) {
  const pathname = usePathname();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP CATEGORY NAVIGATION STRIP                                         */}
      {/* ========================================================================= */}
      <nav
        aria-label="Categorías de Cosméticos"
        className="hidden lg:block bg-white/95 backdrop-blur-md border-b border-[var(--border-subtle)] sticky top-[73px] z-30 transition-all shadow-[0_2px_8px_rgba(45,27,34,0.03)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center justify-between space-x-1 py-1">
            {/* Special Highlights: Tendencias / Ofertas */}
            <li>
              <Link
                href="/catalog?tag=trending"
                className="touch-target px-3 py-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1.5 transition-colors group"
              >
                <Flame className="w-4 h-4 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                <span>Tendencias</span>
              </Link>
            </li>

            {COSMETIC_TAXONOMY.map((category) => {
              const IconComponent = category.icon ? ICON_MAP[category.icon] || Sparkles : Sparkles;
              const isActive = pathname.startsWith(`/category/${category.slug}`);

              return (
                <li
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => setHoveredCategory(category.slug)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    href={`/category/${category.slug}`}
                    className={`touch-target px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-1.5 rounded-md ${
                      isActive
                        ? "text-[var(--primary)] font-semibold bg-[var(--surface-muted)]"
                        : "text-[var(--text-main)] hover:text-[var(--primary)] hover:bg-[var(--surface-muted)]"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 text-[var(--secondary)]" />
                    <span>{category.name}</span>
                    {category.subcategories && (
                      <ChevronDown className="w-3.5 h-3.5 opacity-60 transition-transform duration-200 group-hover:rotate-180" />
                    )}
                  </Link>

                  {/* Mega Dropdown Menu for Category */}
                  <AnimatePresence>
                    {hoveredCategory === category.slug && category.subcategories && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-0 top-full pt-1 w-80 z-50"
                      >
                        <div className="bg-white rounded-xl shadow-xl border border-[var(--border-subtle)] p-4 overflow-hidden">
                          <div className="pb-2.5 mb-2.5 border-b border-[var(--border-subtle)]">
                            <h4 className="font-heading text-base font-bold text-[var(--text-main)]">
                              {category.name}
                            </h4>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                              {category.description}
                            </p>
                          </div>

                          <div className="space-y-1">
                            {category.subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/category/${category.slug}/${sub.slug}`}
                                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--surface-muted)] hover:text-[var(--primary)] transition-colors group"
                              >
                                <span>{sub.name}</span>
                                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--primary)]" />
                              </Link>
                            ))}
                          </div>

                          {category.featuredBrands && (
                            <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)]">
                              <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-subtle)]">
                                Marcas Destacadas:
                              </span>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {category.featuredBrands.map((brand) => (
                                  <Link
                                    key={brand}
                                    href={`/catalog?brand=${encodeURIComponent(brand)}`}
                                    className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--accent-tint)] transition-colors"
                                  >
                                    {brand}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-3 pt-2">
                            <Link
                              href={`/category/${category.slug}`}
                              className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center justify-center gap-1 py-1"
                            >
                              <span>Ver toda la colección de {category.name}</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OUT CATEGORY DRAWER                                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative w-full max-w-xs h-full bg-[var(--surface-base)] shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              {/* Header */}
              <div>
                <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-white">
                  <div>
                    <span className="font-heading text-lg font-bold text-[var(--primary)] tracking-tight">
                      Prana Market
                    </span>
                    <p className="text-xs text-[var(--text-muted)]">Explorar Categorías</p>
                  </div>
                  <button
                    type="button"
                    onClick={onCloseMobile}
                    aria-label="Cerrar menú"
                    className="touch-target p-2 rounded-full text-[var(--text-main)] hover:bg-[var(--surface-muted)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Link: Ofertas */}
                <div className="p-3 bg-gradient-to-r from-[var(--accent-tint)] to-[var(--surface-muted)] border-b border-[var(--border-subtle)]">
                  <Link
                    href="/catalog?tag=trending"
                    onClick={onCloseMobile}
                    className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)] touch-target w-full"
                  >
                    <Flame className="w-5 h-5 text-[var(--primary)]" />
                    <span>🔥 Tendencias & Más Vendidos</span>
                  </Link>
                </div>

                {/* Category List Accordion */}
                <div className="p-3 space-y-2">
                  {COSMETIC_TAXONOMY.map((category) => {
                    const IconComponent = category.icon
                      ? ICON_MAP[category.icon] || Sparkles
                      : Sparkles;

                    return (
                      <div
                        key={category.id}
                        className="rounded-xl bg-white border border-[var(--border-subtle)] overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-3">
                          <Link
                            href={`/category/${category.slug}`}
                            onClick={onCloseMobile}
                            className="flex items-center gap-3 text-[var(--text-main)] font-semibold text-sm hover:text-[var(--primary)] transition-colors flex-grow touch-target justify-start"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[var(--surface-muted)] text-[var(--primary)] flex items-center justify-center shrink-0">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <span>{category.name}</span>
                          </Link>
                        </div>

                        {category.subcategories && category.subcategories.length > 0 && (
                          <div className="px-4 pb-3 pt-1 border-t border-[var(--surface-muted)] grid grid-cols-1 gap-1">
                            {category.subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/category/${category.slug}/${sub.slug}`}
                                onClick={onCloseMobile}
                                className="touch-target py-1.5 px-2 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-muted)] rounded-md transition-colors justify-start"
                              >
                                • {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Drawer Bottom Info */}
              <div className="p-4 border-t border-[var(--border-subtle)] bg-white text-xs text-[var(--text-muted)] space-y-2">
                <div className="flex items-center justify-between">
                  <span>Envíos a toda Colombia 🇨🇴</span>
                  <span className="font-semibold text-[var(--secondary)]">100% Original</span>
                </div>
                <div className="pt-2 text-[11px] text-[var(--text-subtle)] text-center">
                  Prana Market • Rose & Champagne Luxury
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
