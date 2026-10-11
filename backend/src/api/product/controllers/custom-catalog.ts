import { factories } from '@strapi/strapi';

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
}));
