import React, { useRef, useState } from "react";
import { View } from "react-native";
import { countries } from "../healthcare/catalog-data";
import { useHealthcare } from "../healthcare/client";
import {
  Button,
  Chip,
  colors,
  Icon,
  Notice,
  Sheet,
  T,
  TextField,
  Choice,
} from "../ui";
import { legacyDestinationPlaces, planModes, tripChecklist } from "./planning";
import { tripInputSchema } from "./schemas";
import { useTravel } from "./TravelProvider";
import type { AccountTrip, TripChecklist, TripInput, TripPatch } from "./types";

function tripDraft(trip: TripInput): TripInput {
  const { countryCode, city, startsOn, endsOn, mode } = trip;
  return { countryCode, city, startsOn, endsOn, mode };
}

export function AccountTripEditor({
  trip,
  destinationId,
  onClose,
  onSaved,
}: {
  trip?: AccountTrip;
  destinationId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useHealthcare();
  const owner = useRef(user?.id);
  const alive = useRef(true);
  React.useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const activeOwner = useRef(user?.id);
  activeOwner.current = user?.id;
  const travel = useTravel();
  const place =
    destinationId && Object.hasOwn(legacyDestinationPlaces, destinationId)
      ? legacyDestinationPlaces[destinationId]
      : undefined;
  const [base, setBase] = useState(trip);
  const [draft, setDraft] = useState<TripInput>(
    trip
      ? tripDraft(trip)
      : {
          countryCode: place?.countryCode ?? "",
          city: place?.city ?? "",
          startsOn: "",
          endsOn: "",
          mode: "independent",
        },
  );
  const [checklist, setChecklist] = useState<TripChecklist>(
    trip?.checklist ?? {},
  );
  const [countryQuery, setCountryQuery] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<AccountTrip | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  function changedFields(): TripPatch {
    if (!base) return draft;
    const patch: TripPatch = {};
    if (draft.countryCode !== base.countryCode)
      patch.countryCode = draft.countryCode;
    if (draft.city !== base.city) patch.city = draft.city;
    if (draft.startsOn !== base.startsOn) patch.startsOn = draft.startsOn;
    if (draft.endsOn !== base.endsOn) patch.endsOn = draft.endsOn;
    if (draft.mode !== base.mode) patch.mode = draft.mode;
    if (
      tripChecklist.some(
        (item) =>
          Boolean(checklist[item.id as keyof TripChecklist]) !==
          Boolean(base.checklist[item.id as keyof TripChecklist]),
      )
    )
      patch.checklist = checklist;
    return patch;
  }
  async function save() {
    if (lock.current || travel.pending) return;
    const parsed = tripInputSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Review your trip details.");
      return;
    }
    if (!base && !consent) {
      setError("Confirm account storage before saving.");
      return;
    }
    const patch = changedFields();
    if (base && Object.keys(patch).length === 0) {
      setError("There are no changes to save.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      if (base) await travel.updateAccountTrip(base, patch);
      else await travel.createAccountTrip(parsed.data);
      if (alive.current && owner.current === activeOwner.current) onSaved();
    } catch (cause) {
      if (alive.current && owner.current === activeOwner.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Your plan was not saved. Your edits remain here.",
        );
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function loadLatest() {
    if (!base || lock.current || travel.pending) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await travel.getTrip(base.id);
      if (alive.current && owner.current === activeOwner.current) {
        setLatest(result);
        setError(null);
      }
    } catch (cause) {
      if (alive.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load the latest trip.",
        );
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const country = countries.find((item) => item.code === draft.countryCode);
  return (
    <Sheet
      visible
      onClose={() => {
        if (!busy) onClose();
      }}
      title={base ? "Edit account trip" : "Create account trip"}
      subtitle="Private to your account. This is a plan, not a booking."
    >
      <Notice icon="LockKeyhole">
        Account plans are stored on the service, not in this device’s local plan
        storage. Do not add medical details. No provider or organizer is
        contacted.
      </Notice>
      <TextField
        label="Find a country"
        value={countryQuery}
        onChangeText={setCountryQuery}
        editable={!busy}
      />
      <T variant="small">Selected country: {country?.name ?? "Choose below"}</T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {countries
          .filter((item) =>
            `${item.name} ${item.code}`
              .toLowerCase()
              .includes(countryQuery.trim().toLowerCase()),
          )
          .map((item) => (
            <Chip
              key={item.code}
              label={item.name}
              active={draft.countryCode === item.code}
              onPress={() => {
                if (!busy)
                  setDraft({
                    ...draft,
                    countryCode: item.code,
                    city: item.code === draft.countryCode ? draft.city : "",
                  });
              }}
            />
          ))}
      </View>
      <TextField
        label="City"
        value={draft.city}
        onChangeText={(city) => setDraft({ ...draft, city })}
        maxLength={120}
        editable={!busy}
      />
      {country && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {country.cities.map((city) => (
            <Chip
              key={city}
              label={city}
              active={city === draft.city}
              onPress={() => {
                if (!busy) setDraft({ ...draft, city });
              }}
            />
          ))}
        </View>
      )}
      <T variant="eyebrow">Your planning approach</T>
      {planModes.map((mode) => (
        <Choice
          key={mode.id}
          disabled={busy}
          role="radio"
          checked={draft.mode === mode.id}
          onPress={() => setDraft({ ...draft, mode: mode.id })}
          style={{
            padding: 16,
            borderWidth: 1,
            borderColor: draft.mode === mode.id ? colors.teal : colors.line,
            borderRadius: 12,
            backgroundColor:
              draft.mode === mode.id ? colors.sage : colors.white,
            gap: 4,
          }}
        >
          <T variant="label">{mode.title}</T>
          <T variant="small">{mode.description}</T>
        </Choice>
      ))}
      <Notice>
        Club and partner modes record a preference only. No request is sent, no
        organizer assigned, and no service arranged.
      </Notice>
      <TextField
        label="Departure date (YYYY-MM-DD)"
        value={draft.startsOn}
        onChangeText={(startsOn) => setDraft({ ...draft, startsOn })}
        maxLength={10}
        autoCapitalize="none"
        editable={!busy}
      />
      <TextField
        label="Return date (YYYY-MM-DD)"
        value={draft.endsOn}
        onChangeText={(endsOn) => setDraft({ ...draft, endsOn })}
        maxLength={10}
        autoCapitalize="none"
        editable={!busy}
      />
      <T variant="small">
        Tentative travel dates are not a treatment or recovery schedule. Confirm
        timing with your clinician.
      </T>
      {base && (
        <>
          <T variant="h3">Before you go</T>
          {tripChecklist.map((item) => {
            const key = item.id as keyof TripChecklist;
            return (
              <Choice
                key={key}
                disabled={busy}
                role="checkbox"
                checked={Boolean(checklist[key])}
                onPress={() =>
                  setChecklist({ ...checklist, [key]: !checklist[key] })
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 10,
                }}
              >
                <Icon
                  name={checklist[key] ? "CheckCircle2" : "Circle"}
                  color={colors.teal}
                />
                <View style={{ flex: 1 }}>
                  <T variant="label">{item.title}</T>
                  <T variant="small">{item.detail}</T>
                </View>
              </Choice>
            );
          })}
        </>
      )}
      {!base && (
        <Choice
          disabled={busy}
          role="checkbox"
          checked={consent}
          onPress={() => setConsent(!consent)}
          style={{ flexDirection: "row", gap: 10, padding: 12 }}
        >
          <Icon
            name={consent ? "CheckCircle2" : "Circle"}
            color={colors.teal}
          />
          <T style={{ flex: 1 }}>
            I want to save these travel details privately to my signed-in
            account.
          </T>
        </Choice>
      )}
      {error && (
        <T accessibilityRole="alert" style={{ color: colors.red }}>
          {error}
        </T>
      )}
      {base && error && (
        <Button
          label="Load latest without losing my edits"
          variant="secondary"
          disabled={busy || travel.pending}
          onPress={() => void loadLatest()}
        />
      )}
      {latest && (
        <View style={{ gap: 12, padding: 14, backgroundColor: colors.sage }}>
          <T variant="h3">Review the latest account revision</T>
          <T>
            {latest.city},{" "}
            {countries.find((item) => item.code === latest.countryCode)?.name} ·{" "}
            {latest.startsOn} to {latest.endsOn} ·{" "}
            {planModes.find((item) => item.id === latest.mode)?.title}
          </T>
          <T variant="small">
            Latest checklist:{" "}
            {tripChecklist
              .filter(
                (item) => latest.checklist[item.id as keyof TripChecklist],
              )
              .map((item) => item.title)
              .join("; ") || "No items checked"}
            . Updated {latest.updatedAt}. Your unsaved edits are still in the
            form above.
          </T>
          <Button
            label="Keep my changes over this revision"
            variant="secondary"
            onPress={() => {
              const patch = changedFields();
              const mergedChecklist = { ...latest.checklist };
              if (base)
                for (const item of tripChecklist) {
                  const key = item.id as keyof TripChecklist;
                  if (Boolean(checklist[key]) !== Boolean(base.checklist[key]))
                    mergedChecklist[key] = Boolean(checklist[key]);
                }
              setDraft(tripDraft({ ...latest, ...patch }));
              setChecklist(mergedChecklist);
              setBase(latest);
              setLatest(null);
            }}
          />
          <Button
            label="Discard my edits and use latest"
            variant="ghost"
            onPress={() => {
              setDraft(tripDraft(latest));
              setChecklist(latest.checklist);
              setBase(latest);
              setLatest(null);
            }}
          />
        </View>
      )}
      <Button
        label={
          busy
            ? "Saving / loading…"
            : base
              ? "Save account changes"
              : "Save account trip"
        }
        disabled={
          busy || travel.pending || Boolean(latest) || (!base && !consent)
        }
        onPress={() => void save()}
        icon="Check"
      />
    </Sheet>
  );
}
