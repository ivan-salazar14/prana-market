import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

interface OrderData {
  items: unknown[];
  status: string;
  total: number;
  subtotal: number;
  deliveryCost: number;
  deliveryMethod: string;
  transactionId: string;
  paymentMethod: string;
  user?: string;
}

// Create a new order
export async function POST(request: NextRequest) {
  try {
    const { items, deliveryMethod, subtotal, deliveryCost, total, transactionId, paymentMethod, userId } = await request.json();

    // Validate required fields
    if (!items || !subtotal || !total || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: items, subtotal, total, paymentMethod' },
        { status: 400 }
      );
    }

    const orderData: OrderData = {
      items,
      status: 'paid',
      total,
      subtotal,
      deliveryCost,
      deliveryMethod,
      transactionId,
      paymentMethod
    };

    // Only include user if userId is provided and valid
    if (userId && userId !== 'undefined' && userId !== undefined) {
      orderData.user = userId;
    }

    // Convert orderData to FormData for better compatibility
    const formData = new FormData();
    Object.entries(orderData).forEach(([key, value]) => {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    const response = await fetch(`${STRAPI_URL}/api/orders/public`, {
      method: 'POST',
      // No Content-Type header for FormData
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strapi API error:', response.status, response.statusText, errorText);
      throw new Error(`Failed to create order: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// Get user's orders
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(`${STRAPI_URL}/api/orders`, {
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