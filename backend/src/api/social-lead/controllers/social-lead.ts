import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::social-lead.social-lead', ({ strapi }) => ({
  /**
   * Log social lead manually or via custom tracking link
   */
  async logLead(ctx) {
    const { instagram_username, email_or_phone, source_channel, message_content, meta_sender_id, discount_code_issued } = ctx.request.body || {};

    try {
      const newLead = await strapi.documents('api::social-lead.social-lead').create({
        data: {
          instagram_username: instagram_username || 'anonymous_ig',
          email_or_phone: email_or_phone || null,
          source_channel: source_channel || 'instagram_dm',
          discount_code_issued: discount_code_issued || 'BIENVENIDA10',
          converted_to_customer: false,
          message_content: message_content || null,
          meta_sender_id: meta_sender_id || null,
        },
      });

      return ctx.send({
        success: true,
        message: 'Lead registrado exitosamente',
        data: newLead,
      });
    } catch (error: any) {
      strapi.log.error('Error logging social lead:', error);
      return ctx.internalServerError('Error al registrar el lead de red social.');
    }
  },

  /**
   * Get social lead acquisition metrics
   */
  async getLeadAnalytics(ctx) {
    try {
      const leads = await strapi.documents('api::social-lead.social-lead').findMany({
        limit: 500,
      });

      const totalLeads = leads.length;
      const convertedCount = leads.filter((l: any) => l.converted_to_customer).length;
      const instagramDmCount = leads.filter((l: any) => l.source_channel === 'instagram_dm').length;
      const instagramCommentCount = leads.filter((l: any) => l.source_channel === 'instagram_comment').length;
      const socialLandingCount = leads.filter((l: any) => l.source_channel === 'social_landing').length;

      return ctx.send({
        success: true,
        metrics: {
          totalLeads,
          convertedCount,
          conversionRate: totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) + '%' : '0%',
          breakdown: {
            instagram_dm: instagramDmCount,
            instagram_comment: instagramCommentCount,
            social_landing: socialLandingCount,
          },
        },
        recentLeads: leads.slice(0, 20),
      });
    } catch (error: any) {
      strapi.log.error('Error fetching social lead analytics:', error);
      return ctx.internalServerError('Error al obtener métricas de leads.');
    }
  },

  /**
   * Story 7.2: Verify Meta Graph API Webhook Challenge (GET /api/social-leads/webhook)
   */
  async verifyWebhook(ctx) {
    const mode = ctx.query['hub.mode'];
    const token = ctx.query['hub.verify_token'];
    const challenge = ctx.query['hub.challenge'];
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'prana_meta_verify_token_2026';

    if (mode === 'subscribe' && token === verifyToken) {
      ctx.status = 200;
      return ctx.send(challenge);
    }
    return ctx.forbidden('Meta Webhook verification failed.');
  },

  /**
   * Story 7.2: Handle Meta Graph API Webhook Events (POST /api/social-leads/webhook)
   */
  async handleWebhookEvent(ctx) {
    const body = ctx.request.body;

    if (!body || (body.object !== 'page' && body.object !== 'instagram')) {
      return ctx.badRequest('Evento de webhook no válido.');
    }

    try {
      const processedEvents: any[] = [];
      const entries = body.entry || [];

      for (const entry of entries) {
        // Handle Instagram DMs
        if (entry.messaging && Array.isArray(entry.messaging)) {
          for (const messagingItem of entry.messaging) {
            const senderId = messagingItem.sender?.id;
            const messageText = messagingItem.message?.text || '';

            if (senderId) {
              const createdLead = await strapi.documents('api::social-lead.social-lead').create({
                data: {
                  instagram_username: `ig_user_${senderId.slice(-6)}`,
                  source_channel: 'instagram_dm',
                  discount_code_issued: 'BIENVENIDA10',
                  converted_to_customer: false,
                  message_content: messageText,
                  meta_sender_id: senderId,
                },
              });

              processedEvents.push({
                type: 'instagram_dm',
                senderId,
                leadId: createdLead.documentId || createdLead.id,
                replyMessage: `¡Hola! Bienvenido a Prana Market ✨ Usa el cupón BIENVENIDA10 para un 10% OFF en tu primera compra: https://pranamarket.com/products?utm_source=instagram&promo=BIENVENIDA10`,
              });
            }
          }
        }

        // Handle Instagram Comments
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === 'comments' || change.field === 'mentions') {
              const value = change.value || {};
              const senderId = value.from?.id || value.id;
              const username = value.from?.username || `ig_user_${String(senderId).slice(-6)}`;
              const text = value.text || '';

              const createdLead = await strapi.documents('api::social-lead.social-lead').create({
                data: {
                  instagram_username: username,
                  source_channel: 'instagram_comment',
                  discount_code_issued: 'BIENVENIDA10',
                  converted_to_customer: false,
                  message_content: text,
                  meta_sender_id: String(senderId),
                },
              });

              processedEvents.push({
                type: 'instagram_comment',
                username,
                leadId: createdLead.documentId || createdLead.id,
                replyMessage: `¡Gracias por tu comentario @${username}! Te enviamos un 10% de descuento en Prana Market (Cupón: BIENVENIDA10): https://pranamarket.com?utm_source=instagram&promo=BIENVENIDA10`,
              });
            }
          }
        }
      }

      return ctx.send({
        success: true,
        processedCount: processedEvents.length,
        events: processedEvents,
      });
    } catch (error: any) {
      strapi.log.error('Error handling Instagram Meta webhook event:', error);
      return ctx.internalServerError('Error al procesar webhook de Instagram Meta.');
    }
  },
}));

