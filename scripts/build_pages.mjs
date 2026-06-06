// build_pages.mjs — generate a static, indexable page for every AATMF technique
// and tactic, so the framework has a complete, citable URL base:
//
//   /technique/<ID>   e.g. /technique/T1-AT-001   (240 pages)
//   /tactic/<ID>      e.g. /tactic/T1             (15 pages)
//
// Content is baked into the HTML (ported from render-techniques.js `openDetail`)
// so the pages are fully static — no client rendering needed to read them.
// Also writes functions/_ids.js (the id manifest the middleware uses for the
// host-based sitemap). Run from anywhere:  node scripts/build_pages.mjs

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);

globalThis.window = {};
const require = createRequire(import.meta.url);
require(path.join(ROOT, "data.js"));
require(path.join(ROOT, "detail.js"));
const A = globalThis.window.AATMF;
const DET = globalThis.window.AATMF_DETAIL || {};
const TECHS = A.techniques;
const TACTICS = A.tactics;
const tacById = Object.fromEntries(TACTICS.map((t) => [t.id, t]));
const techIds = new Set(TECHS.map((t) => t.id));

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const clean = (s) => String(s ?? "").replace(/\r/g, "").trim();
const rTitle = (r) => r.charAt(0) + r.slice(1).toLowerCase();

// Wrap any known technique id appearing in already-escaped prose in a link.
const linkifyIds = (escaped, selfId) =>
  escaped.replace(/\bT\d+-AT-\d+\b/g, (id) =>
    techIds.has(id) && id !== selfId
      ? `<a class="dt__ref" href="/technique/${id}">${id}</a>`
      : id
  );

const NAV_LINKS = [
  ["/", "Overview"],
  ["/tactics", "Tactics"],
  ["/techniques", "Techniques"],
  ["/detect", "Detect &amp; Defend"],
  ["/compliance", "Compliance"],
  ["/about", "About"],
];

function nav(activeHref) {
  const links = NAV_LINKS.map(
    ([h, l]) =>
      `<a href="${h}"${h === activeHref ? ' aria-current="page"' : ""}>${l}</a>`
  ).join("\n      ");
  const mobile = NAV_LINKS.map(([h, l]) => `<a href="${h}">${l}</a>`).join("\n  ");
  return `<header class="nav">
  <div class="nav__in">
    <a class="brand" href="/" aria-label="AATMF home">
      <img class="brand__mark" src="/spiral-ox.svg" width="24" height="24" alt="">
      <span class="brand__name">AATMF</span>
      <span class="brand__by">by snailsploit</span>
    </a>
    <nav class="nav__links" aria-label="Primary">
      ${links}
    </nav>
    <div class="nav__right">
      <span class="nav__ver"><span class="dot"></span> v3 · 2026</span>
      <a class="btn btn--solid nav__cta" href="/techniques">Browse techniques <span class="arr">&rarr;</span></a>
    </div>
    <button class="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
  </div>
</header>
<div class="mobile" aria-hidden="true">
  ${mobile}
</div>`;
}

const FOOTER = `<footer class="footer">
  <div class="wrap">
    <div class="footer__grid">
      <div class="footer__about">
        <a class="brand" href="/"><img class="brand__mark" src="/spiral-ox.svg" width="22" height="22" alt=""><span class="brand__name" style="font-size:18px;">AATMF</span></a>
        <p>An open framework from snailsploit — a small, independent adversarial-AI research group. The people doing the work are the people on the byline.</p>
      </div>
      <div class="footer__col"><h4>Framework</h4><a href="/">Overview</a><a href="/tactics">The 15 tactics</a><a href="/techniques">Technique browser</a></div>
      <div class="footer__col"><h4>Defense</h4><a href="/detect">Detect &amp; Defend</a><a href="/detect#signatures">Signatures</a><a href="/detect#ir">Incident response</a></div>
      <div class="footer__col"><h4>Compliance</h4><a href="/compliance#owasp-llm">OWASP LLM Top 10</a><a href="/compliance#atlas">MITRE ATLAS</a><a href="/compliance#eu-ai-act">EU AI Act</a></div>
      <div class="footer__col"><h4>About</h4><a href="/about">About AATMF</a><a href="/about#risk">Risk model</a><a href="/about#cite">Citation</a></div>
    </div>
    <div class="footer__bar"><span>© 2026 snailsploit · AATMF v3</span><span>Kai Aizen + Avraham Shemesh</span></div>
  </div>
</footer>`;

