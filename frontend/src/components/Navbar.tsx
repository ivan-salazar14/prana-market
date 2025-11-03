'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Cart from './Cart';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { state } = useCart();
  const { state: authState, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">Prana Market</h1>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Menu
            </Link>
            <Link href="/orders" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Mis Pedidos
            </Link>
            <button
              onClick={() => setIsCartOpen(true)}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium relative"
            >
              <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-3" />
              </svg>
              Cart ({state.items.reduce((sum, item) => sum + item.quantity, 0)})
            </button>
            {authState.user ? (
              <>
                <span className="text-gray-700 px-3 py-2 text-sm">Hello, {authState.user.username}</span>
                <button onClick={logout} className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                <Link href="/register" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Register</Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link href="/" className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
                Menu
              </Link>
              <Link href="/orders" className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
                Mis Pedidos
              </Link>
              <button
                onClick={() => setIsCartOpen(true)}
                className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
              >
                Cart ({state.items.reduce((sum, item) => sum + item.quantity, 0)})
              </button>
              {authState.user ? (
                <>
                  <span className="text-gray-700 block px-3 py-2 text-base">Hello, {authState.user.username}</span>
                  <button onClick={logout} className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">Login</Link>
                  <Link href="/register" className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">Register</Link>
                </>
              )}
            </div>
          </div>
        )}

        <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </nav>
  );
}