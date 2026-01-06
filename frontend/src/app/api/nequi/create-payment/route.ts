import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { paymentStatusStore } from '../payment-store';

const NEQUI_CLIENT_ID = process.env.NEQUI_CLIENT_ID;
const NEQUI_CLIENT_SECRET = process.env.NEQUI_CLIENT_SECRET;
const NEQUI_API_KEY = process.env.NEQUI_API_KEY;

/**
 * Crea un pago con Nequi y genera un código QR
 * En modo desarrollo sin credenciales, genera un QR mock funcional
 */
export async function POST(request: NextRequest) {
  try {
    const { amount_in_cents, currency, description, reference } = await request.json();

    // Validar campos requeridos
    if (!amount_in_cents || !currency || !description || !reference) {
      return NextResponse.json(
        { error: 'Missing required fields: amount_in_cents, currency, description, reference' },
        { status: 400 }
      );
    }

    // Validar que el monto sea positivo
    if (amount_in_cents <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validar moneda
    if (currency !== 'COP') {
      return NextResponse.json(
        { error: 'Only COP currency is supported' },
        { status: 400 }
      );
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasNequiKeys = NEQUI_CLIENT_ID && NEQUI_CLIENT_SECRET && NEQUI_API_KEY;

    // Modo mock para desarrollo
    if (isDevelopment && !hasNequiKeys) {
      console.log('🧪 Using mock Nequi response for development');

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockPaymentId = `nequi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generar QR code real con datos del pago
      // En producción, Nequi proporcionaría este QR, pero en mock lo generamos
      const qrData = `nequi://pay?amount=${amount_in_cents}&ref=${mockPaymentId}&desc=${encodeURIComponent(description)}`;
      
      let qrCodeDataUrl: string;
      try {
        // Generar QR code como data URL
        qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        // Si falla la generación del QR, usar el string directamente
        qrCodeDataUrl = qrData;
      }

      // Guardar estado del pago en el almacenamiento temporal
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos
      paymentStatusStore.set(mockPaymentId, {
        payment_id: mockPaymentId,
        status: 'pending',
        amount: amount_in_cents,
        currency,
        created_at: Date.now(),
        expires_at: expiresAt
      });

      return NextResponse.json({
        payment_id: mockPaymentId,
        qr_code: qrCodeDataUrl,
        qr_data: qrData, // Datos del QR para el componente
        amount: amount_in_cents,
        currency,
        description,
        reference,
        expires_at: new Date(expiresAt).toISOString(),
        status: 'pending'
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

    // TODO: Implementar integración real con API de Nequi
    // Esto involucraría:
    // 1. Obtener token de acceso usando OAuth 2.0 client credentials
    //    const tokenResponse = await fetch('https://api.nequi.com.co/oauth/token', {
    //      method: 'POST',
    //      headers: {
    //        'Content-Type': 'application/x-www-form-urlencoded',
    //        'Authorization': `Basic ${Buffer.from(`${NEQUI_CLIENT_ID}:${NEQUI_CLIENT_SECRET}`).toString('base64')}`
    //      },
    //      body: 'grant_type=client_credentials&scope=payments'
    //    });
    //    const { access_token } = await tokenResponse.json();
    //
    // 2. Crear solicitud de pago
    //    const paymentResponse = await fetch('https://api.nequi.com.co/v1/payments', {
    //      method: 'POST',
    //      headers: {
    //        'Authorization': `Bearer ${access_token}`,
    //        'Content-Type': 'application/json',
    //        'x-api-key': NEQUI_API_KEY
    //      },
    //      body: JSON.stringify({
    //        amount: amount_in_cents,
    //        currency,
    //        description,
    //        reference,
    //        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/nequi/webhook`
    //      })
    //    });
    //    const paymentData = await paymentResponse.json();
    //
    // 3. El QR code vendría en la respuesta de Nequi
    //    return NextResponse.json({
    //      payment_id: paymentData.id,
    //      qr_code: paymentData.qr_code,
    //      amount: amount_in_cents,
    //      currency,
    //      expires_at: paymentData.expires_at,
    //      status: paymentData.status
    //    });

    // Placeholder para implementación real
    return NextResponse.json(
      { error: 'Real Nequi integration not yet implemented. Use development mode for testing.' },
      { status: 501 }
    );

  } catch (error) {
    console.error('Nequi payment creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    );
  }
}