function page({ title, desc, active, body, jsonld }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" href="/favicon.svg">
<link rel="stylesheet" href="/aatmf.css">
<script type="application/ld+json">${jsonld}</script>
</head>
<body data-page="${active === "/tactics" ? "tactics" : "techniques"}">
${nav(active)}
${body}
${FOOTER}
<script src="/site.js"></script>
</body>
</html>
`;
}

function detailBody(t) {
  const D = DET[t.id] || {};
  const tac = tacById[t.tid];
  const maps = [];
  if (clean(t.owasp)) maps.push(["OWASP LLM", clean(t.owasp)]);
  if (clean(t.atlas)) maps.push(["MITRE ATLAS", clean(t.atlas)]);

  let h =
    `<div class="dt__top"><span class="dt__id">${esc(t.id)}</span><span class="rpill" data-r="${t.rating}">${t.rating}</span></div>` +
    `<h1 class="dt__title">${esc(clean(t.title))}</h1>` +
    `<a class="dt__tac" href="/tactic/${t.tid}">${t.tid} · ${esc(clean(tac.name))} &rarr;</a>` +
    `<div class="dt__grid">` +
    `<div class="dt__cell"><span class="dt__k">Risk score</span><span class="dt__v mono">${t.score}</span></div>` +
    `<div class="dt__cell"><span class="dt__k">Rating</span><span class="dt__v">${rTitle(t.rating)}</span></div>` +
    `<div class="dt__cell"><span class="dt__k">Procedures</span><span class="dt__v mono">${t.procedures}</span></div>` +
    `<div class="dt__cell"><span class="dt__k">Severity</span><span class="sev sev--lg" data-r="${t.rating}" style="margin-top:2px"><i></i><i></i><i></i><i></i><i></i></span></div>` +
    `</div>`;

  if (D.m)
    h += `<div class="dt__sec"><span class="dt__k">Mechanism</span><p class="dt__body-text">${linkifyIds(esc(clean(D.m)), t.id)}</p></div>`;
  if (D.d && D.d.length)
    h += `<div class="dt__sec"><span class="dt__k">Detection</span><ul class="dt__list">${D.d
      .map((x) => `<li>${esc(clean(x))}</li>`)
      .join("")}</ul></div>`;
  if (D.g && D.g.length)
    h += `<div class="dt__sec"><span class="dt__k">Mitigation</span><div class="dt__mitig">${D.g
      .map(
        (m) =>
          `<div class="mitig"><span class="mitig__c">${esc(clean(m.c))}</span><span class="mitig__e" data-e="${esc(
            m.e.toUpperCase()
          )}">${esc(m.e)}</span></div>`
      )
      .join("")}</div></div>`;
  if (D.c)
    h += `<div class="dt__sec"><span class="dt__k">Chaining</span><p class="dt__body-text dt__body-text--dim">${linkifyIds(
      esc(clean(D.c)),
      t.id
    )}</p></div>`;
  if (maps.length)
    h += `<div class="dt__sec"><span class="dt__k">Framework mapping</span>${maps
      .map(
        (m) =>
          `<div class="dt__map"><span class="dt__map-f">${m[0]}</span><span class="mtag">${esc(m[1])}</span></div>`
      )
      .join("")}</div>`;
  return h;
}

function techniquePage(t, idx) {
  const tac = tacById[t.tid];
  const D = DET[t.id] || {};
  const title = `${t.id} · ${clean(t.title)} — AATMF`;
  const desc = (D.m ? clean(D.m) : `${clean(t.title)} — AATMF ${t.tid} ${clean(tac.name)} technique. Risk ${t.score} (${rTitle(t.rating)}).`)
    .replace(/\s+/g, " ")
    .slice(0, 185);
  const prev = TECHS[idx - 1];
  const next = TECHS[idx + 1];
  const jsonld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${t.id}: ${clean(t.title)}`,
    name: clean(t.title),
    identifier: t.id,
    description: desc,
    keywords: [clean(t.title), t.id, clean(tac.name), clean(t.owasp), clean(t.atlas), "adversarial AI", "AATMF"]
      .filter(Boolean)
      .join(", "),
    isPartOf: { "@type": "CreativeWork", name: "AATMF — Adversarial AI Threat Modeling Framework", version: "3" },
    author: { "@type": "Organization", name: "snailsploit" },
  });

  const crumb =
    `<nav class="crumb" aria-label="Breadcrumb"><a href="/techniques">Techniques</a> <span>/</span> ` +
    `<a href="/tactic/${t.tid}">${t.tid} · ${esc(clean(tac.name))}</a> <span>/</span> <span>${esc(t.id)}</span></nav>`;

  const pager =
    `<nav class="tnav" aria-label="Technique pagination">` +
    (prev ? `<a class="tnav__prev" href="/technique/${prev.id}">&larr; ${prev.id} · ${esc(clean(prev.title))}</a>` : `<span></span>`) +
    (next ? `<a class="tnav__next" href="/technique/${next.id}">${next.id} · ${esc(clean(next.title))} &rarr;</a>` : `<span></span>`) +
    `</nav>`;

  const body =
    `<main class="tpage"><div class="wrap tpage__wrap">${crumb}` +
    `<article class="dt dt--page">${detailBody(t)}` +
    `<a class="dt__browse" href="/techniques?tactic=${t.tid}">Open in the technique browser &rarr;</a>` +
    `</article>${pager}</div></main>`;

  return page({ title, desc, active: "/techniques", body, jsonld });
}

