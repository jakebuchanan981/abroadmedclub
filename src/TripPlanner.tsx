import React, { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { destinations } from "./data";
import { useApp } from "./store";
import { useHealthcare } from "./healthcare/client";
import { AccountTripEditor } from "./travel/AccountTripEditor";
import { isDate, planModes } from "./travel/planning";
import type { PlanMode } from "./types";
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
} from "./ui";

export function TripPlanner() {
  const { user, sessionLoading } = useHealthcare();
  const { plannerDestinationId, closePlanner, navigate, notify } = useApp();
  if (sessionLoading)
    return (
      <Sheet visible onClose={closePlanner} title="Checking your account">
        <T>Loading account status before choosing where to save this plan.</T>
      </Sheet>
    );
  if (user)
    return (
      <AccountTripEditor
        key={user.id}
        destinationId={plannerDestinationId ?? undefined}
        onClose={closePlanner}
        onSaved={() => {
          closePlanner();
          navigate("trips");
          notify("Trip saved to your account. Nothing has been booked.");
        }}
      />
    );
  return <GuestTripPlanner key={`guest:${plannerDestinationId}`} />;
}

function GuestTripPlanner() {
  const { plannerDestinationId, closePlanner, createTrip } = useApp();
  const { width } = useWindowDimensions();
  const [destinationId, setDestinationId] = useState(
    plannerDestinationId ?? destinations[0].id,
  );
  const [mode, setMode] = useState<PlanMode | null>(null);
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!mode) {
      setError("Choose how you would like to plan your trip.");
      return;
    }
    if (!isDate(startsOn) || !isDate(endsOn)) {
      setError("Enter valid travel dates in YYYY-MM-DD format.");
      return;
    }
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (startsOn < today) {
      setError("Choose a departure date that is today or later.");
      return;
    }
    if (endsOn < startsOn) {
      setError("Your return date must be on or after your departure date.");
      return;
    }
    createTrip({ destinationId, startsOn, endsOn, mode });
  };

  return (
    <Sheet
      visible
      onClose={closePlanner}
      title="Your next chapter starts here."
      subtitle="Create a private plan. No bookings, payments, or requests are made."
    >
      <View style={{ gap: 11 }}>
        <T variant="eyebrow" style={{ color: colors.teal }}>
          01 · Pick a place
        </T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {destinations.map((destination) => (
            <Chip
              key={destination.id}
              label={`${destination.city}, ${destination.country}`}
              active={destinationId === destination.id}
              onPress={() => setDestinationId(destination.id)}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: 11 }}>
        <T variant="eyebrow" style={{ color: colors.teal }}>
          02 · Make it your kind of journey
        </T>
        {planModes.map((option) => (
          <Choice
            key={option.id}
            role="radio"
            accessibilityLabel={option.title}
            checked={mode === option.id}
            onPress={() => {
              setMode(option.id);
              setError(null);
            }}
            style={{
              padding: 16,
              borderWidth: 1,
              borderColor: mode === option.id ? colors.teal : colors.line,
              borderRadius: 12,
              backgroundColor: mode === option.id ? colors.sage : colors.white,
              flexDirection: "row",
              gap: 13,
              alignItems: "center",
            }}
          >
            <Icon
              name={
                option.id === "independent"
                  ? "Compass"
                  : option.id === "abroadmedclub"
                    ? "HandHeart"
                    : "Building2"
              }
              color={colors.teal}
              size={23}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <T variant="label">{option.title}</T>
              <T variant="small">{option.description}</T>
            </View>
            <Icon
              name={mode === option.id ? "CheckCircle2" : "Circle"}
              size={20}
              color={mode === option.id ? colors.teal : colors.muted}
            />
          </Choice>
        ))}
      </View>
      <View style={{ gap: 12 }}>
        <T variant="eyebrow" style={{ color: colors.teal }}>
          03 · When are you thinking?
        </T>
        <View
          style={{ flexDirection: width < 500 ? "column" : "row", gap: 14 }}
        >
          <View style={{ flex: 1 }}>
            <TextField
              label="Departure date"
              placeholder="YYYY-MM-DD"
              value={startsOn}
              onChangeText={(value) => {
                setStartsOn(value);
                setError(null);
              }}
              maxLength={10}
              autoCapitalize="none"
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextField
              label="Return date"
              placeholder="YYYY-MM-DD"
              value={endsOn}
              onChangeText={(value) => {
                setEndsOn(value);
                setError(null);
              }}
              maxLength={10}
              autoCapitalize="none"
            />
          </View>
        </View>
        <T variant="small">
          These are tentative travel dates, not a treatment or recovery
          schedule. Confirm timing with your clinician.
        </T>
      </View>
      <Notice icon="LockKeyhole">
        This plan stays in this browser or app installation. It is not shared
        with a provider or organizer. Don’t add medical details.
      </Notice>
      <Notice>
        Club and partner modes are planning preferences only. No organizer is
        assigned, no request is sent, and no service is arranged.
      </Notice>
      {error && (
        <T
          accessibilityRole="alert"
          style={{ color: colors.red, fontSize: 14 }}
        >
          {error}
        </T>
      )}
      <Button label="Save my trip plan" onPress={save} icon="ArrowRight" />
    </Sheet>
  );
}
