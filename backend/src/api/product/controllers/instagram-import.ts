import {
  parseInstagramUrl,
  sanitizeCaption,
  extractPriceCop,
  detectCategory,
  extractPublicationStructure,
  extractProductFromRawText,
  fetchInstagramPostMetadata,
  capitalizeWords,
} from '../services/instagram-extractor';

export default {
  /**
   * Story 8.4: Extract product draft from Instagram post URL or raw publication text
   * POST /api/products/extract-instagram
   */
  async extractPost(ctx) {
    try {
      const { postUrl, rawText } = ctx.request.body || ctx.request.query || {};
      const rawInput = (rawText || postUrl || '').trim();

      if (!rawInput) {
        return ctx.badRequest('Se requiere una URL de Instagram o el texto de la publicación.');
      }

      const isInstagramUrl = /instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+/i.test(rawInput);

      if (!isInstagramUrl) {
        // Process directly as text publication (e.g. Purpure format or social copy)
        const draft = extractProductFromRawText(rawInput);
        return ctx.send({
          success: true,
          draft,
        });
      }

      const { isValid, shortcode } = parseInstagramUrl(rawInput);
      if (!isValid || !shortcode) {
        return ctx.badRequest('URL de Instagram inválida. Formato esperado: https://www.instagram.com/p/...');
      }

      const { caption, images } = await fetchInstagramPostMetadata(shortcode);

      const structure = extractPublicationStructure(caption);
      const { name, description, variants } = sanitizeCaption(caption);
      const price = structure.items.length > 0 ? structure.items[0].price : extractPriceCop(caption);
      const suggestedCategory = structure.items.length > 0 ? structure.items[0].suggested_category_slug : detectCategory(caption);
      const sku = `PRANA-IG-${shortcode.toUpperCase()}`;

      const cleanHeadline = structure.headline
        .replace(/[✨👗💄🛍️🔥❤️👉👇📍💵💰🎉]/g, '')
        .replace(/^[–\-—•\s]+|[–\-—•\s]+$/g, '')
        .replace(/[.]?$/, '')
        .trim();

      const title = structure.brand && !cleanHeadline.toLowerCase().includes(structure.brand.toLowerCase())
        ? `${capitalizeWords(cleanHeadline)} - ${structure.brand}`
        : (cleanHeadline || name);

      return ctx.send({
        success: true,
        draft: {
          shortcode,
          original_url: `https://www.instagram.com/p/${shortcode}/`,
          name: title,
          price,
          description: structure.generalDescription || description,
          images,
          variants,
          suggested_category_slug: suggestedCategory,
          sku,
          sourcing_type: 'local',
          brand: structure.brand,
          items: structure.items.length > 0 ? structure.items : undefined,
        },
      });
    } catch (error: any) {
      strapi.log.error('Error extracting Instagram post:', error);
      return ctx.badRequest('Error al extraer la publicación de Instagram: ' + error.message);
    }
  },

  /**
   * Story 8.4: Publish approved Instagram product to Strapi
   * POST /api/products/publish-instagram
   */
  async publishProduct(ctx) {
    try {
      const body = ctx.request.body || {};
      const {
        name,
        price,
        description,
        images = [],
        stock = 1,
        sku,
        category_slug,
      } = body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return ctx.badRequest('El nombre del producto es obligatorio.');
      }

      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return ctx.badRequest('El precio en COP debe ser un número mayor o igual a 0.');
      }

      const numStock = Number(stock);
      if (isNaN(numStock) || numStock < 0) {
        return ctx.badRequest('El stock debe ser un número entero mayor o igual a 0.');
      }

      const productSku = (sku || `PRANA-IG-${Date.now()}`).trim();

      // Enforce dropship catalog protection: Check if SKU exists in mastershop_dropship
      const existingProduct = await strapi.documents('api::product.product').findFirst({
        filters: {
          $or: [
            { supplier_sku: productSku },
            { mastershop_id: productSku },
          ],
        },
      });

      if (existingProduct && existingProduct.sourcing_type === 'mastershop_dropship') {
        return ctx.badRequest(
          `El SKU '${productSku}' pertenece al catálogo de dropshipping de MasterShop y no puede ser modificado desde el importador local.`
        );
      }

      // Resolve category relation if provided
      let categoryRelation = null;
      if (category_slug) {
        const cat = await strapi.documents('api::product-category.product-category').findFirst({
          filters: { slug: category_slug },
        });
        if (cat) {
          categoryRelation = cat.documentId || cat.id;
        }
      }

      const slugBase = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const uniqueSlug = `${slugBase}-${Date.now().toString().slice(-6)}`;

      const newProductData: any = {
        name: name.trim(),
        description: description || name.trim(),
        price: Math.round(numPrice),
        cost_price: Math.round(numPrice * 0.6), // default estimated cost
        stock: Math.round(numStock),
        dropship_stock: 0,
        sourcing_type: 'local', // ALWAYS local
        isActive: numStock > 0,
        supplier_sku: productSku,
        supplier_name: 'Bodega Local / Instagram',
        slug: uniqueSlug,
        last_sync_date: new Date(),
      };

      if (categoryRelation) {
        newProductData.product_category = categoryRelation;
      }

      const created = await strapi.documents('api::product.product').create({
        data: newProductData,
        status: 'published',
      });

      strapi.log.info(`✅ Successfully published Instagram product: ${created.name} (SKU: ${productSku})`);

      return ctx.send({
        success: true,
        message: 'Producto de Instagram publicado exitosamente en catálogo local.',
        product: created,
      });
    } catch (error: any) {
      strapi.log.error('Error publishing Instagram product:', error);
      return ctx.badRequest('Error al guardar el producto en Strapi: ' + error.message);
    }
  },
};
