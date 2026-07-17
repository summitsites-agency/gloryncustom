# Gloryn Custom — Website Design Spec

**Date:** 2026-07-15
**Client:** Gloryn Custom (a.k.a. "Ambient Gloryn") — specialized car aesthetics
**Deliverable:** 4-page marketing website, static, deployed to Vercel
**Stakes:** First client website for the builder — must be high quality and stand out.

---

## 1. Brand & Positioning

- **Three words:** specialized car aesthetics.
- **Register:** professional, premium ("Sterling Motors" type look).
- **Colors:** black & gold, sampled from the logo (`logo.jpg` — gold sports-car emblem, "AMBIENT GLORYN").
  - Ink black `#0a0a0a`, near-black `#050505`
  - Brand gold ~`#E7B53B` (sample precisely from logo during build), plus a lighter gold `#F5D27A` and deep bronze `#8A5A1E` for gradients
  - Warm cream text `#F5F0E6`, charcoal surfaces `#141414`
- **Primary customers:** all ages, 18+.
- **Primary product focus:** ambient lighting (lead with it everywhere).

## 2. Core Concept — "The site is the product"

Gloryn installs **light inside dark cabins**. The site mirrors that: a black cinematic canvas where gold light lives and responds to the visitor. Signature interactions:

1. **Cursor as ambient light** — dual-ring custom cursor (from `laocoon.html`) recolored to a soft gold glow.
2. **Starlight fields** — subtle twinkling star canvas on dark sections (evokes the starlight headliner), with occasional **shooting star** streaks (evokes the shooting-stars product).
3. **Drag-to-reveal before/after** — reuse the liquid-reveal canvas engine from `lumora.html` as a real "lights off → lights on" slider over a client car photo (the hero demonstration of ambient lighting).
4. **Cinematic per-letter title reveals** (from `laocoon.html`) and a **full-screen gold menu overlay** (from `lumora.html`).

## 3. Sourced Components (explicit copy targets)

From `templates/prompt-test/good/laocoon.html`:
- **Custom cursor:** `.cursor-inner` (dot) + `.cursor-outer` (lerping ring), `cursor:none` globally, mouse-follow + lerp in RAF loop. Recolor to gold with a soft glow.
- **Fonts:** `Italiana` (display serif) + `Outfit` (body sans) via Google Fonts.
- **Text-to-scroll animation:** `splitTitlesIntoChars()` per-letter split; chars start `opacity:0; translateY(50px); blur(12px)` and reveal when their section becomes active/visible.

From `templates/prompt-test/good/lumora.html`:
- **Menu:** header `.menu-btn` + full-screen `.nav-menu` overlay (staggered items, index numbers, accent hover, Esc to close). Adapt items to link between pages.
- Supporting systems reused/recolored: Lenis smooth scroll, IntersectionObserver `.reveal`/`.line-reveal`/`.word-reveal` system, page loader, contact modal, pills/eyebrows/service-rows/cards/stats/footer, and the **liquid-reveal canvas** (`LiquidReveal`) for the before/after slider.

Other `templates/` projects may be drawn from opportunistically for gallery/detail polish, but lumora + laocoon are the primary system.

## 4. Architecture

Four static HTML pages sharing one design system (no framework — fast, portable, easy to hand off):

```
gloryncustom/
  index.html            # Home
  services.html         # Services
  testimonials.html     # Testimonials
  contact.html          # Booking / Contact
  api/booking.js        # Vercel serverless function (form handler)
  assets/
    css/site.css        # tokens + all shared components
    js/site.js          # cursor, menu, Lenis, reveals, starfield, shooting stars
    js/liquid-reveal.js # drag before/after engine
    img/                # converted client photos (WebP/JPG) + logo
  vercel.json           # config if needed
```

- Shared CSS/JS are linked from every page so the cursor, menu, fonts, and reveals are identical site-wide.
- Menu overlay links **between pages** and to in-page sections.

## 5. Page Breakdown

