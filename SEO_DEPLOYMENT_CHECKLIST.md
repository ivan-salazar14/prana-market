# SEO Deployment Checklist for Prana Make up

## ✅ Pre-Deployment (Completed)

- [x] Root layout metadata with comprehensive SEO tags
- [x] Open Graph and Twitter Card metadata
- [x] Dynamic sitemap generation (`/sitemap.xml`)
- [x] Robots.txt file (`/robots.txt`)
- [x] Structured data utilities (JSON-LD)
- [x] StructuredData component
- [x] Homepage structured data (Organization & Website)
- [x] Performance optimizations in next.config.ts
- [x] OG social media image created
- [x] Logo created
- [x] HTML lang set to Spanish
- [x] Environment variable template

## 📋 Deployment Steps

### 1. Environment Variables

Update your production environment with:

```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

### 2. Build & Test Locally

```bash
cd frontend
npm run build
npm start
```

Test these URLs locally:

- <http://localhost:3000/sitemap.xml>
- <http://localhost:3000/robots.txt>
- View page source and look for JSON-LD scripts

### 3. Deploy to Production

```bash
# Your deployment command (e.g., Railway, Vercel, etc.)
git add .
git commit -m "feat: comprehensive SEO optimization"
git push
```

### 4. Post-Deployment Verification

#### A. Test Core URLs

- [ ] <https://your-domain.com/sitemap.xml> (should show XML)
- [ ] <https://your-domain.com/robots.txt> (should show text)
- [ ] <https://your-domain.com/og-image.jpg> (should show image)
- [ ] <https://your-domain.com/logo.png> (should show logo)

#### B. Test Metadata

- [ ] View source on homepage - check for:
  - `<title>` tag with "Prana Make up"
  - `<meta name="description">` tag
  - `<meta property="og:*">` tags
  - `<meta name="twitter:*">` tags
  - `<script type="application/ld+json">` tags

#### C. Test Social Media Cards

- [ ] Facebook Debugger: <https://developers.facebook.com/tools/debug/>
  - Enter your URL
  - Should show OG image and metadata
- [ ] Twitter Card Validator: <https://cards-dev.twitter.com/validator>
  - Enter your URL
  - Should show Twitter card preview
- [ ] LinkedIn Post Inspector: <https://www.linkedin.com/post-inspector/>

#### D. Test Structured Data

- [ ] Google Rich Results Test: <https://search.google.com/test/rich-results>
  - Enter your homepage URL
  - Should detect Organization and WebSite schemas
- [ ] Schema Markup Validator: <https://validator.schema.org/>
  - Enter your URL
  - Should validate JSON-LD

### 5. Search Console Setup

#### Google Search Console

1. [ ] Go to <https://search.google.com/search-console>
2. [ ] Click "Add Property"
3. [ ] Enter your domain
4. [ ] Choose verification method:
   - **Option 1**: HTML tag (already in metadata, just add verification code to env)
   - **Option 2**: HTML file upload
   - **Option 3**: DNS record
5. [ ] After verification, submit sitemap:
   - Click "Sitemaps" in left menu
   - Enter: `sitemap.xml`
   - Click "Submit"
6. [ ] Request indexing for key pages:
   - Homepage
   - Top product pages
   - Category pages

#### Bing Webmaster Tools (Optional)

1. [ ] Go to <https://www.bing.com/webmasters>
2. [ ] Add your site
3. [ ] Verify ownership
4. [ ] Submit sitemap

### 6. Performance Testing

#### Google PageSpeed Insights

- [ ] Test: <https://pagespeed.web.dev/>
- [ ] Target scores:
  - Performance: 90+
  - Accessibility: 90+
  - Best Practices: 90+
  - SEO: 100

#### Core Web Vitals

- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

### 7. Analytics Setup (Optional)

#### Google Analytics 4

1. [ ] Create GA4 property
2. [ ] Get Measurement ID
3. [ ] Add to environment variables
4. [ ] Add tracking code to layout.tsx (see SEO_GUIDE.md)

### 8. Content Optimization

#### Product Pages

- [ ] Ensure all products have:
  - Unique, descriptive titles (50-60 characters)
  - Detailed descriptions (150-300 words)
  - High-quality images with alt text
  - Proper category assignment
  - Accurate pricing and stock info

#### Category Pages

- [ ] Add descriptions to categories in Strapi
- [ ] Ensure category images have alt text
- [ ] Create category-specific content

### 9. Ongoing Monitoring

#### Weekly Tasks

- [ ] Check Search Console for errors
- [ ] Review indexing status
- [ ] Check for crawl errors
- [ ] Monitor click-through rates

#### Monthly Tasks

- [ ] Review top-performing pages
- [ ] Analyze search queries
- [ ] Update content based on performance
- [ ] Check for broken links
- [ ] Review Core Web Vitals

#### Quarterly Tasks

- [ ] Keyword research and optimization
- [ ] Competitor analysis
- [ ] Content strategy review
- [ ] Technical SEO audit

## 🎯 Success Metrics

### Week 1-2

- [ ] Site indexed by Google
- [ ] Sitemap processed without errors
- [ ] No critical SEO issues in Search Console

### Month 1

- [ ] Appearing in brand searches ("Prana Make up")
- [ ] 10+ pages indexed
- [ ] Organic impressions > 100/week

### Month 2-3

- [ ] Ranking for long-tail keywords
- [ ] Organic clicks > 50/week
- [ ] Average position < 20 for target keywords

### Month 3-6

- [ ] Ranking for competitive terms
- [ ] Organic traffic growth 20%+ month-over-month
- [ ] Conversion rate optimization

## 🚨 Common Issues & Solutions

### Sitemap Not Found

- Check file exists at `/sitemap.xml`
- Verify build completed successfully
- Check server configuration (nginx, etc.)

### Robots.txt Not Working

- Ensure file is in `public/` folder
- Check file permissions
- Verify deployment includes public files

### Structured Data Errors

- Use Rich Results Test to identify issues
- Validate JSON-LD syntax
- Ensure all required fields are present

### Images Not Loading in Social Cards

- Check image URLs are absolute, not relative
- Verify images are accessible publicly
- Check image file sizes (< 5MB for OG images)

### Low PageSpeed Score

- Enable compression (already done)
- Optimize images (use WebP/AVIF)
- Minimize JavaScript
- Use CDN for static assets
- Enable caching headers

## 📚 Resources

- [Google Search Central](https://developers.google.com/search)
- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards)

## 🎉 Completion

Once all items are checked:

- [ ] Document completion date: ___________
- [ ] Initial Google ranking check: ___________
- [ ] Set calendar reminders for monitoring tasks
- [ ] Share results with team

---

**Note**: SEO is an ongoing process. This checklist gets you started, but continuous optimization is key to long-term success!
