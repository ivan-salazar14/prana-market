export async function GET() {
    const BASE_URL = (process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337').replace(/\/$/, '');
    try {
        // Populate Image and product_categories
        const response = await fetch(`${BASE_URL}/api/categories?populate[Image][fields]=url,alternativeText&populate[product_categories][fields]=id,Name,slug&populate[product_categories][populate][Image][fields]=url,alternativeText`);
        if (!response.ok) {
            // Log details if available
            const errorText = await response.text();
            console.error('Strapi response not OK:', response.status, errorText);
            throw new Error(`Failed to fetch from Strapi: ${response.status}`);
        }
        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
