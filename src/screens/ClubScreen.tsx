import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AccountAccess } from "../healthcare/AccountPanel";
import { request, useHealthcare } from "../healthcare/client";
import { useCommunity } from "../community/CommunityProvider";
import { CircleDetail } from "../community/components/CircleDetail";
import {
  CircleEditor,
  type CircleEditorPrefill,
} from "../community/components/forms";
import {
  CountryChoice,
  errorMessage,
  PageControls,
  useCommunityPage,
} from "../community/components/shared";
import type { Circle } from "../community/types";
import { useTravel } from "../travel/TravelProvider";
import type {
  TripCommunityFocus,
  TripCommunityMatches,
} from "../travel/types";
import {
  Button,
  Card,
  Chip,
  Notice,
  Page,
  PageTitle,
  Sheet,
  T,
  TextField,
} from "../ui";

type Category = "all" | "support" | "destination" | "travel" | "mine";
const categories: { value: Category; label: string }[] = [
  { value: "all", label: "All circles" },
  { value: "support", label: "Support" },
  { value: "destination", label: "Destinations" },
  { value: "travel", label: "Travel coordination" },
  { value: "mine", label: "My memberships" },
];

function CircleCard({
  circle,
  onOpen,
}: {
  circle: Circle;
  onOpen: (id: string) => void;
}) {
  return (
    <Card style={{ flexGrow: 1, flexBasis: 290, padding: 24 }}>
      <View style={{ gap: 12 }}>
        <T variant="eyebrow">
          {circle.kind === "travel"
            ? "Member-organized coordination"
            : `${circle.kind} circle`}
        </T>
        <T variant="h3">{circle.name}</T>
        <T>{circle.description}</T>
        {circle.countryCode && (
          <T variant="small">
            {circle.city ? `${circle.city}, ` : ""}
            {circle.countryCode}
          </T>
        )}
        {circle.startsOn && (
          <T variant="small">
            {circle.startsOn} – {circle.endsOn}
          </T>
        )}
        <T variant="label">
          {circle.memberCount} active{" "}
          {circle.memberCount === 1 ? "member" : "members"} · {circle.state}
        </T>
        {circle.myMembership && (
          <T variant="small">Your membership: {circle.myMembership.status}</T>
        )}
        <Button
          label="Open circle"
          variant="secondary"
          onPress={() => onOpen(circle.id)}
          accessibilityLabel={`Open ${circle.name}`}
        />
      </View>
    </Card>
  );
}

function Directory({
  path,
  onOpen,
}: {
  path: string;
  onOpen: (id: string) => void;
}) {
  const page = useCommunityPage<Circle>(path);
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
        {page.items.map((circle) => (
          <CircleCard key={circle.id} circle={circle} onOpen={onOpen} />
        ))}
      </View>
      <PageControls
        page={page}
        empty="No circles match these filters. Try a different search or explicitly create a travel coordination group."
      />
    </View>
  );
}

