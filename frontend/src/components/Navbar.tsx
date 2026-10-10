"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Menu,
  X,
  Search,
  User,
  LogOut,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import Cart from "./Cart";
import CategoryNav from "./CategoryNav";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { state: cartState } = useCart();
  const { state: authState, logout } = useAuth();
  const pathname = usePathname();

  const cartItemsCount = cartState.items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  return (
    <>
      {/* ========================================================================= */}
      {/* MAIN TOP NAVIGATION BAR                                                   */}
      {/* ========================================================================= */}
      <header
        className={cn(
          "sticky top-0 left-0 right-0 z-40 transition-all duration-200 border-b",
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-[var(--border-subtle)] shadow-sm py-2"
            : "bg-white border-[var(--border-subtle)] py-3"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Mobile Left: Menu Toggle Button (>= 48px touch target) */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Abrir menú de navegación"
                className="touch-target p-2 rounded-xl text-[var(--text-main)] hover:bg-[var(--surface-muted)] transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Brand Logo & Editorial Wordmark */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Prana Market"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] leading-none">
                  Prana <span className="text-[var(--primary)] font-serif italic">Market</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-[var(--secondary)] font-semibold mt-0.5">
                  Cosméticos & Belleza
                </span>
              </div>
            </Link>

            {/* Action Icons: Search, User, Cart */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Search Bar */}
              <div className="hidden md:block">
                <SearchBar />
              </div>
              {/* Mobile Search Trigger */}
              <Link
                href="/catalog"
                aria-label="Buscar productos"
                className="md:hidden touch-target p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-muted)] transition-colors"
              >
                <Search className="w-5 h-5" />
              </Link>

              {/* Cart Drawer Trigger */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                aria-label="Bolsa de compras"
                className="touch-target relative p-2 text-[var(--text-main)] hover:text-[var(--primary)] hover:bg-[var(--surface-muted)] rounded-xl transition-all group"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors" />
                {cartItemsCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[var(--primary)] text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white transition-transform group-hover:scale-110">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {/* User Account / Auth Section */}
              <div className="hidden sm:flex items-center pl-1">
                {authState.user ? (
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-muted)] rounded-full border border-[var(--border-subtle)]">
                      <div className="w-6 h-6 bg-[var(--accent-tint)] text-[var(--primary)] rounded-full flex items-center justify-center text-xs font-bold">
                        {authState.user.username[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-main)] max-w-[90px] truncate">
                        {authState.user.username}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={logout}
                      aria-label="Cerrar sesión"
                      className="touch-target p-2 text-[var(--text-muted)] hover:text-[var(--status-error)] hover:bg-[var(--status-error-bg)] rounded-xl transition-colors"
                      title="Cerrar Sesión"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Link
                      href="/login"
                      className="touch-target px-3 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                    >
                      Ingresar
                    </Link>
                    <Link
                      href="/register"
                      className="touch-target px-3.5 py-2 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] shadow-xs transition-colors"
                    >
                      Registro
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation Sub-bar & Mobile Drawer */}
      <CategoryNav
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Slide-Over Cart Drawer */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
