/**
 * order service.
 */

import { factories } from '@strapi/strapi';
import nodemailer from 'nodemailer';

/**
 * Genera el template HTML para el email de pedido
 */
function generateOrderEmailTemplate(order: any, isForCompany: boolean = false): string {
  const orderId = order.id || order.data?.id || 'N/A';
  const items = order.items || order.data?.attributes?.items || [];
  const deliveryMethod = order.deliveryMethod || order.data?.attributes?.deliveryMethod || {};
  const shippingAddress = order.shippingAddress || order.data?.attributes?.shippingAddress;
  const subtotal = order.subtotal || order.data?.attributes?.subtotal || 0;
  const deliveryCost = order.deliveryCost || order.data?.attributes?.deliveryCost || 0;
  const total = order.total || order.data?.attributes?.total || 0;
  const paymentMethod = order.paymentMethod || order.data?.attributes?.paymentMethod || 'N/A';
  const status = order.status || order.data?.attributes?.status || 'pending';

  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name || 'Producto'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">COP ${((item.price || 0) * (item.quantity || 1)).toLocaleString('es-CO')}</td>
    </tr>
  `).join('');

  const shippingInfoHtml = shippingAddress ? `
    <h3 style="color: #333; margin-top: 20px;">Datos de Envío:</h3>
    <p><strong>Nombre:</strong> ${shippingAddress.fullName || 'N/A'}</p>
    <p><strong>Dirección:</strong> ${shippingAddress.address || 'N/A'}</p>
    <p><strong>Ciudad:</strong> ${shippingAddress.city || 'N/A'}</p>
    <p><strong>Teléfono:</strong> ${shippingAddress.phone || 'N/A'}</p>
    ${shippingAddress.email ? `<p><strong>Email:</strong> ${shippingAddress.email}</p>` : ''}
  ` : '<p><strong>Recoger en tienda</strong></p>';

  const title = isForCompany ? 'Nuevo Pedido Recibido' : 'Confirmación de Pedido';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .order-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background-color: #4CAF50; color: white; padding: 10px; text-align: left; }
        .total { font-size: 18px; font-weight: bold; color: #4CAF50; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <div class="order-info">
            <h2>Información del Pedido</h2>
            <p><strong>Número de Orden:</strong> #${orderId}</p>
            <p><strong>Estado:</strong> ${status}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
          </div>

          <div class="order-info">
            <h3>Productos:</h3>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align: center;">Cantidad</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="order-info">
            <h3>Resumen:</h3>
            <p>Subtotal: COP ${subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
            <p>Envío: COP ${deliveryCost.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
            <p class="total">Total: COP ${total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
          </div>

          <div class="order-info">
            <h3>Método de Entrega:</h3>
            <p>${deliveryMethod.name || 'N/A'}</p>
            ${shippingInfoHtml}
          </div>

          <div class="order-info">
            <h3>Método de Pago:</h3>
            <p>${paymentMethod}</p>
          </div>
        </div>
        <div class="footer">
          <p>Gracias por tu pedido</p>
          <p>Prana Market</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envía un email usando Resend (vía API HTTP) o SMTP (vía Nodemailer)
 */
async function dispatchEmail(options: { to: string, from: string, subject: string, html: string }) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    console.log(`Enviando email vía Resend API a: ${options.to}`);
    try {
      // Si el dominio no está verificado en Resend, el 'from' debe ser 'onboarding@resend.dev'
      const fromAddress = options.from.includes('@resend.dev') || options.from.includes('pranamarket.com')
        ? options.from
        : 'onboarding@resend.dev';

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(`Resend API Error: ${JSON.stringify(result)}`);
      }
      return result;
    } catch (error) {
      console.error('Error enviando vía Resend, intentando fallback SMTP...', error.message);
    }
  }

  const transporter = createEmailTransporter();
  if (!transporter) {
    throw new Error('Configuración de email no disponible (falta SMTP o Resend)');
  }
  return await transporter.sendMail(options);
}

function createEmailTransporter() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass },
    connectionTimeout: 10000,
  });
}

/**
 * Envía emails de confirmación de pedido al cliente y a la empresa
 */
export async function sendOrderEmail(strapi: any, order: any) {
  try {
    const companyEmail = process.env.COMPANY_EMAIL || process.env.SMTP_USER;
    const defaultFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pranamarket.com';

    if (!companyEmail) {
      console.warn('COMPANY_EMAIL no configurado, no se enviará email a la empresa');
    }

    // Obtener email del cliente desde shippingAddress o usar un email por defecto
    const shippingAddress = order.shippingAddress || order.data?.attributes?.shippingAddress;
    const customerEmail = shippingAddress?.email || process.env.DEFAULT_CUSTOMER_EMAIL;

    // Enviar email a la empresa
    if (companyEmail) {
      try {
        await dispatchEmail({
          from: defaultFrom,
          to: companyEmail,
          subject: `Nuevo Pedido #${order.id || order.data?.id || 'N/A'} - Prana Market`,
          html: generateOrderEmailTemplate(order, true),
        });
        console.log(`Email de pedido enviado a la empresa: ${companyEmail}`);
      } catch (error) {
        console.error('Error enviando email a la empresa:', error.message);
      }
    }

    // Enviar email al cliente
    if (customerEmail) {
      try {
        await dispatchEmail({
          from: defaultFrom,
          to: customerEmail,
          subject: `Confirmación de Pedido #${order.id || order.data?.id || 'N/A'} - Prana Market`,
          html: generateOrderEmailTemplate(order, false),
        });
        console.log(`Email de pedido enviado al cliente: ${customerEmail}`);
      } catch (error) {
        console.error('Error enviando email al cliente:', error.message);
      }
    } else {
      console.warn('No se pudo determinar el email del cliente, no se enviará email de confirmación');
    }
  } catch (error: any) {
    console.error('Error enviando emails de confirmación:', error);
  }
}

