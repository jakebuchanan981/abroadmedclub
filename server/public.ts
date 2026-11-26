import { existsSync, realpathSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { Catalog, Provider, Source } from "../src/healthcare/types";
import { directoryPath } from "../src/healthcare/navigation";
import { searchProviders } from "../src/healthcare/search";
import { getCatalog } from "./catalog";

const dist = resolve(
  process.env.DIST_DIR || fileURLToPath(new URL("../dist", import.meta.url)),
);
const entities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const escape = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => entities[character]!);
const link = (path: string, label: string): string =>
  `<a href="${escape(path)}">${escape(label)}</a>`;

function sources(values: Source[]): string {
  return `<h2>Sources</h2><ul>${values.map((value) => `<li>${link(value.url, value.label)} · checked ${escape(value.checkedAt)}</li>`).join("")}</ul>`;
}

function providerCards(values: Provider[]): string {
  if (!values.length)
    return "<p>No published providers match this selection. A directory listing is not a medical recommendation.</p>";
  return `<ul>${values.map((provider) => `<li><h2>${link(`/centers/${provider.id}`, provider.name)}</h2><p>${escape(provider.city)}, ${escape(provider.countryCode)}</p><p>${escape(provider.summary)}</p><p>${provider.profileLevel === "basic" ? "Basic public-source listing · contact information not added" : "Independent directory listing"} · not a clinic partnership</p></li>`).join("")}</ul>`;
}

function providerLocation(provider: Provider): string {
  const address = provider.address ? `${escape(provider.address)} · ` : "";
  const precision = provider.address ? "" : " · city-level location only";
  return `<p>${address}${escape(provider.city)}, ${escape(provider.countryCode)}${precision}</p>`;
}

function providerContact(provider: Provider): string {
  const links = [
    provider.website
      ? link(provider.website, "Official provider website")
      : "",
    provider.contactUrl
      ? link(provider.contactUrl, "Official contact information")
      : "",
  ].filter(Boolean);
  return links.length
    ? `<p>${links.join(" · ")}</p>`
    : "<p><strong>Contact information has not been added to this basic discovery record.</strong> The listing does not indicate provider participation; use the cited public source for research.</p>";
}

function publicPaths(catalog: Catalog): string[] {
  return [
    "/",
    "/specialties",
    "/centers",
    "/destinations",
    "/guides",
    "/about",
    "/privacy",
    "/terms",
    "/contact",
    "/providers-join",
    "/how-it-works",
    ...catalog.categories.map((value) => `/specialties/${value.id}`),
    ...catalog.countries.map((value) =>
      directoryPath({ page: "destinations", code: value.code }),
    ),
    ...catalog.providers.map((value) => `/centers/${value.id}`),
    ...catalog.guides.map((value) => `/guides/${value.id}`),
  ];
}

