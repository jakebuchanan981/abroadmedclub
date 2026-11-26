import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Choice,
  colors,
  Icon,
  Notice,
  T,
  TextField,
} from "../ui";
import { request, useHealthcare } from "./client";
import type {
  Catalog,
  Inquiry,
  Offering,
  Price,
  Provider,
  ProviderApplication,
  SupportRequest,
} from "./types";
import { CommunityModerationPanel } from "../community/CommunityModerationPanel";
import { MessagingModerationPanel } from "../messaging/MessagingModerationPanel";

export function InquiryThread({
  id,
  onBack,
  onChange,
  staff = false,
}: {
  id: string;
  onBack: () => void;
  onChange: (inquiry: Inquiry) => void;
  staff?: boolean;
}) {
  const [thread, setThread] = useState<Inquiry | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    request<Inquiry>(`/inquiries/${encodeURIComponent(id)}`)
      .then((result) => {
        if (active) setThread(result);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "Could not load this conversation.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, reload]);
  async function update(close: boolean) {
    setBusy(true);
    setError("");
    try {
      const result = await request<Inquiry>(
        `/inquiries/${encodeURIComponent(id)}${close ? "" : "/messages"}`,
        {
          method: close ? "PATCH" : "POST",
          body: close ? { status: "closed" } : { body: body.trim() },
        },
      );
      setThread(result);
      onChange(result);
      setBody("");
      setConfirmClose(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update this conversation.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={styles.stack}>
      <View style={styles.actions}>
        <Button
          label="Back to inbox"
          variant="ghost"
          onPress={onBack}
          disabled={busy}
        />
        <Button
          label="Refresh conversation"
          variant="secondary"
          onPress={() => setReload((value) => value + 1)}
          disabled={busy || loading}
        />
      </View>
      {loading ? (
        <ActivityIndicator
          color={colors.teal}
          accessibilityLabel="Loading conversation"
        />
      ) : null}
      {error ? (
        <T accessibilityRole="alert" style={styles.error}>
          {error}
        </T>
      ) : null}
      {!loading && thread && (
        <>
          <T variant="h3">About {thread.providerName}</T>
          <T variant="small">
            Reference {thread.id} · {thread.status}
          </T>
          <Notice>
            {staff
              ? "You are replying as the AbroadMedClub directory team, not as a clinician or the provider."
              : "Private conversation with the AbroadMedClub directory team, not the clinic. Do not send medical records, diagnoses, identification documents or payment details. This inbox is not monitored for emergencies."}
          </Notice>
          {thread.messages.length === 0 ? (
            <T>No messages in this conversation.</T>
          ) : (
            thread.messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.message,
                  message.sender === "staff" && styles.operator,
                ]}
              >
                <T variant="label">
                  {message.sender === "staff"
                    ? "AbroadMedClub directory team"
                    : staff
                      ? "Account holder"
                      : "You"}
                </T>
                <T selectable>{message.body}</T>
                <T variant="small">
                  {new Date(message.createdAt).toLocaleString()}
                </T>
              </View>
            ))
          )}
          {thread.status === "closed" ? (
            <Notice>
              This conversation is closed. Start a new inquiry from a provider
              page if you have a different directory question.
            </Notice>
          ) : (
            <>
              <TextField
                label={staff ? "Directory team reply" : "Your reply"}
                value={body}
                onChangeText={setBody}
                multiline
                maxLength={2000}
                editable={!busy}
                placeholder="A brief directory question; no medical details"
              />
              <T variant="small">{body.length}/2000 characters</T>
              <View style={styles.actions}>
                <Button
                  label={busy ? "Saving…" : "Send reply to inbox"}
                  onPress={() => update(false)}
                  disabled={busy || !body.trim()}
                />
                <Button
                  label="Clear reply"
                  variant="ghost"
                  disabled={busy || !body}
                  onPress={() => setBody("")}
                />
                <Button
                  label="Close conversation"
                  variant="secondary"
                  onPress={() => setConfirmClose(true)}
                  disabled={busy}
                />
              </View>
              {confirmClose && (
                <View style={styles.stack}>
                  <T>
                    Close this conversation? No further replies can be added.
                  </T>
                  <View style={styles.actions}>
                    <Button
                      label="Confirm close"
                      onPress={() => update(true)}
                      disabled={busy}
                    />
                    <Button
                      label="Keep open"
                      variant="ghost"
                      onPress={() => setConfirmClose(false)}
                      disabled={busy}
                    />
                  </View>
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}
type StaffTab =
  | "inquiries"
  | "support"
  | "applications"
  | "catalog"
  | "community"
  | "member-reports";

function CatalogPicker({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const matches = options.filter((option) =>
    `${option.name} ${option.id}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <View style={styles.stack}>
      <T variant="label">{label}</T>
      <Button
        label={
          options.find((option) => option.id === value)?.name ??
          "Select an option"
        }
        variant="secondary"
        onPress={() => {
          setOpen(!open);
          setQuery("");
        }}
        disabled={disabled}
      />
      {open && (
        <View style={styles.stack}>
          <TextField
            label={`Search ${label.toLowerCase()}`}
            value={query}
            onChangeText={setQuery}
            editable={!disabled}
          />
          <ScrollView
            style={{ maxHeight: 220 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {matches.length === 0 ? (
              <T>No matching options.</T>
            ) : (
              matches.map((option) => (
                <Choice
                  key={option.id}
                  role="radio"
                  checked={option.id === value}
                  disabled={disabled}
                  onPress={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  style={styles.option}
                >
                  <T>{option.name}</T>
                  {option.id === value && <Icon name="Check" />}
                </Choice>
              ))
            )}
          </ScrollView>
          <Button
            label="Cancel selection"
            variant="ghost"
            onPress={() => setOpen(false)}
          />
        </View>
      )}
    </View>
  );
}

function OperatorQueue({
  kind,
}: {
  kind: "inquiries" | "support" | "applications";
}) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [support, setSupport] = useState<SupportRequest[]>([]);
  const [applications, setApplications] = useState<ProviderApplication[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const pending =
      kind === "inquiries"
        ? request<Inquiry[]>("/admin/inquiries").then((items) => {
            if (active) setInquiries(items);
          })
        : kind === "support"
          ? request<SupportRequest[]>("/admin/support").then((items) => {
              if (active) setSupport(items);
            })
          : request<ProviderApplication[]>("/admin/provider-applications").then(
              (items) => {
                if (active) setApplications(items);
              },
            );
    pending
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "Could not load the operator queue.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [kind, reload]);
  async function changeStatus(
    id: string,
    status: "closed" | "reviewing" | "approved" | "declined",
  ) {
    setBusy(id);
    setError("");
    try {
      await request(
        `/admin/${kind === "support" ? "support" : "provider-applications"}/${encodeURIComponent(id)}`,
        { method: "PATCH", body: { status } },
      );
      setReload((value) => value + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the decision.",
      );
    } finally {
      setBusy(null);
    }
  }
  if (selected)
    return (
      <InquiryThread
        key={selected}
        id={selected}
        staff
        onBack={() => {
          setSelected(null);
          setReload((value) => value + 1);
        }}
        onChange={(updated) =>
          setInquiries((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          )
        }
      />
    );
  return (
    <View style={styles.stack}>
      <Button
        label="Refresh queue"
        variant="secondary"
        disabled={loading || !!busy}
        onPress={() => setReload((value) => value + 1)}
      />
      {error ? (
        <T accessibilityRole="alert" style={styles.error}>
          {error}
        </T>
      ) : null}
      {loading ? (
        <ActivityIndicator
          accessibilityLabel="Loading staff queue"
          color={colors.teal}
        />
      ) : (
        !error && (
          <>
            {kind === "inquiries" &&
              (inquiries.length === 0 ? (
                <Notice>No operator inquiries.</Notice>
              ) : (
                inquiries.map((item) => (
                  <Card key={item.id} style={styles.card}>
                    <T variant="h3">{item.providerName}</T>
                    <T variant="small">
                      {item.id} · {item.status} ·{" "}
                      {new Date(item.updatedAt).toLocaleString()}
                    </T>
                    <Button
                      label="Read and reply"
                      onPress={() => setSelected(item.id)}
                    />
                  </Card>
                ))
              ))}
            {kind === "support" && (
              <>
                <Notice>
                  Support submissions are stored here. There is no support-email
                  sending endpoint; closing an item does not send a reply.
                </Notice>
                {support.length === 0 ? (
                  <T>No support submissions.</T>
                ) : (
                  support.map((item) => (
                    <Card key={item.id} style={styles.card}>
                      <T variant="h3">{item.topic}</T>
                      <T>
                        {item.name} · {item.email}
                      </T>
                      <T variant="small">
                        {item.id} · {item.status} ·{" "}
                        {new Date(item.createdAt).toLocaleString()}
                      </T>
                      <T selectable>{item.message}</T>
                      {item.status !== "closed" && (
                        <Button
                          label={
                            busy === item.id
                              ? "Closing…"
                              : "Mark support submission closed"
                          }
                          disabled={!!busy}
                          onPress={() => changeStatus(item.id, "closed")}
                        />
                      )}
                    </Card>
                  ))
                )}
              </>
            )}
            {kind === "applications" && (
              <>
                <Notice>
                  Application decisions are internal review statuses. Approval
                  does not establish a partnership, verify clinicians or publish
                  a listing. Create and source-review a separate independent
                  catalog record to publish.
                </Notice>
                {applications.length === 0 ? (
                  <T>No provider applications.</T>
                ) : (
                  applications.map((item) => (
                    <Card key={item.id} style={styles.card}>
                      <T variant="h3">{item.organization}</T>
                      <T>
                        {item.contactName} · {item.email}
                      </T>
                      <T selectable>{item.website}</T>
                      <T>
                        {item.city}, {item.countryCode}
                      </T>
                      <T variant="small">
                        {item.id} · {item.status} ·{" "}
                        {new Date(item.createdAt).toLocaleString()}
                      </T>
                      <T selectable>{item.message}</T>
                      <View style={styles.actions}>
                        {(["reviewing", "approved", "declined"] as const).map(
                          (status) => (
                            <Button
                              key={status}
                              label={
                                busy === item.id ? "Saving…" : `Mark ${status}`
                              }
                              variant={
                                item.status === status ? "primary" : "secondary"
                              }
                              disabled={!!busy || item.status === status}
                              onPress={() => changeStatus(item.id, status)}
                            />
                          ),
                        )}
                      </View>
                    </Card>
                  ))
                )}
              </>
            )}
          </>
        )
      )}
    </View>
  );
}

function OfferingEditor({
  offering,
  index,
  catalog,
  disabled,
  onChange,
  onRemove,
}: {
  offering: Offering;
  index: number;
  catalog: Catalog;
  disabled: boolean;
  onChange: (offering: Offering) => void;
  onRemove: () => void;
}) {
  const price = offering.price;
  function updatePrice(patch: Partial<Price>) {
    onChange({ ...offering, price: { ...price, ...patch } });
  }
  return (
    <Card style={styles.card}>
      <T variant="h3">Treatment offering {index + 1}</T>
      <TextField
        label="Offering ID (unique within catalog)"
        value={offering.id}
        onChangeText={(id) => onChange({ ...offering, id })}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
      />
      <CatalogPicker
        label="Treatment"
        value={offering.treatmentId}
        options={catalog.treatments}
        disabled={disabled}
        onChange={(treatmentId) => onChange({ ...offering, treatmentId })}
      />
      <TextField
        label="Service summary supported by source"
        value={offering.summary}
        onChangeText={(summary) => onChange({ ...offering, summary })}
        multiline
        editable={!disabled}
      />
      <TextField
        label="Published service scope (one item per line)"
        value={offering.scope.join("\n")}
        onChangeText={(value) =>
          onChange({ ...offering, scope: value.split("\n") })
        }
        multiline
        editable={!disabled}
      />
      <TextField
        label="Scope exclusions (one item per line)"
        value={offering.exclusions.join("\n")}
        onChangeText={(value) =>
          onChange({ ...offering, exclusions: value.split("\n") })
        }
        multiline
        editable={!disabled}
      />
      <TextField
        label="Public service source label"
        value={offering.source.label}
        onChangeText={(label) =>
          onChange({ ...offering, source: { ...offering.source, label } })
        }
        editable={!disabled}
      />
      <TextField
        label="Public service source URL (HTTPS, required)"
        value={offering.source.url}
        onChangeText={(url) =>
          onChange({ ...offering, source: { ...offering.source, url } })
        }
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        editable={!disabled}
      />
      <TextField
        label="Service source checked date (YYYY-MM-DD)"
        value={offering.source.checkedAt}
        onChangeText={(checkedAt) =>
          onChange({ ...offering, source: { ...offering.source, checkedAt } })
        }
        editable={!disabled}
      />
      <CatalogPicker
        label="Price publication type"
        value={price.kind}
        options={[
          { id: "not-published", name: "No published price" },
          { id: "quote-required", name: "Official source requires a quote" },
          { id: "fixed", name: "Published fixed price" },
          { id: "from", name: "Published starting price" },
          { id: "range", name: "Published range" },
        ]}
        disabled={disabled}
        onChange={(kind) =>
          onChange({
            ...offering,
            price: {
              kind: kind as Price["kind"],
              includes: price.includes,
              excludes: price.excludes,
            },
          })
        }
      />
      {(["fixed", "from", "range"] as string[]).includes(price.kind) && (
        <>
          <Notice>
            Only transcribe an actual current published price. Amounts use
            integer minor units: for example, USD 125.50 is 12550 with 2
            minor-unit digits. Do not estimate or convert prices.
          </Notice>
          <TextField
            label="Currency (ISO code, e.g. USD)"
            value={price.currency ?? ""}
            onChangeText={(currency) =>
              updatePrice({ currency: currency.toUpperCase() })
            }
            autoCapitalize="characters"
            maxLength={3}
            editable={!disabled}
          />
          <TextField
            label="Minor-unit digits (e.g. 2 for USD, 0 for JPY)"
            value={price.minorUnit === undefined ? "" : String(price.minorUnit)}
            keyboardType="number-pad"
            onChangeText={(value) => {
              if (/^\d*$/.test(value))
                updatePrice({
                  minorUnit: value === "" ? undefined : Number(value),
                });
            }}
            editable={!disabled}
          />
          <TextField
            label="Price / minimum amount (integer minor units)"
            value={
              price.amountMinor === undefined ? "" : String(price.amountMinor)
            }
            keyboardType="number-pad"
            onChangeText={(value) => {
              if (/^\d*$/.test(value))
                updatePrice({
                  amountMinor: value === "" ? undefined : Number(value),
                });
            }}
            editable={!disabled}
          />
          {price.kind === "range" && (
            <TextField
              label="Maximum amount (integer minor units)"
              value={
                price.maximumMinor === undefined
                  ? ""
                  : String(price.maximumMinor)
              }
              keyboardType="number-pad"
              onChangeText={(value) => {
                if (/^\d*$/.test(value))
                  updatePrice({
                    maximumMinor: value === "" ? undefined : Number(value),
                  });
              }}
              editable={!disabled}
            />
          )}
          <TextField
            label="Price unit (e.g. per consultation)"
            value={price.unit ?? ""}
            onChangeText={(unit) => updatePrice({ unit })}
            editable={!disabled}
          />
        </>
      )}
      {price.kind !== "not-published" && (
        <TextField
          label="Official price or quote-policy source URL (HTTPS)"
          value={price.sourceUrl ?? ""}
          onChangeText={(sourceUrl) => updatePrice({ sourceUrl })}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!disabled}
        />
      )}
      <TextField
        label="Price includes (one item per line)"
        value={price.includes.join("\n")}
        onChangeText={(value) => updatePrice({ includes: value.split("\n") })}
        multiline
        editable={!disabled}
      />
      <TextField
        label="Price excludes (one item per line)"
        value={price.excludes.join("\n")}
        onChangeText={(value) => updatePrice({ excludes: value.split("\n") })}
        multiline
        editable={!disabled}
      />
      <Button
        label="Remove offering from draft"
        variant="ghost"
        onPress={onRemove}
        disabled={disabled}
      />
    </Card>
  );
}

function ProviderEditor({
  initial,
  initialOfferings,
  catalog,
  isNew,
  onBack,
  onCatalogChange,
}: {
  initial: Provider;
  initialOfferings: Offering[];
  catalog: Catalog;
  isNew: boolean;
  onBack: () => void;
  onCatalogChange: () => void;
}) {
  const { refreshCatalog } = useHealthcare();
  const [provider, setProvider] = useState<Provider>(initial);
  const [offerings, setOfferings] = useState<Offering[]>(initialOfferings);
  const [persisted, setPersisted] = useState(!isNew);
  const [dirty, setDirty] = useState(isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [reviewUnavailable, setReviewUnavailable] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const basic = provider.profileLevel === "basic";
  function edit(patch: Partial<Provider>) {
    setProvider((value) => ({ ...value, ...patch }));
    setDirty(true);
    setConfirmed(false);
    setNotice("");
  }
  function editOfferings(next: Offering[]) {
    setOfferings(next);
    setDirty(true);
    setConfirmed(false);
    setNotice("");
  }
  async function save() {
    setError("");
    setNotice("");
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(provider.id) ||
      !provider.name.trim() ||
      !provider.city.trim() ||
      (!basic && !provider.address.trim()) ||
      !provider.countryCode ||
      !provider.summary.trim() ||
      (!basic && !provider.website.startsWith("https://")) ||
      (!basic && !provider.contactUrl.startsWith("https://")) ||
      (basic &&
        ((provider.website &&
          !provider.website.startsWith("https://")) ||
          (provider.contactUrl &&
            !provider.contactUrl.startsWith("https://")))) ||
      !provider.sources.length ||
      provider.sources.some(
        (source) =>
          !source.label.trim() ||
          !source.url.startsWith("https://") ||
          !source.checkedAt.trim(),
      )
    ) {
      setError(
        basic
          ? "Complete the provider ID, name, country, city, summary, and at least one labeled public HTTPS source with its checked date. Contact fields may stay blank on a basic discovery record."
          : "Complete the provider ID, name, country, city, published address, summary, HTTPS official website/contact route, and at least one labeled public source with its checked date.",
      );
      return;
    }
    if (
      !offerings.length ||
      offerings.some(
        (offering) =>
          !offering.id.trim() ||
          !offering.treatmentId ||
          !offering.summary.trim() ||
          !offering.scope.some((value) => value.trim()) ||
          !offering.source.url.startsWith("https://") ||
          !offering.source.label.trim() ||
          !offering.source.checkedAt,
      )
    ) {
      setError(
        "Include at least one offering. Every offering needs a unique ID, selected treatment, summary, service scope, labeled public HTTPS source and checked date.",
      );
      return;
    }
    setBusy(true);
    try {
      const result = await request<{
        provider: Provider;
        offerings: Offering[];
      }>(`/admin/providers/${encodeURIComponent(provider.id)}`, {
        method: "PUT",
        body: {
          provider: {
            ...provider,
            name: provider.name.trim(),
            city: provider.city.trim(),
            status: "draft",
            listingKind: "independent",
            languages: provider.languages
              .map((value) => value.trim())
              .filter(Boolean),
            facilities: provider.facilities
              .map((value) => value.trim())
              .filter(Boolean),
          },
          offerings: offerings.map((offering) => ({
            ...offering,
            providerId: provider.id,
            scope: offering.scope.map((value) => value.trim()).filter(Boolean),
            exclusions: offering.exclusions
              .map((value) => value.trim())
              .filter(Boolean),
            price: {
              ...offering.price,
              includes: offering.price.includes
                .map((value) => value.trim())
                .filter(Boolean),
              excludes: offering.price.excludes
                .map((value) => value.trim())
                .filter(Boolean),
            },
          })),
        },
      });
      setProvider(result.provider);
      setOfferings(result.offerings);
      setPersisted(true);
      setDirty(false);
      setConfirmed(false);
      setReviewUnavailable(false);
      setNotice(
        "Draft revision saved on the server. Review this exact saved revision before publishing.",
      );
      onCatalogChange();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The draft could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function changePublication(action: "publish" | "suspend") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request(
        `/admin/providers/${encodeURIComponent(provider.id)}/${action}`,
        {
          method: "POST",
          body:
            action === "publish"
              ? { reviewConfirmed: true, reviewedUpdatedAt: provider.updatedAt }
              : {},
        },
      );
      setProvider((value) => ({
        ...value,
        status: action === "publish" ? "published" : "suspended",
      }));
      setConfirmed(false);
      setConfirmSuspend(false);
      setNotice(
        action === "publish"
          ? "Saved revision published. Source review is not clinical verification or a partnership."
          : "Listing suspended. New inquiries for this provider are blocked by the server.",
      );
      onCatalogChange();
      try {
        await refreshCatalog();
      } catch (err) {
        setError(
          `The server updated publication, but the public directory could not refresh: ${err instanceof Error ? err.message : "try refreshing the directory"}`,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Publication status could not be updated.",
      );
      setConfirmed(false);
      if (action === "publish") {
        // The shared request helper exposes error messages, not HTTP status.
        // Reload after every failed publish, including revision conflicts.
        setReviewUnavailable(true);
        try {
          const latest = await request<Catalog>("/admin/catalog");
          const revision = latest.providers.find(
            (item) => item.id === provider.id,
          );
          if (!revision)
            throw new Error("This provider is no longer in the staff catalog.");
          setProvider(revision);
          setOfferings(
            latest.offerings.filter((item) => item.providerId === revision.id),
          );
          setDirty(false);
          setReviewUnavailable(false);
          setConfirmSuspend(false);
          setNotice(
            "The latest server revision is now displayed. Review all current fields and sources again before confirming publication.",
          );
          onCatalogChange();
        } catch (refreshError) {
          setError(
            `Publication was not confirmed and the latest revision could not be loaded. Return to the catalog and refresh before reviewing again. ${refreshError instanceof Error ? refreshError.message : ""}`,
          );
        }
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={styles.stack}>
      <Button
        label="Back to catalog"
        variant="ghost"
        disabled={busy}
        onPress={() => {
          if (dirty) setConfirmDiscard(true);
          else onBack();
        }}
      />
      {confirmDiscard && (
        <Notice>
          There are unsaved changes.{" "}
          <T onPress={onBack} accessibilityRole="button">
            Discard changes and return
          </T>
        </Notice>
      )}
      {confirmDiscard && (
        <Button
          label="Keep editing"
          variant="secondary"
          onPress={() => setConfirmDiscard(false)}
        />
      )}
      <T variant="h3">
        {persisted ? provider.name : "Create independent provider listing"}
      </T>
      <T variant="small">
        Revision status: {persisted ? provider.status : "not saved"} ·{" "}
        {dirty ? "Unsaved changes" : "Saved revision"}
      </T>
      <Notice>
        Public sources establish what an organization or directory publishes,
        not clinician licensing, care quality, safety or suitability. Do not
        create partner claims or unsupported prices. Saving creates a draft;
        only explicit source review publishes it.
      </Notice>
      <View style={styles.actions}>
        <Chip
          label="Basic discovery record"
          active={basic}
          onPress={() => !busy && edit({ profileLevel: "basic" })}
        />
        <Chip
          label="Detailed provider profile"
          active={!basic}
          onPress={() => !busy && edit({ profileLevel: "detailed" })}
        />
      </View>
      {basic && (
        <Notice>
          Contact fields may remain blank. Keep the record factual, identify the
          third-party directory or other public source, and do not imply provider
          participation.
        </Notice>
      )}
      <T variant="small">
        A draft may coexist with a previously published revision. Saving a draft
        does not remove the live listing; use suspension to remove public
        access.
      </T>
      <TextField
        label="Provider ID (lowercase words separated by hyphens)"
        value={provider.id}
        onChangeText={(id) => edit({ id })}
        editable={!busy && !persisted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextField
        label="Official organization name"
        value={provider.name}
        onChangeText={(name) => edit({ name })}
        editable={!busy}
      />
      <CatalogPicker
        label="Country"
        value={provider.countryCode}
        options={catalog.countries.map((country) => ({
          id: country.code,
          name: country.name,
        }))}
        disabled={busy}
        onChange={(countryCode) => edit({ countryCode })}
      />
      <TextField
        label="City"
        value={provider.city}
        onChangeText={(city) => edit({ city })}
        editable={!busy}
      />
      <TextField
        label={
          basic
            ? "Address (optional for basic discovery records)"
            : "Published address (required)"
        }
        value={provider.address}
        onChangeText={(address) => edit({ address })}
        multiline
        editable={!busy}
      />
      <TextField
        label={
          basic
            ? "Official website URL (optional)"
            : "Official website URL (HTTPS, required)"
        }
        value={provider.website}
        onChangeText={(website) => edit({ website })}
        editable={!busy}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <TextField
        label={
          basic
            ? "Official contact page URL (optional)"
            : "Official contact page URL (HTTPS, required)"
        }
        value={provider.contactUrl}
        onChangeText={(contactUrl) => edit({ contactUrl })}
        editable={!busy}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <TextField
        label="Factual directory summary"
        value={provider.summary}
        onChangeText={(summary) => edit({ summary })}
        editable={!busy}
        multiline
      />
      <TextField
        label="Published languages (one per line; leave blank if unknown)"
        value={provider.languages.join("\n")}
        onChangeText={(value) => edit({ languages: value.split("\n") })}
        editable={!busy}
        multiline
      />
      <TextField
        label="Published facilities (one per line; source-backed only)"
        value={provider.facilities.join("\n")}
        onChangeText={(value) => edit({ facilities: value.split("\n") })}
        editable={!busy}
        multiline
      />
      <T variant="h3">{basic ? "Public sources" : "Official sources"}</T>
      {provider.sources.map((source, index) => (
        <Card key={index} style={styles.card}>
          <TextField
            label={`Source ${index + 1} label`}
            value={source.label}
            onChangeText={(label) =>
              edit({
                sources: provider.sources.map((item, i) =>
                  i === index ? { ...item, label } : item,
                ),
              })
            }
            editable={!busy}
          />
          <TextField
            label={`Source ${index + 1} public HTTPS URL`}
            value={source.url}
            onChangeText={(url) =>
              edit({
                sources: provider.sources.map((item, i) =>
                  i === index ? { ...item, url } : item,
                ),
              })
            }
            editable={!busy}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TextField
            label={`Source ${index + 1} checked date (YYYY-MM-DD)`}
            value={source.checkedAt}
            onChangeText={(checkedAt) =>
              edit({
                sources: provider.sources.map((item, i) =>
                  i === index ? { ...item, checkedAt } : item,
                ),
              })
            }
            editable={!busy}
          />
          <Button
            label="Remove source"
            variant="ghost"
            disabled={busy}
            onPress={() =>
              edit({ sources: provider.sources.filter((_, i) => i !== index) })
            }
          />
        </Card>
      ))}
      <Button
        label="Add public source"
        variant="secondary"
        disabled={busy}
        onPress={() =>
          edit({
            sources: [
              ...provider.sources,
              { label: "", url: "", checkedAt: "" },
            ],
          })
        }
      />
      <T variant="h3">Published practitioner information</T>
      <T variant="small">
        Optional official roster information only. This is not license
        verification.
      </T>
      {provider.practitioners.map((practitioner, index) => (
        <Card key={index} style={styles.card}>
          <TextField
            label="Practitioner name"
            value={practitioner.name}
            onChangeText={(name) =>
              edit({
                practitioners: provider.practitioners.map((item, i) =>
                  i === index ? { ...item, name } : item,
                ),
              })
            }
            editable={!busy}
          />
          <TextField
            label="Published role"
            value={practitioner.role}
            onChangeText={(role) =>
              edit({
                practitioners: provider.practitioners.map((item, i) =>
                  i === index ? { ...item, role } : item,
                ),
              })
            }
            editable={!busy}
          />
          <TextField
            label="Official practitioner source URL"
            value={practitioner.sourceUrl}
            onChangeText={(sourceUrl) =>
              edit({
                practitioners: provider.practitioners.map((item, i) =>
                  i === index ? { ...item, sourceUrl } : item,
                ),
              })
            }
            editable={!busy}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            label="Remove practitioner"
            variant="ghost"
            disabled={busy}
            onPress={() =>
              edit({
                practitioners: provider.practitioners.filter(
                  (_, i) => i !== index,
                ),
              })
            }
          />
        </Card>
      ))}
      <Button
        label="Add published practitioner"
        variant="secondary"
        disabled={busy}
        onPress={() =>
          edit({
            practitioners: [
              ...provider.practitioners,
              { name: "", role: "", sourceUrl: "" },
            ],
          })
        }
      />
      <T variant="h3">Source-attributed credential claims</T>
      <T variant="small">
        Optional claims must name a source and explain their limits. Do not
        describe them as independently verified.
      </T>
      {provider.credentialClaims.map((claim, index) => (
        <Card key={index} style={styles.card}>
          <TextField
            label="Source-attributed credential claim"
            value={claim.label}
            onChangeText={(label) =>
              edit({
                credentialClaims: provider.credentialClaims.map((item, i) =>
                  i === index ? { ...item, label } : item,
                ),
              })
            }
            editable={!busy}
          />
          <TextField
            label="Claim source URL"
            value={claim.sourceUrl}
            onChangeText={(sourceUrl) =>
              edit({
                credentialClaims: provider.credentialClaims.map((item, i) =>
                  i === index ? { ...item, sourceUrl } : item,
                ),
              })
            }
            editable={!busy}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label="Attribution, limitations and date caveats"
            value={claim.note}
            onChangeText={(note) =>
              edit({
                credentialClaims: provider.credentialClaims.map((item, i) =>
                  i === index ? { ...item, note } : item,
                ),
              })
            }
            editable={!busy}
            multiline
          />
          <Button
            label="Remove credential claim"
            variant="ghost"
            disabled={busy}
            onPress={() =>
              edit({
                credentialClaims: provider.credentialClaims.filter(
                  (_, i) => i !== index,
                ),
              })
            }
          />
        </Card>
      ))}
      <Button
        label="Add source-attributed claim"
        variant="secondary"
        disabled={busy}
        onPress={() =>
          edit({
            credentialClaims: [
              ...provider.credentialClaims,
              { label: "", sourceUrl: "", note: "" },
            ],
          })
        }
      />
      <T variant="h3">Treatment offerings</T>
      <T variant="small">
        Only add services explicitly supported by a public source. Removing an
        offering takes effect after publishing the saved revision.
      </T>
      {offerings.length === 0 && (
        <Notice>
          No treatment offerings in this draft. Add supported services before
          publication.
        </Notice>
      )}
      {offerings.map((offering, index) => (
        <OfferingEditor
          key={index}
          index={index}
          offering={offering}
          catalog={catalog}
          disabled={busy}
          onChange={(next) =>
            editOfferings(
              offerings.map((item, i) => (i === index ? next : item)),
            )
          }
          onRemove={() =>
            editOfferings(offerings.filter((_, i) => i !== index))
          }
        />
      ))}
      <Button
        label="Add treatment offering"
        variant="secondary"
        disabled={busy}
        onPress={() =>
          editOfferings([
            ...offerings,
            {
              id: "",
              providerId: provider.id,
              treatmentId: "",
              summary: "",
              scope: [],
              exclusions: [],
              price: { kind: "not-published", includes: [], excludes: [] },
              source: { label: "", url: "", checkedAt: "" },
            },
          ])
        }
      />
      {error ? (
        <T accessibilityRole="alert" style={styles.error}>
          {error}
        </T>
      ) : null}
      {notice ? <T accessibilityLiveRegion="polite">{notice}</T> : null}
      <Button
        label={busy ? "Saving…" : "Save draft revision"}
        onPress={save}
        disabled={busy || !dirty}
      />
      <Choice
        role="checkbox"
        accessibilityLabel="Confirm source review of saved revision"
        checked={confirmed}
        disabled={
          busy ||
          dirty ||
          reviewUnavailable ||
          !persisted ||
          provider.status !== "draft"
        }
        onPress={() => setConfirmed((value) => !value)}
        style={styles.option}
      >
        <Icon name={confirmed ? "CheckCircle2" : "Circle"} />
        <T style={{ flex: 1 }} variant="small">
          I reviewed this saved revision against its public sources, including
          each service scope and any price. This is source review only, not
          clinician verification, a safety endorsement or partnership approval.
        </T>
      </Choice>
      <Button
        label="Publish reviewed draft"
        disabled={
          busy ||
          dirty ||
          reviewUnavailable ||
          !persisted ||
          !confirmed ||
          provider.status !== "draft"
        }
        onPress={() => changePublication("publish")}
      />
      {persisted && provider.status !== "suspended" && (
        <Button
          label="Suspend public listing"
          variant="secondary"
          disabled={busy || dirty}
          onPress={() => setConfirmSuspend(true)}
        />
      )}
      {confirmSuspend && (
        <View style={styles.stack}>
          <Notice>
            Suspension removes this provider and its services from the public
            directory and blocks new inquiries.
          </Notice>
          <View style={styles.actions}>
            <Button
              label="Confirm suspension"
              disabled={busy}
              onPress={() => changePublication("suspend")}
            />
            <Button
              label="Cancel suspension"
              variant="ghost"
              disabled={busy}
              onPress={() => setConfirmSuspend(false)}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function CatalogWorkspace() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{
    provider: Provider;
    offerings: Offering[];
    isNew: boolean;
  } | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    request<Catalog>("/admin/catalog")
      .then((result) => {
        if (active) setCatalog(result);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "Could not load staff catalog.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload]);
  if (selected && catalog)
    return (
      <ProviderEditor
        initial={selected.provider}
        initialOfferings={selected.offerings}
        catalog={catalog}
        isNew={selected.isNew}
        onBack={() => {
          setSelected(null);
          setReload((value) => value + 1);
        }}
        onCatalogChange={() => setReload((value) => value + 1)}
      />
    );
  return (
    <View style={styles.stack}>
      <View style={styles.actions}>
        <Button
          label="Refresh full catalog"
          variant="secondary"
          disabled={loading}
          onPress={() => setReload((value) => value + 1)}
        />
        <Button
          label="Create provider draft"
          disabled={loading || !catalog}
          onPress={() =>
            setSelected({
              isNew: true,
              offerings: [],
              provider: {
                id: "",
                name: "",
                countryCode: "",
                city: "",
                address: "",
                website: "",
                summary: "",
                languages: [],
                facilities: [],
                practitioners: [],
                credentialClaims: [],
                sources: [{ label: "", url: "", checkedAt: "" }],
                status: "draft",
                listingKind: "independent",
                profileLevel: "detailed",
                contactUrl: "",
                updatedAt: new Date().toISOString(),
              },
            })
          }
        />
      </View>
      {error ? (
        <T accessibilityRole="alert" style={styles.error}>
          {error}
        </T>
      ) : null}
      {loading ? (
        <ActivityIndicator
          accessibilityLabel="Loading full catalog"
          color={colors.teal}
        />
      ) : (
        catalog && (
          <>
            <TextField
              label="Find a provider by name, city or status"
              value={query}
              onChangeText={setQuery}
            />
            {catalog.providers.filter((provider) =>
              `${provider.name} ${provider.city} ${provider.status}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            ).length === 0 && (
              <Notice>
                No matching providers. Create a draft to add an independently
                sourced organization.
              </Notice>
            )}
            {catalog.providers
              .filter((provider) =>
                `${provider.name} ${provider.city} ${provider.status}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((provider) => (
                <Card key={provider.id} style={styles.card}>
                  <T variant="h3">{provider.name}</T>
                  <T>
                    {provider.city}, {provider.countryCode} · {provider.status}
                  </T>
                  <T variant="small">{provider.id}</T>
                  <Button
                    label="Edit / review listing"
                    variant="secondary"
                    onPress={() =>
                      setSelected({
                        provider,
                        offerings: catalog.offerings.filter(
                          (offering) => offering.providerId === provider.id,
                        ),
                        isNew: false,
                      })
                    }
                  />
                </Card>
              ))}
          </>
        )
      )}
    </View>
  );
}

function StaffWorkspace() {
  const [tab, setTab] = useState<StaffTab | null>(null);
  return (
    <Card style={styles.console}>
      <T variant="eyebrow">Staff only</T>
      <T variant="h2">Directory & community operations</T>
      <Notice>
        Operator records are private. Every operation is authorized by the
        server. These controls manage directory records and reported community
        content, not a clinic’s appointment system. Unreported private member
        conversations are not available through moderation.
      </Notice>
      <View style={styles.actions}>
        {(
          [
            { id: "inquiries", label: "Inquiry inbox" },
            { id: "support", label: "Support" },
            { id: "applications", label: "Provider applications" },
            { id: "catalog", label: "Catalog review" },
            { id: "community", label: "Community reports" },
            { id: "member-reports", label: "Member-message reports" },
          ] as const
        ).map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            active={tab === item.id}
            onPress={() => setTab(item.id)}
          />
        ))}
      </View>
      {tab ? (
        <>
          <Button
            label="Close staff workspace"
            variant="ghost"
            onPress={() => setTab(null)}
          />
          {tab === "catalog" ? (
            <CatalogWorkspace />
          ) : tab === "community" ? (
            <CommunityModerationPanel />
          ) : tab === "member-reports" ? (
            <MessagingModerationPanel />
          ) : (
            <OperatorQueue key={tab} kind={tab} />
          )}
        </>
      ) : (
        <T>Choose a queue or open the catalog editor.</T>
      )}
    </Card>
  );
}

export function StaffConsole() {
  const { user, sessionLoading } = useHealthcare();
  if (sessionLoading || user?.role !== "staff") return null;
  return <StaffWorkspace key={user.id} />;
}

const styles = StyleSheet.create({
  console: { padding: 24, gap: 18 },
  stack: { gap: 14 },
  card: { padding: 18, gap: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  option: {
    minHeight: 46,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  error: { color: colors.red },
  message: {
    padding: 16,
    gap: 8,
    borderRadius: 12,
    backgroundColor: colors.cream,
  },
  operator: { backgroundColor: colors.sage },
});