### 5.1 Home (`index.html`)
- **Hero — flat yellow, video-ready (per client instruction).** Solid brand yellow background as a deliberate placeholder, structured as a drop-in `<video>` element (yellow poster/fallback) so the real high-quality clip swaps in later with one line. Overlay content stays premium: brand logo, big `Italiana` headline with per-letter reveal (ink-black text for contrast on yellow), subheadline, primary CTA ("Book your install"), and a trust bar (2-year warranty · Ottawa + Montreal · open 8am–9pm daily). The rest of the site returns to black & gold below the fold.
- **Quick services grid** — 6–7 service tiles linking to `services.html`.
- **Before/After ambient reveal** — drag slider on a real client car photo (lights off → lights on).
- **Featured gallery** — strip/grid of real converted client photos with hover.
- **Stats** — count-up (e.g., installs done, 2-yr warranty, 2 locations, 7 services).
- **Testimonial teaser** — one gold review card → link to `testimonials.html`.
- **CTA band** → `contact.html`.
- **Footer** — nav, contact, socials, hours, both addresses.

### 5.2 Services (`services.html`)
- Hero title (reveal).
- Rich service rows, each with photo, description, and install time:
  1. **Ambient AG Light** — ~1h30 install (primary focus, lead item)
  2. **Starlight Headliner** — 24–48h depending on car
  3. **Shooting Stars**
  4. **Custom Logo**
  5. **Window Tint** — ~1h
  6. **Wraps** — time varies, contact for a quote
  7. **Car Detailing**
- **2-year warranty** highlighted as a trust block.
- CTA → booking.

### 5.3 Testimonials (`testimonials.html`)
- Hero title.
- Overall-rating panel (stars + count, placeholder).
- Grid of styled 5-star gold review cards with realistic placeholder content (client swaps in real Google reviews).
- **"Leave us a Google review"** button linking to the Google Business profile (placeholder URL until provided).

### 5.4 Booking / Contact (`contact.html`)
- Hero title.
- **Booking form:** service (select), name, email, phone, car make/model, preferred location (Ottawa / Montreal), preferred date, message. Client-side validation.
- **Contact block:** phone 819-319-3798, email gloryncustom@gmail.com, Instagram @gloryncustom, both addresses, hours 8am–9pm daily.
- **Maps** for both locations:
  - Ottawa: 770 Somerset St W, Ottawa ON K1R 6P9, Canada
  - Montreal: 400 Rue du Parc-Industriel
- **Form backend:** POST to `api/booking.js` (Vercel serverless function) which emails gloryncustom@gmail.com via an email provider (Resend recommended). Requires an API key env var (`RESEND_API_KEY`) set in Vercel; until then the endpoint returns a graceful success stub. Success/error states shown inline.

## 6. Media Pipeline

- Client photos are `.HEIC` (from `Gloryn Custom Videos and Photos-...zip`). Convert to web-optimized `WebP` (with `JPG` fallback) using Python + `pillow-heif` (verified available). Resize/compress to sensible web dimensions.
- Select the strongest shots for hero before/after, gallery, and service rows.
- `Glory.mp4` (24MB, in zip) is held in reserve for the hero video slot if wanted later; not used now.
- `logo.jpg` used in header, loader, footer; sample gold from it for the palette.

## 7. Accessibility & Performance

- Respect `prefers-reduced-motion` (disable starfield/shooting stars/reveals → static).
- Custom cursor must not break keyboard nav; visible focus states retained.
- Semantic headings, alt text on all images, labelled form fields, skip link.
- Lazy-load gallery images; compress media; preconnect fonts.
- Custom cursor + `cursor:none` only on fine-pointer devices; touch devices get default behavior.

## 8. Deployment

- Static site + `api/` function deploy on **Vercel** (client requirement — not base44).
- `vercel.json` only if needed (e.g., clean URLs, function config).
- Env var `RESEND_API_KEY` (or chosen provider) documented in a README for the client to set.

## 9. Out of Scope (YAGNI for v1)

- CMS / admin panel.
- Live Google reviews API integration (placeholder cards instead).
- E-commerce / payments.
- Multi-language (site is English; note French market exists but not required now).
- The real hero video (client will supply later).

## 10. Open Items for Client (non-blocking)

- Google Business profile URL for the review CTA.
- Google Maps embed confirmation for the Montreal address (city/postal to finalize).
- Email provider API key for the booking function.
- Final high-quality hero video.
