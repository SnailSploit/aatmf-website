# AATMF site — launch runbook

The site is deployed to **Cloudflare Pages** (project `aatmf`) and is intentionally
kept **off search engines** until a custom domain is attached. Everything below is
staged so launch is a flip of a switch, not a rebuild.

## Current state (staging / "on the dl")

- Live at `https://aatmf.pages.dev` — **`X-Robots-Tag: noindex`** on every
  `*.pages.dev` response (see `functions/_middleware.js`), so it won't be indexed
  or compete with the main site. Still publicly reachable by URL, and social
  cards render when the link is shared.
- SEO surface is **host-agnostic** — canonical, Open Graph, Twitter tags,
  `/sitemap.xml` and `/robots.txt` all derive from the request host, so they
  become correct automatically on whatever domain you attach. No code edits
  needed to "point at" a domain.

## Open decision (deferred)

**Canonical home for AATMF** — not yet decided:

- **Standalone** (`aatmf.org` / `aatmf.io` / `aatmf.snailsploit.com`) → the new
  domain is the source of truth; the main site's AATMF section 301-redirects (or
  `rel=canonical`s) to it. Strongest for SEO; best if courting outside adoption.
- **Keep both** → main site keeps a brand page (commercial intent); standalone
  holds the reference docs. Differentiate titles/keywords so they don't compete.

The middleware works for any of these. See the cannibalization notes in the PR.

## Launch checklist (when the domain is chosen)

1. **Attach the custom domain** to the `aatmf` Pages project
   (Cloudflare dashboard → Pages → aatmf → Custom domains), or:
   `npx wrangler pages deployment ...` / dashboard. DNS is auto-configured if the
   zone is on Cloudflare.
2. **noindex lifts automatically** — the custom domain doesn't match `*.pages.dev`,
   so it's immediately indexable. Verify: `curl -sI https://<domain>/ | grep -i robots`
   returns nothing.
3. **Consolidate** per the decision above: 301 the main site's AATMF URLs to the
   new home (or add `rel=canonical`), so link equity isn't split.
4. **Redirect the preview**: in the Pages project, redirect `aatmf.pages.dev` →
   custom domain (or leave it noindexed).
5. **Search Console**: add the custom domain as a property, submit
   `https://<domain>/sitemap.xml`. Keep the old property to watch the 301/canonical
   take effect (impressions should migrate).
6. **Seed authority**: one strong contextual link from the main site's most
   authoritative page → the new home; point the GitHub README at it.
7. **Verify cards**: run the URL through the
   [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and
   X Card Validator — confirm `og:image` (the 1200×630 `og.png`) renders.

## Deploy

```bash
# from repo root, with CLOUDFLARE_API_TOKEN set
npx wrangler pages deploy . --project-name=aatmf --branch=main
```

`functions/` is picked up automatically as Pages Functions. Source files that
aren't part of the site (`*.md`, `scripts/`, `docs/`, `*.zip`) can be excluded
from the upload bundle; the current production deploy ships only the web assets.
