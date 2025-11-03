/**
 * Handles GET requests to fetch a specific product by ID.
 * @param request - The incoming request object.
 * @param context - The context object containing route parameters.
 * @returns A Response object with the product data or an error message.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/products/${id}?populate[images][fields]=url,alternativeText&populate[product_category][fields]=Name,slug,Description`);
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