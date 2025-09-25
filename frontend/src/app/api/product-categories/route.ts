export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/product-categories?populate[Image][fields]=url,alternativeText`);
    if (!response.ok) {
      throw new Error('Failed to fetch from Strapi');
    }
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}