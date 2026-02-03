# 🚀 SEO Quick Start Guide - Prana Make up

## ⚡ Immediate Actions (Do This First!)

### 1. Update Environment Variables

```bash
# In your production environment (Railway, Vercel, etc.)
NEXT_PUBLIC_SITE_URL=https://prana-market-production.up.railway.app
NEXT_PUBLIC_BACKEND_URL=https://prana-market-production.up.railway.app
```

### 2. Deploy to Production

```bash
git add .
git commit -m "feat: SEO optimization for production"
git push
```

### 3. Verify These URLs Work

- ✅ <https://your-domain.com/sitemap.xml>
- ✅ <https://your-domain.com/robots.txt>
- ✅ <https://your-domain.com/og-image.jpg>

### 4. Google Search Console (15 minutes)

1. Go to: <https://search.google.com/search-console>
2. Click "Add Property"
3. Enter your domain
4. Choose "HTML tag" verification
5. Get verification code
6. Add to environment: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-code`
7. Redeploy
8. Click "Verify" in Search Console
9. Go to "Sitemaps" → Submit: `sitemap.xml`
10. Done! ✅

## 📊 What You Get

### Immediate Benefits

- ✅ Professional social media previews
- ✅ Rich search results with product info
- ✅ Proper indexing by Google
- ✅ Better page load performance

### Within 1-2 Weeks

- 📈 Site appears in Google search
- 📈 Brand searches show your site
- 📈 Products indexed individually

### Within 1-3 Months

- 🚀 Ranking for "maquillaje Colombia"
- 🚀 Organic traffic growing
- 🚀 Sales from search engines

## 🎯 Key Files Created

| File | Purpose | URL |
|------|---------|-----|
| `sitemap.ts` | Auto-generates sitemap | `/sitemap.xml` |
| `robots.txt` | Guides search crawlers | `/robots.txt` |
| `og-image.jpg` | Social media preview | `/og-image.jpg` |
| `logo.png` | Brand logo | `/logo.png` |
| `structured-data.ts` | Rich search results | N/A (utility) |

## 🔍 Quick Tests

### Test Sitemap

```bash
curl https://your-domain.com/sitemap.xml
# Should show XML with all your products
```

### Test Robots

```bash
curl https://your-domain.com/robots.txt
# Should show crawler instructions
```

### Test Metadata

1. Visit your homepage
2. Right-click → "View Page Source"
3. Search for: `og:title`
4. Should see: "Prana Make up"

### Test Social Preview

1. Go to: <https://developers.facebook.com/tools/debug/>
2. Enter your URL
3. Should show your OG image and metadata

## 📈 Monitoring (Weekly)

### Google Search Console

- Check "Performance" → See clicks and impressions
- Check "Coverage" → Ensure no errors
- Check "Sitemaps" → Verify it's processed

### Quick Metrics

- **Impressions**: How many times you appear in search
- **Clicks**: Actual visitors from search
- **CTR**: Click-through rate (aim for 3-5%)
- **Position**: Average ranking (aim for top 10)

## 🎨 Customization

### Update Social Media Handles

Edit `src/app/layout.tsx`:

```tsx
twitter: {
  creator: "@your-twitter-handle",
}
```

### Update Site Description

Edit `src/app/layout.tsx`:

```tsx
description: "Your custom description here",
```

### Add Google Analytics

1. Create GA4 property
2. Get Measurement ID
3. Add to `layout.tsx` (see SEO_GUIDE.md)

## 🚨 Troubleshooting

### Sitemap Not Found

- Check build completed: `npm run build`
- Verify file exists: `ls src/app/sitemap.ts`
- Check deployment logs

### Social Preview Not Showing

- Verify image exists: `/og-image.jpg`
- Check image is accessible (not 404)
- Use Facebook Debugger to refresh cache

### Not Appearing in Google

- Wait 1-2 weeks for indexing
- Submit URL in Search Console
- Check robots.txt isn't blocking

## 📚 Full Documentation

For complete details, see:

- **SEO_IMPLEMENTATION_SUMMARY.md** - What was done
- **SEO_GUIDE.md** - How to optimize further
- **SEO_DEPLOYMENT_CHECKLIST.md** - Step-by-step deployment

## ✅ Success Checklist

- [ ] Environment variables updated
- [ ] Deployed to production
- [ ] Sitemap accessible
- [ ] Robots.txt accessible
- [ ] Google Search Console verified
- [ ] Sitemap submitted
- [ ] Social previews tested
- [ ] First week monitoring scheduled

## 🎉 You're Done

Your site is now optimized for search engines. Results will improve over time with:

- Regular content updates
- Quality product descriptions
- Customer reviews
- Social media presence
- Backlinks from other sites

**Questions?** Check the full documentation or search for specific topics in SEO_GUIDE.md.

---

**Last Updated**: February 2, 2026
**Status**: Production Ready ✅
