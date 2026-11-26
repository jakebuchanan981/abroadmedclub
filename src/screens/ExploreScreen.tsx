import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { destinations } from "../data";
import { useHealthcare } from "../healthcare/client";
import { DirectoryLink } from "../healthcare/DirectoryLink";
import type { DirectoryRoute } from "../healthcare/navigation";
import type { Catalog, Provider } from "../healthcare/types";
import {
  Choice,
  countryName,
  ExternalLink,
  PriceDetails,
  ProviderCard,
  ProviderPhoto,
  providerOfferings,
  ServiceDetails,
  TravelCards,
  treatmentName,
} from "../healthcare/directory/DirectoryParts";
import { normalize, searchProviders } from "../healthcare/search";
import { useApp } from "../store";
import {
  Button,
  Card,
  colors,
  EmptyState,
  Icon,
  type IconName,
  Notice,
  Page,
  SectionTitle,
  T,
  TextField,
} from "../ui";
import { ResourcesScreen } from "./ResourcesScreen";

type ResultRoute = Extract<DirectoryRoute, { page: "providers" }>;
const resourcePages: Partial<Record<DirectoryRoute["page"], true>> = {
  guides: true,
  about: true,
  privacy: true,
  terms: true,
  contact: true,
  "providers-join": true,
  "how-it-works": true,
};
const pageSize = 9;

type HomeBenefitTarget = "providers" | "compare" | "trips" | "club";

const heroProofs = [
  "Public sources and check dates",
  "No paid clinical rankings",
  "Guest plans stay on your device",
] as const;

const journeySteps: ReadonlyArray<{
  icon: IconName;
  title: string;
  body: string;
}> = [
  {
    icon: "Search",
    title: "Find",
    body: "Search by care, medical center or destination.",
  },
  {
    icon: "SlidersHorizontal",
    title: "Compare",
    body: "Review published services side by side.",
  },
  {
    icon: "CalendarDays",
    title: "Prepare",
    body: "Organize dates, questions, documents and aftercare.",
  },
  {
    icon: "Users",
    title: "Connect",
    body: "Join traveler circles only when you choose.",
  },
];

const homeBenefits: ReadonlyArray<{
  icon: IconName;
  eyebrow: string;
  title: string;
  body: string;
  actionLabel: string;
  target: HomeBenefitTarget;
}> = [
  {
    icon: "ShieldCheck",
    eyebrow: "Evidence",
    title: "Research you can inspect",
    body: "Open original sources and see when listing details were checked—not just a polished profile.",
    actionLabel: "Browse centers",
    target: "providers",
  },
  {
    icon: "SlidersHorizontal",
    eyebrow: "Clarity",
    title: "Compare without sponsored rankings",
    body: "Put published services side by side. Missing information stays visible instead of becoming a recommendation.",
    actionLabel: "Compare centers",
    target: "compare",
  },
  {
    icon: "CalendarDays",
    eyebrow: "Planning",
    title: "Plan beyond the appointment",
    body: "Save a destination and dates, then work through costs, documents, accommodation, support and aftercare.",
    actionLabel: "Plan a trip",
    target: "trips",
  },
  {
    icon: "Users",
    eyebrow: "Community",
    title: "Get perspective on your terms",
    body: "Browse opt-in destination circles and traveler groups. Looking for a match never publishes your private trip.",
    actionLabel: "Explore the club",
    target: "club",
  },
];

function DirectoryNavigation() {
  const { go, compareIds } = useHealthcare();
  return (
    <View style={styles.navigation}>
      <DirectoryLink route={{ page: "home" }} label="Directory home">
        <View style={[styles.row, { alignItems: "center" }]}>
          <Icon name="Compass" size={20} />
          <T variant="label">Directory home</T>
        </View>
      </DirectoryLink>
      <Button
        label={`Compare (${compareIds.length}/3)`}
        variant="secondary"
        small
        onPress={() => go({ page: "compare" })}
      />
    </View>
  );
}

function Finder({
  catalog,
  initial = {},
  label = "Find medical centers",
}: {
  catalog: Catalog;
  initial?: Omit<ResultRoute, "page">;
  label?: string;
}) {
  const { go } = useHealthcare();
  const [q, setQ] = useState(initial.q ?? "");
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? "");
  const [countryCode, setCountryCode] = useState(initial.countryCode ?? "");
  const submit = () =>
    go({
      page: "providers",
      q: q.trim() || undefined,
      categoryId: categoryId || undefined,
      countryCode: countryCode || undefined,
    });
  return (
    <Card style={styles.finder}>
      <View
        style={{ flex: 2, flexBasis: 270, flexShrink: 1, minWidth: 0, gap: 8 }}
      >
        <TextField
          label="Treatment, center or city"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={submit}
          placeholder="e.g. dental implants or Bangkok"
          returnKeyType="search"
        />
        <T variant="small" style={{ color: colors.muted }}>
          Search published services and provider names.
        </T>
      </View>
      <Choice
        label="Specialty"
        value={categoryId}
        options={[
          { value: "", label: "All specialties" },
          ...catalog.categories.map((category) => ({
            value: category.id,
            label: category.name,
          })),
        ]}
        onChange={setCategoryId}
      />
      <Choice
        label="Country"
        value={countryCode}
        options={[
          { value: "", label: "All countries" },
          ...catalog.countries.map((country) => ({
            value: country.code,
            label: country.name,
          })),
        ]}
        onChange={setCountryCode}
      />
      <Button
        label={label}
        icon="Search"
        onPress={submit}
        style={{ alignSelf: "flex-start", marginTop: 26 }}
      />
    </Card>
  );
}

