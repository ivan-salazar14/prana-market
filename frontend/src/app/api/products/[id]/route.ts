export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/products/${params.id}?populate[images][fields]=url,alternativeText&populate[product_category][fields]=Name,slug,Description`);
    if (!response.ok) {
      throw new Error('Failed to fetch from Strapi');
    }
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching product:', error);
    return Response.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}