export async function sendOperationalAlert(
  strapi: any,
  alertData: {
    orderId: string | number;
    alertType: 'MAX_RETRIES_EXCEEDED' | 'DELIVERY_EXCEPTION' | 'SYNC_FAILURE';
    issueSummary: string;
    details?: any;
  }
) {
  try {
    const opsEmail = process.env.OPERATIONS_ALERT_EMAIL || process.env.COMPANY_EMAIL || process.env.SMTP_USER;
    const defaultFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'alerts@pranamarket.com';

    if (!opsEmail) {
      strapi.log.warn('OPERATIONS_ALERT_EMAIL o COMPANY_EMAIL no configurado para alertas operativas.');
      return;
    }

    const alertTitleMap: Record<string, string> = {
      MAX_RETRIES_EXCEEDED: '⚠️ Alerta Crítica: Reintentos Máximos de Despacho Agotados',
      DELIVERY_EXCEPTION: '🚚 Alerta Logística: Novedad / Devolución en Transportadora',
      SYNC_FAILURE: '🔴 Error de Sincronización Dropshipping (Mastershop)',
    };

    const title = alertTitleMap[alertData.alertType] || '⚠️ Alerta de Operaciones - Prana Market';
    const monitorUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/dropship-monitor`;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #2D1B22; }
          .alert-card { max-width: 600px; margin: 20px auto; border: 2px solid #E53E3E; border-radius: 16px; overflow: hidden; }
          .alert-header { bg-color: #E53E3E; background: #9B1C1C; color: white; padding: 20px; text-align: center; }
          .alert-body { padding: 24px; background: #FFF5F5; }
          .field { margin-bottom: 12px; }
          .label { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #7A666D; }
          .value { font-size: 16px; font-weight: bold; color: #2D1B22; }
          .cause-box { background: #FED7D7; border: 1px solid #FEB2B2; padding: 12px; border-radius: 10px; color: #9B1C1C; font-weight: 600; margin-top: 16px; }
          .btn-action { display: inline-block; background: #9B1C1C; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="alert-card">
          <div class="alert-header">
            <h2>${title}</h2>
          </div>
          <div class="alert-body">
            <div class="field">
              <div class="label">Número de Pedido</div>
              <div class="value">#PM-${alertData.orderId}</div>
            </div>
            <div class="field">
              <div class="label">Tipo de Incidencia</div>
              <div class="value">${alertData.alertType}</div>
            </div>
            <div class="field">
              <div class="label">Fecha / Hora</div>
              <div class="value">${new Date().toLocaleString('es-CO')}</div>
            </div>

            <div class="cause-box">
              <strong>Detalle de la Novedad:</strong><br/>
              ${alertData.issueSummary}
            </div>

            <div style="text-align: center;">
              <a href="${monitorUrl}" class="btn-action">Ir al Centro de Control de Excepciones</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await dispatchEmail({
      from: defaultFrom,
      to: opsEmail,
      subject: `[ALERTA OPERATIVA] Pedido #${alertData.orderId}: ${alertData.issueSummary.substring(0, 60)}`,
      html: htmlTemplate,
    });

    strapi.log.info(`[Story 5.6] Alerta operativa enviada a ${opsEmail} para Pedido #${alertData.orderId}`);
  } catch (err: any) {
    strapi.log.error('Error al enviar alerta operativa:', err);
  }
}

export default factories.createCoreService('api::order.order');