import { NextRequest, NextResponse } from 'next/server';

const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount_in_cents,
      currency = 'COP',
      customer_email,
      customer_name,
      customer_phone,
      reference,
      redirect_url,
      payment_method_type = 'CARD',
      bank_code,
      user_type = '0', // 0: Natural, 1: Jurídica
      user_legal_id,
      user_legal_id_type = 'CC'
    } = body;

    // Validate required fields
    if (!amount_in_cents || !customer_email || !reference) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: amount_in_cents, customer_email, reference' },
        { status: 400 }
      );
    }

    const isDevelopment = process.env.NODE_ENV !== 'production';
    const hasWompiKeys = Boolean(WOMPI_PUBLIC_KEY && WOMPI_PRIVATE_KEY);

    // If Efecty or Baloto cash network voucher requested
    if (payment_method_type === 'EFECTY' || payment_method_type === 'BALOTO') {
      const generatedPin = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const expirationDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const convenio = payment_method_type === 'EFECTY' ? '110757' : '950212';

      return NextResponse.json({
        success: true,
        payment_method_type,
        transaction_id: `cash_${Date.now()}_${reference}`,
        voucher: {
          reference_pin: generatedPin,
          convenio_number: convenio,
          entity_name: payment_method_type === 'EFECTY' ? 'Efecty Colombia' : 'Baloto / SuRed',
          expires_at: expirationDate,
          amount_cop: Math.round(amount_in_cents / 100),
          customer_name: customer_name || 'Cliente Prana Market',
          customer_email,
          instructions: 'Acércate a cualquier punto físico autorizado del país e indica el número de convenio y referencia de pago.'
        }
      });
    }

    // In development without production Wompi keys, return mock transaction URL
    if (!hasWompiKeys) {
      const mockTransactionId = `mock_wompi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      return NextResponse.json({
        success: true,
        transaction_id: mockTransactionId,
        payment_method_type,
        checkout_url: `${appUrl}/payment/success?transaction_id=${mockTransactionId}&reference=${reference}&method=${payment_method_type}&mock=true`,
      });
    }

    // Live Wompi API transaction creation
    const wompiPayload: any = {
      amount_in_cents,
      currency,
      customer_email,
      reference,
      redirect_url: redirect_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    };

    if (payment_method_type === 'PSE' && bank_code) {
      wompiPayload.payment_method = {
        type: 'PSE',
        user_type: Number(user_type),
        user_legal_id_type,
        user_legal_id,
        financial_institution_code: bank_code,
        payment_description: `Compra Prana Market #${reference}`
      };
    }

    const response = await fetch('https://api.wompi.co/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wompiPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Wompi API error:', errorData);
      throw new Error(`Wompi API error: ${errorData.error?.message || 'Error al comunicarse con Wompi'}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      transaction_id: data.data.id,
      payment_method_type,
      checkout_url: data.data.checkout_url || data.data.payment_method?.extra?.async_payment_url,
    });
  } catch (error: any) {
    console.error('Wompi transaction creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la transacción' },
      { status: 500 }
    );
  }
}