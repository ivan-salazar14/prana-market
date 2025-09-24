export async function GET() {
  try {
    const response = await fetch(`${process.env.STRAPI_API_URL}/api/home?populate=*`);
    if (!response.ok) {
      throw new Error('Failed to fetch from Strapi');
    }
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching home:', error);
    return Response.json({ error: 'Failed to fetch home' }, { status: 500 });
  }
}