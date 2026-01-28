'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { getStrapiMedia } from '@/utils/strapi';
import { cn } from '@/utils/cn';

interface PromoItem {
    id: number;
    title?: string;
    link?: string;
    image: {
        url: string;
        alternativeText?: string;
    };
    product?: {
        documentId: string;
        name: string;
    };
}

interface PromoSliderProps {
    items: PromoItem[];
}

export default function PromoSlider({ items }: PromoSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const slideNext = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % items.length);
    }, [items.length]);

    const slidePrev = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    }, [items.length]);

    useEffect(() => {
        if (items.length <= 1) return;
        const timer = setInterval(slideNext, 6000);
        return () => clearInterval(timer);
    }, [slideNext, items.length]);

    if (!items || items.length === 0) return null;

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 1.05,
        }),
    };

    const currentItem = items[currentIndex];
    // Calculate link: priority to product relation, then custom link
    const promoLink = currentItem.product
        ? `/product/${currentItem.product.documentId}`
        : currentItem.link || '#';

    return (
        <div className="relative w-full mb-12 group">
            <div className="relative h-[300px] md:h-[500px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl bg-zinc-100 dark:bg-zinc-900 border border-gray-100 dark:border-white/5">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.4 },
                            scale: { duration: 0.6 }
                        }}
                        className="absolute inset-0"
                    >
                        {/* Background Image */}
                        <div className="relative w-full h-full">
                            <Image
                                src={getStrapiMedia(currentItem.image.url) || ''}
                                alt={currentItem.image.alternativeText || currentItem.title || 'Promoción'}
                                fill
                                priority
                                className="object-cover transition-transform duration-[10s] ease-linear transform scale-100 group-hover:scale-110"
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/60 md:via-black/30 md:to-transparent" />
                        </div>

                        {/* Content Container */}
                        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20">
                            <div className="max-w-xl space-y-4 md:space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <span className="inline-block px-4 py-1.5 bg-pink-500 text-white text-[10px] md:text-sm font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-pink-500/30">
                                        Lanzamiento Exclusivo
                                    </span>
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-3xl md:text-6xl font-black text-white leading-tight drop-shadow-md"
                                >
                                    {currentItem.title || currentItem.product?.name || 'Grandes Ofertas'}
                                </motion.h2>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-white/80 text-sm md:text-lg font-medium max-w-md line-clamp-2 md:line-clamp-none"
                                >
                                    Descubre la magia del maquillaje profesional. Resalta tu belleza con nuestra selección exclusiva.
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="pt-4"
                                >
                                    <Link
                                        href={promoLink}
                                        className="inline-flex items-center gap-2 bg-white text-pink-600 hover:bg-pink-600 hover:text-white px-6 md:px-10 py-3 md:py-4 rounded-full text-sm md:text-lg font-black transition-all duration-300 shadow-xl hover:shadow-pink-500/20 active:scale-95 group/btn"
                                    >
                                        <span>Descubrir Más</span>
                                        <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Controls */}
                {items.length > 1 && (
                    <>
                        <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 z-20">
                            <button
                                onClick={slidePrev}
                                className="p-3 md:p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-pink-600 transition-all active:scale-90"
                            >
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 z-20">
                            <button
                                onClick={slideNext}
                                className="p-3 md:p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-pink-600 transition-all active:scale-90"
                            >
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        {/* Dots */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                            {items.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setDirection(index > currentIndex ? 1 : -1);
                                        setCurrentIndex(index);
                                    }}
                                    className={cn(
                                        "h-1.5 transition-all duration-500 rounded-full",
                                        index === currentIndex
                                            ? "w-8 md:w-12 bg-white"
                                            : "w-2 md:w-3 bg-white/30 hover:bg-white/50"
                                    )}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
