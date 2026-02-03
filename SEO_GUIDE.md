# SEO Optimization Guide for Prana Make up

## Overview

This document outlines all SEO optimizations implemented for production deployment and search engine positioning.

## ✅ Implemented Optimizations

### 1. **Root Layout Metadata** (`src/app/layout.tsx`)

- ✅ Comprehensive metadata with proper branding
- ✅ Open Graph tags for social media sharing
- ✅ Twitter Card metadata
- ✅ Robots directives for search engines
- ✅ Google Search Console verification support
- ✅ Keywords optimization for makeup/cosmetics industry

### 2. **Sitemap Generation** (`src/app/sitemap.ts`)

- ✅ Dynamic sitemap that automatically includes:
  - Homepage
  - All product pages
  - All category pages
- ✅ Proper priority and change frequency settings
- ✅ Automatic updates when products/categories change
- ✅ Accessible at: `https://your-domain.com/sitemap.xml`

### 3. **Robots.txt** (`public/robots.txt`)

- ✅ Allows all search engines to crawl
- ✅ Blocks sensitive routes (admin, API, auth)
- ✅ Points to sitemap location
- ✅ Accessible at: `https://your-domain.com/robots.txt`

### 4. **Structured Data (JSON-LD)**

Created utilities and components for rich search results:

- ✅ Organization schema (`utils/structured-data.ts`)
- ✅ Website schema with search functionality
- ✅ Product schema for individual products
- ✅ BreadcrumbList schema
- ✅ ItemList schema for product listings
- ✅ Reusable StructuredData component

### 5. **Homepage SEO**

- ✅ Organization JSON-LD for brand recognition
- ✅ Website JSON-LD with search action
- ✅ Semantic HTML structure
- ✅ Proper heading hierarchy (H1, H2, H3)

## 📋 Next Steps for Full SEO Implementation

### A. Product Pages Enhancement

Add this to each product page (`src/app/product/[id]/page.tsx`):

```tsx
// Add to imports
import StructuredData from '@/components/StructuredData';
import { generateProductJsonLd, generateBreadcrumbJsonLd } from '@/utils/structured-data';

// Add inside the component return, after product is loaded:
{product && (
  <StructuredData 
    data={[
      generateProductJsonLd(product, `${window.location.origin}/product/${id}`),
      generateBreadcrumbJsonLd([
        { name: 'Inicio', url: window.location.origin },
        { name: product.product_category?.Name || 'Productos', url: `${window.location.origin}/?category=${product.product_category?.documentId}` },
        { name: product.name, url: window.location.href }
      ])
    ]} 
  />
)}
```

### B. Environment Variables Setup

Add to `.env` or `.env.production`:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://prana-market-production.up.railway.app
NEXT_PUBLIC_BACKEND_URL=https://prana-market-production.up.railway.app

# SEO Verification Codes (Get these from search engines)
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-google-verification-code
# NEXT_PUBLIC_BING_SITE_VERIFICATION=your-bing-verification-code
```

### C. Image Optimization

1. **Create OG Image** (`public/og-image.jpg`):
   - Size: 1200x630px
   - Include brand logo and tagline
   - Use high-quality makeup/cosmetics imagery

2. **Add Logo** (`public/logo.png`):
   - Square format (recommended: 512x512px)
   - Transparent background
   - High resolution

3. **Add Favicon** (already exists at `src/app/favicon.ico`)
   - Ensure it's optimized and branded

### D. Performance Optimization

#### 1. Next.js Config (`next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  // ... existing config
  
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // ... existing remotePatterns
  },
  
  // Enable SWC minification
  swcMinify: true,
};
```

#### 2. Add Loading States

- ✅ Already implemented in product page
- Consider adding to homepage for better UX

### E. Content Optimization

#### 1. Product Descriptions

- Ensure each product has unique, descriptive content
- Include relevant keywords naturally
- Minimum 50-100 words per product
- Highlight benefits and features

#### 2. Category Descriptions

Add descriptions to categories in Strapi for better SEO

#### 3. Alt Text for Images

- ✅ Already using product names and alternative text
- Ensure all images in Strapi have descriptive alt text

### F. Technical SEO Checklist

#### Canonical URLs

Add to `layout.tsx`:

```tsx
<link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL} />
```

#### Language Declaration

- ✅ Already set: `<html lang="en">` in layout.tsx
- Consider changing to `lang="es"` for Spanish content

#### Mobile Optimization

- ✅ Responsive design already implemented
- Test with Google Mobile-Friendly Test

#### Page Speed

Run these commands to optimize:

```bash
# Build for production
npm run build