function Home({ catalog }: { catalog: Catalog }) {
  const { go } = useHealthcare();
  const { navigate } = useApp();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  // An alphabetical editorial selection, not a clinical or commercial ranking.
  const featured = [...catalog.providers]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 3);
  const openBenefit = (target: HomeBenefitTarget) => {
    if (target === "trips" || target === "club") {
      navigate(target);
      return;
    }
    go({ page: target });
  };

  return (
    <View style={styles.homeStack}>
      <View style={[styles.hero, compact && styles.heroStacked]}>
        <View
          style={[styles.heroCopy, compact && styles.heroCopyCompact]}
        >
          <T variant="eyebrow" style={{ color: "#C5D9CD" }}>
            Research care. Plan the whole journey.
          </T>
          <T
            variant="h1"
            accessibilityRole="header"
            style={{
              color: colors.white,
              fontSize: width < 600 ? 43 : 64,
              lineHeight: width < 600 ? 49 : 69,
            }}
          >
            Care abroad, without the guesswork.
          </T>
          <T style={styles.heroBody}>
            AbroadMedClub brings source-linked provider research, side-by-side
            comparisons, practical trip planning and opt-in community into one
            calm workspace.
          </T>
          <View style={styles.heroActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Find medical centers"
              onPress={() => go({ page: "providers" })}
              style={({ pressed, hovered }) => [
                styles.heroAction,
                styles.heroPrimaryAction,
                (pressed || hovered) && styles.heroActionActive,
              ]}
            >
              <T variant="label" style={{ color: colors.tealDark }}>
                Find medical centers
              </T>
              <Icon name="ArrowRight" size={18} color={colors.tealDark} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See how AbroadMedClub works"
              onPress={() => go({ page: "how-it-works" })}
              style={({ pressed, hovered }) => [
                styles.heroAction,
                styles.heroSecondaryAction,
                (pressed || hovered) && styles.heroActionActive,
              ]}
            >
              <T variant="label" style={{ color: colors.white }}>
                See how it works
              </T>
              <Icon name="ArrowRight" size={18} color={colors.white} />
            </Pressable>
          </View>
          <View style={styles.heroProofs}>
            {heroProofs.map((proof) => (
              <View key={proof} style={styles.heroProof}>
                <Icon name="CheckCircle2" size={17} color="#C5D9CD" />
                <T variant="small" style={{ color: "#E5EEE7", flex: 1 }}>
                  {proof}
                </T>
              </View>
            ))}
          </View>
        </View>
        <ImageBackground
          source={destinations[0].image}
          accessibilityLabel="Istanbul cityscape, travel inspiration, not a medical facility"
          style={[
            styles.heroImage,
            compact && styles.stackedHeroPanel,
            compact && { minHeight: 500, width: "100%" },
          ]}
        >
          <LinearGradient
            colors={["rgba(16,39,31,0.18)", "rgba(16,39,31,0.92)"]}
            style={styles.heroImageOverlay}
          >
            <View style={styles.journeyPanel}>
              <T variant="eyebrow" style={{ color: colors.teal }}>
                One journey · four useful tools
              </T>
              <T variant="h3">Move from first question to prepared plan.</T>
              <View style={styles.journeySteps}>
                {journeySteps.map((step, index) => (
                  <View
                    key={step.title}
                    style={[
                      styles.journeyStep,
                      index > 0 && styles.journeyStepBorder,
                    ]}
                  >
                    <View style={styles.journeyStepIcon}>
                      <Icon name={step.icon} size={18} color={colors.teal} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <T variant="label">{step.title}</T>
                      <T variant="small">{step.body}</T>
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.photoCredit}>
              <T variant="eyebrow" style={{ color: colors.white }}>
                Istanbul, Türkiye
              </T>
              <T variant="small" style={{ color: "#E5EEE7" }}>
                A destination, not a clinic photograph
              </T>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>

      <View style={styles.finderSection}>
        <View style={styles.finderIntro}>
          <T variant="eyebrow" style={{ color: colors.teal }}>
            Start here
          </T>
          <T variant="h2" accessibilityRole="header">
            What care are you exploring?
          </T>
          <T style={{ color: colors.muted, maxWidth: 700 }}>
            Search by treatment, medical center or city. Add a specialty or
            country now, or refine your shortlist later.
          </T>
        </View>
        <Finder catalog={catalog} />
      </View>

      <Notice>
        An independent information directory, not a medical recommendation or
        booking service. Published listings are not a guarantee of credentials,
        outcomes or suitability.
      </Notice>

      <View>
        <View style={styles.sectionIntro}>
          <T variant="eyebrow" style={{ color: colors.teal }}>
            Why AbroadMedClub
          </T>
          <T variant="h2" accessibilityRole="header">
            Everything around the decision, in one place.
          </T>
          <T style={{ color: colors.muted, maxWidth: 760 }}>
            Most directories stop at a list of clinics. AbroadMedClub helps you
            inspect the information, compare options, prepare the trip and find
            peer perspective.
          </T>
        </View>
        <View style={styles.row}>
          {homeBenefits.map((benefit) => (
            <Card
              key={benefit.title}
              style={[
                styles.benefitCard,
                !compact && styles.benefitCardWide,
              ]}
            >
              <View style={styles.benefitIcon}>
                <Icon name={benefit.icon} size={22} color={colors.teal} />
              </View>
              <View style={styles.benefitCopy}>
                <T variant="eyebrow" style={{ color: colors.teal }}>
                  {benefit.eyebrow}
                </T>
                <T variant="h3">{benefit.title}</T>
                <T style={{ color: colors.muted }}>{benefit.body}</T>
              </View>
              <Button
                label={benefit.actionLabel}
                variant="ghost"
                icon="ArrowRight"
                onPress={() => openBenefit(benefit.target)}
                style={{ alignSelf: "flex-start" }}
              />
            </Card>
          ))}
        </View>
      </View>

      <View>
        <SectionTitle
          title="A closer look at published centers"
          description="An alphabetical selection of sourced listings. No paid clinical ranking."
          actionLabel="View all centers"
          onAction={() => go({ page: "providers" })}
        />
        {featured.length ? (
          <View style={styles.row}>
            {featured.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                catalog={catalog}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="Building2"
            title="No centers published yet"
            body="The specialty and country directories remain available. Published listings will appear here when available."
            actionLabel="Explore specialties"
            onAction={() => go({ page: "specialties" })}
          />
        )}
      </View>
      <View>
        <SectionTitle
          title="Every specialty, one starting point"
          description="Explore the full directory. A category's presence does not mean a provider or procedure is available."
          actionLabel="Specialty directory"
          onAction={() => go({ page: "specialties" })}
        />
        <CategoryGrid catalog={catalog} />
      </View>
      <View>
        <SectionTitle
          title="Beyond the consultation"
          description="Keep the practical side of travel organized in one of our existing destination planners."
        />
        <TravelCards />
      </View>
      <Card style={styles.editorialBand}>
        <T variant="eyebrow">Independent choices. Clear next steps.</T>
        <T variant="h2">Understand the listing before contacting a center.</T>
        <T>
          Read the original sources, confirm details with the provider and
          involve your own clinician. Our listing team can answer directory
          questions; it does not deliver messages to clinics or arrange medical
          care.
        </T>
        <View style={styles.row}>
          <Button
            label="How the directory works"
            onPress={() => go({ page: "how-it-works" })}
          />
          <Button
            label="About AbroadMedClub"
            variant="secondary"
            onPress={() => go({ page: "about" })}
          />
        </View>
      </Card>
    </View>
  );
}

function CategoryGrid({
  catalog,
  query = "",
}: {
  catalog: Catalog;
  query?: string;
}) {
  const { go } = useHealthcare();
  const counts = useMemo(() => {
    const treatmentCategories = new Map(
      catalog.treatments.map((treatment) => [
        treatment.id,
        treatment.categoryId,
      ]),
    );
    const map = new Map<string, Set<string>>();
    for (const offering of catalog.offerings) {
      const id = treatmentCategories.get(offering.treatmentId);
      if (!id) continue;
      if (!map.has(id)) map.set(id, new Set());
      map.get(id)!.add(offering.providerId);
    }
    return map;
  }, [catalog]);
  const matching = catalog.categories.filter((category) =>
    normalize(`${category.name} ${category.description}`).includes(
      normalize(query),
    ),
  );
  return matching.length ? (
    <View style={styles.row}>
      {matching.map((category) => {
        const count = counts.get(category.id)?.size ?? 0;
        const noun = count === 1 ? "center" : "centers";
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityLabel={`${category.name}, ${count} published ${noun}`}
            onPress={() => go({ page: "specialties", categoryId: category.id })}
            style={({ pressed, hovered }) => [
              styles.directoryTile,
              (pressed || hovered) && { backgroundColor: colors.sage },
            ]}
          >
            <T variant="label" style={{ flex: 1 }}>
              {category.name}
            </T>
            <T variant="small" style={{ color: colors.muted }}>
              {count} {noun}
            </T>
            <Icon name="ArrowRight" size={16} />
          </Pressable>
        );
      })}
    </View>
  ) : (
    <EmptyState
      icon="Search"
      title="No matching specialties"
      body="Try a broader search or clear the search field to see the full specialty directory."
    />
  );
}

function Specialties({
  catalog,
  categoryId,
}: {
  catalog: Catalog;
  categoryId?: string;
}) {
  const { go } = useHealthcare();
  const [query, setQuery] = useState("");
  const category = catalog.categories.find((item) => item.id === categoryId);
  if (categoryId && !category) return <Missing title="Specialty not found" />;
  if (!category)
    return (
      <View style={styles.stack}>
        <Heading
          eyebrow="The specialty directory"
          title="Explore every area of care"
          description={`${catalog.categories.length} specialties, with treatment information and published provider scope. Availability and medical suitability are separate questions.`}
        />
        <TextField
          label="Search specialties"
          placeholder="Search by specialty or topic"
          value={query}
          onChangeText={setQuery}
        />
        <CategoryGrid catalog={catalog} query={query} />
      </View>
    );
  const treatments = catalog.treatments.filter(
    (treatment) => treatment.categoryId === category.id,
  );
  return (
    <View style={styles.stack}>
      <Button
        label="All specialties"
        variant="ghost"
        icon="ArrowLeft"
        onPress={() => go({ page: "specialties" })}
        style={{ alignSelf: "flex-start" }}
      />
      <Heading
        eyebrow="Specialty guide"
        title={category.name}
        description={category.description}
      />
      <Notice>
        These categories help you navigate services, not choose a treatment. A
        qualified clinician must assess suitability, alternatives, risks and
        aftercare with you.
      </Notice>
      <Button
        label="Find specialty centers"
        icon="ArrowRight"
        onPress={() => go({ page: "providers", categoryId: category.id })}
        style={{ alignSelf: "flex-start" }}
      />
      <View>
        <SectionTitle
          title="Treatments & consultations"
          description="Read the treatment overview, then compare the actual scope published by each center."
        />
        <View style={styles.row}>
          {treatments.map((treatment) => (
            <Card key={treatment.id} style={styles.pathCard}>
              <T variant="h3">{treatment.name}</T>
              <T>{treatment.summary}</T>
              <Button
                label="Treatment details"
                variant="secondary"
                icon="ArrowRight"
                onPress={() =>
                  go({
                    page: "providers",
                    categoryId: category.id,
                    treatmentId: treatment.id,
                  })
                }
              />
            </Card>
          ))}
        </View>
        {!treatments.length && (
          <Notice>
            No treatment descriptions have been published for this specialty.
            You can still browse its center directory.
          </Notice>
        )}
      </View>
      <Finder
        catalog={catalog}
        initial={{ categoryId: category.id }}
        label="Search this specialty"
      />
    </View>
  );
}

function CountryDirectory({
  catalog,
  code,
}: {
  catalog: Catalog;
  code?: string;
}) {
  const { go } = useHealthcare();
  const [query, setQuery] = useState("");
  const country = catalog.countries.find((item) => item.code === code);
  if (code && !country) return <Missing title="Country not found" />;
  if (country) {
    const providers = catalog.providers.filter(
      (provider) => provider.countryCode === country.code,
    );
    const cities = [
      ...new Set([
        ...country.cities,
        ...providers.map((provider) => provider.city),
      ]),
    ].sort((a, b) => a.localeCompare(b));
    return (
      <View style={styles.stack}>
        <Button
          label="All countries"
          variant="ghost"
          icon="ArrowLeft"
          onPress={() => go({ page: "destinations" })}
          style={{ alignSelf: "flex-start" }}
        />
        <Heading
          eyebrow={`${country.region} · Country directory`}
          title={`Care in ${country.name}`}
          description={`${providers.length} published ${providers.length === 1 ? "center" : "centers"}. Explore the available location-specific records and confirm every service directly with the provider.`}
        />
        <Finder
          catalog={catalog}
          initial={{ countryCode: country.code }}
          label="Search this country"
        />
        <View>
          <SectionTitle
            title="Browse by city"
            description="Every listed city remains accessible, including those without published centers."
          />
          <View style={styles.row}>
            {cities.map((city) => (
              <Button
                key={city}
                label={`${city} (${providers.filter((provider) => provider.city === city).length})`}
                variant="secondary"
                onPress={() =>
                  go({ page: "providers", countryCode: country.code, city })
                }
              />
            ))}
          </View>
          {!cities.length && (
            <Notice>
              No cities are currently listed. Search this country's complete
              directory above.
            </Notice>
          )}
        </View>
        <View>
          <SectionTitle title={`Published centers in ${country.name}`} />
          {providers.length ? (
            <View style={styles.row}>
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  catalog={catalog}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="Building2"
              title="No published centers here yet"
              body="This country is part of the directory, but it currently has no published provider records. This does not imply that medical services are unavailable in the country."
              actionLabel="Browse all centers"
              onAction={() => go({ page: "providers" })}
            />
          )}
        </View>
        <View>
          <SectionTitle title="Practical travel planning" />
          <TravelCards country={country.name} />
        </View>
      </View>
    );
  }
  const countries = catalog.countries.filter((item) =>
    normalize(`${item.name} ${item.region} ${item.cities.join(" ")}`).includes(
      normalize(query),
    ),
  );
  const regions = [...new Set(countries.map((item) => item.region))].sort();
  return (
    <View style={styles.stack}>
      <Heading
        eyebrow="The destination directory"
        title="Find your place to begin"
        description={`Browse all ${catalog.countries.length} countries, then narrow by city and specialty. Counts reflect published directory records, not the total number of providers in a country.`}
      />
      <TextField
        label="Search countries or cities"
        value={query}
        onChangeText={setQuery}
        placeholder="e.g. Portugal or Seoul"
      />
      {regions.map((region) => (
        <View key={region}>
          <SectionTitle title={region} />
          <View style={styles.row}>
            {countries
              .filter((item) => item.region === region)
              .map((item) => (
                <Pressable
                  key={item.code}
                  accessibilityRole="button"
                  onPress={() => go({ page: "destinations", code: item.code })}
                  style={({ hovered, pressed }) => [
                    styles.directoryTile,
                    (hovered || pressed) && { backgroundColor: colors.sage },
                  ]}
                >
                  <T variant="label" style={{ flex: 1 }}>
                    {item.name}
                  </T>
                  <T variant="small">
                    {
                      catalog.providers.filter(
                        (provider) => provider.countryCode === item.code,
                      ).length
                    }{" "}
                    centers
                  </T>
                  <Icon name="ArrowRight" size={16} />
                </Pressable>
              ))}
          </View>
        </View>
      ))}
      {!countries.length && (
        <EmptyState
          icon="Search"
          title="No matching countries or cities"
          body="Try another spelling or clear the search to browse the complete country directory."
          actionLabel="Clear search"
          onAction={() => setQuery("")}
        />
      )}
      <View>
        <SectionTitle
          title="Our travel-planning destinations"
          description="Six city planners, separate from the international medical directory. Choose the actual city you plan to visit."
        />
        <TravelCards />
      </View>
    </View>
  );
}

function Results({ catalog, route }: { catalog: Catalog; route: ResultRoute }) {
  const { go } = useHealthcare();
  const [query, setQuery] = useState(route.q ?? "");
  const [sort, setSort] = useState("name");
  const [language, setLanguage] = useState("");
  const [priceAvailability, setPriceAvailability] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    setQuery(route.q ?? "");
    setPage(1);
  }, [route]);
  const selectedTreatment = catalog.treatments.find(
    (item) => item.id === route.treatmentId,
  );
  const selectedCategory = catalog.categories.find(
    (item) => item.id === (route.categoryId ?? selectedTreatment?.categoryId),
  );
  const selectedCountry = catalog.countries.find(
    (item) => item.code === route.countryCode,
  );
  const update = (patch: Partial<ResultRoute>) => go({ ...route, ...patch });
  const languages = [
    ...new Set(catalog.providers.flatMap((provider) => provider.languages)),
  ].sort();
  const cities = [
    ...new Set([
      ...(selectedCountry?.cities ?? []),
      ...catalog.providers
        .filter(
          (provider) =>
            !route.countryCode || provider.countryCode === route.countryCode,
        )
        .map((provider) => provider.city),
    ]),
  ].sort();
  const treatments = catalog.treatments.filter(
    (item) => !selectedCategory || item.categoryId === selectedCategory.id,
  );
  const results = useMemo(
    () =>
      searchProviders(catalog, {
        ...route,
        language,
        publishedPriceOnly: priceAvailability === "published",
        sort: sort === "location" ? "location" : "name",
      }),
    [catalog, route, language, priceAvailability, sort],
  );
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const shown = results.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const invalid =
    (route.categoryId &&
      !catalog.categories.some((item) => item.id === route.categoryId)) ||
    (route.treatmentId && !selectedTreatment) ||
    (route.countryCode && !selectedCountry);
  if (invalid)
    return <Missing title="This directory filter no longer exists" />;
  return (
    <View style={styles.stack}>
      <Heading
        eyebrow={
          selectedTreatment
            ? "Treatment overview & directory"
            : "The medical center directory"
        }
        title={
          selectedTreatment?.name ??
          (route.city
            ? `Medical centers in ${route.city}`
            : selectedCountry
              ? `Medical centers in ${selectedCountry.name}`
              : selectedCategory
                ? `${selectedCategory.name} centers`
                : "Find a center, understand its scope")
        }
        description={
          selectedTreatment?.summary ??
          "Compare published services and source-linked information. Directory inclusion is not a medical recommendation, credential verification or a claim of appointment availability."
        }
      />
      {selectedTreatment && (
        <Card style={styles.detailIntro}>
          <T variant="h3">Before you make a shortlist</T>
          <T>
            This overview is general information. Diagnosis, treatment options,
            eligibility, risks and follow-up need an individual discussion with
            a qualified clinician. A consultation listing does not establish
            availability of a specific procedure.
          </T>
          <ExternalLink
            label="Read the treatment information source"
            url={selectedTreatment.sourceUrl}
          />
          <View style={styles.row}>
            <Button
              label="View specialty guide"
              variant="secondary"
              onPress={() =>
                go({
                  page: "specialties",
                  categoryId: selectedTreatment.categoryId,
                })
              }
            />
            <Button
              label="Prepare with patient guides"
              variant="ghost"
              onPress={() => go({ page: "guides" })}
            />
          </View>
        </Card>
      )}
      <Card style={styles.filterPanel}>
        <T
          variant="h3"
          accessibilityRole="header"
          headingLevel={2}
        >
          Refine your directory
        </T>
        <View style={styles.row}>
          <View style={{ flex: 1, flexBasis: 260 }}>
            <TextField
              label="Search within these filters"
              value={query}
              onChangeText={setQuery}
              placeholder="Treatment, provider, city or country"
              onSubmitEditing={() => update({ q: query.trim() || undefined })}
              returnKeyType="search"
            />
          </View>
          <Button
            label="Search"
            icon="Search"
            onPress={() => update({ q: query.trim() || undefined })}
            style={{ marginTop: 26 }}
          />
        </View>
        <View style={styles.row}>
          <Choice
            label="Specialty"
            value={selectedCategory?.id ?? ""}
            options={[
              { value: "", label: "All specialties" },
              ...catalog.categories.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            ]}
            onChange={(value) =>
              update({ categoryId: value || undefined, treatmentId: undefined })
            }
          />
          <Choice
            label="Treatment"
            value={route.treatmentId ?? ""}
            options={[
              { value: "", label: "All treatments" },
              ...treatments.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            ]}
            onChange={(value) => update({ treatmentId: value || undefined })}
          />
          <Choice
            label="Country"
            value={route.countryCode ?? ""}
            options={[
              { value: "", label: "All countries" },
              ...catalog.countries.map((item) => ({
                value: item.code,
                label: item.name,
              })),
            ]}
            onChange={(value) =>
              update({ countryCode: value || undefined, city: undefined })
            }
          />
          <Choice
            label="City"
            value={route.city ?? ""}
            options={[
              { value: "", label: "All cities" },
              ...cities.map((city) => ({ value: city, label: city })),
            ]}
            onChange={(value) => update({ city: value || undefined })}
          />
        </View>
        <View style={styles.row}>
          <Choice
            label="Published language support"
            value={language}
            options={[
              { value: "", label: "Any / not specified" },
              ...languages.map((item) => ({ value: item, label: item })),
            ]}
            onChange={(value) => {
              setLanguage(value);
              setPage(1);
            }}
          />
          <Choice
            label="Price information"
            value={priceAvailability}
            options={[
              { value: "", label: "All price statuses" },
              { value: "published", label: "Has a published amount" },
            ]}
            onChange={(value) => {
              setPriceAvailability(value);
              setPage(1);
            }}
          />
          <Choice
            label="Sort centers"
            value={sort}
            options={[
              { value: "name", label: "Center name A–Z" },
              { value: "location", label: "Country, city, then name" },
            ]}
            onChange={(value) => {
              setSort(value);
              setPage(1);
            }}
          />
        </View>
        <T variant="small" style={{ color: colors.muted }}>
          Prices are not ranked: currencies, treatment scope, inclusions and
          eligibility differ. Language support is shown only when published and
          must be confirmed.
        </T>
        <Button
          label="Clear all filters"
          variant="ghost"
          onPress={() => {
            setLanguage("");
            setPriceAvailability("");
            setPage(1);
            setQuery("");
            go({ page: "providers" });
          }}
          style={{ alignSelf: "flex-start" }}
        />
      </Card>
      <View style={styles.resultsHeader}>
        <T variant="h2" accessibilityRole="header">
          {results.length} {results.length === 1 ? "center" : "centers"} found
        </T>
        <T variant="small" style={{ color: colors.muted }}>
          Published records only · Compare up to 3 centers
        </T>
      </View>
      {results.length ? (
        <>
          <View style={styles.row}>
            {shown.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                catalog={catalog}
              />
            ))}
          </View>
          <View style={styles.pagination}>
            <Button
              label="Previous page"
              variant="secondary"
              disabled={currentPage === 1}
              onPress={() => setPage(currentPage - 1)}
            />
            <T accessibilityLiveRegion="polite" variant="small">
              Page {currentPage} of {pageCount} ·{" "}
              {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, results.length)} of{" "}
              {results.length}
            </T>
            <Button
              label="Next page"
              variant="secondary"
              disabled={currentPage === pageCount}
              onPress={() => setPage(currentPage + 1)}
            />
          </View>
        </>
      ) : (
        <EmptyState
          icon="Search"
          title="No published centers match these filters"
          body="Try removing a treatment, location or language filter. An empty directory result does not mean care is unavailable, and we will not substitute a different destination or procedure."
          actionLabel="Browse all centers"
          onAction={() => {
            setLanguage("");
            setPriceAvailability("");
            setPage(1);
            setQuery("");
            go({ page: "providers" });
          }}
        />
      )}
      {(route.city || selectedCountry) && (
        <View>
          <SectionTitle title="Keep travel planning separate" />
          <TravelCards country={selectedCountry?.name} city={route.city} />
        </View>
      )}
    </View>
  );
}

