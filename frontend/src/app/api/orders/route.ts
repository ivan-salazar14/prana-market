import { NextRequest, NextResponse } from 'next/server';
import { OrderCreationError, processOrderRequest } from '../../../utils/order';

const BASE_STRAPI_URL = (process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337').replace(/\/$/, '');
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// Create a new order
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const result = await processOrderRequest(payload, {
      findByTransactionId: async (transactionId) => {
        const checkUrl = `${BASE_STRAPI_URL}/api/orders?filters[transactionId][$eq]=${encodeURIComponent(transactionId)}`;

        try {
          const existingRes = await fetch(checkUrl, {
            headers: {
              'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            },
          });

          if (!existingRes.ok) return null;

          const existingJson = await existingRes.json().catch(() => null);
          return existingJson?.data?.[0] ?? null;
        } catch (err) {
          // A failed reconciliation lookup must never block a legitimate order.
          console.warn('[Orders:Idempotency] Could not verify existing order by transactionId:', err);
          return null;
        }
      },
      create: async (order) => {
        const formData = new FormData();
        Object.entries(order).forEach(([key, value]) => {
          formData.append(
            key,
            value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value)
          );
        });

        const response = await fetch(`${BASE_STRAPI_URL}/api/orders`, {
          method: 'POST',
          // No Content-Type header for FormData
          headers: {
            'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message = errorData.error?.message || response.statusText;
          console.error('Strapi API error:', response.status, message);
          throw new OrderCreationError(message, response.status);
        }

        return response.json();
      },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (result.idempotent) {
      console.log('[Orders:Idempotency] Returning existing order for an already processed transaction');
      return NextResponse.json(
        { data: result.order, idempotent: true, message: 'Order already processed' },
        { status: result.status }
      );
    }

    return NextResponse.json(result.order, { status: result.status });
  } catch (error) {
    if (error instanceof OrderCreationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}

// Get user's orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');

    const authHeader = request.headers.get('authorization');

    // Extract userId from JWT token if available, otherwise use query param
    let userId: string | null = queryUserId;
    if (authHeader && !userId) {
      try {
        // Decode JWT to get userId (simple base64 decode, no verification needed for this)
        const token = authHeader.replace('Bearer ', '');
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Use Buffer which is available in Node.js
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
        const payload = JSON.parse(jsonPayload);
        userId = payload.id || payload.sub || null;
      } catch (e) {
        console.warn('Could not extract userId from token:', e);
      }
    }

    // Use API token to fetch orders from Strapi
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    };

    // Build query with user filter if userId is available
    // Use public endpoint to allow API token access
    let url = `${BASE_STRAPI_URL}/api/orders`;
    if (userId) {
      // Use string concatenation to properly pass filters to Strapi
      url += `?filters[user][id][$eq]=${userId}`;
    }

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch orders:', response.status, response.statusText, errorText);
      throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}