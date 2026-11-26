import "@expo/metro-runtime";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import Svg, { Circle } from "react-native-svg";
import { brand } from "./src/data";
import { AppProvider, useApp } from "./src/store";
import { TripPlanner } from "./src/TripPlanner";
import { ExploreScreen } from "./src/screens/ExploreScreen";
import { ClubScreen } from "./src/screens/ClubScreen";
import { TripsScreen } from "./src/screens/TripsScreen";
import { MessagesScreen } from "./src/screens/MessagesScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { HealthcareProvider, useHealthcare } from "./src/healthcare/client";
import { InquirySheet } from "./src/healthcare/InquirySheet";
import { SiteFooter } from "./src/healthcare/SiteFooter";
import { DirectoryLink } from "./src/healthcare/DirectoryLink";
import { TravelProvider } from "./src/travel/TravelProvider";
import { MessagingProvider } from "./src/messaging/MessagingProvider";
import { CommunityProvider } from "./src/community/CommunityProvider";
import {
  Avatar,
  Button,
  colors,
  fonts,
  Icon,
  type IconName,
  Notice,
  T,
} from "./src/ui";
import type { Tab } from "./src/types";

const navigation: { id: Tab; title: string; icon: IconName }[] = [
  { id: "explore", title: "Explore", icon: "Compass" },
  { id: "club", title: "Club", icon: "Users" },
  { id: "trips", title: "My Trips", icon: "CalendarDays" },
  { id: "messages", title: "Messages", icon: "MessageCircle" },
  { id: "profile", title: "Profile", icon: "UserRound" },
];

function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: colors.teal,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width={size * 0.77}
        height={size * 0.77}
        viewBox="0 0 32 32"
        aria-hidden
      >
        <Circle
          cx="12"
          cy="12"
          r="7"
          stroke="#F4F4E5"
          strokeWidth="1.8"
          fill="none"
        />
        <Circle
          cx="20"
          cy="12"
          r="7"
          stroke="#F4F4E5"
          strokeWidth="1.8"
          fill="none"
        />
        <Circle
          cx="12"
          cy="20"
          r="7"
          stroke="#F4F4E5"
          strokeWidth="1.8"
          fill="none"
        />
        <Circle
          cx="20"
          cy="20"
          r="7"
          stroke="#F4F4E5"
          strokeWidth="1.8"
          fill="none"
        />
      </Svg>
    </View>
  );
}

