---
name: prana-market
description: Visual identity tokens and design system for Prana Market (Rose & Champagne Luxury).
status: final
sources:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/addendum.md
updated: 2026-09-24
colors:
  primary: '#D45B7A'
  primary-hover: '#B84361'
  primary-active: '#9B334F'
  secondary: '#C89D66'
  secondary-hover: '#B0854E'
  secondary-active: '#956D3B'
  accent: '#E8839B'
  accent-tint: '#FCE7ED'
  surface-base: '#FDF9F7'
  surface-card: '#FFFFFF'
  surface-elevated: '#FFFFFF'
  surface-muted: '#F7EEF1'
  text-main: '#2D1B22'
  text-muted: '#7A666D'
  text-subtle: '#A69299'
  text-inverse: '#FFFFFF'
  border-subtle: '#F2E3E7'
  border-strong: '#D9BAC3'
  status-success: '#10B981'
  status-success-bg: '#ECFDF5'
  status-warning: '#F59E0B'
  status-warning-bg: '#FFFBEB'
  status-error: '#EF4444'
  status-error-bg: '#FEF2F2'
  status-info: '#3B82F6'
  status-info-bg: '#EFF6FF'
  nequi-brand: '#20002C'
  nequi-accent: '#FF2A82'
  wompi-brand: '#2D3282'
  badge-local-bg: '#FCE7ED'
  badge-local-text: '#B33959'
  badge-dropship-bg: '#EAF2EC'
  badge-dropship-text: '#2C6E49'
typography:
  font-heading:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: '-0.015em'
  font-body:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontWeight: '400'
    lineHeight: '1.5'
  h1:
    fontSize: '2.25rem'
    fontWeight: '700'
    lineHeight: '1.15'
  h2:
    fontSize: '1.75rem'
    fontWeight: '700'
    lineHeight: '1.25'
  h3:
    fontSize: '1.25rem'
    fontWeight: '600'
    lineHeight: '1.35'
  body-lg:
    fontSize: '1.125rem'
    lineHeight: '1.6'
  body-md:
    fontSize: '1rem'
    lineHeight: '1.5'
  body-sm:
    fontSize: '0.875rem'
    lineHeight: '1.45'
  caption:
    fontSize: '0.75rem'
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: '0.01em'
rounded:
  sm: '4px'
  md: '8px'
  lg: '12px'
  xl: '16px'
  full: '9999px'
spacing:
  '1': '0.25rem'
  '2': '0.5rem'
  '3': '0.75rem'
  '4': '1rem'
  '6': '1.5rem'
  '8': '2rem'
  '10': '2.5rem'
  '12': '3rem'
  '16': '4rem'
  gutter: '1.25rem'
  margin-mobile: '1rem'
  margin-desktop: '2rem'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    hoverBackgroundColor: '{colors.primary-hover}'
    color: '{colors.text-inverse}'
    borderRadius: '{rounded.lg}'
    fontWeight: '700'
    minHeight: '48px'
    padding: '{spacing.3} {spacing.6}'
  button-nequi:
    backgroundColor: '{colors.nequi-brand}'
    color: '{colors.nequi-accent}'
    borderRadius: '{rounded.lg}'
    fontWeight: '700'
    minHeight: '48px'
    padding: '{spacing.3} {spacing.6}'
  badge-local:
    backgroundColor: '{colors.badge-local-bg}'
    color: '{colors.badge-local-text}'
    borderRadius: '{rounded.full}'
    padding: '{spacing.1} {spacing.3}'
    fontSize: '{typography.caption.fontSize}'
    fontWeight: '700'
  badge-dropship:
    backgroundColor: '{colors.badge-dropship-bg}'
    color: '{colors.badge-dropship-text}'
    borderRadius: '{rounded.full}'
    padding: '{spacing.1} {spacing.3}'
    fontSize: '{typography.caption.fontSize}'
    fontWeight: '700'
  product-card:
    backgroundColor: '{colors.surface-card}'
    borderRadius: '{rounded.xl}'
    borderColor: '{colors.border-subtle}'
    padding: '{spacing.3}'
  cart-drawer:
    backgroundColor: '{colors.surface-card}'
    borderColor: '{colors.border-subtle}'
    maxWidth: '440px'
  pdp-sticky-bar:
    backgroundColor: '{colors.surface-card}'
    borderColor: '{colors.border-subtle}'
    padding: '{spacing.3} {spacing.4}'
    minHeight: '68px'
---

# Prana Market — Design Spine (DESIGN.md)

## Brand & Style

**Prana Market** embodies "Rose & Champagne Luxury" — an approachable, warm luxury aesthetic tailored for modern Colombian beauty enthusiasts. The visual register strikes a balance between editorial elegance (inspired by top global cosmetic houses) and friendly, energetic warmth.

- **Tone**: Sophisticated, clean, luminous, empowering.
- **Materiality**: Silk-soft off-whites, delicate glassmorphism on sticky floating elements, crisp typography with editorial serif headers for high-impact merchandising paired with hyper-legible geometric sans-serif for prices, product metadata, and checkouts.
- **Colombian Affinity**: Prominent integration of localized trust badges (Nequi, Wompi, PSE, Servientrega, Coordinadora) using genuine brand accents harmonious with the main palette.

---

## Colors

