import { NextRequest, NextResponse } from 'next/server';

export interface SocialProofComment {
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

const FALLBACK_SOCIAL_PROOFS: SocialProofComment[] = [
  {
    id: 'ugc-1',
    author_handle: '@valen_beauty_co',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    comment_text: '¡Quedé enamorada del acabado! La piel se siente hidratada todo el día y el tono queda súper natural. Definitivamente volveré a pedir por aquí ✨💖',
    rating: 5,
    media_thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    instagram_post_url: 'https://www.instagram.com/pranamarket',
    is_approved: true,
    timestamp: 'Hace 2 días'
  },
  {
    id: 'ugc-2',
    author_handle: '@caro_skincare_bogota',
    author_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    comment_text: 'El envío a Bogotá me llegó en menos de 24 horas y con el cupón de bienvenida BIENVENIDA10 ahorré un montón. Súper recomendados 🛍️🇨🇴',
    rating: 5,
    media_thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80',
    instagram_post_url: 'https://www.instagram.com/pranamarket',
    is_approved: true,
    timestamp: 'Hace 3 días'
  },
  {
    id: 'ugc-3',
    author_handle: '@camila.glow.medellin',
    author_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    comment_text: 'Lo vi en un reel de Instagram y superó mis expectativas. La textura es ligera y no deja sensación grasosa. ¡10/10! 🌿',
    rating: 5,
    media_thumbnail: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80',
    instagram_post_url: 'https://www.instagram.com/pranamarket',
    is_approved: true,
    timestamp: 'Hace 5 días'
  }
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productSlug = searchParams.get('product_slug');
  const BASE_URL = (process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337').replace(/\/$/, '');

  try {
    const url = new URL(`${BASE_URL}/api/social-proofs`);
    if (productSlug) {
      url.searchParams.set('product_slug', productSlug);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'strapi',
          data: data.data.filter((item: any) => item.is_approved !== false),
        });
      }
    }
  } catch (error) {
    // Strapi not reachable or timeout -> use graceful fallback
  }

  // Graceful fallback for storefront continuity
  const filteredFallback = productSlug
    ? FALLBACK_SOCIAL_PROOFS.filter(p => !p.product_slug || p.product_slug === productSlug)
    : FALLBACK_SOCIAL_PROOFS;

  return NextResponse.json({
    success: true,
    source: 'fallback',
    data: filteredFallback.length > 0 ? filteredFallback : FALLBACK_SOCIAL_PROOFS,
  });
}
