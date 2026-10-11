'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star, MessageCircle, ExternalLink, Heart, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SocialProofItem {
  id: string | number;
  author_handle: string;
  author_avatar?: string;
  comment_text: string;
  rating: number;
  media_thumbnail?: string;
  instagram_post_url: string;
  is_approved: boolean;
  product_slug?: string;
  timestamp?: string;
}

interface InstagramSocialProofProps {
  productSlug?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function InstagramSocialProof({
  productSlug,
  title = 'Lo que dicen en Instagram',
  subtitle = 'Comentarios reales y experiencias compartidas por nuestra comunidad en Colombia',
  className,
}: InstagramSocialProofProps) {
  const [items, setItems] = useState<SocialProofItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchSocialProof = async () => {
      try {
        const query = productSlug ? `?product_slug=${encodeURIComponent(productSlug)}` : '';
        const res = await fetch(`/api/social-proof${query}`);
        if (!res.ok) throw new Error('Failed to fetch social proof');
        const json = await res.json();
        if (isMounted && json.data) {
          setItems(json.data);
        }
      } catch (err) {
        console.error('Error loading Instagram social proof:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSocialProof();
    return () => {
      isMounted = false;
    };
  }, [productSlug]);

  return (
    <section
      aria-label="Opiniones y comentarios de Instagram"
      className={cn(
        'w-full py-12 px-4 sm:px-6 lg:px-8 border-t border-stone-200/80 bg-stone-50/50',
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-pink-200 text-pink-700 text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            Comunidad Instagram @pranamarket
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            {title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-600 font-medium">
            {subtitle}
          </p>
        </div>

        {/* Loading Skeleton: Fixed heights to prevent CLS */}
        {loading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            style={{ minHeight: '380px' }}
          >
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-6 border border-stone-200/70 shadow-sm flex flex-col justify-between animate-pulse"
                style={{ height: '380px' }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-stone-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-stone-200 rounded w-28" />
                      <div className="h-3 bg-stone-200 rounded w-20" />
                    </div>
                  </div>
                  <div className="h-44 bg-stone-200 rounded-2xl mb-4" />
                  <div className="space-y-2">
                    <div className="h-3.5 bg-stone-200 rounded w-full" />
                    <div className="h-3.5 bg-stone-200 rounded w-4/5" />
                  </div>
                </div>
                <div className="h-10 bg-stone-200 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <article
                key={item.id}
                className="group bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm hover:shadow-md hover:border-pink-200 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Author Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
                          {item.author_avatar ? (
                            <Image
                              src={item.author_avatar}
                              alt={item.author_handle}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-700 font-bold text-sm">
                              {item.author_handle.slice(1, 3).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900 text-sm hover:text-pink-600 transition-colors">
                            {item.author_handle}
                          </span>
                          <CheckCircle2 className="w-4 h-4 text-sky-500" aria-label="Verificado" />
                        </div>
                        <span className="text-xs text-stone-500 font-medium">
                          {item.timestamp || 'Comprador verificado'}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i < item.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Media Thumbnail (if present) */}
                  {item.media_thumbnail && (
                    <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4 bg-stone-100">
                      <Image
                        src={item.media_thumbnail}
                        alt={`Publicación de ${item.author_handle}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-[11px] font-semibold text-white">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Instagram UGC</span>
                      </div>
                    </div>
                  )}

                  {/* Comment Text */}
                  <blockquote className="text-stone-700 text-sm leading-relaxed mb-4 italic">
                    "{item.comment_text}"
                  </blockquote>
                </div>

                {/* Footer CTA */}
                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-stone-500 font-semibold">
                    <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                    Amor por el producto
                  </span>
                  <a
                    href={item.instagram_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-stone-900 bg-stone-100 hover:bg-stone-900 hover:text-white px-3.5 py-2 rounded-xl transition-colors"
                  >
                    <span>Ver en Instagram</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
