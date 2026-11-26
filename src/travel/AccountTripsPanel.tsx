import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { countries } from "../healthcare/catalog-data";
import { formatDate } from "../data";
import { useApp } from "../store";
import {
  Button,
  Card,
  colors,
  EmptyState,
  Icon,
  Notice,
  Sheet,
  T,
} from "../ui";
import type { Trip } from "../types";
import { AccountTripEditor } from "./AccountTripEditor";
import { legacyDestinationPlaces, planModes, tripChecklist } from "./planning";
import { useTravel } from "./TravelProvider";
import type { AccountTrip, TripChecklist } from "./types";

export function AccountTripsPanel() {
  const travel = useTravel();
  const { state, openPlanner } = useApp();
  const [editing, setEditing] = useState<AccountTrip | null>(null);
  const [deleting, setDeleting] = useState<AccountTrip | null>(null);
  const [copying, setCopying] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function copyPlans() {
    if (!copying || lock.current || travel.pending) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await travel.importLocalTrips(copying);
      if (!alive.current) return;
      setCopying(null);
      setReceipt(
        `${result.createdCount} account plans created; ${result.existingCount} already copied. All device originals are unchanged. Existing account copies were not overwritten.`,
      );
    } catch (cause) {
      if (alive.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "No copy was confirmed. Retry when connected.",
        );
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function deletePlan() {
    if (!deleting || lock.current || travel.pending) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await travel.deleteAccountTrip(deleting);
      if (!alive.current) return;
      setDeleting(null);
      setReceipt(
        "Account plan deleted. Local plans are unchanged. No services were canceled.",
      );
    } catch (cause) {
      if (alive.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Deletion was not confirmed. Refresh and review before retrying.",
        );
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function reviewDeletion() {
    if (!deleting || lock.current || travel.pending) return;
    lock.current = true;
    setBusy(true);
    try {
      const trip = await travel.getTrip(deleting.id);
      if (alive.current) {
        setDeleting(trip);
        setError(null);
      }
    } catch (cause) {
      if (alive.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not refresh this plan.",
        );
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <View style={{ gap: 18, marginTop: 24 }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <T variant="h2" accessibilityRole="header">
          Your private account trips
        </T>
        <Button
          label={travel.loading ? "Refreshing…" : "Refresh account trips"}
          variant="secondary"
          disabled={travel.loading || travel.pending}
          onPress={() => void travel.refreshTrips()}
        />
      </View>
      <Notice icon="LockKeyhole">
        These plans sync to your signed-in account. Device plans below remain
        separate unless you explicitly copy them. Nothing is booked, paid for,
        or sent to an organizer. Refresh for the latest saved state.
      </Notice>
      {receipt && (
        <T accessibilityLiveRegion="polite" style={{ color: colors.teal }}>
          {receipt}
        </T>
      )}
      {travel.error && (
        <T accessibilityRole="alert" style={{ color: colors.red }}>
          {travel.error}
        </T>
      )}
      {travel.loading && <T>Loading account trips…</T>}
      {!travel.loading && !travel.error && travel.accountTrips.length === 0 && (
        <EmptyState
          icon="Plane"
          title="No account trips yet"
          body="Create a private plan for any catalog country, or explicitly copy your device plans below."
          actionLabel="Create account trip"
          onAction={() => openPlanner()}
        />
      )}
      {travel.accountTrips.map((trip) => {
        const mode = planModes.find((item) => item.id === trip.mode);
        const completed = tripChecklist.filter(
          (item) => trip.checklist[item.id as keyof TripChecklist],
        ).length;
        return (
          <Card key={trip.id} style={{ padding: 24, gap: 12 }}>
            <T variant="eyebrow" style={{ color: colors.teal }}>
              Account plan · Unbooked
            </T>
            <T variant="h2">
              {trip.city},{" "}
              {
                countries.find((country) => country.code === trip.countryCode)
                  ?.name
              }
            </T>
            <T>
              {formatDate(trip.startsOn)} to {formatDate(trip.endsOn)}
            </T>
            <T variant="label">{mode?.title}</T>
            <T variant="small">
              {mode?.organizer}. A preference only; no service or contact is
              arranged.
            </T>
            <T variant="h3">
              Before you go · {completed} of {tripChecklist.length} checked
            </T>
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: tripChecklist.length,
                now: completed,
              }}
              style={{
                height: 6,
                backgroundColor: colors.line,
                borderRadius: 3,
              }}
            >
              <View
                style={{
                  width: `${(completed / tripChecklist.length) * 100}%`,
                  height: 6,
                  backgroundColor: colors.teal,
                  borderRadius: 3,
                }}
              />
            </View>
            {tripChecklist.map((item) => (
              <View key={item.id} style={{ flexDirection: "row", gap: 10 }}>
                <Icon
                  name={
                    trip.checklist[item.id as keyof TripChecklist]
                      ? "CheckCircle2"
                      : "Circle"
                  }
                  color={colors.teal}
                  size={18}
                />
                <T style={{ flex: 1 }}>{item.title}</T>
              </View>
            ))}
            <T variant="small">
              A checked item records your preparation, not provider verification
              or medical suitability. Last saved {trip.updatedAt}.
            </T>
            <T variant="small">
              This uses your private location and tentative dates for read-only
              matching. It publishes nothing, joins nothing, and contacts
              nobody.
            </T>
            <Button
              label="Find fellow planners"
              accessibilityLabel={`Find fellow planners for ${trip.city}`}
              variant="secondary"
              disabled={travel.pending}
              onPress={() => travel.openClubForTrip(trip)}
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <Button
                label="Edit plan and checklist"
                icon="Settings2"
                disabled={travel.pending}
                onPress={() => {
                  setEditing(trip);
                  setError(null);
                }}
              />
              <Button
                label="Delete account plan"
                icon="Trash2"
                variant="ghost"
                disabled={travel.pending}
                onPress={() => {
                  setDeleting(trip);
                  setError(null);
                }}
              />
            </View>
          </Card>
        );
      })}
      {state.trips.length > 0 && (
        <Card style={{ padding: 24, gap: 14 }}>
          <T variant="h3">Copy device plans to this account</T>
          <T>
            Your local plans remain on this device. Copying is explicit and
            repeat-safe: it never updates an existing account copy with later
            local changes.
          </T>
          <Button
            label={`Review copying all ${state.trips.length} local plans`}
            variant="secondary"
            disabled={travel.pending}
            onPress={() => {
              setCopying(state.trips);
              setError(null);
            }}
          />
          {state.trips.map((trip) => (
            <Button
              key={trip.id}
              label={`Copy only ${Object.hasOwn(legacyDestinationPlaces, trip.destinationId) ? legacyDestinationPlaces[trip.destinationId].city : trip.destinationId} · ${trip.startsOn}`}
              variant="ghost"
              disabled={travel.pending}
              onPress={() => {
                setCopying([trip]);
                setError(null);
              }}
            />
          ))}
        </Card>
      )}
      {editing && (
        <AccountTripEditor
          key={editing.id}
          trip={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setReceipt(
              "Your account trip changes were saved. Nothing has been booked.",
            );
          }}
        />
      )}
      <Sheet
        visible={Boolean(copying)}
        onClose={() => {
          if (!busy) setCopying(null);
        }}
        title="Copy local plans to your account?"
      >
        <T>
          This sends the selected destinations, dates, planning preferences, and
          checklist to your signed-in account. It does not delete local
          originals or send a request to providers or organizers.
        </T>
        {copying?.map((trip) => (
          <T key={trip.id}>
            {Object.hasOwn(legacyDestinationPlaces, trip.destinationId)
              ? legacyDestinationPlaces[trip.destinationId].city
              : trip.destinationId}{" "}
            · {trip.startsOn} to {trip.endsOn}
          </T>
        ))}
        <T>
          All selected plans are validated together: if one is invalid, none are
          copied. Repeating a copy does not overwrite an existing account plan.
        </T>
        {error && (
          <T accessibilityRole="alert" style={{ color: colors.red }}>
            {error}
          </T>
        )}
        <Button
          label={busy ? "Copying…" : "I consent — copy to this account"}
          disabled={busy || travel.pending}
          onPress={() => void copyPlans()}
        />
        <Button
          label="Keep plans local only"
          variant="secondary"
          disabled={busy}
          onPress={() => setCopying(null)}
        />
      </Sheet>
      <Sheet
        visible={Boolean(deleting)}
        onClose={() => {
          if (!busy) setDeleting(null);
        }}
        title="Delete this account plan?"
      >
        <T>
          {deleting?.city} · {deleting?.startsOn} to {deleting?.endsOn}
        </T>
        <T variant="small">
          {planModes.find((mode) => mode.id === deleting?.mode)?.title}.
          Checked:{" "}
          {tripChecklist
            .filter(
              (item) => deleting?.checklist[item.id as keyof TripChecklist],
            )
            .map((item) => item.title)
            .join("; ") || "None"}
          . Revision: {deleting?.updatedAt}.
        </T>
        <T>
          This removes the plan and checklist from your account on all devices.
          Local originals stay unchanged. This cannot be undone; no services are
          canceled.
        </T>
        {error && (
          <>
            <T accessibilityRole="alert" style={{ color: colors.red }}>
              {error}
            </T>
            <Button
              label="Load latest plan for review"
              variant="secondary"
              disabled={busy || travel.pending}
              onPress={() => void reviewDeletion()}
            />
          </>
        )}
        <Button
          label={busy ? "Please wait…" : "Delete account plan permanently"}
          icon="Trash2"
          disabled={busy || travel.pending}
          onPress={() => void deletePlan()}
        />
        <Button
          label="Keep plan"
          variant="secondary"
          disabled={busy}
          onPress={() => setDeleting(null)}
        />
      </Sheet>
    </View>
  );
}
