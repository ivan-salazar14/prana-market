'use client';

import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <button className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Menu
            </button>
            <button className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Favorites
            </button>
            <button className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Cart (0)
            </button>
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
              <button className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
                Menu
              </button>
              <button className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
                Favorites
              </button>
              <button className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
                Cart (0)
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}