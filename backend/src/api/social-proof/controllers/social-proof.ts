import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::social-proof.social-proof', ({ strapi }) => ({
  /**
   * Public endpoint to fetch approved Instagram comments / social proofs
   */
  async getApproved(ctx) {
    try {
      const { product_slug } = ctx.query;
      const filters: any = {
        is_approved: true,
      };
      if (product_slug) {
        filters.product_slug = product_slug;
      }

      const entries = await strapi.documents('api::social-proof.social-proof').findMany({
        filters,
        limit: 50,
      });

      return ctx.send({
        success: true,
        data: entries,
      });
    } catch (error: any) {
      strapi.log.error('Error fetching approved social proofs:', error);
      return ctx.internalServerError('Error al obtener pruebas sociales de Instagram.');
    }
  },

  /**
   * Admin moderation endpoint to approve/reject an Instagram comment
   */
  async moderate(ctx) {
    const { id } = ctx.params;
    const { is_approved } = ctx.request.body || {};

    try {
      const updated = await strapi.documents('api::social-proof.social-proof').update({
        documentId: id,
        data: {
          is_approved: Boolean(is_approved),
        },
      });

      return ctx.send({
        success: true,
        message: 'Estado de moderación actualizado con éxito',
        data: updated,
      });
    } catch (error: any) {
      strapi.log.error('Error moderating social proof:', error);
      return ctx.internalServerError('Error al moderar prueba social.');
    }
  },
}));