function ProviderProfile({ catalog, id }: { catalog: Catalog; id: string }) {
  const { go, startInquiry, compareIds, toggleCompare } = useHealthcare();
  const provider = catalog.providers.find((item) => item.id === id);
  if (!provider)
    return <Missing title="This center is not currently published" />;
  const offerings = providerOfferings(catalog, provider.id);
  const country = countryName(catalog, provider.countryCode);
  const selected = compareIds.includes(provider.id);
  const basic = provider.profileLevel === "basic";
  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <Button
          label="All centers"
          variant="ghost"
          icon="ArrowLeft"
          onPress={() => go({ page: "providers" })}
        />
        <Button
          label={`${provider.city}, ${country}`}
          variant="ghost"
          icon="MapPin"
          onPress={() =>
            go({
              page: "providers",
              countryCode: provider.countryCode,
              city: provider.city,
            })
          }
        />
      </View>
      <ProviderPhoto provider={provider} large />
      <View style={styles.profileHero}>
        <View style={styles.profileSymbol}>
          <Icon name="Building2" size={40} color={colors.white} />
        </View>
        <View style={{ flex: 1, minWidth: 260, gap: 14 }}>
          <T variant="eyebrow">
            {basic
              ? "Basic public-source medical center record"
              : "Source-linked medical center record"}
          </T>
          <T variant="h1" accessibilityRole="header">
            {provider.name}
          </T>
          <T style={{ color: colors.muted }}>
            {provider.city} · {country}
          </T>
          <T>{provider.summary}</T>
        </View>
      </View>
      <Notice>
        {basic
          ? "Basic discovery listing assembled from public pages. Provider contact information has not been added, and the listing does not indicate provider participation. "
          : provider.listingKind === "independent"
            ? "Independent directory listing. No clinic partnership is implied. "
            : "Directory listing. "}
        Sources describe the named location; they do not independently verify
        clinical credentials, safety or outcomes. Last listing update:{" "}
        {provider.updatedAt}.
      </Notice>
      <View style={styles.row}>
        <Button
          label="Ask our listing team"
          accessibilityLabel="Ask AbroadMedClub listing team, not the clinic"
          icon="MessageCircle"
          onPress={() => startInquiry(provider.id)}
        />
        <Button
          label={selected ? "Remove from comparison" : "Add to comparison"}
          variant="secondary"
          disabled={!selected && compareIds.length >= 3}
          onPress={() => toggleCompare(provider.id)}
        />
        {compareIds.length >= 2 && (
          <Button
            label="Open comparison"
            variant="ghost"
            onPress={() => go({ page: "compare" })}
          />
        )}
      </View>
      <T variant="small" style={{ color: colors.muted }}>
        Your inquiry goes to the AbroadMedClub listing team, not this clinic. It
        does not book an appointment, obtain a quote or send medical information
        to the provider.
      </T>
      <View style={styles.row}>
        <Card style={styles.pathCard}>
          <T
            variant="h3"
            accessibilityRole="header"
            headingLevel={2}
          >
            Location & contact status
          </T>
          {provider.address ? (
            <T>{provider.address}</T>
          ) : (
            <T>Street address not added to this record.</T>
          )}
          <T>
            {provider.city}, {country}
          </T>
          {provider.website && (
            <ExternalLink
              label="Official provider website"
              url={provider.website}
            />
          )}
          {provider.contactUrl && (
            <ExternalLink
              label="Contact provider directly on its website"
              url={provider.contactUrl}
            />
          )}
          {provider.address && (
            <ExternalLink
              label="Find this address on Google Maps"
              url={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${provider.name}, ${provider.address}, ${provider.city}, ${country}`)}`}
            />
          )}
          {!provider.website && !provider.contactUrl && (
            <Notice>
              Contact information is intentionally absent from this basic
              discovery record. Use the cited public source for research; do not
              assume the organization participates in AbroadMedClub.
            </Notice>
          )}
          <T variant="small" style={{ color: colors.muted }}>
            {provider.address
              ? "Map search uses the published address; confirm the exact branch and entrance with the provider. External contact is separate from our listing-team inbox."
              : "Location is city-level only. Confirm the exact facility before making travel plans."}
          </T>
        </Card>
        <Card style={styles.pathCard}>
          <T
            variant="h3"
            accessibilityRole="header"
            headingLevel={2}
          >
            Published languages & facilities
          </T>
          <T variant="label">Languages</T>
          <T>
            {provider.languages.length
              ? provider.languages.join(", ")
              : "Language support is not specified in this listing."}
          </T>
          <T variant="label">Facilities / service setting</T>
          {provider.facilities.length ? (
            provider.facilities.map((item, index) => (
              <T key={index}>• {item}</T>
            ))
          ) : (
            <T>Facility details are not published in this listing.</T>
          )}
          <T variant="small" style={{ color: colors.muted }}>
            Confirm interpreter availability and accessibility for the
            appointment and exact location you need.
          </T>
        </Card>
      </View>
      <View>
        <SectionTitle
          title="Published services & costs"
          description="Each service has its own public source and scope. Broad consultations are not evidence that every related procedure is offered."
        />
        <View style={{ gap: 18 }}>
          {offerings.map((offering) => (
            <ServiceDetails
              key={offering.id}
              offering={offering}
              catalog={catalog}
              inquiry
            />
          ))}
        </View>
        {!offerings.length && (
          <Notice>
            No service records are currently published for this center. Check
            its official website rather than inferring availability from its
            name.
          </Notice>
        )}
      </View>
      <View>
        <SectionTitle
          title="Practitioners named in the sources"
          description="A published name is not an independent credential check or a promise that a practitioner is available."
        />
        {provider.practitioners.length ? (
          <View style={styles.row}>
            {provider.practitioners.map((practitioner, index) => (
              <Card
                key={`${practitioner.name}-${index}`}
                style={styles.pathCard}
              >
                <T variant="h3">{practitioner.name}</T>
                <T>{practitioner.role}</T>
                <ExternalLink
                  label="Official practitioner source"
                  url={practitioner.sourceUrl}
                />
              </Card>
            ))}
          </View>
        ) : (
          <Notice>
            No location-specific practitioner records have been included. Ask
            the provider who would assess and treat you, and how to check their
            current registration.
          </Notice>
        )}
      </View>
      <View>
        <SectionTitle
          title="Published credential claims"
          description="Provider-published claims are attributed below, not certified by AbroadMedClub. Check current status and location coverage with the relevant issuing body."
        />
        {provider.credentialClaims.length ? (
          <View style={{ gap: 16 }}>
            {provider.credentialClaims.map((claim, index) => (
              <Card key={index} style={styles.detailIntro}>
                <T variant="h3">{claim.label}</T>
                <T>{claim.note}</T>
                <ExternalLink
                  label="Read the original claim"
                  url={claim.sourceUrl}
                />
              </Card>
            ))}
          </View>
        ) : (
          <Notice>
            No credential or accreditation claim is recorded for this location.
            No inference should be made about accreditation or clinical quality.
          </Notice>
        )}
      </View>
      <View>
        <SectionTitle
          title="Sources & transparency"
          description="Use these public pages to check what was published and when our record was reviewed. Some basic records begin with third-party directory research."
        />
        <Card style={styles.detailIntro}>
          {provider.sources.map((source, index) => (
            <View key={`${source.url}-${index}`} style={styles.source}>
              <ExternalLink label={source.label} url={source.url} />
              <T variant="small" selectable style={{ color: colors.muted }}>
                {source.url}
              </T>
              <T variant="small">Checked {source.checkedAt}</T>
            </View>
          ))}
          {!provider.sources.length && (
            <T>No source records are currently available.</T>
          )}
        </Card>
      </View>
      <Card style={styles.editorialBand}>
        <T variant="h2">Questions worth taking to a consultation</T>
        <T>
          Who will provide care? What is included in the individual quote? What
          alternatives and risks apply to you? Who handles complications and
          follow-up after you return home?
        </T>
        <Button
          label="Read the patient guides"
          variant="secondary"
          onPress={() => go({ page: "guides" })}
          style={{ alignSelf: "flex-start" }}
        />
      </Card>
      <View>
        <SectionTitle title={`Travel planning for ${provider.city}`} />
        <TravelCards country={country} city={provider.city} />
      </View>
    </View>
  );
}

