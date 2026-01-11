import { NextRequest, NextResponse } from 'next/server';
import { paymentStatusStore } from '../payment-store';

const NEQUI_WEBHOOK_SECRET = process.env.NEQUI_WEBHOOK_SECRET;

/**
 * Webhook endpoint para recibir notificaciones de pago de Nequi
 * Nequi envía actualizaciones del estado de los pagos aquí
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar firma del webhook si está configurada
    const signature = request.headers.get('x-nequi-signature');
    if (NEQUI_WEBHOOK_SECRET && signature) {
      // TODO: Implementar verificación de firma HMAC
      // const expectedSignature = crypto.createHmac('sha256', NEQUI_WEBHOOK_SECRET)
      //   .update(await request.text())
      //   .digest('hex');
      // if (signature !== expectedSignature) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      // }
    }

    const webhookData = await request.json();

    console.log('Nequi webhook received:', webhookData);

    // Validar datos del webhook
    if (!webhookData.payment_id || !webhookData.status) {
      return NextResponse.json(
        { error: 'Invalid webhook data: missing payment_id or status' },
        { status: 400 }
      );
    }

    const { payment_id, status, completed_at } = webhookData;

    // Actualizar estado del pago en el almacenamiento local
    const payment = paymentStatusStore.get(payment_id);
    if (payment) {
      payment.status = status;
      if (status === 'completed' && completed_at) {
        payment.completed_at = new Date(completed_at).getTime();
      }
      paymentStatusStore.set(payment_id, payment);

      console.log(`✅ Payment ${payment_id} status updated to ${status} via webhook`);
    } else {
      console.warn(`⚠️ Webhook received for unknown payment: ${payment_id}`);
    }

    // Aquí podrías integrar con el backend de Strapi para actualizar el estado del pedido
    // Por ejemplo, hacer una llamada a la API de orders para marcar el pedido como pagado

    return NextResponse.json({
      success: true,
      payment_id,
      status
    });

  } catch (error) {
    console.error('Nequi webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}