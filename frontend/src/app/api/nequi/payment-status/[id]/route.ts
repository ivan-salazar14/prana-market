import { NextRequest, NextResponse } from 'next/server';

const NEQUI_CLIENT_ID = process.env.NEQUI_CLIENT_ID;
const NEQUI_CLIENT_SECRET = process.env.NEQUI_CLIENT_SECRET;
const NEQUI_API_KEY = process.env.NEQUI_API_KEY;

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

    // Check if we're in development mode - always use mock responses
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      // Mock response for development/testing
      console.log('🧪 Checking mock Nequi payment status for:', paymentId);

      // Simulate payment completion after some time
      const isCompleted = Math.random() > 0.7; // 30% chance of completion

      return NextResponse.json({
        payment_id: paymentId,
        status: isCompleted ? 'completed' : 'pending',
        amount: 10000, // Mock amount in cents
        currency: 'COP',
        timestamp: new Date().toISOString(),
      });
    }

    // Production mode - check if Nequi is configured
    const hasNequiKeys = NEQUI_CLIENT_ID && NEQUI_CLIENT_SECRET && NEQUI_API_KEY;
    if (!hasNequiKeys) {
      return NextResponse.json(
        { error: 'Nequi payment gateway is not configured. Please set NEQUI_CLIENT_ID, NEQUI_CLIENT_SECRET, and NEQUI_API_KEY environment variables.' },
        { status: 500 }
      );
    }

    // TODO: Implement real Nequi API integration
    // This would involve:
    // 1. Check payment status via Nequi API
    // 2. Return current status

    // Placeholder for real implementation
    return NextResponse.json(
      { error: 'Real Nequi integration not yet implemented. Use development mode for testing.' },
      { status: 501 }
    );

  } catch (error) {
    console.error('Nequi payment status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check payment status' },
      { status: 500 }
    );
  }
}