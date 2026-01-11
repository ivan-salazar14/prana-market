import { NextRequest, NextResponse } from 'next/server';
import { paymentStatusStore, cleanupExpiredPayments } from '../../payment-store';

const NEQUI_CLIENT_ID = process.env.NEQUI_CLIENT_ID;
const NEQUI_CLIENT_SECRET = process.env.NEQUI_CLIENT_SECRET;
const NEQUI_API_KEY = process.env.NEQUI_API_KEY;

// Cache para el token de acceso
let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Obtiene un token de acceso de Nequi usando OAuth 2.0
 */
async function getNequiAccessToken(): Promise<string | null> {
  // Verificar si el token actual es válido (con margen de 5 minutos)
  if (accessToken && tokenExpiresAt > Date.now() + 5 * 60 * 1000) {
    return accessToken;
  }

  if (!NEQUI_CLIENT_ID || !NEQUI_CLIENT_SECRET) {
    throw new Error('Nequi credentials not configured');
  }

  try {
    const auth = Buffer.from(`${NEQUI_CLIENT_ID}:${NEQUI_CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://api.nequi.com.co/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: 'grant_type=client_credentials&scope=payment'
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('No access token received from Nequi');
    }

    accessToken = data.access_token;
    // Los tokens de Nequi expiran en 3600 segundos (1 hora)
    tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

    return accessToken;
  } catch (error) {
    console.error('Error getting Nequi access token:', error);
    throw error;
  }
}

/**
 * Simula la transición de estado de un pago mock
 * En modo desarrollo, simula que el pago se completa después de cierto tiempo
 */
function simulatePaymentCompletion(paymentId: string) {
  const payment = paymentStatusStore.get(paymentId);
  if (!payment || payment.status !== 'pending') return;

  const elapsed = Date.now() - payment.created_at;
  const timeSinceCreation = elapsed / 1000; // segundos

  // Simular que el pago se completa después de 15-30 segundos (para testing)
  // En producción real, esto vendría de un webhook de Nequi
  if (timeSinceCreation > 15 && Math.random() > 0.3) {
    payment.status = 'completed';
    payment.completed_at = Date.now();
    console.log(`✅ Mock payment ${paymentId} completed`);
  }
}

/**
 * Obtiene el estado de un pago de Nequi
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const paymentId = resolvedParams.id;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasNequiKeys = NEQUI_CLIENT_ID && NEQUI_CLIENT_SECRET && NEQUI_API_KEY;

    // Modo mock para desarrollo
    if (isDevelopment && !hasNequiKeys) {
      cleanupExpiredPayments();

      let payment = paymentStatusStore.get(paymentId);

      // Si no existe el pago, crearlo como pending
      if (!payment) {
        payment = {
          payment_id: paymentId,
          status: 'pending',
          amount: 0, // Se actualizará cuando se cree el pago
          currency: 'COP',
          created_at: Date.now(),
          expires_at: Date.now() + 10 * 60 * 1000 // 10 minutos
        };
        paymentStatusStore.set(paymentId, payment);
        console.log(`🧪 Created mock payment status for: ${paymentId}`);
      }

      // Simular completación del pago
      simulatePaymentCompletion(paymentId);

      // Verificar si expiró
      if (payment.expires_at < Date.now() && payment.status === 'pending') {
        payment.status = 'expired';
      }

      return NextResponse.json({
        payment_id: payment.payment_id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        created_at: new Date(payment.created_at).toISOString(),
        expires_at: new Date(payment.expires_at).toISOString(),
        completed_at: payment.completed_at ? new Date(payment.completed_at).toISOString() : null,
        timestamp: new Date().toISOString()
      });
    }

    // Verificar si Nequi está configurado para producción
    if (!hasNequiKeys) {
      return NextResponse.json(
        { 
          error: 'Nequi payment gateway is not configured. Please set NEQUI_CLIENT_ID, NEQUI_CLIENT_SECRET, and NEQUI_API_KEY environment variables.' 
        },
        { status: 500 }
      );
    }

    // Implementar consulta real a API de Nequi
    try {
      // 1. Obtener token de acceso
      const accessToken = await getNequiAccessToken();

      // 2. Consultar estado del pago
      const statusResponse = await fetch(`https://api.nequi.com.co/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': NEQUI_API_KEY!
        }
      });

      if (!statusResponse.ok) {
        if (statusResponse.status === 404) {
          return NextResponse.json(
            { error: 'Payment not found' },
            { status: 404 }
          );
        }
        const errorData = await statusResponse.text();
        console.error('Nequi payment status check failed:', statusResponse.status, errorData);
        throw new Error(`Nequi API error: ${statusResponse.status} ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();

      // 3. Actualizar estado local si existe en el store
      const localPayment = paymentStatusStore.get(paymentId);
      if (localPayment) {
        localPayment.status = statusData.status;
        if (statusData.status === 'completed' && statusData.completed_at) {
          localPayment.completed_at = new Date(statusData.completed_at).getTime();
        }
        paymentStatusStore.set(paymentId, localPayment);
      }

      // 4. Retornar estado actualizado
      return NextResponse.json({
        payment_id: statusData.id,
        status: statusData.status, // 'pending', 'completed', 'expired', 'failed'
        amount: statusData.amount,
        currency: statusData.currency,
        created_at: statusData.created_at,
        expires_at: statusData.expires_at,
        completed_at: statusData.completed_at,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Real Nequi payment status check error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to check payment status with Nequi' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Nequi payment status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para actualizar el estado de un pago (usado por webhooks o para testing)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const paymentId = resolvedParams.id;
    const { status, amount } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Solo permitir en desarrollo para testing
    if (process.env.NODE_ENV === 'development') {
      let payment = paymentStatusStore.get(paymentId);
      
      if (!payment) {
        payment = {
          payment_id: paymentId,
          status: status || 'pending',
          amount: amount || 0,
          currency: 'COP',
          created_at: Date.now(),
          expires_at: Date.now() + 10 * 60 * 1000
        };
      } else {
        payment.status = status || payment.status;
        if (status === 'completed') {
          payment.completed_at = Date.now();
        }
      }

      paymentStatusStore.set(paymentId, payment);
      
      return NextResponse.json({
        success: true,
        payment_id: paymentId,
        status: payment.status
      });
    }

    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );

  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update payment status' },
      { status: 500 }
    );
  }
}