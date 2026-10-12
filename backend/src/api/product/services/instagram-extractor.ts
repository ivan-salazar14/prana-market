import { factories } from '@strapi/strapi';

export interface ExtractedProductItem {
  id: string;
  name: string;
  raw_label: string;
  price: number;
  description: string;
  suggested_category_slug?: string;
  sku: string;
}

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
  sourcing_type?: string;
  brand?: string;
  items?: ExtractedProductItem[];
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

  // 4. Matches Colombian prices with dots preceded by colon, dash or boundary: e.g. "Splash: 26.000", "Mini mantequilla: 13.000", or standalone "26.000"
  const itemDotRegex = /(?:[:\-–]\s*|\b)(\d{1,3}(?:\.\d{3})+)\b/;
  const itemDotMatch = text.match(itemDotRegex);
  if (itemDotMatch && itemDotMatch[1]) {
    const numStr = itemDotMatch[1].replace(/\./g, '');
    const price = parseInt(numStr, 10);
    if (!isNaN(price) && price > 0) return price;
  }

  return 0;
}

export function capitalizeWords(str: string): string {
  if (!str) return '';
  return str
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
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
  // Skincare next (e.g. "serum iluminador", "mantequilla corporal", "splash" -> skincare)
  if (/suero|serum|crema|tonico|tónico|bloqueador|skincare|acido|ácido|limpiador|hidratante|mantequilla|splash|corporal|body|exfoliante|locion|loción|balsamo|bálsamo/i.test(lower)) return 'skincare';
  if (/labial|gloss|lipstick|tinta/i.test(lower)) return 'labios';
  if (/pestañ|mascara|sombra|delineador|cejas/i.test(lower)) return 'ojos';
  if (/base|corrector|polvo|rubor|primer|iluminador|contorno/i.test(lower)) return 'rostro';
  if (/kit|set|combo|duo|pack/i.test(lower)) return 'sets';
  return 'general';
}

/**
 * Story 8.4: Parse structured publication captions containing multiple items or brand headers.
 * Example:
 * Splash piña colada y mini mantequilla corporal de Purpure.
 * Huelen delicioso, tienen una duración increíble y la mantequilla tiene unos destellos hermosos.
 *
 * Splash: 26.000
 * Mini mantequilla: 13.000
 */
export function extractPublicationStructure(rawText: string): {
  brand: string;
  headline: string;
  generalDescription: string;
  items: ExtractedProductItem[];
} {
  if (!rawText) {
    return { brand: '', headline: '', generalDescription: '', items: [] };
  }

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Detect brand (e.g. "de Purpure", "por Purpure", "marca: Purpure")
  let brand = '';
  const brandMatch = rawText.match(/\b(?:de|por|marca:?)\s+([A-Z][A-Za-z0-9_-]+)\b/i);
  if (brandMatch && brandMatch[1]) {
    brand = capitalizeWords(brandMatch[1]);
  }

  // 2. Identify price list lines: "Splash: 26.000", "Mini mantequilla: 13.000"
  const itemLineRegex = /^([A-Za-zÀ-ÿ0-9\s/]+?)[:\-–]\s*(?:\$|COP)?\s*(\d{1,3}(?:\.\d{3})+|\d{2,4}\s*(?:k|mil)|\d{4,7})\b/i;

  const rawItemLines: { rawLabel: string; price: number; line: string }[] = [];
  const contentLines: string[] = [];

  for (const line of lines) {
    const match = line.match(itemLineRegex);
    if (match) {
      const rawLabel = match[1].trim();
      const priceVal = extractPriceCop(line);
      if (priceVal > 0) {
        rawItemLines.push({
          rawLabel,
          price: priceVal,
          line,
        });
      }
    } else {
      contentLines.push(line);
    }
  }

  const headline = contentLines[0] || 'Producto Prana Market';
  const generalDescription = contentLines.join('\n\n');

  // 3. Correlate raw labels with headline text to produce professional catalog names
  const items: ExtractedProductItem[] = rawItemLines.map((item, idx) => {
    let resolvedName = item.rawLabel;

    // Clean headline from brand suffix for matching
    const cleanHeadline = headline
      .replace(/\b(?:de|por)\s+[A-Za-z0-9_-]+[.]?$/i, '')
      .replace(/[.,;]$/, '')
      .trim();

    // Segment headline by " y ", " con ", ",", " + "
    const segments = cleanHeadline
      .split(/\s+(?:y|\+|con)\s+|,/i)
      .map((s) => s.trim())
      .filter(Boolean);

    const matchedSegment = segments.find(
      (s) =>
        s.toLowerCase().includes(item.rawLabel.toLowerCase()) ||
        item.rawLabel.toLowerCase().includes(s.toLowerCase())
    );

    if (matchedSegment) {
      resolvedName = matchedSegment;
    }

    const fullName = brand && !resolvedName.toLowerCase().includes(brand.toLowerCase())
      ? `${capitalizeWords(resolvedName)} - ${brand}`
      : capitalizeWords(resolvedName);

    const category = detectCategory(resolvedName);

    // Normalize accented characters for clean SKU slug
    const normalizedAscii = resolvedName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 15);

    const brandSkuPrefix = brand
      ? `${brand.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()}-`
      : '';

    const sku = `PRANA-LOC-${brandSkuPrefix}${normalizedAscii}-${Date.now().toString().slice(-4)}${idx + 1}`;

    return {
      id: `item-${idx + 1}`,
      name: fullName,
      raw_label: item.rawLabel,
      price: item.price,
      suggested_category_slug: category,
      sku,
      description: generalDescription,
    };
  });

  return {
    brand,
    headline,
    generalDescription,
    items,
  };
}

