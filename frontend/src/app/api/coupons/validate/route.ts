import { NextRequest, NextResponse } from 'next/server';

interface CouponRule {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  description: string;
  isExpired?: boolean;
}

const COUPON_DATABASE: Record<string, CouponRule> = {
  BIENVENIDA10: {
    code: 'BIENVENIDA10',
    type: 'percentage',
    value: 10,
    description: '10% de descuento en tu compra',
  },
  FIJO5000: {
    code: 'FIJO5000',
    type: 'fixed',
    value: 5000,
    description: '$5.000 COP de descuento en tu compra',
  },
  ENVIOGRATIS: {
    code: 'ENVIOGRATIS',
    type: 'free_shipping',
    value: 0,
    description: 'Envío gratis en tu pedido',
  },
  EXPIRADO: {
    code: 'EXPIRADO',
    type: 'percentage',
    value: 15,
    description: 'Cupón expirado',
    isExpired: true,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawCode = body?.code;

    if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
      return NextResponse.json(
        { valid: false, error: 'Por favor ingresa un código de cupón' },
        { status: 400 }
      );
    }

    const code = rawCode.trim().toUpperCase();
    const coupon = COUPON_DATABASE[code];

    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: 'Código inválido' },
        { status: 400 }
      );
    }

    if (coupon.isExpired) {
      return NextResponse.json(
        { valid: false, error: 'Código expirado' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
      },
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { valid: false, error: 'Error al validar el cupón' },
      { status: 500 }
    );
  }
}
