import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

    const strapiRes = await fetch(`${strapiUrl}/api/products/extract-instagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await strapiRes.json();
    if (!strapiRes.ok) {
      return NextResponse.json(
        { error: data.error?.message || data.message || 'Error al extraer la publicación' },
        { status: strapiRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al conectar con el servidor de catálogo: ' + error.message },
      { status: 500 }
    );
  }
}
