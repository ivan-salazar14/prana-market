import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// Create a new order
export async function POST(request: NextRequest) {
  try {
    const { items, deliveryMethod, subtotal, deliveryCost, total, transactionId, paymentMethod, userId } = await request.json();

    const orderData = {
      data: {
        user: userId,
        items,
        status: 'paid',
        total,
        subtotal,
        deliveryCost,
        deliveryMethod,
        transactionId,
        paymentMethod
      }
    };

    const response = await fetch(`${STRAPI_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
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
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    if (!userIdParam) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    const response = await fetch(`${STRAPI_URL}/api/orders?filters[user][id][$eq]=${userId}`, {
      // headers: {
      //   'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      // },
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