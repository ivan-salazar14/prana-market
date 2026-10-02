'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { Product } from '@/types/product';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

interface SearchResult {
  product: Product;
  image: string;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export default function SearchBar({ onSearch, placeholder = 'Buscar productos...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
      const response = await fetch(
        `${baseUrl}/api/products?filters[name][$containsi]=${encodeURIComponent(searchQuery)}&populate=*`,
        { cache: 'no-store' }
      );

      if (response.ok) {
        const data = await response.json();
        const searchResults = (data.data || []).map((item: any) => ({
          product: {
            id: item.id,
            name: item.name,
            slug: item.slug,
            brand: item.brand || 'Prana Market',
            priceCOP: item.price || item.priceCOP || 0,
            images: item.images?.map((img: any) => img.url) || [],
          },
          image: item.images?.[0]?.url || '',
        }));
        setResults(searchResults);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-subtle" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-surface-card border border-border-subtle rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          aria-label="Buscar productos"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-main transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-card border border-border-subtle rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-text-muted">
              <div className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm mt-2">Buscando...</p>
            </div>
          ) : results.length > 0 ? (
            <ul className="py-2">
              {results.map((result) => (
                <li key={result.product.id}>
                  <Link
                    href={`/product/${result.product.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted transition-colors"
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                    }}
                  >
                    {result.image && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-muted">
                        <Image
                          src={result.image}
                          alt={result.product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-main truncate">
                        {result.product.name}
                      </p>
                      <p className="text-xs text-text-muted">{result.product.brand}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">
                      {formatPrice(result.product.priceCOP)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-text-muted">
              <p className="text-sm">No se encontraron productos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
