---
title: 'Story 8.4: Instagram Post-to-Product AI Importer'
type: 'feature'
created: '2026-10-11'
status: 'review'
baseline_commit: 'NO_VCS'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Store operators managing inventory in Prana Market have their physical products showcased on Instagram posts with rich photos, carousels, and informal captions containing prices and descriptions. Manually migrating these products one-by-one into Strapi requires downloading images, reformatting Colombian prices, removing WhatsApp/DM boilerplate, and typing fields, which takes 3–5 minutes per product and discourages catalog completion.

**Approach:** Build an assisted import feature inside `/admin/catalog` allowing operators to paste a public Instagram post URL. The system extracts the high-resolution media and caption, passes the raw text and images to an LLM extraction service to structure clean e-commerce attributes (sanitized title, integer COP price, structured description, size/color variants, and category matching), and presents an interactive verification card where the operator can tweak attributes and publish to Strapi with 1 click (`sourcing_type: 'local'`).

## Boundaries & Constraints

**Always:**
- Enforce `sourcing_type: 'local'` on all products generated from Instagram posts.
- Parse prices strictly in Colombian Pesos (COP) as non-negative integers, normalizing patterns like `"$85.000"`, `"85k"`, `"85 mil"` to `85000`.
- Upload extracted post images directly into Strapi's Media Library (or local/Cloudinary provider) to avoid relying on temporary Instagram CDN URLs that expire quickly.
- Sanitize promotional social copy: strip out `"link en bio"`, `"escríbenos al DM"`, `"WhatsApp en perfil"`, and hashtag walls from the final product description.
- Keep the human-in-the-loop: Never auto-publish without presenting the interactive preview modal for operator confirmation.
- Generate a unique SKU if not provided in the post (format: `PRANA-IG-[POST_ID]`).

**Never:**
- Never alter or overwrite dropship products (`sourcing_type: 'mastershop_dropship'`).
- Never crash the admin UI if an Instagram post is private, deleted, or rate-limited; provide actionable user feedback.
- Never store raw unparsed captions with broken emoji formatting as the official title.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Single photo post | Valid IG URL (`https://instagram.com/p/...`) with price in caption | Fetches image and caption, extracts title and price COP, shows preview with single image preselected as cover | If price missing, highlights price field in red requiring manual entry in modal |
| Carousel post | IG URL with multiple slides (3–5 photos) | Extracts all images in high resolution, displays gallery thumbnail selector allowing operator to pick cover and gallery items | If extraction times out, allows re-trying or uploading photos manually |
| Colombian slang price | Caption with `"Blusa lino 75k"`, `"$120.000 COP"` | Extracted price: `75000`, `120000` | Fallback to `0` and prompt operator if ambiguous (e.g., `"precio especial"`) |
| Private or invalid post URL | Private profile URL or non-existent post | Extraction returns HTTP 422 with descriptive reason | Toast: `"No se pudo acceder a la publicación. Verifica que sea pública"` |
| Duplicate post import | Operator submits a post URL that was already imported | Warns operator that product already exists with link to edit it, or allows creating duplicate with `-copia` | Prevents accidental duplicate SKUs |

</frozen-after-approval>

## Code Map

- `backend/src/api/product/services/instagram-extractor.ts` -- Service to fetch public Instagram post metadata (media URLs + caption) and call LLM parser for structured schema extraction.
- `backend/src/api/product/controllers/instagram-import.ts` -- Strapi controller handling `POST /api/products/extract-instagram` and `POST /api/products/commit-instagram`.
- `backend/src/api/product/routes/instagram-import.ts` -- Strapi route definitions for extraction and draft publishing.
- `frontend/src/app/admin/catalog/components/InstagramImporter.tsx` -- Interactive Next.js component featuring post URL input, live extraction skeleton, and confirmation modal.
- `frontend/src/app/admin/catalog/page.tsx` -- Update catalog management page to host the "Importar desde Instagram" tab alongside CSV import.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/api/product/services/instagram-extractor.ts` -- Implement Instagram post metadata retrieval and structured LLM prompt parser.
- [x] `backend/src/api/product/controllers/instagram-import.ts` -- Implement extraction and commit endpoints with image ingestion to Media Library.
- [x] `backend/src/api/product/routes/instagram-import.ts` -- Register Strapi routes for Instagram importer.
- [x] `frontend/src/app/admin/catalog/components/InstagramImporter.tsx` -- Build UI with URL input, loading spinner, image carousel preview, and editable form.
- [x] `frontend/src/app/admin/catalog/page.tsx` -- Integrate importer component into the `/admin/catalog` dashboard.

**Acceptance Criteria:**
- Given an operator pastes a public Instagram post URL in `/admin/catalog`, when clicking "Extraer Producto", then the images, clean title, and COP price are presented in under 5 seconds.
- Given the extracted product preview, when the operator selects the cover image and clicks "Aprobar y Publicar", then a new local product (`sourcing_type: 'local'`) is persisted in Strapi and images are saved in Media Library.
- Given an invalid or private post URL, when submitting, then the operator receives an informative error alert and the form remains intact.
