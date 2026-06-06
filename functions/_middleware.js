// SEO + social middleware for the AATMF site on Cloudflare Pages.
//
//  - Keeps the temporary *.pages.dev deployment out of the search index
//    (X-Robots-Tag: noindex) so it can't cannibalize the main site or the
//    future custom domain. Any other host (the custom domain) is untouched.
//  - Injects host-agnostic canonical + Open Graph / Twitter tags into every
//    HTML page, mirroring that page's own <title> and meta description. Because
//    the URLs are derived from the request host, every tag is correct on
//    whatever domain serves the page — no rework when the custom domain lands.
//  - Serves a host-based /sitemap.xml and /robots.txt.

const PAGES = ["/", "/tactics", "/techniques", "/detect", "/compliance", "/about"];

const decodeEntities = (s) =>
  String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

const attr = (s) =>
  decodeEntities(s)
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function sitemap(origin) {
  const now = new Date().toISOString().slice(0, 10);
  const body = PAGES.map(
    (p) => `  <url><loc>${origin}${p}</loc><lastmod>${now}</lastmod></url>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const isPreview = url.hostname.endsWith(".pages.dev");

  if (url.pathname === "/sitemap.xml") {
    const headers = { "content-type": "application/xml; charset=utf-8" };
    if (isPreview) headers["X-Robots-Tag"] = "noindex";
    return new Response(sitemap(url.origin), { headers });
  }

  if (url.pathname === "/robots.txt") {
    // Crawlable so social scrapers can still render cards on a shared link;
    // search indexing on *.pages.dev is blocked by the noindex header below.
    const body = `User-agent: *\nAllow: /\nSitemap: ${url.origin}/sitemap.xml\n`;
    return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  let response = await next();
  const ct = response.headers.get("content-type") || "";

  if (response.status === 200 && ct.includes("text/html")) {
    let path = url.pathname.replace(/index\.html$/, "").replace(/\.html$/, "");
    if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);
    if (path === "") path = "/";
    const canonical = url.origin + path;
    const ogImage = url.origin + "/og.png";

    let title = "";
    let desc = "";
    response = new HTMLRewriter()
      .on("title", { text(t) { title += t.text; } })
      .on('meta[name="description"]', {
        element(el) { desc = el.getAttribute("content") || ""; },
      })
      .on("head", {
        element(el) {
          el.onEndTag((end) => {
            const t = attr(title);
            const d = attr(desc);
            end.before(
              `<link rel="canonical" href="${canonical}">` +
                `<meta property="og:type" content="website">` +
                `<meta property="og:site_name" content="AATMF">` +
                `<meta property="og:title" content="${t}">` +
                `<meta property="og:description" content="${d}">` +
                `<meta property="og:url" content="${canonical}">` +
                `<meta property="og:image" content="${ogImage}">` +
                `<meta property="og:image:width" content="1200">` +
                `<meta property="og:image:height" content="630">` +
                `<meta name="twitter:card" content="summary_large_image">` +
                `<meta name="twitter:title" content="${t}">` +
                `<meta name="twitter:description" content="${d}">` +
                `<meta name="twitter:image" content="${ogImage}">`,
              { html: true }
            );
          });
        },
      })
      .transform(response);
  }

  if (isPreview) {
    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  return response;
}
