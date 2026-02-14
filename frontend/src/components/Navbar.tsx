'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Menu,
  X,
  User,
  LogOut,
  Package,
  Home
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/Button';
import { cn } from '@/utils/cn';
import Cart from './Cart';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { state: cartState } = useCart();
  const { state: authState, logout } = useAuth();
  const pathname = usePathname();

  const cartItemsCount = cartState.items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Mis Pedidos', href: '/orders', icon: Package },
  ];

  return (
    <>
      <div className="bg-black text-white py-2.5 text-center text-[10px] md:text-xs font-black tracking-[0.2em] px-4 uppercase relative z-[60]">
        ✨ Envíos a todo Colombia | Belleza, Salud y Bienestar ✨
      </div>
      <nav
        className={cn(
          "sticky top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          isScrolled
            ? "bg-white/90 backdrop-blur-md border-gray-100 py-2 shadow-sm dark:bg-zinc-950/90 dark:border-white/10"
            : "bg-white border-transparent py-4 dark:bg-zinc-950"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-10 h-10 group-hover:scale-110 transition-transform duration-300">
                <Image
                  src="/logo.png"
                  alt="Prana Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                Prana <span className="text-brand-primary">Market</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                    pathname === link.href
                      ? "bg-brand-secondary text-brand-primary"
                      : "text-stone-600 hover:bg-brand-secondary/30 hover:text-stone-900"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </Link>
              ))}

              <div className="h-6 w-px bg-stone-200 mx-2" />

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-stone-600 hover:text-brand-primary hover:bg-brand-secondary/30 rounded-xl transition-all group"
              >
                <ShoppingBag className="w-6 h-6" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-transform group-hover:scale-110">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {authState.user ? (
                <div className="flex items-center ml-2 space-x-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-background rounded-full border border-stone-100">
                    <div className="w-6 h-6 bg-brand-secondary text-brand-primary rounded-full flex items-center justify-center text-xs font-bold">
                      {authState.user.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-stone-700">{authState.user.username}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all tooltip"
                    title="Cerrar Sesión"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 ml-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-brand-primary transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="rounded-xl shadow-brand-primary/20">
                      Registro
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center space-x-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 bg-gray-50 rounded-xl"
              >
                <ShoppingBag className="w-6 h-6" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-white/10 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors",
                      pathname === link.href
                        ? "bg-pink-50 text-pink-700"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                ))}

                <div className="my-4 h-px bg-gray-100" />

                {authState.user ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-700">
                      <div className="w-8 h-8 bg-pink-100 text-pink-700 rounded-full flex items-center justify-center font-bold">
                        {authState.user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{authState.user.username}</p>
                        <p className="text-xs text-gray-500">{authState.user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 p-2">
                    <Link
                      href="/login"
                      className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold text-white bg-black hover:bg-gray-900"
                    >
                      Registro
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
