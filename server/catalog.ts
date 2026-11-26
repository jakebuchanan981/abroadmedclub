import { seedCatalog } from "../src/healthcare/catalog";
import type { Catalog, Offering, Provider } from "../src/healthcare/types";
import { audit, db } from "./storage";
import { ApiError, providerRevision } from "./validation";

export type Revision = { provider: Provider; offerings: Offering[] };
type ProviderRow = {
  id: string;
  state: Provider["status"];
  published: string | null;
  draft: string | null;
  revision: number;
};

// Seed only missing rows: restarting must never overwrite reviewed changes or suspensions.
db.transaction(() => {
  const insert = db.query(
    "INSERT OR IGNORE INTO providers (id, state, published, draft, revision) VALUES (?, ?, ?, ?, 1)",
  );
  for (const provider of seedCatalog.providers) {
    const revision: Revision = {
      provider: { ...provider, listingKind: "independent" },
      offerings: seedCatalog.offerings.filter(
        (offering) => offering.providerId === provider.id,
      ),
    };
    const serialized = JSON.stringify(revision);
    insert.run(
      provider.id,
      provider.status,
      provider.status === "published" ? serialized : null,
      provider.status === "draft" ? serialized : null,
    );
  }
})();

export function getCatalog(admin = false): Catalog {
  const providers: Provider[] = [];
  const offerings: Offering[] = [];
  const rows = db
    .query<ProviderRow, []>(
      "SELECT id, state, published, draft, revision FROM providers ORDER BY id",
    )
    .all();
  for (const row of rows) {
    const serialized = admin
      ? row.draft || row.published
      : row.state === "published"
        ? row.published
        : null;
    if (!serialized) continue;
    const revision = JSON.parse(serialized) as Revision;
    providers.push({
      ...revision.provider,
      status:
        row.state === "suspended"
          ? "suspended"
          : admin && row.draft
            ? "draft"
            : row.state,
    });
    offerings.push(...revision.offerings);
  }
  return { ...seedCatalog, providers, offerings };
}

export function saveDraft(
  id: string,
  payload: unknown,
  actorId: string,
): Revision {
  const revision = providerRevision(payload, id, seedCatalog);
  return db.transaction(() => {
    assertOfferingIdsAvailable(id, revision.offerings);
    const previous = db
      .query<ProviderRow, [string]>("SELECT * FROM providers WHERE id = ?")
      .get(id);
    const number = (previous?.revision || 0) + 1;
    const priorPayload = previous?.draft || previous?.published;
    const priorTimestamp = priorPayload
      ? Date.parse((JSON.parse(priorPayload) as Revision).provider.updatedAt)
      : 0;
    revision.provider.updatedAt = new Date(
      Math.max(
        Date.now(),
        (Number.isFinite(priorTimestamp) ? priorTimestamp : 0) + 1,
      ),
    ).toISOString();
    db.query(
      "INSERT INTO providers (id, state, draft, revision) VALUES (?, 'draft', ?, ?) ON CONFLICT(id) DO UPDATE SET draft = excluded.draft, revision = excluded.revision",
    ).run(id, JSON.stringify(revision), number);
    audit(actorId, "provider.draft", id, number, revision);
    return revision;
  })();
}

function assertOfferingIdsAvailable(
  providerId: string,
  offerings: Offering[],
): void {
  const requested = new Set(offerings.map((offering) => offering.id));
  for (const row of db
    .query<ProviderRow, [string]>("SELECT * FROM providers WHERE id != ?")
    .all(providerId)) {
    for (const serialized of [row.published, row.draft]) {
      if (
        serialized &&
        (JSON.parse(serialized) as Revision).offerings.some((offering) =>
          requested.has(offering.id),
        )
      ) {
        throw new ApiError(
          409,
          "An offering ID is already assigned to another provider.",
        );
      }
    }
  }
}

export function publishDraft(
  id: string,
  actorId: string,
  reviewedUpdatedAt: string,
): void {
  db.transaction(() => {
    const row = db
      .query<ProviderRow, [string]>("SELECT * FROM providers WHERE id = ?")
      .get(id);
    if (!row) throw new ApiError(404, "Provider not found.");
    if (!row.draft)
      throw new ApiError(409, "Save a complete draft before publishing.");
    // Validate again against the current taxonomy; the audit retains the exact reviewed draft.
    const draft = JSON.parse(row.draft) as Revision;
    if (draft.provider.updatedAt !== reviewedUpdatedAt)
      throw new ApiError(
        409,
        "The draft changed after your review. Reload and review the current revision before publishing.",
      );
    providerRevision(draft, id, seedCatalog);
    assertOfferingIdsAvailable(id, draft.offerings);
    const published: Revision = {
      ...draft,
      provider: {
        ...draft.provider,
        status: "published",
        listingKind: "independent",
      },
    };
    db.query(
      "UPDATE providers SET state = 'published', published = ?, draft = NULL WHERE id = ?",
    ).run(JSON.stringify(published), id);
    audit(actorId, "provider.publish.review-confirmed", id, row.revision, {
      reviewed: draft,
      published,
    });
  })();
}

export function suspendProvider(id: string, actorId: string): void {
  db.transaction(() => {
    const row = db
      .query<ProviderRow, [string]>("SELECT * FROM providers WHERE id = ?")
      .get(id);
    if (!row) throw new ApiError(404, "Provider not found.");
    db.query("UPDATE providers SET state = 'suspended' WHERE id = ?").run(id);
    audit(actorId, "provider.suspend", id, row.revision);
  })();
}

export function publishedTarget(
  providerId: string,
  offeringId?: string,
): Revision {
  const row = db
    .query<ProviderRow, [string]>("SELECT * FROM providers WHERE id = ?")
    .get(providerId);
  if (!row || row.state !== "published" || !row.published)
    throw new ApiError(
      404,
      "This provider is not currently available for inquiries.",
    );
  const revision = JSON.parse(row.published) as Revision;
  if (
    offeringId &&
    !revision.offerings.some((offering) => offering.id === offeringId)
  )
    throw new ApiError(
      400,
      "The offering does not belong to this published provider.",
    );
  return revision;
}