function tacticPage(tac) {
  const techs = TECHS.filter((x) => x.tid === tac.id).sort((a, b) => b.score - a.score);
  const title = `${tac.id} · ${clean(tac.name)} — AATMF`;
  const desc = `${clean(tac.name)} (${tac.id}) — ${clean(tac.objective)}. ${techs.length} AATMF techniques, avg risk ${tac.avg}.`.slice(
    0,
    185
  );
  const domainLabel = { core: "Core", advanced: "Advanced", infra: "Infrastructure & human" }[tac.domain] || tac.domain;
  const jsonld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${tac.id}: ${clean(tac.name)}`,
    identifier: tac.id,
    description: desc,
    isPartOf: { "@type": "CreativeWork", name: "AATMF — Adversarial AI Threat Modeling Framework", version: "3" },
    hasPart: techs.map((t) => ({ "@type": "TechArticle", identifier: t.id, name: clean(t.title) })),
  });

  const rows = techs
    .map(
      (t) =>
        `<a class="tac-hub__row" href="/technique/${t.id}">` +
        `<span class="tac-hub__id">${t.id}</span>` +
        `<span class="tac-hub__title">${esc(clean(t.title))}</span>` +
        `<span class="tac-hub__proc mono">${t.procedures} proc</span>` +
        `<span class="tac-hub__risk"><span class="mono">${t.score}</span><span class="rpill" data-r="${t.rating}">${t.rating}</span></span>` +
        `</a>`
    )
    .join("");

  const body =
    `<main class="tac-hub"><div class="wrap tpage__wrap">` +
    `<nav class="crumb" aria-label="Breadcrumb"><a href="/tactics">Tactics</a> <span>/</span> <span>${tac.id}</span></nav>` +
    `<div class="tac-hub__head"><span class="dt__id">${tac.id} · ${esc(domainLabel)} domain</span>` +
    `<h1 class="tac-hub__title-h">${esc(clean(tac.name))}</h1>` +
    `<p class="tac-hub__obj">${esc(clean(tac.objective))}</p>` +
    `<div class="dt__grid" style="margin-top:24px">` +
    `<div class="dt__cell"><span class="dt__k">Techniques</span><span class="dt__v mono">${tac.count}</span></div>` +
    `<div class="dt__cell"><span class="dt__k">Avg risk</span><span class="dt__v mono">${tac.avg}</span></div>` +
    `<div class="dt__cell"><span class="dt__k">Max risk</span><span class="dt__v mono">${tac.max}</span></div>` +
    `<div class="dt__cell"><span class="dt__k">Domain</span><span class="dt__v">${esc(domainLabel)}</span></div>` +
    `</div></div>` +
    `<div class="tac-hub__list">${rows}</div>` +
    `<a class="dt__browse" href="/techniques?tactic=${tac.id}">Open ${tac.id} in the technique browser &rarr;</a>` +
    `</div></main>`;

  return page({ title, desc, active: "/tactics", body, jsonld });
}

// ---- write everything ----
for (const dir of ["technique", "tactic"]) {
  rmSync(path.join(ROOT, dir), { recursive: true, force: true });
  mkdirSync(path.join(ROOT, dir), { recursive: true });
}

TECHS.forEach((t, i) => writeFileSync(path.join(ROOT, "technique", `${t.id}.html`), techniquePage(t, i)));
TACTICS.forEach((tac) => writeFileSync(path.join(ROOT, "tactic", `${tac.id}.html`), tacticPage(tac)));

mkdirSync(path.join(ROOT, "functions"), { recursive: true });
writeFileSync(
  path.join(ROOT, "functions", "_ids.js"),
  `// generated by scripts/build_pages.mjs — id manifest for the sitemap\nexport const TACTIC_IDS = ${JSON.stringify(
    TACTICS.map((t) => t.id)
  )};\nexport const TECHNIQUE_IDS = ${JSON.stringify(TECHS.map((t) => t.id))};\n`
);

console.log(`Wrote ${TECHS.length} technique pages + ${TACTICS.length} tactic pages + functions/_ids.js`);
