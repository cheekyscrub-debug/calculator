# Assets & Deployment Guide

## Run locally
Any static server works. Example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy to Cloudflare Pages
1. Push this repo to GitHub.
2. In Cloudflare Pages, create a new project from the repo.
3. Build settings:
   - Framework preset: None
   - Build command: (leave empty)
   - Output directory: (leave empty)
4. Deploy.

## Gallery images
Place images in `assets/images/` and list their filenames in `assets/script.js`:

```js
const galleryImages = [
  "work-01.jpg",
  "work-02.jpg"
];
```

Supports up to 40 images. The gallery auto-rotates and opens a modal viewer on click.

## Contact form API
The form POSTs to `/api/contact`.

### Mode 1 (default): Logging mode
- Enquiries are accepted and logged in a **redacted** form.
- TODO: Replace logging with real email sending before production.

### Mode 2 (recommended once domain exists): Real email
Two options are scaffolded in `functions/api/contact.js`.

#### Option A: MailChannels (Cloudflare Workers)
- Requires a verified domain and a sender address.
- Set environment variables in Cloudflare Pages:
  - `EMAIL_PROVIDER=mailchannels`
  - `FROM_EMAIL=no-reply@YOURDOMAIN.com`
  - `TO_EMAIL=shkelzen_naza@hotmail.co.uk`

#### Option B: Resend (or similar provider)
- Requires an API key.
- Set environment variables:
  - `EMAIL_PROVIDER=resend`
  - `RESEND_API_KEY=YOUR_KEY`
  - `FROM_EMAIL=no-reply@YOURDOMAIN.com`
  - `TO_EMAIL=shkelzen_naza@hotmail.co.uk`

## TODO
- Add real domain and update canonical/OG URLs in `index.html`.
- Add real gallery images to `assets/images/`.
- Replace testimonial placeholders with approved snippets.
- Enable real email sending once a domain exists.
- Add a basic privacy notice.