# Analyze bundle size
npx @next/bundle-analyzer
```

### G. Search Console Setup

#### 1. Google Search Console

1. Go to <https://search.google.com/search-console>
2. Add your property
3. Verify ownership using the verification code in metadata
4. Submit sitemap: `https://your-domain.com/sitemap.xml`

#### 2. Bing Webmaster Tools

1. Go to <https://www.bing.com/webmasters>
2. Add your site
3. Verify ownership
4. Submit sitemap

### H. Analytics Integration

Add Google Analytics or similar:

```tsx
// In layout.tsx, add to <head>
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
  `}
</Script>
```

## 🎯 SEO Best Practices Being Followed

1. **Semantic HTML**: Using proper heading hierarchy
2. **Mobile-First**: Responsive design throughout
3. **Fast Loading**: Next.js optimization, image optimization
4. **Unique Content**: Each product has unique metadata
5. **Internal Linking**: Product cards link to detail pages
6. **Breadcrumbs**: Navigation structure for users and search engines
7. **Schema Markup**: Rich snippets for better search results
8. **Social Sharing**: Open Graph and Twitter Cards

## 📊 Monitoring & Maintenance

### Regular Tasks

1. **Weekly**: Check Search Console for errors
2. **Monthly**: Review top-performing pages
3. **Quarterly**: Update keywords based on trends
4. **As Needed**: Add new products with SEO-optimized content

### Key Metrics to Track

- Organic traffic
- Click-through rate (CTR)
- Average position in search results
- Core Web Vitals (LCP, FID, CLS)
- Mobile usability
- Index coverage

## 🔍 Testing Your SEO

### Tools to Use

1. **Google Search Console**: Overall health
2. **Google PageSpeed Insights**: Performance
3. **Google Rich Results Test**: Structured data
4. **Screaming Frog**: Technical SEO audit
5. **Ahrefs/SEMrush**: Keyword tracking (paid)

### Quick Tests

```bash
# Test sitemap
curl https://your-domain.com/sitemap.xml

# Test robots.txt
curl https://your-domain.com/robots.txt

# Test structured data
curl https://your-domain.com | grep "application/ld+json"
```

## 🚀 Deployment Checklist

Before going to production:

- [ ] Update NEXT_PUBLIC_SITE_URL in environment variables
- [ ] Create and add og-image.jpg to public folder
- [ ] Add logo.png to public folder
- [ ] Get Google Search Console verification code
- [ ] Update social media handles in metadata
- [ ] Test all pages load correctly
- [ ] Verify sitemap.xml is accessible
- [ ] Verify robots.txt is accessible
- [ ] Submit sitemap to Google Search Console
- [ ] Set up Google Analytics
- [ ] Test Open Graph tags with Facebook Debugger
- [ ] Test Twitter Cards with Twitter Card Validator

## 📱 Social Media Optimization

### Facebook Debugger

Test your Open Graph tags:
<https://developers.facebook.com/tools/debug/>

### Twitter Card Validator

Test your Twitter Cards:
<https://cards-dev.twitter.com/validator>

### LinkedIn Post Inspector
<https://www.linkedin.com/post-inspector/>

## 🎨 Content Strategy for SEO

### Keyword Research

Focus on:

- "maquillaje Colombia"
- "productos de belleza"
- "cosméticos online"
- "tienda de maquillaje"
- Brand-specific searches
- Product category searches

### Content Ideas

1. Blog section for makeup tutorials
2. Product comparison guides
3. Seasonal collections
4. Beauty tips and tricks
5. Customer testimonials

## 🔒 Security & Trust Signals

- [ ] HTTPS enabled (SSL certificate)
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Contact information visible
- [ ] Secure payment badges
- [ ] Customer reviews/ratings

## 📈 Expected Results

With proper implementation:

- **Week 1-2**: Indexed by Google
- **Month 1**: Appearing in brand searches
- **Month 2-3**: Ranking for long-tail keywords
- **Month 3-6**: Improving for competitive terms
- **Month 6+**: Established presence in search results

Remember: SEO is a long-term strategy. Consistent optimization and quality content are key to success!
