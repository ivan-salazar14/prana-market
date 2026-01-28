import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { paymentStatusStore } from '../payment-store';

const NEQUI_CLIENT_ID = process.env.NEQUI_CLIENT_ID;
const NEQUI_CLIENT_SECRET = process.env.NEQUI_CLIENT_SECRET;
const NEQUI_API_KEY = process.env.NEQUI_API_KEY;
const hasNequiKeys = !!(NEQUI_CLIENT_ID && NEQUI_CLIENT_SECRET && NEQUI_API_KEY);

// Cache para el token de acceso
let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Obtiene un token de acceso de Nequi usando OAuth 2.0
 */
async function getNequiAccessToken(): Promise<string | null> {
  // Verificar si el token actual es válido (con margen de 5 minutos)
  if (accessToken && tokenExpiresAt > Date.now() + 5 * 60 * 1000) {
    console.log('🔄 Using cached Nequi access token');
    return accessToken;
  }

  if (!NEQUI_CLIENT_ID || !NEQUI_CLIENT_SECRET) {
    throw new Error('Nequi credentials not configured. Please set NEQUI_CLIENT_ID and NEQUI_CLIENT_SECRET environment variables.');
  }

  try {
    console.log('🔑 Requesting new Nequi access token');
    const auth = Buffer.from(`${NEQUI_CLIENT_ID}:${NEQUI_CLIENT_SECRET}`).toString('base64');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://api.nequi.com.co/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: 'grant_type=client_credentials&scope=payment',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Nequi token request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Nequi authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.access_token) {
      console.error('❌ No access token in Nequi response:', data);
      throw new Error('Invalid response from Nequi authentication service');
    }

    accessToken = data.access_token;
    // Los tokens de Nequi expiran en 3600 segundos (1 hora) por defecto
    tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

    console.log('✅ Nequi access token obtained successfully');
    return accessToken;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏰ Nequi token request timed out');
      throw new Error('Nequi authentication service timeout');
    }
    console.error('❌ Error getting Nequi access token:', error);
    throw error;
  }
}

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

    // Sandbox/Mock mode if credentials are missing
    if (!hasNequiKeys) {
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
          //    quality: 0.92,
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
        status: 'pending',
        is_sandbox: true
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

    // Implementar integración real con API de Nequi
    try {
      console.log(`💰 Creating Nequi payment for ${amount_in_cents} COP: ${description}`);

      // 1. Obtener token de acceso
      const token = await getNequiAccessToken();
      if (!token) {
        throw new Error('Failed to obtain Nequi access token');
      }

      // 2. Crear solicitud de pago
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const paymentResponse = await fetch('https://api.nequi.com.co/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-api-key': NEQUI_API_KEY!
        },
        body: JSON.stringify({
          amount: amount_in_cents,
          currency,
          description,
          reference,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/nequi/webhook`
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.text();
        console.error(`❌ Nequi payment creation failed: ${paymentResponse.status} ${paymentResponse.statusText}`, errorData);

        // Manejar errores específicos de Nequi
        if (paymentResponse.status === 401) {
          // Token expirado, limpiar cache y reintentar una vez
          accessToken = null;
          tokenExpiresAt = 0;
          throw new Error('Nequi authentication expired. Please try again.');
        } else if (paymentResponse.status === 400) {
          throw new Error('Invalid payment data. Please check amount and currency.');
        } else if (paymentResponse.status >= 500) {
          throw new Error('Nequi service temporarily unavailable. Please try again later.');
        }

        throw new Error(`Nequi payment creation failed: ${paymentResponse.status} ${paymentResponse.statusText}`);
      }

      const paymentData = await paymentResponse.json();
      console.log(`✅ Nequi payment created successfully: ${paymentData.id}`);

      // 3. Procesar respuesta y generar QR si es necesario
      // Nequi debería proporcionar el QR code en la respuesta
      let qrCodeDataUrl = paymentData.qr_code;

      // Si Nequi no proporciona QR, generar uno basado en los datos del pago
      if (!qrCodeDataUrl) {
        const qrData = `nequi://pay?amount=${amount_in_cents}&ref=${paymentData.id}&desc=${encodeURIComponent(description)}`;
        try {
          qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
        } catch (qrError) {
          console.error('Error generating QR code:', qrError);
          qrCodeDataUrl = qrData; // fallback to text
        }
      }

      // Guardar estado del pago en el almacenamiento temporal
      const expiresAt = paymentData.expires_at ? new Date(paymentData.expires_at).getTime() : Date.now() + 10 * 60 * 1000;
      paymentStatusStore.set(paymentData.id, {
        payment_id: paymentData.id,
        status: paymentData.status || 'pending',
        amount: amount_in_cents,
        currency,
        created_at: Date.now(),
        expires_at: expiresAt
      });

      return NextResponse.json({
        payment_id: paymentData.id,
        qr_code: qrCodeDataUrl,
        qr_data: paymentData.qr_code || `nequi://pay?amount=${amount_in_cents}&ref=${paymentData.id}&desc=${encodeURIComponent(description)}`,
        amount: amount_in_cents,
        currency,
        description,
        reference,
        expires_at: new Date(expiresAt).toISOString(),
        status: paymentData.status || 'pending'
      });

    } catch (error) {
      console.error('Real Nequi payment creation error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create payment with Nequi' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Nequi payment creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    );
  }
}