### Primary Palette
- `{colors.primary}` (`#D45B7A` — Dusty Rose): Main brand identifier. Drives primary conversion buttons (Add to Cart, Proceed to Checkout), category highlights, and active tab states.
- `{colors.secondary}` (`#C89D66` — Warm Champagne Gold): Accent tone for premium deals, VIP badges, star ratings, and free shipping progress thresholds.
- `{colors.accent}` (`#E8839B` — Rose Glow): Subtle interactive glows, hover states, and dynamic banner backgrounds.

### Neutrals & Surfaces
- `{colors.surface-base}` (`#FDF9F7` — Silk Canvas): Ambient page background providing warmth without pure stark white fatigue.
- `{colors.surface-card}` (`#FFFFFF` — Pure Card Surface): Isolated product containers, slide-over sheets, and modals.
- `{colors.text-main}` (`#2D1B22` — Espresso Plum): High-contrast primary text providing WCAG AAA legibility against `{colors.surface-base}` and `{colors.surface-card}`.
- `{colors.text-muted}` (`#7A666D` — Mauve Bark): Secondary product attributes, volume indicators (e.g., "30ml"), and ingredient list summaries.

### Badging & Local Trust Tokens
- `{colors.badge-local-bg}` / `{colors.badge-local-text}` (`#FCE7ED` / `#B33959`): "📦 Envío Exprés Local" identifier.
- `{colors.badge-dropship-bg}` / `{colors.badge-dropship-text}` (`#EAF2EC` / `#2C6E49`): "🌿 Dropshipping Nacional (Mastershop)" identifier.
- `{colors.nequi-brand}` / `{colors.nequi-accent}` (`#20002C` / `#FF2A82`): High-converting Nequi express checkout CTA.

---

## Typography

- **Headings**: `'Playfair Display'`, serif. Reserved for brand headlines, editorial hero titles, collection banners, and section title cards (`H1`, `H2`).
- **Body & Interface**: `'Plus Jakarta Sans'`, sans-serif. Used for product titles, prices, variant swatches, form fields, badges, and checkout steps to ensure micro-legibility on mobile displays.
- **Price Hierarchy**: Prices are always bold and prominent, formatted in Colombian standard (`$48.900 COP`).

---

## Layout & Spacing

- **Grid System**: 4-column layout on mobile (`< 768px`), 8-column layout on tablet (`768px` - `1024px`), 12-column layout on desktop (`> 1024px`).
- **Mobile Margins**: `{spacing.margin-mobile}` (`16px`) horizontal padding to maximize viewable screen real estate.
- **Touch Target Floor**: All interactive buttons, swatch pills, and quantity toggles maintain a minimum interactive hit area of `48px x 48px`.

---

## Elevation & Depth

- **Level 0 (Flat)**: Standard cards with `{colors.border-subtle}` 1px border.
- **Level 1 (Card Hover & Swatches)**: `0 4px 12px -2px rgba(45, 27, 34, 0.08)`.
- **Level 2 (Slide-over Cart & Sticky Bars)**: `0 10px 30px -5px rgba(45, 27, 34, 0.16)`.
- **Level 3 (Modals & Nequi Push Dialogs)**: `0 20px 40px -10px rgba(45, 27, 34, 0.25)`.

---

## Shapes

- **Cards & Containers**: `{rounded.xl}` (`16px`) for friendly, modern cosmetic curves.
- **Buttons & Inputs**: `{rounded.lg}` (`12px`) for solid tactile touch feel.
- **Pills, Badges & Shade Swatches**: `{rounded.full}` (`9999px`) circular precision.

---

## Components

### 1. Product Card (`product-card`)
- Aspect ratio: 1:1 image frame with soft neutral background (`{colors.surface-muted}`).
- Origin tag at top-left (`{components.badge-local}` or `{components.badge-dropship}`).
- Heart / Wishlist toggle top-right.
- Shade swatch mini-strip (max 4 visible + "+3 más").
- Bold COP price with clear strikethrough if discounted.
- Quick "Añadir +" micro-button.

### 2. Sticky Mobile PDP Bar (`pdp-sticky-bar`)
- Fixed to viewport bottom with subtle top shadow and backdrop-filter blur (`rgba(255, 255, 255, 0.95)`).
- Dual CTA: "Añadir al Carrito" (`{components.button-primary}`) and "⚡ Nequi Express" (`{components.button-nequi}`).

### 3. Dynamic Free Shipping Threshold Bar
- Visual bar with smooth CSS width transition.
- Text: "¡Faltan **$25.000 COP** para tu Envío Gratis!" changing to "🎉 ¡Felicidades! Tienes **Envío Gratis**".
- Color gradient from `{colors.secondary}` to `{colors.primary}`.

---

## Do's and Don'ts

### Do:
- Always pair dropshipped and local items with their explicit delivery badge.
- Always display prices in Colombian Pesos with full thousands separators (`$85.000 COP`).
- Keep the Nequi signature purple/magenta colors uncorrupted in the checkout buttons to preserve instant recognition and trust.
- Provide optimistic visual state when adding to cart (mini confetti burst or smooth counter bump).

### Don't:
- Never hide shipping origins or surprise users with unexpected split shipments at the final payment step.
- Never use unstyled raw form controls or native browser alerts.
- Never use generic red or green that clash with the brand's sophisticated rose and champagne tones.
