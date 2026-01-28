import { NextRequest, NextResponse } from 'next/server';

const BASE_STRAPI_URL = (process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337').replace(/\/$/, '');
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

interface OrderData {
  items: unknown[];
  status: string;
  total: number;
  subtotal: number;
  deliveryCost: number;
  deliveryMethod: string;
  shippingAddress?: unknown;
  transactionId?: string;
  paymentMethod: string;
  user?: string | number;
}

// Create a new order
export async function POST(request: NextRequest) {
  try {
    const { items, deliveryMethod, shippingAddress, subtotal, deliveryCost, total, transactionId, paymentMethod, userId } = await request.json();

    // Validate required fields
    if (!items || !subtotal || !total || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: items, subtotal, total, paymentMethod' },
        { status: 400 }
      );
    }

    // Validate shippingAddress if delivery method is not pickup
    const parsedDeliveryMethod = typeof deliveryMethod === 'string' ? JSON.parse(deliveryMethod) : deliveryMethod;
    if (parsedDeliveryMethod && parsedDeliveryMethod.id !== 'pickup' && !shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required for delivery methods' },
        { status: 400 }
      );
    }

    const orderData: OrderData = {
      items,
      status: (paymentMethod === 'efectivo' || paymentMethod === 'nequi_manual') ? 'pending' : 'paid',
      total,
      subtotal,
      deliveryCost,
      deliveryMethod,
      paymentMethod
    };

    // Include transactionId if it's a valid, non-empty string
    if (transactionId && typeof transactionId === 'string' && transactionId.trim() !== '') {
      orderData.transactionId = transactionId;
    }

    // Include shippingAddress if provided
    if (shippingAddress) {
      orderData.shippingAddress = shippingAddress;
    }

    // Only include user if userId is provided and valid
    const parsedUserId = parseInt(userId, 10);
    if (!isNaN(parsedUserId)) {
      orderData.user = parsedUserId;
    }

    // Convert orderData to FormData for better compatibility
    const formData = new FormData();
    Object.entries(orderData).forEach(([key, value]) => {
      if (key === 'user' && typeof value === 'number') {
        formData.append(key, String(value));
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    console.log('formData:', formData);

    const response = await fetch(`${BASE_STRAPI_URL}/api/orders/public`, {
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

    // Extract userId from JWT token if available
    let userId: string | null = null;
    if (authHeader) {
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
    let url = `${BASE_STRAPI_URL}/api/orders/public`;
    if (userId) {
      // Use URLSearchParams to properly encode the filter
      const params = new URLSearchParams();
      params.append('filters[user][id][$eq]', String(userId));
      url += `?${params.toString()}`;
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