export async function GET() {
  const BASE_URL = (process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337').replace(/\/$/, '');
  try {
    const response = await fetch(`${BASE_URL}/api/home?populate[0]=Cover&populate[1]=Slider.image&populate[2]=Slider.product`);
    if (!response.ok) {
      // If home content doesn't exist, return default data
      if (response.status === 404) {
        return Response.json({
          data: {
            id: 1,
            Title: "Welcome to Prana Market",
            Description: "Discover fresh organic products from local farmers",
            Cover: null,
            Slider: []
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
        Cover: null,
        Slider: []
      }
    });
  }
}