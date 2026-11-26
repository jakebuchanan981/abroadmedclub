import { test } from "bun:test";
import assert from "node:assert/strict";
import {
  destinationTravelResources,
  travelVendorUrl,
} from "../src/travel/destination-resources";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// A separate process gives every scenario its own database, key and module state.
async function checkIsolated(script: string): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), "abroadmedclub-regression-"));
  try {
    const child = Bun.spawn(
      [
        process.execPath,
        "--eval",
        `
      import assert from "node:assert/strict";
      import { getCatalog, saveDraft, publishDraft } from "./server/catalog.ts";
      import { publicResponse } from "./server/public.ts";
      import { directoryPath } from "./src/healthcare/navigation.ts";
      const base = "https://directory.example.invalid";
      ${script}
    `,
      ],
      {
        cwd: fileURLToPath(new URL("../", import.meta.url)),
        env: { ...process.env, DATA_DIR: directory },
        stdout: "ignore",
        stderr: "pipe",
      },
    );
    const [exitCode, stderr] = await Promise.all([
      child.exited,
      new Response(child.stderr).text(),
    ]);
    if (exitCode !== 0)
      throw new Error(`Isolated scenario failed (${exitCode}): ${stderr}`);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("a newer draft cannot be published using an earlier source review", async () => {
  await checkIsolated(`
    const catalog = getCatalog();
    const provider = catalog.providers[0];
    assert(provider);
    const offerings = catalog.offerings.filter(item => item.providerId === provider.id);
    const clock = Date.now();
    Date.now = () => clock;
    const reviewed = saveDraft(provider.id, { provider, offerings }, "reviewer");
    const changed = saveDraft(provider.id, {
      provider: { ...provider, summary: provider.summary + " Updated directory research." }, offerings,
    }, "editor");
    assert.throws(() => publishDraft(provider.id, "reviewer", reviewed.provider.updatedAt), { status: 409 });
    assert.equal(getCatalog().providers.find(item => item.id === provider.id).summary, provider.summary);
    publishDraft(provider.id, "reviewer", changed.provider.updatedAt);
    assert.equal(getCatalog().providers.find(item => item.id === provider.id).summary, changed.provider.summary);
  `);
});

test("every generated country deep link returns an indexable public page", async () => {
  await checkIsolated(`
    for (const country of getCatalog().countries) {
      const path = directoryPath({ page: "destinations", code: country.code });
      const response = await publicResponse(new Request(base + path), base);
      assert.equal(response.status, 200, path);
      let canonical;
      let robots;
      await new HTMLRewriter()
        .on('link[rel="canonical"]', { element(node) { canonical = node.getAttribute("href"); } })
        .on('meta[name="robots"]', { element(node) { robots = node.getAttribute("content"); } })
        .transform(response).text();
      assert.equal(canonical, base + path);
      assert(!robots?.includes("noindex"), path);
    }
    const uppercase = await publicResponse(new Request(base + "/destinations/HU?view=country"), base);
    assert.equal(uppercase.status, 308);
    assert.equal(uppercase.headers.get("Location"), "/destinations/hu?view=country");
  `);
});

test("basic launch listings span supported destinations without contact routes", async () => {
  await checkIsolated(`
    const catalog = getCatalog();
    const basics = catalog.providers.filter(provider => provider.profileLevel === "basic");
    assert.equal(basics.length, 12);
    assert.deepEqual(
      [...new Set(basics.map(provider => provider.countryCode))].sort(),
      ["CR", "HU", "KR", "PT", "TH", "TR"],
    );
    assert(basics.every(provider =>
      !provider.address &&
      !provider.website &&
      !provider.contactUrl &&
      provider.sources.length > 0 &&
      catalog.offerings.some(offering => offering.providerId === provider.id)
    ));
    const treatmentIds = new Set(
      catalog.offerings
        .filter(offering => basics.some(provider => provider.id === offering.providerId))
        .map(offering => offering.treatmentId),
    );
    assert(treatmentIds.size >= 12);
    const response = await publicResponse(
      new Request(base + "/centers/asan-medical-center"),
      base,
    );
    assert.equal(response.status, 200);
    const html = await response.text();
    assert(html.includes("Contact information has not been added"));
    assert(!html.includes('href=""'));
  `);
});

test("destination resources add only configured affiliate tracking", () => {
  const destinationIds = [
    "istanbul",
    "bangkok",
    "seoul",
    "budapest",
    "san-jose",
    "lisbon",
  ];
  for (const id of destinationIds) {
    const resources = destinationTravelResources[id];
    assert(resources);
    assert.equal(resources.stays.length, 2);
    assert.equal(
      resources.stays.filter((option) => option.preferred).length,
      1,
    );
    assert(resources.guide.url.startsWith("https://"));
    assert(resources.entry.url.startsWith("https://"));
    assert(resources.visaHelp.url.startsWith("https://"));
  }
  const hotel = destinationTravelResources.istanbul!.stays.find(
    (option) => option.vendor === "Booking.com",
  );
  const rental = destinationTravelResources.istanbul!.stays.find(
    (option) => option.vendor === "Vrbo",
  );
  assert(hotel);
  assert(rental);
  const tracked = new URL(travelVendorUrl(hotel, "istanbul", "12345"));
  assert.equal(tracked.searchParams.get("aid"), "12345");
  assert.equal(
    tracked.searchParams.get("label"),
    "abroadmedclub-istanbul-hotel",
  );
  assert.equal(travelVendorUrl(hotel, "istanbul", "invalid"), hotel.url);
  assert.equal(travelVendorUrl(rental, "istanbul", "12345"), rental.url);
});

test("public keyword search finds normalized text in published service scope", async () => {
  await checkIsolated(`
    const catalog = getCatalog();
    const provider = catalog.providers[0];
    assert(provider);
    const offerings = catalog.offerings.filter(item => item.providerId === provider.id);
    assert(offerings[0]);
    offerings[0] = { ...offerings[0], scope: [...offerings[0].scope, "Directory fixture café scope"] };
    const draft = saveDraft(provider.id, { provider, offerings }, "reviewer");
    publishDraft(provider.id, "reviewer", draft.provider.updatedAt);
    const response = await publicResponse(new Request(base + "/centers?q=cafe"), base);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert(html.includes('href="/centers/' + provider.id + '"'), "service-only search match must be visible without JavaScript");
  `);
});

test("private writes require the expected account and a still-live session", async () => {
  await checkIsolated(`
    import { api } from "./server/api.ts";
    import { parseApiResponse } from "./src/healthcare/schemas.ts";
    const credentials = { email: "session-regression@example.invalid", password: "private-session-regression-2040" };
    const call = (path, method, body, token, expected) => api(new Request(base + "/api" + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: "Bearer " + token } : {}),
        ...(expected ? { "X-AMC-Expected-Account": expected } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }), path, "session-regression", true);
    const signed = parseApiResponse("/auth/register", "POST", await (
      await call("/auth/register", "POST", { ...credentials, name: "Session regression" })
    ).json());
    const plan = { countryCode: getCatalog().countries[0].code, city: "Regression city", startsOn: "2037-06-10", endsOn: "2037-06-15", mode: "independent", consent: true };
    const mismatch = await call("/travel/trips", "POST", plan, signed.token, "a-different-account");
    assert.equal(mismatch.status, 409);
    assert.equal(mismatch.headers.get("X-AMC-Account"), signed.user.id);

    let releaseBody;
    const { promise: reading, resolve: notifyReader } = Promise.withResolvers();
    // Zero high-water mark signals only when the API actually waits for this body.
    const body = new ReadableStream({
      pull(controller) {
        releaseBody = () => {
          controller.enqueue(new TextEncoder().encode(JSON.stringify(plan)));
          controller.close();
        };
        notifyReader();
      },
    }, { highWaterMark: 0 });
    const pending = api(new Request(base + "/api/travel/trips", {
      method: "POST", body,
      headers: { "content-type": "application/json", authorization: "Bearer " + signed.token },
    }), "/travel/trips", "session-regression", true);
    await reading;
    assert.equal((await call("/auth/logout", "POST", {}, signed.token)).status, 200);
    releaseBody();
    await assert.rejects(pending, { status: 401 });

    const signedAgain = parseApiResponse("/auth/login", "POST", await (
      await call("/auth/login", "POST", credentials)
    ).json());
    const plans = parseApiResponse("/travel/trips", "GET", await (
      await call("/travel/trips", "GET", undefined, signedAgain.token)
    ).json());
    assert.deepEqual(plans.items, [], "Neither rejected write may create a private plan");
  `);
});

test("account trips discover only matching public community circles", async () => {
  await checkIsolated(`
    import { api } from "./server/api.ts";
    import { db } from "./server/storage.ts";
    import { parseApiResponse } from "./src/healthcare/schemas.ts";
    import { parseTravelResponse } from "./src/travel/schemas.ts";

    const call = (path, method, body, token) => api(new Request(base + "/api" + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: "Bearer " + token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }), path, "community-match-regression", true);
    const firstRegistration = await call("/auth/register", "POST", {
      name: "Trip owner",
      email: "trip-match@example.invalid",
      password: "trip-match-regression-2040",
    });
    const signed = parseApiResponse(
      "/auth/register",
      "POST",
      await firstRegistration.json(),
    );
    const secondRegistration = await call("/auth/register", "POST", {
      name: "Other account",
      email: "other-trip-match@example.invalid",
      password: "other-trip-match-regression-2040",
    });
    const other = parseApiResponse(
      "/auth/register",
      "POST",
      await secondRegistration.json(),
    );
    const countries = getCatalog().countries;
    assert(countries[0] && countries[1]);
    const tripInput = {
      countryCode: countries[0].code,
      city: "São Paulo",
      startsOn: "2037-06-10",
      endsOn: "2037-06-15",
      mode: "independent",
      consent: true,
    };
    const createdTrip = parseTravelResponse(
      "/travel/trips",
      "POST",
      await (await call("/travel/trips", "POST", tripInput, signed.token)).json(),
    );

    const insertCircle = db.query(
      "INSERT INTO community_circles (id, owner_id, kind, state, payload, city_key, created_at, updated_at) VALUES (?, ?, 'travel', ?, ?, ?, ?, ?)",
    );
    let circleSequence = 0;
    const cityKey = (value) =>
      value.normalize("NFKC").toLocaleLowerCase("und");
    const addCircle = (id, state, countryCode, city, startsOn, endsOn) => {
      const time = new Date(Date.UTC(2040, 0, 1, 0, 0, circleSequence++)).toISOString();
      insertCircle.run(
        id,
        other.user.id,
        state,
        JSON.stringify({
          name: "Fixture " + id,
          description: "Public travel matching fixture.",
          countryCode,
          city,
          startsOn,
          endsOn,
        }),
        cityKey(city),
        time,
        time,
      );
    };
    addCircle("match-end-boundary", "open", tripInput.countryCode, "são paulo", "2037-06-01", tripInput.startsOn);
    addCircle("match-start-boundary", "open", tripInput.countryCode, "SÃO PAULO", tripInput.endsOn, "2037-06-20");
    addCircle("country-only-city", "open", tripInput.countryCode, "Another City", "2037-06-11", "2037-06-12");
    addCircle("wrong-country", "open", countries[1].code, tripInput.city, "2037-06-11", "2037-06-12");
    addCircle("ends-too-soon", "open", tripInput.countryCode, tripInput.city, "2037-06-01", "2037-06-09");
    addCircle("starts-too-late", "open", tripInput.countryCode, tripInput.city, "2037-06-16", "2037-06-20");
    addCircle("closed-overlap", "closed", tripInput.countryCode, tripInput.city, "2037-06-11", "2037-06-12");
    for (let index = 0; index < 29; index += 1) {
      addCircle(
        "match-page-" + String(index).padStart(2, "0"),
        "open",
        tripInput.countryCode,
        tripInput.city,
        "2037-06-11",
        "2037-06-12",
      );
    }

    const leakedCreate = {
      name: "Leaked private trip",
      description: "Must be rejected rather than publishing private fields.",
      countryCode: tripInput.countryCode,
      city: tripInput.city,
      startsOn: tripInput.startsOn,
      endsOn: tripInput.endsOn,
      alias: "Other traveler",
      allowMessages: false,
      consent: true,
      tripId: createdTrip.id,
      mode: createdTrip.mode,
      checklist: createdTrip.checklist,
      accountId: signed.user.id,
      providerId: "provider-private",
      treatment: "treatment-private",
      inquiryId: "inquiry-private",
    };
    const circlesBeforeRejectedCreate = db
      .query("SELECT COUNT(*) AS count FROM community_circles")
      .get().count;
    await assert.rejects(
      call("/community/circles", "POST", leakedCreate, other.token),
      { status: 400 },
    );
    assert.equal(
      db.query("SELECT COUNT(*) AS count FROM community_circles").get().count,
      circlesBeforeRejectedCreate,
    );

    const persistenceSnapshot = db.query(\`
      SELECT
        (SELECT COUNT(*) FROM community_circles) AS circles,
        (SELECT COUNT(*) FROM community_memberships) AS memberships,
        (SELECT COUNT(*) FROM audit) AS audits,
        (SELECT COUNT(*) FROM travel_trips) AS trips
    \`);
    const beforeDiscovery = persistenceSnapshot.get();
    const cityRequest = { tripId: createdTrip.id, scope: "city" };
    const cityFirst = parseTravelResponse(
      "/travel/community-matches",
      "POST",
      await (await call("/travel/community-matches", "POST", cityRequest, signed.token)).json(),
    );
    assert.deepEqual(cityFirst.source, {
      countryCode: tripInput.countryCode,
      city: tripInput.city,
      startsOn: tripInput.startsOn,
      endsOn: tripInput.endsOn,
      updatedAt: createdTrip.updatedAt,
    });
    assert.deepEqual(Object.keys(cityFirst.source).sort(), [
      "city",
      "countryCode",
      "endsOn",
      "startsOn",
      "updatedAt",
    ]);
    assert.deepEqual(Object.keys(cityFirst).sort(), [
      "destinationCircle",
      "source",
      "travelGroups",
    ]);
    assert.equal(cityFirst.destinationCircle?.kind, "destination");
    assert.equal(cityFirst.destinationCircle?.state, "open");
    assert.equal(cityFirst.destinationCircle?.countryCode, tripInput.countryCode);
    assert.equal(cityFirst.travelGroups.items.length, 30);
    assert(cityFirst.travelGroups.nextCursor);

    const citySecond = parseTravelResponse(
      "/travel/community-matches",
      "POST",
      await (await call("/travel/community-matches", "POST", {
        ...cityRequest,
        cursor: cityFirst.travelGroups.nextCursor,
      }, signed.token)).json(),
    );
    const cityIds = [...cityFirst.travelGroups.items, ...citySecond.travelGroups.items]
      .map((circle) => circle.id);
    assert.equal(cityIds.length, 31);
    assert(cityIds.includes("match-end-boundary"));
    assert(cityIds.includes("match-start-boundary"));
    assert(!cityIds.includes("country-only-city"));
    assert(!cityIds.includes("wrong-country"));
    assert(!cityIds.includes("ends-too-soon"));
    assert(!cityIds.includes("starts-too-late"));
    assert(!cityIds.includes("closed-overlap"));
    assert.equal(citySecond.travelGroups.nextCursor, null);

    const countryMatches = parseTravelResponse(
      "/travel/community-matches",
      "POST",
      await (await call("/travel/community-matches", "POST", {
        tripId: createdTrip.id,
        scope: "country",
      }, signed.token)).json(),
    );
    const countryIds = countryMatches.travelGroups.items.map((circle) => circle.id);
    assert(countryIds.includes("country-only-city"));
    assert(!countryIds.includes("wrong-country"));
    assert(!countryIds.includes("ends-too-soon"));
    assert(!countryIds.includes("starts-too-late"));
    assert(!countryIds.includes("closed-overlap"));

    const privateKeys = {
      tripId: true,
      mode: true,
      checklist: true,
      accountId: true,
      userId: true,
      providerId: true,
      treatment: true,
      inquiryId: true,
    };
    const visit = (value) => {
      if (!value || typeof value !== "object") return;
      for (const [key, child] of Object.entries(value)) {
        assert(!Object.hasOwn(privateKeys, key), "Private field leaked: " + key);
        visit(child);
      }
    };
    visit(cityFirst);
    assert.throws(() => parseTravelResponse(
      "/travel/community-matches",
      "POST",
      { ...cityFirst, checklist: {} },
    ));
    assert.throws(() => parseTravelResponse(
      "/travel/community-matches",
      "POST",
      { ...cityFirst, source: { ...cityFirst.source, tripId: createdTrip.id } },
    ));

    await assert.rejects(
      call("/travel/community-matches", "POST", cityRequest, other.token),
      { status: 404 },
    );
    await assert.rejects(
      call("/travel/community-matches", "POST", {
        tripId: createdTrip.id,
        scope: "country",
        cursor: cityFirst.travelGroups.nextCursor,
      }, signed.token),
      { status: 400 },
    );
    assert.deepEqual(
      persistenceSnapshot.get(),
      beforeDiscovery,
      "Discovery must not persist anything",
    );
    const updatedTrip = parseTravelResponse(
      "/travel/trips/" + createdTrip.id,
      "PATCH",
      await (await call("/travel/trips/" + createdTrip.id, "PATCH", {
        expectedUpdatedAt: createdTrip.updatedAt,
        patch: { mode: "partner" },
      }, signed.token)).json(),
    );
    assert.notEqual(updatedTrip.updatedAt, createdTrip.updatedAt);
    const beforeStaleCursor = persistenceSnapshot.get();
    await assert.rejects(
      call("/travel/community-matches", "POST", {
        ...cityRequest,
        cursor: cityFirst.travelGroups.nextCursor,
      }, signed.token),
      { status: 400 },
    );
    assert.deepEqual(
      persistenceSnapshot.get(),
      beforeStaleCursor,
      "A stale discovery cursor must not persist anything",
    );
  `);
});