function FocusedClubJourney({
  focus,
  onOpen,
  onCreate,
  onClear,
}: {
  focus: TripCommunityFocus;
  onOpen: (id: string) => void;
  onCreate: (prefill: CircleEditorPrefill) => void;
  onClear: () => void;
}) {
  const [scope, setScope] = useState<"city" | "country">("city");
  const [matches, setMatches] = useState<TripCommunityMatches | null>(null);
  const [groups, setGroups] = useState<Circle[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const sequence = useRef(0);

  const load = useCallback(
    async (cursor?: string) => {
      const serial = ++sequence.current;
      const appending = cursor !== undefined;
      if (appending) setLoadingMore(true);
      else setLoading(true);
      setError("");
      try {
        const page = await request<TripCommunityMatches>(
          "/travel/community-matches",
          {
            method: "POST",
            body: {
              tripId: focus.id,
              scope,
              ...(cursor === undefined ? {} : { cursor }),
            },
          },
        );
        if (sequence.current !== serial) return;
        setMatches(page);
        setGroups((current) =>
          appending ? [...current, ...page.travelGroups.items] : page.travelGroups.items,
        );
        setNextCursor(page.travelGroups.nextCursor);
      } catch (cause) {
        if (sequence.current !== serial) return;
        setError(errorMessage(cause));
      } finally {
        if (sequence.current === serial) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [focus.id, scope],
  );

  useEffect(() => {
    setMatches(null);
    setGroups([]);
    setNextCursor(null);
    void load();
    return () => {
      sequence.current += 1;
    };
  }, [load]);

  return (
    <View style={{ gap: 20 }}>
      <PageTitle
        eyebrow="The club · private trip matching"
        title="Find community around your account trip."
        description="Your account trip stays private. The server uses only its destination and dates to find open community options; browsing does not publish, join or create anything."
      />
      <Notice>
        This view reads the latest version of your private account trip on the
        server. Matching does not expose the trip, add a membership, send a
        message, or change the plan.
      </Notice>
      <View style={{ gap: 8 }}>
        <T variant="h2" accessibilityRole="header">
          Match area
        </T>
        <T>
          Start with the exact city entered on the trip, or explicitly broaden
          the search to overlapping groups anywhere in the same country.
        </T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Chip
            label="Exact city"
            active={scope === "city"}
            onPress={() => setScope("city")}
          />
          <Chip
            label="Whole country"
            active={scope === "country"}
            onPress={() => setScope("country")}
          />
        </View>
      </View>

      {matches && (
        <Card style={{ padding: 24 }}>
          <View style={{ gap: 8 }}>
            <T variant="eyebrow">Private source used by the server</T>
            <T variant="h3" accessibilityRole="header">
              {matches.source.city}, {matches.source.countryCode}
            </T>
            <T>
              {matches.source.startsOn} – {matches.source.endsOn}
            </T>
            <T variant="small">
              Trip version updated {matches.source.updatedAt}
            </T>
            <T variant="small">
              These exact server-returned values are shown for review. No trip
              identifier, checklist, treatment or account identity is shared
              with circles.
            </T>
          </View>
        </Card>
      )}

      {loading && (
        <ActivityIndicator
          accessibilityLabel={
            matches ? "Refreshing trip community matches" : "Loading trip community matches"
          }
        />
      )}
      {!!error && (
        <View accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Notice>{error}</Notice>
        </View>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Button
          label={error && !matches ? "Retry matching" : "Refresh matches"}
          variant="secondary"
          disabled={loading || loadingMore}
          onPress={() => {
            void load();
          }}
        />
        <Button
          label="Clear trip focus"
          variant="ghost"
          onPress={onClear}
          accessibilityLabel="Clear trip focus and return to ordinary Club browsing"
        />
      </View>

      {matches && (
        <>
          <View style={{ gap: 12 }}>
            <T variant="h2" accessibilityRole="header">
              Destination circle
            </T>
            {matches.destinationCircle ? (
              <CircleCard circle={matches.destinationCircle} onOpen={onOpen} />
            ) : (
              <T>No open destination circle matches this country.</T>
            )}
          </View>

          <View style={{ gap: 12 }}>
            <T variant="h2" accessibilityRole="header">
              Overlapping travel groups
            </T>
            <T variant="small">
              Open member-organized groups whose dates overlap this private
              trip{scope === "city" ? " in the exact entered city" : " in the same country"}.
            </T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
              {groups.map((circle) => (
                <CircleCard key={circle.id} circle={circle} onOpen={onOpen} />
              ))}
            </View>
            {!loading && !error && groups.length === 0 && (
              <T>
                No open travel groups overlap these dates in this{" "}
                {scope === "city" ? "city" : "country"}.
              </T>
            )}
            {loadingMore && (
              <ActivityIndicator accessibilityLabel="Loading more overlapping travel groups" />
            )}
            {nextCursor && (
              <Button
                label="Load more overlapping groups"
                variant="secondary"
                disabled={loading || loadingMore}
                onPress={() => {
                  void load(nextCursor);
                }}
              />
            )}
          </View>

          <Card style={{ padding: 24 }}>
            <View style={{ gap: 12 }}>
              <T variant="h3" accessibilityRole="header">
                Create an independent public group
              </T>
              <T>
                Review a new group with only the country, city and dates copied
                into editable fields. Your private trip stays private. The group
                is independent public metadata and will not follow later trip
                edits or deletion.
              </T>
              <Button
                label="Review copied details and create"
                icon="Plus"
                onPress={() =>
                  onCreate({
                    countryCode: matches.source.countryCode,
                    city: matches.source.city,
                    startsOn: matches.source.startsOn,
                    endsOn: matches.source.endsOn,
                  })
                }
                disabled={loading || loadingMore}
              />
            </View>
          </Card>
        </>
      )}
    </View>
  );
}

export function ClubScreen() {
  const { user, sessionLoading } = useHealthcare();
  const {
    clubTripFocus,
    clearClubTripFocus,
  } = useTravel();
  const { memberships, loading, error, joinedCount, refreshMemberships } =
    useCommunity();
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [creationPrefill, setCreationPrefill] =
    useState<CircleEditorPrefill | null>(null);
  const [version, setVersion] = useState(0);
  const filters = new URLSearchParams();
  if (search) filters.set("q", search);
  if (country) filters.set("country", country);
  if (category !== "all" && category !== "mine") filters.set("kind", category);
  const path = `/community/circles?${filters.toString()}`;
  const mine = memberships.filter(
    (circle) =>
      (!country || circle.countryCode === country) &&
      (!search ||
        `${circle.name} ${circle.description} ${circle.city ?? ""}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase())),
  );
  return (
    <Page>
      {clubTripFocus ? (
        <FocusedClubJourney
          key={`${clubTripFocus.id}:${clubTripFocus.countryCode}:${clubTripFocus.city}:${clubTripFocus.startsOn}:${clubTripFocus.endsOn}:${version}`}
          focus={clubTripFocus}
          onOpen={setSelectedId}
          onCreate={(source) => {
            setCreationPrefill(source);
            setCreating(true);
          }}
          onClear={clearClubTripFocus}
        />
      ) : (
        <>
          <PageTitle
            eyebrow="The club · choose your community"
            title="Good company, on your terms."
            description="Browse real circles, join with an alias, and coordinate with other members. Participation is always an explicit account choice."
          />
          <View style={{ gap: 20 }}>
            <Notice>
              Peer experiences are not medical advice. Members and staff can see
              circle posts and opted aliases. Travel groups are member-organized
              coordination, not club or partner packages: no bookings, payments
              or arranged care. Moderation is not continuous.
            </Notice>
            <T variant="small">
              Previous device-only preview choices do not join real circles or
              publish a profile. Counts reflect active account memberships at
              the latest successful refresh.
            </T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {categories.map((item) => (
                <Chip
                  key={item.value}
                  label={
                    item.value === "mine"
                      ? `${item.label} (${joinedCount} active)`
                      : item.label
                  }
                  active={category === item.value}
                  onPress={() => setCategory(item.value)}
                />
              ))}
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "flex-end",
              }}
            >
              <View style={{ flexGrow: 1, flexBasis: 260 }}>
                <TextField
                  label="Search circles, descriptions and cities"
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={() => setSearch(query.trim())}
                  returnKeyType="search"
                  maxLength={120}
                />
              </View>
              <Button label="Search" onPress={() => setSearch(query.trim())} />
              <CountryChoice value={country} onChange={setCountry} allowAll />
            </View>
            <Button
              label="Create a travel coordination group"
              icon="Plus"
              disabled={sessionLoading}
              onPress={() => {
                setCreationPrefill(null);
                setCreating(true);
              }}
            />
            {category === "mine" ? (
              !user ? (
                <Card style={{ padding: 24, gap: 16 }}>
                  <T variant="h3">Sign in to view your memberships</T>
                  <AccountAccess />
                </Card>
              ) : (
                <View style={{ gap: 14 }}>
                  {loading && (
                    <ActivityIndicator accessibilityLabel="Loading your memberships" />
                  )}
                  {!!error && <Notice>{error}</Notice>}
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}
                  >
                    {mine.map((circle) => (
                      <CircleCard
                        key={circle.id}
                        circle={circle}
                        onOpen={setSelectedId}
                      />
                    ))}
                  </View>
                  {!loading && !error && mine.length === 0 && (
                    <T>
                      No matching memberships. Browse circles and choose to
                      join; travel requests need owner approval.
                    </T>
                  )}
                  <Button
                    label={error ? "Retry memberships" : "Refresh memberships"}
                    variant="secondary"
                    disabled={loading}
                    onPress={() => {
                      void refreshMemberships();
                    }}
                  />
                </View>
              )
            ) : (
              <Directory
                key={`${path}:${version}`}
                path={path}
                onOpen={setSelectedId}
              />
            )}
          </View>
        </>
      )}
      <Sheet
        visible={creating || selectedId !== null}
        onClose={() => {
          setCreating(false);
          setCreationPrefill(null);
          setSelectedId(null);
        }}
        title={
          creating
            ? "Create member-organized travel coordination"
            : "Circle details"
        }
      >
        {creating ? (
          sessionLoading ? (
            <ActivityIndicator />
          ) : user ? (
            <CircleEditor
              prefill={creationPrefill ?? undefined}
              onSaved={(circle) => {
                const createdFromTrip = creationPrefill !== null;
                setCreating(false);
                setCreationPrefill(null);
                setSelectedId(circle.id);
                setVersion((old) => old + 1);
                if (createdFromTrip) clearClubTripFocus();
              }}
            />
          ) : (
            <>
              <Notice>
                Sign in first. Creating a group explicitly publishes its
                metadata and your owner membership; it does not arrange travel.
              </Notice>
              <AccountAccess />
            </>
          )
        ) : selectedId ? (
          <CircleDetail
            key={selectedId}
            id={selectedId}
            onChanged={() => setVersion((old) => old + 1)}
          />
        ) : null}
      </Sheet>
    </Page>
  );
}