function Comparison({ catalog }: { catalog: Catalog }) {
  const { compareIds, toggleCompare, go, startInquiry } = useHealthcare();
  const providers = compareIds
    .map((id) => catalog.providers.find((provider) => provider.id === id))
    .filter((provider): provider is Provider => !!provider);
  return (
    <View style={styles.stack}>
      <Heading
        eyebrow="Your shortlist"
        title="Compare information, not medical quality"
        description="Choose two or three centers and review location-specific published facts side by side. There is no score, recommendation or cheapest-provider ranking."
      />
      <Notice>
        Different procedures, currencies, units and inclusions are not
        equivalent. A published price is not your quote; a missing fact is not
        evidence that a service is unavailable.
      </Notice>
      {providers.length < 2 && (
        <EmptyState
          icon="Building2"
          title={
            providers.length
              ? "Add one more center to compare"
              : "Start with two centers"
          }
          body="Use Compare on any published center card. Your shortlist stays in this session only; no medical suitability is inferred."
          actionLabel="Browse medical centers"
          onAction={() => go({ page: "providers" })}
        />
      )}
      <View style={styles.row}>
        {providers.map((provider) => (
          <Card key={provider.id} style={styles.compareColumn}>
            <ProviderPhoto provider={provider} />
            <T
              variant="h3"
              accessibilityRole="header"
              headingLevel={2}
            >
              {provider.name}
            </T>
            <T>
              {provider.city}, {countryName(catalog, provider.countryCode)}
            </T>
            <Button
              label="Remove"
              variant="ghost"
              small
              onPress={() => toggleCompare(provider.id)}
            />
            <View style={styles.rule} />
            <T variant="label">Address</T>
            <T variant="small">{provider.address || "Not published"}</T>
            <T variant="label">Published languages</T>
            <T variant="small">
              {provider.languages.join(", ") || "Not specified"}
            </T>
            <T variant="label">Facilities / service setting</T>
            <T variant="small">
              {provider.facilities.join("; ") || "Not specified"}
            </T>
            <T variant="label">Practitioners in this record</T>
            <T variant="small">
              {provider.practitioners
                .map((item) => `${item.name} — ${item.role}`)
                .join("; ") || "None recorded; ask the provider"}
            </T>
            <View style={styles.rule} />
            <T variant="h3">Services & source-published prices</T>
            {providerOfferings(catalog, provider.id).map((offering) => (
              <View key={offering.id} style={styles.comparisonService}>
                <T variant="label">
                  {treatmentName(catalog, offering.treatmentId)}
                </T>
                <T variant="small">{offering.summary}</T>
                {!!offering.scope.length && (
                  <T variant="small">Scope: {offering.scope.join("; ")}</T>
                )}
                {!!offering.exclusions.length && (
                  <T variant="small">
                    Limitations: {offering.exclusions.join("; ")}
                  </T>
                )}
                <PriceDetails price={offering.price} />
                <ExternalLink
                  label="Service source"
                  url={offering.source.url}
                />
                <T variant="small">Checked {offering.source.checkedAt}</T>
              </View>
            ))}
            {!providerOfferings(catalog, provider.id).length && (
              <T variant="small">No services published.</T>
            )}
            <T variant="label">Credential claims</T>
            {provider.credentialClaims.length ? (
              provider.credentialClaims.map((claim, index) => (
                <View key={index}>
                  <T variant="small">
                    {claim.label} — {claim.note}
                  </T>
                  <ExternalLink
                    label="Provider-published claim"
                    url={claim.sourceUrl}
                  />
                </View>
              ))
            ) : (
              <T variant="small">None recorded; not a quality judgment.</T>
            )}
            <T variant="label">Record sources</T>
            {provider.sources.map((source, index) => (
              <View key={index}>
                <ExternalLink label={source.label} url={source.url} />
                <T variant="small">Checked {source.checkedAt}</T>
              </View>
            ))}
            <Button
              label="Full center profile"
              onPress={() => go({ page: "provider", id: provider.id })}
            />
            {provider.contactUrl ? (
              <ExternalLink
                label="Official provider contact"
                url={provider.contactUrl}
              />
            ) : (
              <T variant="small" style={{ color: colors.muted }}>
                Contact details have not been added to this basic discovery
                record.
              </T>
            )}
            <Button
              label="Ask our listing team"
              variant="secondary"
              onPress={() => startInquiry(provider.id)}
            />
            <T variant="small" style={{ color: colors.muted }}>
              Recipient: AbroadMedClub listing team, not the clinic.
            </T>
          </Card>
        ))}
      </View>
      <Button
        label={
          providers.length >= 3 ? "Browse other centers" : "Add another center"
        }
        variant="secondary"
        onPress={() => go({ page: "providers" })}
        style={{ alignSelf: "flex-start" }}
      />
    </View>
  );
}

