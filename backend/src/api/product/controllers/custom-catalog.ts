import { factories } from '@strapi/strapi';

export function parseCsvRows(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  if (!csvText || typeof csvText !== 'string') return { headers: [], rows: [] };

  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const rawHeaders = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  const headers = rawHeaders;

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV splitter handling quoted cells
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      let val = match[1];
      if (val !== undefined) {
        val = val.replace(/^["']|["']$/g, '').trim();
        matches.push(val);
      }
    }

    // Filter trailing empty match from regex
    const rowValues = line.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowObj[header] = rowValues[idx] !== undefined ? rowValues[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export default factories.createCoreController('api::product.product', ({ strapi }) => ({
  /**
   * Story 7.1: Instagram Catalog Sync & Meta Product Feed Generation
   * Generates RSS 2.0 XML feed complying with Meta Commerce Manager specifications
   */
  async generateInstagramFeed(ctx) {
    try {
      const products = await strapi.documents('api::product.product').findMany({
        populate: ['images', 'category'],
        limit: 1000,
      });

      const frontendUrl = process.env.FRONTEND_URL || 'https://pranamarket.com';

      const itemsXml = (products || []).map((prod: any) => {
        const prodId = prod.documentId || prod.id;
        const title = (prod.name || prod.title || 'Producto Prana Market')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const description = (prod.description || title)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const slug = prod.slug || prodId;
        const link = `${frontendUrl}/product/${slug}?utm_source=instagram&amp;utm_medium=social_catalog&amp;utm_campaign=ig_shopping`;
        const price = `${Math.round(prod.price || 0)} COP`;

        let imageUrl = `${frontendUrl}/icon.png`;
        if (Array.isArray(prod.images) && prod.images.length > 0) {
          imageUrl = prod.images[0].url || imageUrl;
        } else if (prod.image?.url) {
          imageUrl = prod.image.url;
        }

        const stockStatus = (prod.stock === 0 || prod.inStock === false) ? 'out of stock' : 'in stock';

        return `
    <item>
      <g:id>${prodId}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:brand>Prana Market</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${stockStatus}</g:availability>
      <g:price>${price}</g:price>
    </item>`;
      }).join('');

      const xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Prana Market Official Product Feed</title>
    <link>${frontendUrl}</link>
    <description>Catálogo Oficial de Productos de Prana Market para Meta &amp; Instagram Commerce Manager</description>${itemsXml}
  </channel>
</rss>`;

      ctx.set('Content-Type', 'application/xml');
      ctx.set('Cache-Control', 'public, max-age=3600');
      return ctx.send(xmlFeed);
    } catch (error: any) {
      strapi.log.error('Error generating Instagram product feed:', error);
      return ctx.internalServerError('Error al generar el feed de Meta/Instagram.');
    }
  },

  /**
   * Story 8.1: Download CSV sample template
   * GET /api/products/csv-template
   */
  async getCsvTemplate(ctx) {
    const templateContent =
      'sku,name,category_slug,price,cost_price,stock,description,is_active\n' +
      'PRANA-LOC-001,Labial Hidratante Rosa,labios,45000,25000,20,Labial hidratante con ácido hialurónico,true\n' +
      'PRANA-LOC-002,Serum Facial Vitamina C,skincare,85000,45000,15,Serum antioxidante iluminador,true\n';

    ctx.set('Content-Type', 'text/csv; charset=utf-8');
    ctx.set('Content-Disposition', 'attachment; filename="template-productos-prana.csv"');
    return ctx.send(templateContent);
  },

  /**
   * Story 8.1: Bulk CSV Catalog Upload & Stock Management
   * POST /api/products/import-csv
   */
  async importCsv(ctx) {
    try {
      const body = ctx.request.body || {};
      const csvContent = body.csvContent || body.content || '';

      if (!csvContent || typeof csvContent !== 'string' || csvContent.trim().length === 0) {
        return ctx.badRequest('Se requiere el archivo o contenido CSV en el campo csvContent.');
      }

      const { headers, rows } = parseCsvRows(csvContent);

      const requiredHeaders = ['sku', 'name', 'category_slug', 'price', 'stock'];
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

      if (missingHeaders.length > 0) {
        return ctx.badRequest(
          `Cabeceras CSV faltantes requeridas: ${missingHeaders.join(', ')}. Cabeceras encontradas: ${headers.join(', ')}`
        );
      }

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Line 1 is headers

        const sku = (row.sku || '').trim();
        const name = (row.name || '').trim();
        const categorySlug = (row.category_slug || '').trim().toLowerCase();
        const rawPrice = (row.price || '').trim();
        const rawStock = (row.stock || '').trim();
        const rawCostPrice = (row.cost_price || '').trim();
        const description = (row.description || name).trim();
        const isActive = row.is_active === undefined || row.is_active === '' ? true : row.is_active.toLowerCase() === 'true';

        // 1. Validation of required row fields
        if (!sku || !name || !categorySlug || !rawPrice || !rawStock) {
          errors.push(`Fila ${rowNum}: Faltan campos obligatorios requeridos (sku, name, category_slug, price, stock).`);
          skippedCount++;
          continue;
        }

        const price = Number(rawPrice);
        const stock = parseInt(rawStock, 10);
        const costPrice = rawCostPrice ? Number(rawCostPrice) : Math.round(price * 0.6);

        if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
          errors.push(`Fila ${rowNum}: Valores numéricos inválidos (price: ${rawPrice}, stock: ${rawStock}). Deben ser >= 0.`);
          skippedCount++;
          continue;
        }

        // 2. Protect MasterShop Dropship Catalog: Check if SKU exists
        const existingProduct = await strapi.documents('api::product.product').findFirst({
          filters: {
            $or: [{ supplier_sku: sku }, { mastershop_id: sku }],
          },
        });

        if (existingProduct && existingProduct.sourcing_type === 'mastershop_dropship') {
          errors.push(`Fila ${rowNum}: El SKU '${sku}' pertenece a MasterShop dropship y no puede modificarse por CSV local.`);
          skippedCount++;
          continue;
        }

        // 3. Resolve Category Relationship
        let categoryRelation = null;
        if (categorySlug) {
          const category = await strapi.documents('api::product-category.product-category').findFirst({
            filters: { slug: categorySlug },
          });
          if (category) {
            categoryRelation = category.documentId || category.id;
          }
        }

        // 4. Upsert Product
        if (existingProduct && existingProduct.sourcing_type === 'local') {
          // Update existing local product
          await strapi.documents('api::product.product').update({
            documentId: existingProduct.documentId,
            data: {
              name,
              price,
              cost_price: costPrice,
              stock,
              description,
              isActive: isActive && stock > 0,
              product_category: categoryRelation || existingProduct.product_category,
              last_sync_date: new Date(),
            },
          });
          updatedCount++;
        } else {
          // Create new local product
          const slugBase = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
          const uniqueSlug = `${slugBase}-${sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

          await strapi.documents('api::product.product').create({
            data: {
              name,
              description,
              price,
              cost_price: costPrice,
              stock,
              dropship_stock: 0,
              sourcing_type: 'local', // Strictly local
              isActive: isActive && stock > 0,
              supplier_sku: sku,
              supplier_name: 'Bodega Local / CSV',
              slug: uniqueSlug,
              product_category: categoryRelation,
              last_sync_date: new Date(),
            },
            status: 'published',
          });
          createdCount++;
        }
      }

      strapi.log.info(
        `📊 CSV Import complete. Total: ${rows.length}, Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`
      );

      return ctx.send({
        success: true,
        summary: {
          total: rows.length,
          created: createdCount,
          updated: updatedCount,
          skipped: skippedCount,
          errors,
        },
      });
    } catch (error: any) {
      strapi.log.error('Error executing CSV catalog import:', error);
      return ctx.badRequest('Error al procesar el archivo CSV: ' + error.message);
    }
  },
}));
