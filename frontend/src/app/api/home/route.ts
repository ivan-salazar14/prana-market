export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/home?populate=Cover`);
    if (!response.ok) {
      // If home content doesn't exist, return default data
      if (response.status === 404) {
        return Response.json({
          data: {
            id: 1,
            Title: "Welcome to Prana Market",
            Description: "Discover fresh organic products from local farmers",
            Cover: null
          }
        });
      }
      throw new Error('Failed to fetch from Strapi');
    }
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching home:', error);
    // Return default data on any error
    return Response.json({
      data: {
        id: 1,
        Title: "Welcome to Prana Market",
        Description: "Discover fresh organic products from local farmers",
        Cover: null
      }
    });
  }
}