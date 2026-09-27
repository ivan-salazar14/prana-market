<!-- bmad:context -->
<!-- Verified 2026-09-24 against c1a0aeccd9c48c37c3f53d7ba9f2d34b0a8b0ce5. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## prana-market

E-commerce platform designed for the Colombian market with product catalog, delivery options, and Colombian payment processing (Wompi, Stripe). Strapi v5 backend, Next.js 16 frontend. Project planning artifacts live in `_bmad-output/` and documentation in `docs/`.

## Policy

- Never push directly to `main`; work on feature branches and submit PRs.
- Never commit secrets, credentials, or production keys (`.env`, `.env.local`). Always document new variables in the respective `.env.example` in `backend/` or `frontend/`.

## Where things are

- Backend (Strapi CMS): `backend/` (API routes in `backend/src/api/`, configurations in `backend/config/`)
- Frontend (Next.js App Router): `frontend/` (pages and components in `frontend/src/`)
- Deployment and SEO guides: `docs/` (Railway setup and SEO checklists)

## Running and verifying

- Backend requires Node.js `18.x` - `22.x`. Run development server with `npm run develop` from `backend/`.
- Frontend runs Next.js with Turbopack. Run development server with `npm run dev` from `frontend/`.
- Validate frontend changes with `npm run lint` and `npm run build` from `frontend/`.
- Root `package.json` provides convenience aliases pointing to `backend/` (`npm run setup`, `npm run build`, `npm run start`).

## Conventions that differ from defaults

- Currency and pricing are managed in Colombian Pesos (COP).
- Payment processing prioritizes Wompi (supporting PSE, credit cards, Efecty, Baloto) alongside Stripe.

<!-- /bmad:context -->
