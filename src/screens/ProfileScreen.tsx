import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { destinations } from "../data";
import { useApp } from "../store";
import { AccountPanel } from "../healthcare/AccountPanel";
import { useHealthcare } from "../healthcare/client";
import { useCommunity } from "../community/CommunityProvider";
import { useTravel } from "../travel/TravelProvider";
import type { Currency, Preferences } from "../types";
import {
  Avatar,
  Button,
  Card,
  colors,
  EmptyState,
  Icon,
  Notice,
  Page,
  PageTitle,
  SectionTitle,
  Sheet,
  T,
  TextField,
  Choice,
} from "../ui";

const currencies: { id: Currency; label: string }[] = [
  { id: "USD", label: "US dollar" },
  { id: "EUR", label: "Euro" },
  { id: "GBP", label: "British pound" },
];

export function ProfileScreen() {
  const { width } = useWindowDimensions();
  const { user } = useHealthcare();
  const community = useCommunity();
  const travel = useTravel();
  const {
    state,
    ready,
    storageError,
    updatePreferences,
    toggleSaved,
    openPlanner,
    navigate,
    resetData,
  } = useApp();
  const [form, setForm] = useState<Preferences>(state.preferences);
  const [saved, setSaved] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  useEffect(() => {
    setForm(state.preferences);
  }, [state.preferences]);
  const dirty =
    form.displayName !== state.preferences.displayName ||
    form.homeCountry !== state.preferences.homeCountry ||
    form.currency !== state.preferences.currency;
  const savedDestinations = destinations.filter((destination) =>
    state.savedDestinations.includes(destination.id),
  );
  const name = state.preferences.displayName.trim();
  const initials = name
    ? name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "ME";
  const wide = width >= 1100;
  const editPreferences = (patch: Partial<Preferences>) => {
    setForm((previous) => ({ ...previous, ...patch }));
    setSaved(false);
  };

  return (
    <Page>
      <PageTitle
        eyebrow="Your corner of the club"
        title="Make yourself at home."
        description="Manage your account, private plans and conversations, plus preferences saved on this device."
      />
      <AccountPanel />
      <Card style={styles.identity}>
        <Avatar initials={initials} size={70} />
        <View style={{ flex: 1, minWidth: 150, gap: 5 }}>
          <T variant="h2" accessibilityRole="header">
            {name ? `Hello, ${name}.` : "Hello, fellow traveler."}
          </T>
          <T style={{ color: colors.ink }}>
            A little space for your next chapter.
          </T>
        </View>
        <View style={styles.privateBadge}>
          <Icon name="LockKeyhole" size={15} color={colors.teal} />
          <T variant="eyebrow" style={{ color: colors.teal, fontSize: 10 }}>
            Local profile only
          </T>
        </View>
      </Card>
      <View style={styles.stats}>
        {[
          {
            count: savedDestinations.length,
            label: "Saved on this device",
            icon: "Heart" as const,
          },
          {
            count:
              !user || community.loading || community.error
                ? "—"
                : community.joinedCount,
            label: "Joined circles",
            icon: "Users" as const,
          },
          {
            count: state.trips.length,
            label: "Local trip plans",
            icon: "Plane" as const,
          },
          {
            count:
              !user || travel.loading || travel.error
                ? "—"
                : travel.accountTrips.length,
            label: "Account trip plans",
            icon: "Plane" as const,
          },
        ].map((stat) => (
          <Card key={stat.label} style={styles.stat}>
            <Icon name={stat.icon} size={20} color={colors.teal} />
            <T variant="h2">{stat.count}</T>
            <T variant="small">{stat.label}</T>
          </Card>
        ))}
      </View>
      <View
        style={[styles.columns, { flexDirection: wide ? "row" : "column" }]}
      >
        <Card style={styles.preferences}>
          <View style={styles.sectionHeading}>
            <Icon name="Settings2" color={colors.teal} size={21} />
            <T variant="h3" accessibilityRole="header">
              Your preferences
            </T>
          </View>
          <T variant="small">
            Optional preferences for this device. Your circle nickname and
            message opt-in are chosen separately when you join each circle.
          </T>
          <TextField
            label="Device display name"
            value={form.displayName}
            editable={ready}
            maxLength={60}
            autoCapitalize="words"
            placeholder="What should we call you?"
            onChangeText={(displayName) => editPreferences({ displayName })}
          />
          <TextField
            label="Home country"
            value={form.homeCountry}
            editable={ready}
            maxLength={80}
            autoCapitalize="words"
            placeholder="Country only — no address needed"
            onChangeText={(homeCountry) => editPreferences({ homeCountry })}
          />
          <View style={{ gap: 9 }}>
            <T variant="label">Preferred display currency</T>
            <View
              style={styles.currencyOptions}
              accessibilityRole="radiogroup"
              accessibilityLabel="Preferred display currency"
            >
              {currencies.map((currency) => (
                <Choice
                  key={currency.id}
                  role="radio"
                  accessibilityLabel={`${currency.id}, ${currency.label}`}
                  checked={form.currency === currency.id}
                  disabled={!ready}
                  onPress={() => editPreferences({ currency: currency.id })}
                  style={({ pressed }) => [
                    styles.currency,
                    form.currency === currency.id && {
                      borderColor: colors.teal,
                      backgroundColor: colors.sage,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <T variant="label" style={{ color: colors.teal }}>
                    {currency.id}
                  </T>
                  {form.currency === currency.id && (
                    <Icon name="Check" size={15} color={colors.teal} />
                  )}
                </Choice>
              ))}
            </View>
            <T variant="small">
              A saved preference for planning. Any published provider prices
              retain their original billing currency; no automatic conversion is
              applied.
            </T>
          </View>
          <View style={styles.divider} />
          <T variant="label">Your community visibility is your choice</T>
          <T variant="small">
            Joining a circle shares your chosen nickname with its members and
            moderators. New private conversations require your message opt-in.
            Manage those choices inside each circle. The interface is in
            English.
          </T>
          <View style={styles.actions}>
            <Button
              label="Save preferences"
              icon="Check"
              disabled={!dirty || !ready}
              onPress={() => {
                updatePreferences({
                  ...form,
                  displayName: form.displayName.trim(),
                  homeCountry: form.homeCountry.trim(),
                });
                setSaved(true);
              }}
            />
            {dirty && (
              <Button
                label="Cancel changes"
                variant="ghost"
                onPress={() => {
                  setForm(state.preferences);
                  setSaved(false);
                }}
              />
            )}
          </View>
          <T
            variant="small"
            accessibilityLiveRegion="polite"
            style={saved && !storageError ? { color: colors.teal } : undefined}
          >
            {dirty
              ? "You have unsaved preference changes."
              : saved
                ? storageError
                  ? "Preferences updated in this preview, but device storage is unavailable."
                  : "Preferences saved locally. No profile published."
                : "Your preferences stay on this browser or device."}
          </T>
        </Card>
        <View style={[styles.sideColumn, wide && { width: 320 }]}>
          <Card style={styles.privacy}>
            <View style={styles.privacyIcon}>
              <Icon name="LockKeyhole" size={26} color={colors.teal} />
            </View>
            <T variant="h3" accessibilityRole="header">
              Your account and your local plans.
            </T>
            <T style={{ color: colors.muted }}>
              Account trip plans, circle participation, private member messages,
              and directory inquiries are stored by the operator service.
            </T>
            <T variant="small">
              Guest plans, saved destinations, preferences and legacy drafts
              stay on this device. Copying local plans into your account is
              explicit; their originals remain here and do not synchronize
              automatically.
            </T>
            <Notice icon="Info">
              Local storage is not suitable for medical information. Do not add
              diagnoses, treatment records, or other sensitive details.
            </Notice>
          </Card>
          <Card style={styles.exploreCard}>
            <T variant="h3">A place for your people.</T>
            <T variant="small">
              Explore destination and support circles, or create a
              member-organized travel group. Membership and sharing are opt-in.
            </T>
            <Button
              label="Visit the club"
              variant="secondary"
              icon="ArrowRight"
              onPress={() => navigate("club")}
            />
          </Card>
        </View>
      </View>
      <View style={styles.savedSection}>
        <SectionTitle
          title="Places on your mind"
          description={`${savedDestinations.length} saved ${savedDestinations.length === 1 ? "destination" : "destinations"} · your own little shortlist`}
        />
        {savedDestinations.length === 0 ? (
          <EmptyState
            icon="Heart"
            title="Keep a little inspiration close."
            body="Save destinations as you explore. They’ll be waiting here when you’re ready to turn an idea into a local plan."
            actionLabel="Explore destinations"
            onAction={() => navigate("explore")}
          />
        ) : (
          <View style={styles.savedGrid}>
            {savedDestinations.map((destination) => (
              <Card
                key={destination.id}
                style={{ width: wide ? "48.5%" : "100%" }}
              >
                <Image
                  source={destination.image}
                  accessibilityLabel={`${destination.city}, ${destination.country}`}
                  resizeMode="cover"
                  style={{ height: 180, width: "100%" }}
                />
                <View style={styles.savedCopy}>
                  <T variant="eyebrow" style={{ color: colors.teal }}>
                    {destination.country}
                  </T>
                  <T variant="h3" accessibilityRole="header">
                    {destination.city}
                  </T>
                  <T variant="small">{destination.subtitle}</T>
                  <View style={styles.actions}>
                    <Button
                      label="Plan a trip"
                      icon="ArrowRight"
                      variant="secondary"
                      accessibilityLabel={`Plan a trip to ${destination.city}`}
                      onPress={() => openPlanner(destination.id)}
                    />
                    <Button
                      label="Remove"
                      icon="Heart"
                      variant="ghost"
                      accessibilityLabel={`Remove ${destination.city} from saved destinations`}
                      onPress={() => toggleSaved(destination.id)}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>
      <Card style={styles.localData}>
        <View style={{ flex: 1, minWidth: 150, gap: 8 }}>
          <T variant="h3" accessibilityRole="header">
            A fresh start, on this device.
          </T>
          <T variant="small">
            Reset device-saved destinations, guest plans and checklists, legacy
            preview selections and drafts, and local preferences. Your account,
            account plans, online memberships and conversations are unchanged.
          </T>
        </View>
        <Button
          label="Reset local data"
          icon="Trash2"
          variant="secondary"
          onPress={() => setResetOpen(true)}
        />
      </Card>
      <Sheet
        visible={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset your device-local data?"
        subtitle="This cannot be undone."
      >
        <T>
          This removes saved destinations, guest plans and checklists, legacy
          preview selections and drafts, and preferences from this device only.
        </T>
        <Notice icon="Info">
          Your online account, account plans, circle memberships, member
          messages and directory inquiries remain unchanged. No bookings are
          canceled.
        </Notice>
        <View style={styles.actions}>
          <Button
            label="Keep my data"
            variant="secondary"
            onPress={() => setResetOpen(false)}
          />
          <Button
            label="Reset local data"
            icon="Trash2"
            style={{ backgroundColor: colors.red, borderColor: colors.red }}
            onPress={() => {
              resetData();
              setSaved(false);
              setResetOpen(false);
            }}
          />
        </View>
      </Sheet>
    </Page>
  );
}

const styles = StyleSheet.create({
  identity: {
    padding: 26,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 20,
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  privateBadge: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    backgroundColor: "#F9FBF5",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginVertical: 24,
  },
  stat: { flex: 1, minWidth: 130, padding: 20, gap: 5 },
  columns: { gap: 24, alignItems: "stretch" },
  preferences: { flex: 1, minWidth: 0, padding: 24, gap: 19 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  currencyOptions: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  currency: {
    minHeight: 46,
    minWidth: 78,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 13,
  },
  divider: { height: 1, backgroundColor: colors.line },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  sideColumn: { gap: 20 },
  privacy: { padding: 24, gap: 17, backgroundColor: "#F2F3EC" },
  privacyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E1E9DB",
    alignItems: "center",
    justifyContent: "center",
  },
  exploreCard: {
    padding: 24,
    gap: 15,
    backgroundColor: colors.peach,
    borderColor: colors.peach,
  },
  savedSection: { marginTop: 38, marginBottom: 30 },
  savedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "space-between",
  },
  savedCopy: { padding: 22, gap: 7 },
  localData: {
    padding: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 22,
  },
});
