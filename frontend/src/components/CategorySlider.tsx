'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { getStrapiMedia } from '@/utils/strapi';
import { cn } from '@/utils/cn';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface ProductCategory {
    id: number;
    Name: string;
    slug: string;
    Description: string;
    Image?: {
        url: string;
        alternativeText?: string;
    };
}

interface CategorySliderProps {
    categories: any[];
    selectedCategory: string | number | null;
    onSelectCategory: (id: string | number | null) => void;
}

export default function CategorySlider({ categories, selectedCategory, onSelectCategory }: CategorySliderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [categories]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="mb-16 relative">
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Nuestras Categorías
                    </h2>
                    <p className="text-gray-500 font-medium">Explora productos seleccionados para tu bienestar</p>
                </div>
                <div className="flex gap-2">
                    {selectedCategory && (
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => onSelectCategory(null)}
                            className="text-emerald-600 hover:text-emerald-700 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-full transition-colors"
                        >
                            Ver todas
                        </motion.button>
                    )}
                </div>
            </div>

            <div className="relative group/slider rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-gray-100 dark:border-white/5">
                {/* Navigation Arrows */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-4 z-10 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                    {showLeftArrow && (
                        <button
                            onClick={() => scroll('left')}
                            className="p-3 rounded-full bg-white dark:bg-zinc-800 shadow-xl border border-gray-50 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:text-emerald-600 transition-all hover:scale-110 active:scale-95"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    )}
                </div>

                <div className="absolute top-1/2 -translate-y-1/2 -right-4 z-10 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                    {showRightArrow && (
                        <button
                            onClick={() => scroll('right')}
                            className="p-3 rounded-full bg-white dark:bg-zinc-800 shadow-xl border border-gray-50 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:text-emerald-600 transition-all hover:scale-110 active:scale-95"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    )}
                </div>

                {/* Categories List */}
                <div
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="flex overflow-x-auto gap-8 md:gap-12 scrollbar-hide snap-x py-2 px-4"
                >
                    {categories.map((category) => (
                        <motion.div
                            key={category.id}
                            whileHover={{ y: -8 }}
                            className="flex-shrink-0 snap-start"
                        >
                            <button
                                onClick={() => onSelectCategory(category.id)}
                                className="flex flex-col items-center gap-4 group/item focus:outline-none"
                            >
                                <div className={cn(
                                    "relative w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden transition-all duration-500 shadow-lg",
                                    selectedCategory === category.id
                                        ? "ring-4 ring-emerald-500 ring-offset-4 scale-105 shadow-emerald-100"
                                        : "ring-0 ring-offset-0 grayscale-[0.3] group-hover/item:grayscale-0 group-hover/item:scale-105"
                                )}>
                                    {category.Image ? (
                                        <Image
                                            fill
                                            src={getStrapiMedia(category.Image.url) || '/placeholder.png'}
                                            alt={category.Image.alternativeText || category.Name}
                                            className="object-cover transition-transform duration-700 group-hover/item:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <span className="text-3xl font-bold uppercase">{category.Name[0]}</span>
                                        </div>
                                    )}
                                    {/* Overlay for selected state */}
                                    {selectedCategory === category.id && (
                                        <div className="absolute inset-0 bg-emerald-600/10 backdrop-blur-[1px]" />
                                    )}
                                </div>

                                <div className="flex flex-col items-center">
                                    <span className={cn(
                                        "text-base md:text-lg font-bold transition-all duration-300 text-center",
                                        selectedCategory === category.id
                                            ? "text-emerald-700 dark:text-emerald-400 scale-110"
                                            : "text-gray-700 dark:text-gray-300 group-hover/item:text-emerald-600"
                                    )}>
                                        {category.Name}
                                    </span>
                                    <div className={cn(
                                        "h-1 rounded-full bg-emerald-500 transition-all duration-300",
                                        selectedCategory === category.id ? "w-8 mt-1 opacity-100" : "w-0 mt-1 opacity-0 group-hover/item:w-4 group-hover/item:opacity-50"
                                    )} />
                                </div>
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
