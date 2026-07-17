# Gloryn Custom — Website

Specialized car aesthetics — ambient lighting, starlight headliners, tint, wraps & detailing.
Static site (HTML/CSS/JS) + one Vercel serverless function for the booking form.

## Structure

```
index.html            Home  (flat-yellow, video-ready hero)
services.html         Services (7 services + warranty)
testimonials.html     Testimonials (review cards)
contact.html          Booking + contact + maps
api/booking.js        Serverless function — emails booking requests
assets/css/site.css   Design system (black & gold)
assets/js/site.js     Cursor, menu, reveals, starfield, before/after, form
assets/img/           Optimized photos (WebP) + logo
```

## Deploy (Vercel)

1. Push this folder to a Git repo (or drag-drop into Vercel).
2. Import the project in Vercel — no build step, it's static + `api/`.
3. Set environment variables (Project → Settings → Environment Variables):
   - `RESEND_API_KEY` — from [resend.com](https://resend.com) (free tier is fine).
   - `BOOKING_TO` *(optional)* — defaults to `gloryncustom@gmail.com`.
   - `BOOKING_FROM` *(optional)* — a sender on a domain you've verified in Resend.
     Until you verify a domain, leave it unset (uses Resend's test sender).

The booking form works even before `RESEND_API_KEY` is set (it just won't email yet),
so the site never shows an error to a customer.

## Things to update

- **Hero video** — the homepage hero is a flat-yellow placeholder. When the final clip is
  ready, drop it into `assets/video/` and uncomment the `<video class="hero-video">` line
  near the top of `index.html` (the yellow shows as fallback while it loads).
  A copy of `Glory.mp4` from the original shoot is kept in `_media_src/` if you want to use it.
- **Google profile** — the "Read on Google", "Write a Google review", and footer "Google reviews"
  links point to `https://share.google/kh2nYeU2pTBoFxN5n` (Ambient Gloryn Custom). That page is
  where visitors read reviews and tap **Write a review**.
- **Testimonials text** — the six review cards use *placeholder* quotes (see `NOTE: placeholder
  reviews` in `testimonials.html`). Google renders live reviews via JavaScript, so they can't be
  auto-scraped. Two ways to make them real:
  1. **Manual (quickest):** paste your real Google review text/authors into the six `.tcard`s.
  2. **Live auto-updating:** either drop in a widget embed (Elfsight / Trustindex — free tier,
     paste their `<script>` where the cards are), **or** add a Google Places API key
     (`GOOGLE_PLACES_API_KEY`) + your Place ID and fetch reviews from a small `api/reviews.js`
     Vercel function. (Ask and I can wire the function — it needs the Place ID from your profile.)
- **Socials** — Instagram (`@gloryncustom`) and TikTok (`@gloryncustom`) are linked in the footer
  and on the contact page.
- **Montreal address** — confirm the full `400 Rue du Parc-Industriel` address / postal code;
  update it in `contact.html` (map iframe + text) and the footer of each page.

## Local preview

```
python -m http.server 8099
# open http://localhost:8099
```
(The booking email only runs on Vercel, where the `api/` function is live.)
