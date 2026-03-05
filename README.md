# 2K IQ Lab (Static)

Production-ready static website with 5 in-browser tools:
1. Teammate IQ / Toxicity Scanner
2. Why You’re Losing Analyzer
3. Build Counter Bot
4. Animation Optimizer
5. Squad Chemistry Bot

## Stack
- HTML
- CSS
- Vanilla JavaScript
- No server, no database, no build step required

## Project Structure
- `index.html`
- `assets/styles.css`
- `assets/app.js`
- `assets/logo.svg`
- `pages/about.html`
- `pages/contact.html`
- `pages/privacy.html`
- `pages/terms.html`
- `pages/faq.html`
- `render.yaml`

## Monetization + Pro
- Free mode: ad placeholder blocks (`.ad-slot`) for AdSense placement
- Pro mode: `$2.99/month` using Stripe Payment Link
- Pro unlock is local-only (`localStorage`) and stored on the current browser/device

Stripe link configured in:
- `index.html` (`#stripe-pay-link`)
- `assets/app.js` (`STRIPE_LINK` constant)

## Deploy on Render (Static Site)

### Option A: Render Dashboard (quick)
1. Push this folder to GitHub.
2. Go to Render Dashboard -> **New** -> **Static Site**.
3. Connect your repository.
4. Build command: **(leave empty / none)**
5. Publish directory: `.`
6. Deploy.

### Option B: Blueprint via `render.yaml`
1. Commit and push `render.yaml` to your repo.
2. In Render Dashboard, create from Blueprint and select the repo.
3. Apply configuration.

## GitHub Push Example
```bash
git init
git add .
git commit -m "Build 2K IQ Lab static site"
git branch -M main
git remote add origin https://github.com/marketintelbot-alt/2kiqpro.git
git push -u origin main
```

## Add Google AdSense Later
1. In `index.html`, keep existing `<div class="ad-slot">` blocks where ads should render.
2. Add your AdSense script once approved:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
```
3. Replace each placeholder with your ad unit snippet.
4. Keep one ad near hero, one between tool sections, and one in footer.

## Notes
- This build includes real content pages (About, Contact, Privacy, Terms, FAQ) for trust and AdSense readiness.
- Disclaimer is included across the product: "Not affiliated with 2K or Take-Two. Educational tool. Results are estimates."
- Because this is static-only, Pro billing state is not server-verified.
