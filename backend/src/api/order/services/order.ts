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
 * Crea un transporter de nodemailer con la configuración SMTP
 */
function createEmailTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE !== 'false', // Default to true if using 465
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
}

/**
 * Envía emails de confirmación de pedido al cliente y a la empresa
 */
export async function sendOrderEmail(strapi: any, order: any) {
  try {
    const transporter = createEmailTransporter();

    if (!transporter) {
      console.warn('Email no configurado: faltan variables SMTP_HOST, SMTP_USER o SMTP_PASS');
      return;
    }

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
        await transporter.sendMail({
          from: defaultFrom,
          to: companyEmail,
          subject: `Nuevo Pedido #${order.id || order.data?.id || 'N/A'} - Prana Market`,
          html: generateOrderEmailTemplate(order, true),
        });
        console.log(`Email de pedido enviado a la empresa: ${companyEmail}`);
      } catch (error) {
        console.error('Error enviando email a la empresa:', error);
      }
    }

    // Enviar email al cliente
    if (customerEmail) {
      try {
        await transporter.sendMail({
          from: defaultFrom,
          to: customerEmail,
          subject: `Confirmación de Pedido #${order.id || order.data?.id || 'N/A'} - Prana Market`,
          html: generateOrderEmailTemplate(order, false),
        });
        console.log(`Email de pedido enviado al cliente: ${customerEmail}`);
      } catch (error) {
        console.error('Error enviando email al cliente:', error);
      }
    } else {
      console.warn('No se pudo determinar el email del cliente, no se enviará email de confirmación');
    }
  } catch (error) {
    console.error('Error general al enviar emails de pedido:', error);
    // No lanzar el error para que la creación de la orden no falle
  }
}

export default factories.createCoreService('api::order.order');