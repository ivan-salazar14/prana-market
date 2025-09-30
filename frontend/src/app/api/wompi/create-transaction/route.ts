import { NextRequest, NextResponse } from 'next/server';

const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY;
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    const { amount_in_cents, currency, customer_email, reference, redirect_url } = await request.json();

    // Validate required fields
    if (!amount_in_cents || !currency || !customer_email || !reference) {
      return NextResponse.json(
        { error: 'Missing required fields: amount_in_cents, currency, customer_email, reference' },
        { status: 400 }
      );
    }

    // Check if we're in development mode and Wompi keys are not configured
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasWompiKeys = WOMPI_PUBLIC_KEY && WOMPI_PRIVATE_KEY;

    if (isDevelopment && !hasWompiKeys) {
      // Mock response for development/testing
      console.log('🧪 Using mock Wompi response for development');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockTransactionId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return NextResponse.json({
        transaction_id: mockTransactionId,
        checkout_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?transaction_id=${mockTransactionId}&mock=true`,
      });
    }

    // Check if Wompi is configured for production
    if (!hasWompiKeys) {
      return NextResponse.json(
        { error: 'Wompi payment gateway is not configured. Please set WOMPI_PUBLIC_KEY and WOMPI_PRIVATE_KEY environment variables.' },
        { status: 500 }
      );
    }

    // Create transaction with Wompi API
    const response = await fetch('https://api.wompi.co/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount_in_cents,
        currency,
        customer_email,
        reference,
        redirect_url: redirect_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Wompi API error:', errorData);
      throw new Error(`Wompi API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    return NextResponse.json({
      transaction_id: data.data.id,
      checkout_url: data.data.checkout_url,
    });
  } catch (error) {
    console.error('Wompi transaction creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create transaction' },
      { status: 500 }
    );
  }
}