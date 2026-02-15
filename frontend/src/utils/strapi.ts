export function getStrapiMedia(url: string | null) {
    if (url === null) {
        return null;
    }

    // Return the full URL if the media is hosted on an external provider
    if (url.startsWith('http') || url.startsWith('//')) {
        return url;
    }

    // Use the backend URL for uploads (supports both local and production)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';
    return `${backendUrl}${url}`;
}