type Page = {
  title: string;
  description: string;
  body: string;
  status?: number;
  noindex?: boolean;
};
function renderPage(url: URL, catalog: Catalog): Page {
  const path = url.pathname.replace(/\/$/, "") || "/";
  const [family, id, extra] = path.slice(1).split("/");
  const missing: Page = {
    title: "Page not available",
    description: "This page is unavailable or no longer published.",
    body: `<p>The requested page is unavailable or no longer published.</p>${link("/centers", "Browse published care providers")}`,
    status: 404,
    noindex: true,
  };
  if (extra) return missing;
  if (path === "/")
    return {
      title: "International care, thoughtfully researched",
      description:
        "Explore source-backed international care providers, destinations and practical planning guides.",
      body: `<p>Explore international care with clear sources and thoughtful questions. Our directory is independent: listings do not establish clinical suitability, verified credentials, availability or a partnership.</p><h2>Explore care</h2><ul>${catalog.categories.map((value) => `<li>${link(`/specialties/${value.id}`, value.name)}</li>`).join("")}</ul><h2>Published providers</h2>${providerCards(catalog.providers)}<h2>Planning guides</h2><ul>${catalog.guides.map((value) => `<li>${link(`/guides/${value.id}`, value.title)}</li>`).join("")}</ul>`,
    };
  if (family === "centers") {
    if (id) {
      const provider = catalog.providers.find((value) => value.id === id);
      if (!provider) return missing;
      const offerings = catalog.offerings.filter(
        (value) => value.providerId === provider.id,
      );
      return {
        title: provider.name,
        description: provider.summary,
        body: `<p>${provider.profileLevel === "basic" ? "Basic discovery listing assembled from public pages. Provider contact information has not been added, and the listing does not indicate provider participation." : "Independent directory listing."} Publication reflects source review, not medical credential verification or a safety endorsement.</p><p>${escape(provider.summary)}</p>${providerLocation(provider)}${providerContact(provider)}<h2>Listed services</h2>${offerings.map((offering) => `<article><h3>${escape(catalog.treatments.find((value) => value.id === offering.treatmentId)?.name || offering.treatmentId)}</h3><p>${escape(offering.summary)}</p><ul>${offering.scope.map((value) => `<li>${escape(value)}</li>`).join("")}</ul>${offering.exclusions.length ? `<h4>Scope exclusions</h4><ul>${offering.exclusions.map((value) => `<li>${escape(value)}</li>`).join("")}</ul>` : ""}<p>${offering.price.kind === "not-published" ? "Price not published in this directory. Request an itemized quote only through a verified official channel." : offering.price.kind === "quote-required" ? "Individual provider quote required." : `Published ${escape(offering.price.kind)} price: ${escape(new Intl.NumberFormat("en", { style: "currency", currency: offering.price.currency }).format(offering.price.amountMinor! / 10 ** offering.price.minorUnit!))}${offering.price.maximumMinor !== undefined ? `–${escape(new Intl.NumberFormat("en", { style: "currency", currency: offering.price.currency }).format(offering.price.maximumMinor / 10 ** offering.price.minorUnit!))}` : ""} ${escape(offering.price.unit || "")}. Confirm current price and inclusions directly.`}</p>${sources([offering.source])}</article>`).join("")}<h2>Languages listed by the provider</h2><p>${escape(provider.languages.join(", ") || "Not documented in this directory.")}</p><h2>Listed facilities</h2><ul>${provider.facilities.map((value) => `<li>${escape(value)}</li>`).join("")}</ul>${provider.practitioners.length ? `<h2>Practitioner source references</h2><ul>${provider.practitioners.map((value) => `<li>${link(value.sourceUrl, value.name)} — ${escape(value.role)}</li>`).join("")}</ul>` : ""}${provider.credentialClaims.length ? `<h2>Provider-reported credential claims</h2><ul>${provider.credentialClaims.map((value) => `<li>${link(value.sourceUrl, value.label)} — ${escape(value.note)}</li>`).join("")}</ul>` : ""}${sources(provider.sources)}<p>Inquiries submitted in the app go to the AbroadMedClub directory team, not to this provider. No appointment or clinic delivery is implied.</p>`,
      };
    }
    const values = searchProviders(catalog, {
      categoryId: url.searchParams.get("specialty") || undefined,
      treatmentId: url.searchParams.get("treatment") || undefined,
      countryCode: url.searchParams.get("country") || undefined,
      city: url.searchParams.get("city") || undefined,
      q: url.searchParams.get("q") || undefined,
    });
    return {
      title: "Care providers",
      description:
        "Browse independently listed international care providers and their official sources.",
      body: providerCards(values),
      noindex: url.search.length > 0,
    };
  }
  if (family === "specialties") {
    if (!id)
      return {
        title: "Care specialties",
        description:
          "Explore care categories and source-backed service listings.",
        body: `<ul>${catalog.categories.map((value) => `<li><h2>${link(`/specialties/${value.id}`, value.name)}</h2><p>${escape(value.description)}</p></li>`).join("")}</ul>`,
      };
    const category = catalog.categories.find((value) => value.id === id);
    if (!category) return missing;
    const treatments = catalog.treatments.filter(
      (value) => value.categoryId === id,
    );
    return {
      title: category.name,
      description: category.description,
      body: `<p>${escape(category.description)}</p><h2>Treatments and consultations</h2><ul>${treatments.map((value) => `<li><h3>${link(`/centers?treatment=${value.id}`, value.name)}</h3><p>${escape(value.summary)}</p>${link(value.sourceUrl, "Educational source")}</li>`).join("")}</ul>${link(`/centers?specialty=${id}`, "View published providers in this specialty")}`,
    };
  }
  if (family === "destinations") {
    if (!id)
      return {
        title: "Care destinations",
        description:
          "Research international care destinations. Geographic coverage is not a recommendation or safety rating.",
        body: `<p>Country taxonomy does not mean a provider is listed in every country.</p><ul>${catalog.countries.map((value) => `<li>${link(directoryPath({ page: "destinations", code: value.code }), value.name)} · ${escape(value.region)}</li>`).join("")}</ul>`,
      };
    const country = catalog.countries.find(
      (value) => value.code === id.toUpperCase(),
    );
    if (!country) return missing;
    return {
      title: `Care in ${country.name}`,
      description: `Explore published providers in ${country.name} and research practical travel requirements independently.`,
      body: `<p>Check entry requirements, insurance, accessibility and follow-up arrangements directly. A destination listing is not a safety or medical suitability recommendation.</p>${providerCards(catalog.providers.filter((value) => value.countryCode === country.code))}`,
    };
  }
  if (family === "guides") {
    if (!id)
      return {
        title: "Planning guides",
        description:
          "Practical, source-backed guides to researching international care.",
        body: `<ul>${catalog.guides.map((value) => `<li><h2>${link(`/guides/${value.id}`, value.title)}</h2><p>${escape(value.summary)}</p></li>`).join("")}</ul>`,
      };
    const guide = catalog.guides.find((value) => value.id === id);
    if (!guide) return missing;
    return {
      title: guide.title,
      description: guide.summary,
      body: `<p>${escape(guide.summary)}</p><p>General education, not individual medical advice. Ask a qualified clinician about your circumstances.</p>${guide.sections.map((section) => `<section><h2>${escape(section.heading)}</h2>${section.paragraphs.map((value) => `<p>${escape(value)}</p>`).join("")}${section.bullets?.length ? `<ul>${section.bullets.map((value) => `<li>${escape(value)}</li>`).join("")}</ul>` : ""}</section>`).join("")}${sources(guide.sources)}`,
    };
  }
  const information: Record<string, Page> = {
    "/about": {
      title: "About AbroadMedClub",
      description:
        "An independent international care directory and planning resource.",
      body: "<p>AbroadMedClub helps people organize research about international care. Listings cite public sources. Some launch records begin with a hospital or clinic name and service categories found in another medical-tourism directory and intentionally omit contact details. We are not a healthcare provider, emergency service, insurer or booking agent. A listing does not imply participation, a partnership, credential verification or clinical endorsement.</p><p>Basic discovery records may be published before provider outreach. AbroadMedClub will not initiate that outreach until the directory and core site operations are mostly functional. Inclusion and applications have no charge during launch; any future commercial relationship would require separate agreement and labeling.</p><p>Signed-in travelers can privately ask the server to match the latest version of an owned account trip with open destination and overlapping travel communities. Browsing does not publish the trip, join a circle or create a group. A separate reviewed creation action can copy only country, city and dates into editable independent public group metadata; publication still requires explicit consent and later trip edits or deletion are not synchronized.</p>",
    },
    "/how-it-works": {
      title: "How it works",
      description:
        "Research providers, compare published information and ask the directory team for help.",
      body: "<ol><li>Browse care categories and destinations.</li><li>Review public sources, service scope and price limitations. A basic discovery record may cite a third-party directory and omit provider contact details.</li><li>Discuss suitability and continuity of care with qualified clinicians.</li><li>Sign in to ask the AbroadMedClub directory team a minimal, non-clinical planning question.</li></ol><p>A stored inquiry is an operator-inbox receipt, not provider delivery, a quote or an appointment.</p><p>Signed-in account trips can be matched server-side with open destination and date-overlapping travel communities. Browsing is read-only and publishes nothing. Creating an independent public travel group is a separate reviewed and explicitly consented action.</p>",
    },
    "/privacy": {
      title: "Privacy",
      description:
        "How local and account planning, community participation and private inbox data are handled.",
      body: "<p>Guest plans, saved destinations, preferences and legacy drafts stay on-device. Account plans, opted-in memberships, posts and messages use the operator backend; copying guest plans is explicit and retains the originals. New private drafts are not saved in device storage.</p><p>Account-trip community matching runs on the server against the latest owned trip and returns only its country, city, dates and update time with open community matches. Browsing does not publish the trip, create a group or add a membership. Explicit creation from a match copies only country, city and dates into editable fields for independent public group metadata, still requires publication consent, and does not synchronize later trip edits or deletion.</p><p>Account identity and private content are encrypted at rest, not end-to-end. Public circle metadata and relationship/index identifiers are not all encrypted. Circle membership aliases and posts are accessible to active members and moderators; pending travel-group requests do not grant access. Account names and email addresses are not public member identities. Private member conversations are participant-only; staff moderation exposes individually reported messages shared with consent, not unreported history. Either-direction blocks prevent further messages and remain manageable after thread deletion.</p><p>Account deletion removes account plans, memberships, posts, directory inquiries, private member conversations for both participants, related reports/blocks, and owned travel groups with their discussions. Deleting a shared conversation removes it for both people. Reports do not retain deleted source content as snapshots. Separately submitted support requests and applications require an operator removal request. Audit identifiers and any separately made backups need their own retention controls. No automatic expiry or forensic erasure is promised.</p><p>Local reset does not delete online data. Do not submit medical records, detailed health histories, identity documents or payment information. This local service has not received production security, legal or compliance approval.</p><p>External source, travel-guide, visa-support and accommodation sites follow their own privacy practices and receive ordinary connection and referral information. A Booking.com link may include an AbroadMedClub affiliate identifier, but no form text, health information, account details or trip-plan content is appended.</p>",
    },
    "/terms": {
      title: "Directory terms",
      description:
        "Important limitations of the AbroadMedClub research directory.",
      body: "<p>Information is for general research and may change. Confirm scope, current pricing, credentials, regulatory registration and availability directly with providers and relevant authorities. Basic records may come from third-party directory research and omit contact details; publication and source review do not establish provider participation, medical safety or suitability.</p><p>Directory inclusion and provider applications have no charge during launch. AbroadMedClub will defer its own provider outreach until the directory and core site operations are mostly functional. Any future paid relationship requires separate agreement and labeling and does not create a clinical ranking.</p><p>Travel links open independent vendors. AbroadMedClub may earn a commission at no extra cost when affiliate tracking is configured. A preferred travel vendor label is editorial, not a guarantee of quality, availability, savings or suitability. Vendor member rates or promotions may reduce expenses, but no discount is guaranteed.</p><p>Circles offer peer discussion, not medical advice. Joining and message permissions are opt-in; use blocking and reporting for inappropriate contact. Member-created travel groups are coordination spaces, not vetted organizers or club/partner packages. No medical advice, appointment, payment, clinic forwarding or travel-service contract is created by a plan, group or operator inquiry. In an emergency, contact local emergency services; no inbox or moderation response deadline is promised. Do not submit medical records or another person's private information.</p>",
    },
    "/contact": {
      title: "Contact the directory team",
      description:
        "Send a support request to the AbroadMedClub operator inbox.",
      body: "<p>The interactive application provides a support form. Requests are stored for the directory operator, not emailed or forwarded to a clinic. Do not include clinical history or urgent medical concerns.</p>",
    },
    "/providers-join": {
      title: "Free launch provider applications",
      description:
        "Apply at no charge for directory-team review of your organization.",
      body: "<p>There is no charge to apply or be included during launch. Use the interactive form to provide public evidence and official contact information. Submission creates an operator review record, not automatic publication, a verified-provider designation or partnership.</p><p>AbroadMedClub may already hold a basic public-source record without contact details. We are not initiating provider outreach until the directory and core site operations are mostly functional.</p>",
    },
    "/compare": {
      title: "Compare providers",
      description:
        "Compare published provider information in the interactive application.",
      body: "<p>Your current comparison selection is held in app memory. Select providers in the directory to compare their published service scope and sources.</p>",
      noindex: true,
    },
  };
  return information[path] || missing;
}

