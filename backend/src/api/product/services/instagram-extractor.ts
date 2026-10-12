import { factories } from '@strapi/strapi';

export interface ExtractedProductDraft {
  shortcode: string;
  original_url: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  variants?: {
    sizes?: string[];
    colors?: string[];
  };
  suggested_category_slug?: string;
  sku: string;
}

export function parseInstagramUrl(url: string): { isValid: boolean; shortcode?: string; type?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false };
  }

  const cleanUrl = url.trim();
  const igRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i;
  const match = cleanUrl.match(igRegex);

  if (match && match[1]) {
    const isReel = cleanUrl.includes('/reel/');
    return {
      isValid: true,
      shortcode: match[1],
      type: isReel ? 'reel' : 'post',
    };
  }

  return { isValid: false };
}

export function extractPriceCop(text: string): number {
  if (!text) return 0;

  // 1. Matches: "$85.000", "$ 85.000", "85.000 COP", "COP 85.000"
  const formattedPriceRegex = /(?:\$|COP)\s*(\d{1,3}(?:\.\d{3})+)|(\d{1,3}(?:\.\d{3})+)\s*(?:COP|\$)/i;
  const formattedMatch = text.match(formattedPriceRegex);
  if (formattedMatch) {
    const numStr = (formattedMatch[1] || formattedMatch[2]).replace(/\./g, '');
    const price = parseInt(numStr, 10);
    if (!isNaN(price) && price > 0) return price;
  }

  // 2. Matches Colombian slang: "85k", "85 k", "85 mil", "85mil"
  const slangPriceRegex = /(?:precio:?\s*|\$)?(\d{2,4})\s*(?:k|mil)\b/i;
  const slangMatch = text.match(slangPriceRegex);
  if (slangMatch && slangMatch[1]) {
    const thousandPart = parseInt(slangMatch[1], 10);
    if (!isNaN(thousandPart) && thousandPart > 0) {
      return thousandPart * 1000;
    }
  }

  // 3. Matches plain numbers with currency symbols: "$85000", "COP 85000"
  const plainRegex = /(?:\$|COP|precio:?)\s*(\d{4,7})\b/i;
  const plainMatch = text.match(plainRegex);
  if (plainMatch && plainMatch[1]) {
    const price = parseInt(plainMatch[1], 10);
    if (!isNaN(price) && price > 0) return price;
  }

  return 0;
}

export function sanitizeCaption(caption: string): { name: string; description: string; variants: any } {
  if (!caption) {
    return {
      name: 'Producto Prana Market',
      description: '',
      variants: { sizes: [], colors: [] },
    };
  }

  const lines = caption.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // Strip emojis, hashtags, and social call-to-actions
  const ctaFilter = /(escr[ií]benos|pedidos?|env[ií]os?|link en bio|whatsapp|dm\b|direct\b|domicilios?|escr[ií]beme|inbox|p[ií]delo)/i;
  
  // Extract variants
  const sizes: string[] = [];
  const sizeMatch = caption.match(/(?:tallas?|sizes?):?\s*([A-Za-z0-9,\s/-]+)/i);
  if (sizeMatch && sizeMatch[1]) {
    const rawSizes = sizeMatch[1].split(/[,/\s]+/).filter((s) => ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'UNICA', 'ÚNICA'].includes(s.toUpperCase()));
    sizes.push(...rawSizes.map((s) => s.toUpperCase()));
  }

  const colors: string[] = [];
  const colorKeywords = ['negro', 'blanco', 'beige', 'lino', 'rosado', 'rojo', 'azul', 'verde', 'nude', 'café', 'dorado', 'plateado'];
  colorKeywords.forEach((col) => {
    if (new RegExp(`\\b${col}\\b`, 'i').test(caption)) {
      colors.push(col.charAt(0).toUpperCase() + col.slice(1).toLowerCase());
    }
  });

  // Clean lines for description
  const cleanLines = lines.filter((line) => {
    if (line.startsWith('#')) return false; // Hashtag wall
    if (ctaFilter.test(line)) return false; // WhatsApp / DM CTAs
    if (line.startsWith('http')) return false;
    return true;
  });

  // Extract name from first substantive line
  let rawName = cleanLines.length > 0 ? cleanLines[0] : 'Producto Instagram';
  
  // Strip emojis and leading/trailing punctuation
  let cleanName = rawName
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    .replace(/[✨👗💄🛍️🔥❤️👉👇📍💵💰🎉]/g, '')
    .replace(/^[–\-—•\s]+|[–\-—•\s]+$/g, '')
    .trim();

  if (cleanName.length < 3) {
    cleanName = 'Producto Prana Market';
  } else if (cleanName.length > 60) {
    cleanName = cleanName.substring(0, 60).trim();
  }

  // Commercial description
  const cleanDescription = cleanLines.join('\n\n')
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    .trim();

  return {
    name: cleanName,
    description: cleanDescription || cleanName,
    variants: { sizes, colors },
  };
}

export function detectCategory(text: string): string {
  const lower = (text || '').toLowerCase();
  // Accessories first (e.g. "brocha para rubor" -> accesorios)
  if (/brocha|esponja|cosmetiquera|rizador|encrespador|aplicador|pincel/i.test(lower)) return 'accesorios';
  // Skincare next (e.g. "serum iluminador" -> skincare)
  if (/suero|serum|crema|tonico|tónico|bloqueador|skincare|acido|ácido|limpiador|hidratante/i.test(lower)) return 'skincare';
  if (/labial|gloss|lipstick|tinta/i.test(lower)) return 'labios';
  if (/pestañ|mascara|sombra|delineador|cejas/i.test(lower)) return 'ojos';
  if (/base|corrector|polvo|rubor|primer|iluminador|contorno/i.test(lower)) return 'rostro';
  if (/kit|set|combo|duo|pack/i.test(lower)) return 'sets';
  return 'general';
}

export default factories.createCoreService('api::product.product', ({ strapi }) => ({
  /**
   * Story 8.4: Extract product data from an Instagram post URL
   */
  async extractProductFromInstagram(postUrl: string): Promise<ExtractedProductDraft> {
    const { isValid, shortcode } = parseInstagramUrl(postUrl);

    if (!isValid || !shortcode) {
      throw new Error('URL de Instagram no válida. Debe ser de tipo https://instagram.com/p/...');
    }

    let caption = '';
    let images: string[] = [];

    // Attempt oEmbed or public metadata fetch
    try {
      const oembedUrl = `https://api.instagram.com/oembed?url=https://www.instagram.com/p/${shortcode}/&omitscript=true`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data: any = await res.json();
        caption = data.title || '';
        if (data.thumbnail_url) {
          images.push(data.thumbnail_url);
        }
      }
    } catch (err) {
      strapi.log.warn(`Instagram oEmbed fetch warning for ${shortcode}:`, err);
    }

    // Default fallback image if oEmbed did not provide one or was rate limited
    if (images.length === 0) {
      images.push(`https://instagram.com/p/${shortcode}/media/?size=l`);
    }

    // Clean caption and parse entities
    const { name, description, variants } = sanitizeCaption(caption);
    const price = extractPriceCop(caption);
    const suggestedCategory = detectCategory(caption);
    const sku = `PRANA-IG-${shortcode.toUpperCase()}`;

    return {
      shortcode,
      original_url: `https://www.instagram.com/p/${shortcode}/`,
      name,
      price,
      description,
      images,
      variants,
      suggested_category_slug: suggestedCategory,
      sku,
    };
  },
}));
