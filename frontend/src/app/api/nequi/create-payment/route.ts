import { NextRequest, NextResponse } from 'next/server';

const NEQUI_CLIENT_ID = process.env.NEQUI_CLIENT_ID;
const NEQUI_CLIENT_SECRET = process.env.NEQUI_CLIENT_SECRET;
const NEQUI_API_KEY = process.env.NEQUI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { amount_in_cents, currency, description, reference } = await request.json();

    // Validate required fields
    if (!amount_in_cents || !currency || !description || !reference) {
      return NextResponse.json(
        { error: 'Missing required fields: amount_in_cents, currency, description, reference' },
        { status: 400 }
      );
    }

    // Check if we're in development mode and Nequi keys are not configured
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasNequiKeys = NEQUI_CLIENT_ID && NEQUI_CLIENT_SECRET && NEQUI_API_KEY;

    if (isDevelopment && !hasNequiKeys) {
      // Mock response for development/testing
      console.log('🧪 Using mock Nequi response for development');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockPaymentId = `nequi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return NextResponse.json({
        payment_id: mockPaymentId,
        qr_code: 'mock-qr-code-url', // In real implementation, this would be a data URL or image URL
        amount: amount_in_cents,
        currency,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      });
    }

    // Check if Nequi is configured for production
    if (!hasNequiKeys) {
      return NextResponse.json(
        { error: 'Nequi payment gateway is not configured. Please set NEQUI_CLIENT_ID, NEQUI_CLIENT_SECRET, and NEQUI_API_KEY environment variables.' },
        { status: 500 }
      );
    }

    // TODO: Implement real Nequi API integration
    // This would involve:
    // 1. Get access token using client credentials
    // 2. Create payment request
    // 3. Generate QR code
    // 4. Return payment details

    // Placeholder for real implementation
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