export async function publicResponse(
  request: Request,
  base: string,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method !== "GET" && request.method !== "HEAD")
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  const countryPath = /^\/destinations\/([a-z]{2})\/?$/i.exec(path);
  if (countryPath) {
    const canonicalPath = directoryPath({
      page: "destinations",
      code: countryPath[1],
    });
    if (path !== canonicalPath)
      return new Response(null, {
        status: 308,
        headers: { Location: canonicalPath + url.search },
      });
  }
  const catalog = getCatalog();
  if (path === "/robots.txt")
    return new Response(
      `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /compare\nSitemap: ${base}/sitemap.xml\n`,
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  if (path === "/sitemap.xml")
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPaths(
        catalog,
      )
        .map((value) => `<url><loc>${escape(base + value)}</loc></url>`)
        .join("")}</urlset>`,
      { headers: { "Content-Type": "application/xml; charset=utf-8" } },
    );
  if (
    /\.(?:js|css|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|mp4|webm)$/i.test(
      path,
    )
  ) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(path);
    } catch {
      return new Response("Invalid path", { status: 400 });
    }
    const target = resolve(dist, `.${decoded}`);
    if (
      !target.startsWith(dist + sep) ||
      !existsSync(target) ||
      !realpathSync(target).startsWith(realpathSync(dist) + sep)
    )
      return new Response("Asset not found", { status: 404 });
    return new Response(Bun.file(target), {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }
  const page = renderPage(url, catalog);
  const title = `${page.title} | AbroadMedClub`;
  const canonical = base + (url.pathname.replace(/\/$/, "") || "/");
  const metadata = `<title>${escape(title)}</title><meta name="description" content="${escape(page.description)}"><link rel="canonical" href="${escape(canonical)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:type" content="${url.pathname.startsWith("/guides/") ? "article" : "website"}"><meta property="og:url" content="${escape(canonical)}">${page.noindex ? '<meta name="robots" content="noindex,follow">' : ""}`;
  const content = `<div style="max-width:1080px;margin:0 auto;padding:28px;font:17px/1.6 system-ui;color:#183531;background:#fff"><header>${link("/", "AbroadMedClub")}<nav aria-label="Main navigation">${link("/specialties", "Specialties")} · ${link("/centers", "Providers")} · ${link("/destinations", "Destinations")} · ${link("/guides", "Guides")}</nav></header><main><h1>${escape(page.title)}</h1>${page.body}</main><footer><p>${link("/about", "About")} · ${link("/privacy", "Privacy")} · ${link("/terms", "Terms")} · ${link("/contact", "Contact")}</p><p>Research information only. No medical advice or emergency support.</p></footer></div>`;
  const index = Bun.file(resolve(dist, "index.html"));
  let html: string;
  if (await index.exists()) {
    html = await index.text();
    html = html
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
      .replace(
        /<meta\b[^>]*(?:name=["'](?:description|robots)["']|property=["']og:[^"']+["'])[^>]*>/gi,
        "",
      )
      .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "");
    html = html.replace(/<\/head>/i, `${metadata}</head>`);
    // Expo's client takes over #root; without JavaScript the same public data remains readable.
    const root = /<div\b([^>]*\bid=["']root["'][^>]*)>\s*<\/div>/i;
    html = root.test(html)
      ? html.replace(root, `<div$1>${content}</div>`)
      : html.replace(/<body([^>]*)>/i, `<body$1>${content}`);
  } else {
    html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${metadata}</head><body>${content}<p style="padding:28px">Interactive account and request forms require the web application build. These directory pages remain available without JavaScript.</p></body></html>`;
  }
  return new Response(html, {
    status: page.status || 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      ...(page.noindex ? { "X-Robots-Tag": "noindex" } : {}),
    },
  });
}
