import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const strapiUrl = (
      process.env.NEXT_PUBLIC_STRAPI_URL ||
      process.env.NEXT_PUBLIC_STRAPI_API_URL ||
      'http://localhost:1337'
    ).replace(/\/$/, '');

    const strapiRes = await fetch(`${strapiUrl}/api/products/extract-instagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const rawText = await strapiRes.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText || strapiRes.statusText };
    }

    if (!strapiRes.ok) {
      return NextResponse.json(
        { error: data.error?.message || data.message || `Error del servidor (${strapiRes.status}): ${strapiRes.statusText}` },
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postUrl = searchParams.get('postUrl');
    const rawText = searchParams.get('rawText');

    if (!postUrl && !rawText) {
      return NextResponse.json({
        message: 'Extractor API activa. Envía POST con { postUrl } o { rawText }, o GET con ?postUrl=...',
      });
    }

    const strapiUrl = (
      process.env.NEXT_PUBLIC_STRAPI_URL ||
      process.env.NEXT_PUBLIC_STRAPI_API_URL ||
      'http://localhost:1337'
    ).replace(/\/$/, '');

    const strapiRes = await fetch(`${strapiUrl}/api/products/extract-instagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ postUrl, rawText }),
    });

    const rawTextResp = await strapiRes.text();
    let data: any = {};
    try {
      data = JSON.parse(rawTextResp);
    } catch {
      data = { message: rawTextResp || strapiRes.statusText };
    }

    return NextResponse.json(data, { status: strapiRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al conectar con el servidor de catálogo: ' + error.message },
      { status: 500 }
    );
  }
}