function PatientApp() {
  const {
    tab,
    navigate,
    state,
    ready,
    plannerDestinationId,
    closePlanner,
    toast,
    storageError,
  } = useApp();
  const { route, go, back, user } = useHealthcare();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mobile = width < 900;
  const scroll = useRef<ScrollView>(null);
  const initials =
    (user?.name || state.preferences.displayName)
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ME";

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [tab, route]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (plannerDestinationId) {
          closePlanner();
          return true;
        }
        if (tab === "explore" && back()) return true;
        if (tab !== "explore") {
          navigate("explore");
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [tab, plannerDestinationId, closePlanner, navigate, back]);

  return (
    <View style={[styles.app, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View role="banner" style={styles.headerBorder}>
        <View style={[styles.header, { paddingHorizontal: mobile ? 20 : 48 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="AbroadMedClub home"
            onPress={() => go({ page: "home" })}
            style={styles.wordmark}
          >
            <BrandMark />
            <T
              style={{
                fontFamily: fonts.bold,
                fontSize: mobile ? 21 : 22,
                letterSpacing: -0.9,
              }}
            >
              {brand.name}
            </T>
          </Pressable>
          {!mobile && (
            <View
              role="navigation"
              aria-label={
                Platform.OS === "web" ? "Primary navigation" : undefined
              }
            >
              <View accessibilityRole="tablist" style={styles.desktopNav}>
                {navigation.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="tab"
                    accessibilityLabel={item.title}
                    aria-selected={tab === item.id}
                    onPress={() =>
                      item.id === "explore" ? go(route) : navigate(item.id)
                    }
                    style={({ hovered }) => [
                      styles.navItem,
                      tab === item.id && styles.navActive,
                      hovered && { backgroundColor: colors.sage },
                    ]}
                  >
                    <T
                      variant="label"
                      style={{
                        color: tab === item.id ? colors.teal : colors.muted,
                        fontSize: 13,
                      }}
                    >
                      {item.title}
                    </T>
                    {tab === item.id && <View style={styles.navDot} />}
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <View style={styles.headerRight}>
            {!mobile && (
              <View style={styles.locale}>
                <Icon name="Globe2" size={16} />
                <T variant="small">English</T>
              </View>
            )}
            {!mobile && (
              <Button
                label={user ? "My account" : "Sign in"}
                small
                variant="secondary"
                onPress={() => navigate("profile")}
              />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open your account and preferences"
              onPress={() => navigate("profile")}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Avatar initials={initials} size={36} />
            </Pressable>
          </View>
        </View>
      </View>
      {tab === "explore" && (
        <View
          role="navigation"
          aria-label={Platform.OS === "web" ? "Care directory" : undefined}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.line,
            backgroundColor: colors.white,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: mobile ? 20 : 48,
              gap: mobile ? 24 : 34,
              minHeight: 52,
              alignItems: "center",
              maxWidth: 1380,
              flexGrow: 1,
            }}
          >
            <DirectoryLink route={{ page: "providers" }} label="Find care" />
            <DirectoryLink
              route={{ page: "specialties" }}
              label="Specialties"
            />
            <DirectoryLink
              route={{ page: "destinations" }}
              label="Destinations"
            />
            <DirectoryLink route={{ page: "guides" }} label="Patient guides" />
            <DirectoryLink
              route={{ page: "how-it-works" }}
              label="How it works"
            />
            <DirectoryLink
              route={{ page: "providers-join" }}
              label="For medical centers"
            />
          </ScrollView>
        </View>
      )}
      {storageError && (
        <View
          role={Platform.OS === "web" ? "status" : undefined}
          style={{ padding: 14 }}
        >
          <Notice>{storageError}</Notice>
        </View>
      )}
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {!ready ? (
          <View role="main" style={styles.loading}>
            <ActivityIndicator color={colors.teal} />
            <T>Opening AbroadMedClub…</T>
          </View>
        ) : (
          <>
            <View role="main">
              {tab === "explore" && (
                <ExploreScreen
                  onScrollTo={(y) =>
                    scroll.current?.scrollTo({ y, animated: true })
                  }
                />
              )}
              {tab === "club" && <ClubScreen />}
              {tab === "trips" && <TripsScreen />}
              {tab === "messages" && <MessagesScreen />}
              {tab === "profile" && <ProfileScreen />}
            </View>
            <SiteFooter />
          </>
        )}
      </ScrollView>
      {mobile && (
        <View
          role="navigation"
          aria-label={Platform.OS === "web" ? "Primary navigation" : undefined}
        >
          <View
            accessibilityRole="tablist"
            style={[
              styles.bottomNav,
              { paddingBottom: Math.max(insets.bottom, 9) },
            ]}
          >
            {navigation.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityLabel={item.title}
                aria-selected={tab === item.id}
                onPress={() =>
                  item.id === "explore" ? go(route) : navigate(item.id)
                }
                style={styles.bottomItem}
              >
                <View
                  style={[
                    styles.bottomIcon,
                    tab === item.id && { backgroundColor: colors.sage },
                  ]}
                >
                  <Icon
                    name={item.icon}
                    size={22}
                    color={tab === item.id ? colors.teal : "#788379"}
                  />
                </View>
                <T
                  variant="small"
                  style={{
                    fontSize: 10,
                    lineHeight: 15,
                    color: tab === item.id ? colors.teal : colors.muted,
                    fontFamily: tab === item.id ? fonts.bold : fonts.medium,
                  }}
                >
                  {item.title}
                </T>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      {toast && (
        <View
          pointerEvents="none"
          role={Platform.OS === "web" ? "status" : undefined}
          accessibilityLiveRegion="polite"
          style={[styles.toast, { bottom: mobile ? 90 + insets.bottom : 26 }]}
        >
          <Icon name="Info" color={colors.white} size={18} />
          <T style={{ color: colors.white, fontSize: 13, flexShrink: 1 }}>
            {toast}
          </T>
        </View>
      )}
      {plannerDestinationId && <TripPlanner key={plannerDestinationId} />}
      <InquirySheet />
    </View>
  );
}

function AccountWorkspace() {
  const { user, sessionRevision } = useHealthcare();
  return (
    <TravelProvider
      key={`${user?.id ?? "guest"}:${user?.role ?? "guest"}:${sessionRevision}`}
    >
      <MessagingProvider>
        <CommunityProvider>
          <PatientApp />
        </CommunityProvider>
      </MessagingProvider>
    </TravelProvider>
  );
}

export default function App() {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSerifDisplay_400Regular,
  });
  if (!loaded && !error)
    return (
      <View role="main" style={styles.loading}>
        <ActivityIndicator
          color={colors.teal}
          accessibilityLabel="Loading AbroadMedClub"
        />
      </View>
    );
  if (error)
    return (
      <View role="main" style={styles.loading}>
        <T>
          AbroadMedClub could not load its bundled fonts. Please reopen the app.
        </T>
      </View>
    );
  return (
    <SafeAreaProvider>
      <AppProvider>
        <HealthcareProvider>
          <AccountWorkspace />
        </HealthcareProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.cream },
  headerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.cream,
  },
  header: {
    width: "100%",
    maxWidth: 1380,
    alignSelf: "center",
    minHeight: 85,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
  },
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 44,
  },
  desktopNav: { flexDirection: "row", alignItems: "center", gap: 5 },
  navItem: {
    minHeight: 44,
    paddingHorizontal: 17,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  navActive: { backgroundColor: colors.sage },
  navDot: {
    position: "absolute",
    bottom: 5,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.teal,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 15 },
  locale: { flexDirection: "row", gap: 7, alignItems: "center", minHeight: 44 },
  bottomNav: {
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 7,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  bottomItem: { flex: 1, alignItems: "center", gap: 3, minHeight: 51 },
  bottomIcon: {
    width: 47,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  toast: {
    position: "absolute",
    alignSelf: "center",
    maxWidth: "92%",
    backgroundColor: colors.tealDark,
    borderRadius: 11,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    boxShadow: "0 5px 18px rgba(20,40,30,0.2)",
  },
  loading: {
    flex: 1,
    minHeight: 300,
    backgroundColor: colors.cream,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    gap: 15,
  },
});