function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.heading}>
      <T variant="eyebrow">{eyebrow}</T>
      <T variant="h1" accessibilityRole="header">
        {title}
      </T>
      <T
        style={{
          color: colors.muted,
          maxWidth: 880,
          fontSize: 16,
          lineHeight: 27,
        }}
      >
        {description}
      </T>
    </View>
  );
}

function Missing({ title }: { title: string }) {
  const { go } = useHealthcare();
  return (
    <EmptyState
      icon="Search"
      title={title}
      body="This link may be outdated or the record may have been removed from the public directory. Browse the current catalog to continue."
      actionLabel="Browse current directory"
      onAction={() => go({ page: "providers" })}
    />
  );
}

export function ExploreScreen({
  onScrollTo,
}: {
  onScrollTo: (y: number) => void;
}) {
  const { catalog, loading, error, refreshCatalog, route } = useHealthcare();
  const scroll = useRef(onScrollTo);
  scroll.current = onScrollTo;
  useEffect(() => {
    scroll.current(0);
  }, [route]);
  // Never let stale, unpublished records leak into counts or comparisons.
  const publicCatalog = useMemo(() => {
    if (!catalog) return null;
    const providers = catalog.providers.filter(
      (provider) => provider.status === "published",
    );
    const ids = new Set(providers.map((provider) => provider.id));
    return {
      ...catalog,
      providers,
      offerings: catalog.offerings.filter((offering) =>
        ids.has(offering.providerId),
      ),
    };
  }, [catalog]);
  if (resourcePages[route.page])
    return (
      <View>
        <Page>
          <DirectoryNavigation />
        </Page>
        <ResourcesScreen />
      </View>
    );
  let content: React.ReactNode;
  if (!publicCatalog) {
    content = loading ? (
      <View style={styles.loading} accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.teal} size="large" />
        <T variant="h3">Loading the live directory</T>
        <T>Please wait while published listings are retrieved.</T>
      </View>
    ) : (
      <EmptyState
        icon="Info"
        title="The directory could not be loaded"
        body={
          error ??
          "No catalog is available. Please retry when connected to the directory service."
        }
        actionLabel="Retry loading"
        onAction={() => {
          void refreshCatalog().catch(() => undefined);
        }}
      />
    );
  } else {
    switch (route.page) {
      case "specialties":
        content = (
          <Specialties
            key={route.categoryId ?? "all"}
            catalog={publicCatalog}
            categoryId={route.categoryId}
          />
        );
        break;
      case "destinations":
        content = (
          <CountryDirectory
            key={route.code ?? "all"}
            catalog={publicCatalog}
            code={route.code}
          />
        );
        break;
      case "providers":
        content = <Results catalog={publicCatalog} route={route} />;
        break;
      case "provider":
        content = <ProviderProfile catalog={publicCatalog} id={route.id} />;
        break;
      case "compare":
        content = <Comparison catalog={publicCatalog} />;
        break;
      default:
        content = <Home catalog={publicCatalog} />;
    }
  }
  return (
    <Page>
      <DirectoryNavigation />
      {content}
    </Page>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 42 },
  homeStack: { gap: 56 },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "flex-start",
  },
  navigation: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  hero: {
    backgroundColor: colors.tealDark,
    borderRadius: 24,
    overflow: "hidden",
    flexDirection: "row",
    minHeight: 560,
  },
  heroStacked: {
    flexDirection: "column",
  },
  heroCopy: {
    flex: 1.08,
    padding: 48,
    gap: 24,
    justifyContent: "center",
  },
  heroCopyCompact: { padding: 26 },
  heroBody: {
    color: "#E5EEE7",
    maxWidth: 580,
    fontSize: 17,
    lineHeight: 28,
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  heroAction: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  heroPrimaryAction: {
    backgroundColor: "#F4F4E9",
    borderColor: "#F4F4E9",
  },
  heroSecondaryAction: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.4)",
  },
  heroActionActive: { opacity: 0.78 },
  heroProofs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingTop: 4,
  },
  heroProof: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexBasis: 175,
    flexGrow: 1,
  },
  heroImage: {
    flex: 0.92,
    minHeight: 560,
  },
  stackedHeroPanel: { flexGrow: 0, flexShrink: 0, flexBasis: "auto" },
  heroImageOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    gap: 28,
  },
  journeyPanel: {
    backgroundColor: "rgba(248,247,242,0.96)",
    borderRadius: 18,
    padding: 22,
    gap: 14,
  },
  journeySteps: { gap: 0 },
  journeyStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
  },
  journeyStepBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  journeyStepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  photoCredit: { gap: 5 },
  finderSection: { gap: 20 },
  finderIntro: { gap: 8 },
  finder: {
    padding: 24,
    gap: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    borderColor: "#CAD7CA",
  },
  sectionIntro: { gap: 9, marginBottom: 24 },
  benefitCard: {
    flex: 1,
    flexBasis: 260,
    flexShrink: 1,
    minWidth: 0,
    minHeight: 315,
    padding: 25,
    gap: 18,
  },
  benefitCardWide: { minHeight: 370 },
  benefitIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitCopy: { flex: 1, gap: 10 },
  pathCard: {
    flex: 1,
    flexBasis: 280,
    flexShrink: 1,
    minWidth: 0,
    padding: 25,
    gap: 17,
  },
  directoryTile: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 280,
    minWidth: 0,
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editorialBand: { backgroundColor: colors.sage, padding: 30, gap: 20 },
  heading: { paddingVertical: 10, gap: 16 },
  filterPanel: { padding: 24, gap: 24 },
  detailIntro: { padding: 26, gap: 16 },
  resultsHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pagination: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  profileHero: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 24,
  },
  profileSymbol: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  source: {
    gap: 4,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  compareColumn: {
    flex: 1,
    flexBasis: 300,
    flexShrink: 1,
    minWidth: 0,
    padding: 24,
    gap: 16,
  },
  comparisonService: {
    gap: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rule: { height: 1, backgroundColor: colors.line, marginVertical: 4 },
  loading: {
    minHeight: 320,
    justifyContent: "center",
    alignItems: "center",
    gap: 18,
  },
});
