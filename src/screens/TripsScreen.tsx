import React, { useState } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { formatDate, getDestination } from "../data";
import { planModes, tripChecklist } from "../travel/planning";
import { AccountTripsPanel } from "../travel/AccountTripsPanel";
import { useHealthcare } from "../healthcare/client";
import { AccountAccess } from "../healthcare/AccountPanel";
import { useApp } from "../store";
import {
  Button,
  Card,
  colors,
  EmptyState,
  Icon,
  Notice,
  Page,
  PageTitle,
  Sheet,
  T,
  Choice,
} from "../ui";

export function TripsScreen() {
  const { width } = useWindowDimensions();
  const { user, sessionLoading } = useHealthcare();
  const [showAccount, setShowAccount] = useState(false);
  const { state, openPlanner, navigate, removeTrip, toggleChecklist } =
    useApp();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deletingTrip = state.trips.find((trip) => trip.id === deletingId);
  const deletingDestination = deletingTrip
    ? getDestination(deletingTrip.destinationId)
    : undefined;
  const wide = width >= 1100;

  return (
    <Page>
      <PageTitle
        eyebrow="Your next chapter"
        title="A little planning. More peace of mind."
        description="A personal space to gather your travel plans and take the practical details one step at a time."
        action={
          <Button
            label={user ? "New account trip" : "New local trip plan"}
            icon="Plus"
            onPress={() => openPlanner()}
          />
        }
      />
      <Notice icon="Bookmark">
        These are planning records, not bookings. No care, organizer,
        accommodation, or transport has been confirmed.
      </Notice>
      {user ? (
        <AccountTripsPanel key={user.id} />
      ) : (
        <View style={{ marginTop: 24, gap: 12 }}>
          <Notice icon="LockKeyhole">
            Guest plans stay on this device. Sign in to create private account
            trips across all catalog countries. Signing in never uploads local
            plans automatically.
          </Notice>
          <Button
            label={
              showAccount ? "Hide account access" : "Sign in for account trips"
            }
            variant="secondary"
            disabled={sessionLoading}
            onPress={() => setShowAccount(!showAccount)}
          />
          {showAccount && !sessionLoading && <AccountAccess />}
        </View>
      )}
      <T variant="h2" accessibilityRole="header" style={{ marginTop: 28 }}>
        Plans stored on this device
      </T>
      <T variant="small">
        These local plans are separate from account trips and remain available
        when signed out.
      </T>
      <View style={styles.plans}>
        {state.trips.length === 0 ? (
          <EmptyState
            icon="Plane"
            title="No device plans"
            body={
              user
                ? "Your account plans appear above. There are no guest plans stored on this device to copy."
                : "Choose a destination and dates to create a local plan. Nothing is booked or uploaded."
            }
            actionLabel={user ? undefined : "Start a local plan"}
            onAction={user ? undefined : () => openPlanner()}
          />
        ) : (
          state.trips.map((trip) => {
            const destination = getDestination(trip.destinationId);
            const mode = planModes.find((item) => item.id === trip.mode);
            if (!destination || !mode) return null;
            const complete = tripChecklist.filter(
              (item) => trip.checklist[item.id],
            ).length;
            return (
              <Card key={trip.id}>
                <View style={{ flexDirection: wide ? "row" : "column" }}>
                  <View style={[styles.destination, wide && { width: 300 }]}>
                    <Image
                      source={destination.image}
                      accessibilityLabel={`${destination.city}, ${destination.country}`}
                      style={{ width: "100%", height: wide ? 220 : 200 }}
                      resizeMode="cover"
                    />
                    <View style={styles.destinationCopy}>
                      <View style={styles.badge}>
                        <Icon name="Bookmark" size={13} color={colors.teal} />
                        <T variant="eyebrow" style={styles.badgeText}>
                          Local plan · Unbooked
                        </T>
                      </View>
                      <T variant="h2" accessibilityRole="header">
                        {destination.city}
                      </T>
                      <T style={{ color: colors.muted }}>
                        {destination.country}
                      </T>
                      <View style={styles.date}>
                        <Icon
                          name="CalendarDays"
                          size={17}
                          color={colors.teal}
                        />
                        <T variant="label" style={{ flex: 1 }}>
                          {formatDate(trip.startsOn)}
                          {"\n"}to {formatDate(trip.endsOn)}
                        </T>
                      </View>
                      <Button
                        label="Delete plan"
                        icon="Trash2"
                        variant="ghost"
                        accessibilityLabel={`Delete ${destination.city} trip plan`}
                        onPress={() => setDeletingId(trip.id)}
                        style={{ alignSelf: "flex-start" }}
                      />
                    </View>
                  </View>
                  <View
                    style={[
                      styles.preparation,
                      { padding: width < 700 ? 20 : 28 },
                    ]}
                  >
                    <T variant="eyebrow" style={{ color: colors.teal }}>
                      Your planning approach
                    </T>
                    <T variant="h3">{mode.title}</T>
                    <T variant="label">{mode.organizer}</T>
                    <T variant="small">
                      {trip.mode === "independent"
                        ? "You make your own arrangements directly. This checklist is a planning aid, not a confirmation of services."
                        : trip.mode === "abroadmedclub"
                          ? "You’ve noted a preference for AbroadMedClub coordination. No request has been sent and no team has been assigned."
                          : "You’ve noted a preference for independent organizer support. No partner has been selected or contacted."}
                    </T>
                    <View style={styles.checklistHeading}>
                      <T variant="h3" accessibilityRole="header">
                        Before you go
                      </T>
                      <T variant="small">
                        {complete} of {tripChecklist.length} checked
                      </T>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${(complete / tripChecklist.length) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                    <View style={{ gap: 4 }}>
                      {tripChecklist.map((item) => {
                        const checked = Boolean(trip.checklist[item.id]);
                        return (
                          <Choice
                            key={item.id}
                            role="checkbox"
                            checked={checked}
                            accessibilityLabel={`${item.title}, ${destination.city} plan`}
                            accessibilityHint={item.detail}
                            onPress={() => toggleChecklist(trip.id, item.id)}
                            style={({ pressed }) => [
                              styles.checklistItem,
                              pressed && { backgroundColor: colors.sage },
                            ]}
                          >
                            <View
                              style={[
                                styles.checkbox,
                                checked && {
                                  backgroundColor: colors.teal,
                                  borderColor: colors.teal,
                                },
                              ]}
                            >
                              {checked && (
                                <Icon
                                  name="Check"
                                  size={16}
                                  color={colors.white}
                                />
                              )}
                            </View>
                            <View style={{ flex: 1, gap: 3 }}>
                              <T variant="label">{item.title}</T>
                              <T variant="small">{item.detail}</T>
                            </View>
                          </Choice>
                        );
                      })}
                    </View>
                    <T variant="small">
                      Your checklist is for your own preparation. Checking an
                      item does not verify a provider or confirm medical
                      suitability.
                    </T>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </View>
      <Card style={styles.community}>
        <View style={styles.communityIcon}>
          <Icon name="Users" color={colors.teal} size={25} />
        </View>
        <View style={{ flex: 1, minWidth: 160, gap: 5 }}>
          <T variant="h3">You don’t have to figure it all out alone.</T>
          <T style={{ color: colors.muted }}>
            Explore destination circles and connect with members who choose to
            share their planning experiences.
          </T>
        </View>
        <Button
          label="Explore the club"
          icon="ArrowRight"
          variant="secondary"
          onPress={() => navigate("club")}
        />
      </Card>
      <Sheet
        visible={Boolean(deletingTrip)}
        onClose={() => setDeletingId(null)}
        title="Delete this local plan?"
        subtitle={
          deletingDestination
            ? `Your ${deletingDestination.city} plan`
            : undefined
        }
      >
        <T>
          This removes this plan, its dates, and its checklist from this device.
          It can’t be undone. Nothing is booked, so no services will be
          canceled.
        </T>
        <View style={styles.actions}>
          <Button
            label="Keep plan"
            variant="secondary"
            onPress={() => setDeletingId(null)}
          />
          <Button
            label="Delete local plan"
            icon="Trash2"
            style={{ backgroundColor: colors.red, borderColor: colors.red }}
            onPress={() => {
              if (deletingTrip) removeTrip(deletingTrip.id);
              setDeletingId(null);
            }}
          />
        </View>
      </Sheet>
    </Page>
  );
}

const styles = StyleSheet.create({
  plans: { gap: 24, marginVertical: 26 },
  destination: { backgroundColor: "#F1F2EA" },
  destinationCopy: { padding: 24, gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  badgeText: { color: colors.teal, fontSize: 10, letterSpacing: 1 },
  date: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginVertical: 13,
  },
  preparation: { flex: 1, minWidth: 0, gap: 9 },
  checklistHeading: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 19,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.sage,
    marginVertical: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.teal,
    borderRadius: 2,
  },
  checklistItem: {
    flexDirection: "row",
    gap: 12,
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#A5B4A7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  community: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    padding: 24,
    gap: 20,
    backgroundColor: colors.peach,
    borderColor: colors.peach,
  },
  communityIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFF9F2",
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-end",
  },
});