/**
 * Story 8.4: Extract product draft directly from raw text publication
 */
export function extractProductFromRawText(rawText: string, defaultImage?: string): ExtractedProductDraft {
  const structure = extractPublicationStructure(rawText);
  const fallbackImage = defaultImage || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80';

  if (structure.items.length > 0) {
    const firstItem = structure.items[0];
    const cleanHeadline = structure.headline
      .replace(/[✨👗💄🛍️🔥❤️👉👇📍💵💰🎉]/g, '')
      .replace(/^[–\-—•\s]+|[–\-—•\s]+$/g, '')
      .replace(/[.]?$/, '')
      .trim();

    const title = structure.brand && !cleanHeadline.toLowerCase().includes(structure.brand.toLowerCase())
      ? `${capitalizeWords(cleanHeadline)} - ${structure.brand}`
      : capitalizeWords(cleanHeadline);

    return {
      shortcode: `TEXT-${Date.now().toString().slice(-6)}`,
      original_url: '',
      name: title,
      price: firstItem.price,
      description: structure.generalDescription,
      images: [fallbackImage],
      variants: { sizes: [], colors: [] },
      suggested_category_slug: firstItem.suggested_category_slug || 'skincare',
      sku: firstItem.sku,
      sourcing_type: 'local',
      brand: structure.brand,
      items: structure.items,
    };
  }

  // Fallback to standard caption parsing if no itemized lines
  const { name, description, variants } = sanitizeCaption(rawText);
  const price = extractPriceCop(rawText);
  const suggestedCategory = detectCategory(rawText);
  const sku = `PRANA-LOC-${Date.now().toString().slice(-6)}`;

  return {
    shortcode: `TEXT-${Date.now().toString().slice(-6)}`,
    original_url: '',
    name,
    price,
    description,
    images: [fallbackImage],
    variants,
    suggested_category_slug: suggestedCategory,
    sku,
    sourcing_type: 'local',
  };
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
    const structure = extractPublicationStructure(caption);
    const { name, description, variants } = sanitizeCaption(caption);
    const price = structure.items.length > 0 ? structure.items[0].price : extractPriceCop(caption);
    const suggestedCategory = structure.items.length > 0 ? structure.items[0].suggested_category_slug : detectCategory(caption);
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
      sourcing_type: 'local',
      brand: structure.brand,
      items: structure.items.length > 0 ? structure.items : undefined,
    };
  },
}));

