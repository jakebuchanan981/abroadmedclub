import React, { useState } from "react";
import { Image, Linking, Pressable, StyleSheet, View } from "react-native";
import { destinations } from "../../data";
import {
  destinationTravelResources,
  travelVendorUrl,
} from "../../travel/destination-resources";
import { useApp } from "../../store";
import { Button, Card, colors, Icon, Notice, T, TextField } from "../../ui";
import { useHealthcare } from "../client";
import { DirectoryLink } from "../DirectoryLink";
import { normalize } from "../search";
import { providerMedia } from "../provider-media";
import type { Catalog, Offering, Price, Provider } from "../types";

export const countryName = (catalog: Catalog, code: string) =>
  catalog.countries.find((country) => country.code === code)?.name ?? code;
export const providerOfferings = (catalog: Catalog, id: string) =>
  catalog.offerings.filter((offering) => offering.providerId === id);
export const treatmentName = (catalog: Catalog, id: string) =>
  catalog.treatments.find((treatment) => treatment.id === id)?.name ??
  "Published service";

export function priceLabel(price: Price): string {
  if (price.kind === "not-published") return "Price not published";
  if (price.kind === "quote-required") return "Individual quote required";
  if (!price.currency || price.amountMinor === undefined)
    return "Confirm price with provider";
  const divisor = 10 ** (price.minorUnit ?? 2);
  const format = (value: number) =>
    `${price.currency} ${(value / divisor).toLocaleString("en-US", { minimumFractionDigits: price.minorUnit ?? 2, maximumFractionDigits: price.minorUnit ?? 2 })}`;
  const amount =
    price.kind === "range" && price.maximumMinor !== undefined
      ? `${format(price.amountMinor)} – ${format(price.maximumMinor)}`
      : `${price.kind === "from" ? "From " : ""}${format(price.amountMinor)}`;
  return `${amount}${price.unit ? ` · ${price.unit}` : ""}`;
}

export function ExternalLink({ label, url }: { label: string; url: string }) {
  const { notify } = useApp();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label} (external website)`}
      onPress={() => {
        if (!/^https?:\/\//i.test(url)) {
          notify("This listing does not have a usable website link.");
          return;
        }
        void Linking.openURL(url).catch(() =>
          notify("Unable to open this website. Please try again."),
        );
      }}
      style={({ pressed }) => [parts.external, pressed && { opacity: 0.65 }]}
    >
      <T variant="label" style={{ color: colors.teal, flexShrink: 1 }}>
        {label}
      </T>
      <Icon name="ArrowUpRight" size={16} />
    </Pressable>
  );
}

export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; count?: number }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.value === value);
  const matching = options.filter((option) =>
    normalize(option.label).includes(normalize(search)),
  );
  return (
    <View style={parts.choice}>
      <T variant="label">{label}</T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? "All"}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={parts.choiceButton}
      >
        <T style={{ flex: 1 }}>{selected?.label ?? "All"}</T>
        <Icon name={open ? "X" : "ChevronDown"} size={18} />
      </Pressable>
      {open && (
        <View style={parts.options}>
          {options.length > 8 && (
            <TextField
              label={`Find ${label.toLowerCase()}`}
              value={search}
              onChangeText={setSearch}
              placeholder="Type to narrow the list"
            />
          )}
          {matching.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: option.value === value }}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
                setSearch("");
              }}
              style={[
                parts.option,
                option.value === value && { backgroundColor: colors.sage },
              ]}
            >
              <T style={{ flex: 1 }}>{option.label}</T>
              {option.count !== undefined && (
                <T variant="small">{option.count}</T>
              )}
              {option.value === value && <Icon name="Check" size={16} />}
            </Pressable>
          ))}
          {!matching.length && (
            <T variant="small">
              No matching options. Try a different spelling.
            </T>
          )}
        </View>
      )}
    </View>
  );
}

export function PriceDetails({ price }: { price: Price }) {
  return (
    <View style={{ gap: 8 }}>
      <T variant="h3">{priceLabel(price)}</T>
      {(price.kind === "fixed" ||
        price.kind === "from" ||
        price.kind === "range") && (
        <T variant="small" style={{ color: colors.muted }}>
          Published amount in its original currency, not a personal quote.
          Eligibility, scope, validity and final costs must be confirmed
          directly.
        </T>
      )}
      {!!price.includes.length && (
        <T variant="small">Price includes: {price.includes.join("; ")}</T>
      )}
      {!!price.excludes.length && (
        <T variant="small">Price excludes: {price.excludes.join("; ")}</T>
      )}
      {price.sourceUrl && (
        <ExternalLink label="Original price source" url={price.sourceUrl} />
      )}
    </View>
  );
}

export function ServiceDetails({
  offering,
  catalog,
  inquiry = false,
}: {
  offering: Offering;
  catalog: Catalog;
  inquiry?: boolean;
}) {
  const { go, startInquiry } = useHealthcare();
  return (
    <Card style={parts.service}>
      <T variant="h3" accessibilityRole="header">
        {treatmentName(catalog, offering.treatmentId)}
      </T>
      <T>{offering.summary}</T>
      {!!offering.scope.length && (
        <View style={{ gap: 5 }}>
          <T variant="label">Published service scope</T>
          {offering.scope.map((item, index) => (
            <T key={index} variant="small">
              • {item}
            </T>
          ))}
        </View>
      )}
      {!!offering.exclusions.length && (
        <T variant="small">
          Scope limitations: {offering.exclusions.join("; ")}
        </T>
      )}
      <View style={parts.rule} />
      <PriceDetails price={offering.price} />
      <ExternalLink label={offering.source.label} url={offering.source.url} />
      <T variant="small" style={{ color: colors.muted }}>
        Source checked {offering.source.checkedAt}. Published information may
        change.
      </T>
      <View style={parts.row}>
        <Button
          label="Explore this treatment"
          variant="secondary"
          small
          onPress={() =>
            go({ page: "providers", treatmentId: offering.treatmentId })
          }
        />
        {inquiry && (
          <Button
            label="Ask our listing team"
            small
            onPress={() => startInquiry(offering.providerId, offering.id)}
          />
        )}
      </View>
    </Card>
  );
}

export function ProviderPhoto({
  provider,
  large = false,
}: {
  provider: Provider;
  large?: boolean;
}) {
  const media = providerMedia[provider.id];
  if (!media) return null;
  return (
    <View style={parts.media}>
      <Image
        source={media.image}
        accessibilityLabel={media.alt}
        resizeMode="cover"
        style={[parts.providerImage, large && parts.providerImageLarge]}
      />
      <View style={parts.mediaCaption}>
        <T variant="small" style={{ color: colors.muted }}>
          Facility photograph. Appearance may have changed since capture.
        </T>
        <ExternalLink
          label={`Photo: ${media.credit} · ${media.license}`}
          url={media.sourceUrl}
        />
      </View>
    </View>
  );
}

export function ProviderCard({
  provider,
  catalog,
}: {
  provider: Provider;
  catalog: Catalog;
}) {
  const { go, compareIds, toggleCompare } = useHealthcare();
  const offerings = providerOfferings(catalog, provider.id);
  const categories = catalog.categories.filter((category) =>
    offerings.some((offering) =>
      catalog.treatments.some(
        (treatment) =>
          treatment.id === offering.treatmentId &&
          treatment.categoryId === category.id,
      ),
    ),
  );
  const selected = compareIds.includes(provider.id);
  return (
    <Card style={parts.providerCard}>
      <ProviderPhoto provider={provider} />
      <View style={parts.row}>
        <View style={parts.symbol}>
          <Icon name="Building2" size={25} />
        </View>
        <T variant="eyebrow" style={{ flex: 1 }}>
          {provider.profileLevel === "basic"
            ? "Basic public-source listing · Contact not added"
            : "Source-linked directory listing"}
        </T>
      </View>
      <DirectoryLink
        route={{ page: "provider", id: provider.id }}
        label={provider.name}
      >
        <T variant="h3" accessibilityRole="header">
          {provider.name}
        </T>
      </DirectoryLink>
      <T variant="small" style={{ color: colors.muted }}>
        {provider.city} · {countryName(catalog, provider.countryCode)}
      </T>
      <T style={{ fontSize: 14, lineHeight: 23 }}>{provider.summary}</T>
      <T variant="small">
        {categories.map((category) => category.name).join(" · ") ||
          "Service scope not published"}
      </T>
      <View style={parts.rule} />
      <T variant="small">
        {offerings.length} sourced{" "}
        {offerings.length === 1 ? "service" : "services"} · No medical ranking
      </T>
      <View style={parts.row}>
        <Button
          label="View center"
          small
          icon="ArrowRight"
          onPress={() => go({ page: "provider", id: provider.id })}
        />
        <Button
          label={selected ? "Remove comparison" : "Compare"}
          small
          variant="secondary"
          disabled={!selected && compareIds.length >= 3}
          onPress={() => toggleCompare(provider.id)}
        />
      </View>
    </Card>
  );
}

export function TravelCards({
  country,
  city,
}: {
  country?: string;
  city?: string;
}) {
  const { state, toggleSaved, openPlanner, navigate } = useApp();
  const { go } = useHealthcare();
  const countryMatches = destinations.filter(
    (destination) =>
      !country || normalize(destination.country) === normalize(country),
  );
  const cityMatches = city
    ? countryMatches.filter(
        (destination) => normalize(destination.city) === normalize(city),
      )
    : countryMatches;
  const matching =
    city && !cityMatches.length && countryMatches.length
      ? countryMatches
      : cityMatches;
  const countryFallback = Boolean(
    city && !cityMatches.length && countryMatches.length,
  );
  return (
    <View style={{ gap: 18 }}>
      <T variant="small" style={{ color: colors.muted }}>
        Landmark photography is travel context, not a medical-facility image.
        Travel planning is separate from choosing care.
      </T>
      {countryFallback && (
        <Notice>
          A city-specific planner is not available for {city}. Showing the
          supported planner for the same country instead.
        </Notice>
      )}
      {!matching.length && (
        <Notice>
          No matching local travel planner is available for this location.
          Continue browsing the care directory, or explicitly choose another
          travel destination below.
        </Notice>
      )}
      <View style={parts.row}>
        {matching.map((destination) => {
          const resources = destinationTravelResources[destination.id];
          return (
            <Card key={destination.id} style={parts.travelCard}>
              <Image
                source={destination.image}
                accessibilityLabel={
                  resources
                    ? `${resources.landmark.name} in ${destination.city}, not a clinic`
                    : `${destination.city} landmark, not a clinic`
                }
                resizeMode="cover"
                style={parts.travelImage}
              />
              <View style={parts.travelBody}>
                <T variant="eyebrow">{destination.country} · Destination</T>
                <T variant="h3">{destination.city}</T>
                {resources && (
                  <>
                    <T variant="small" style={{ color: colors.muted }}>
                      Landmark: {resources.landmark.name}
                    </T>
                    <ExternalLink
                      label={`Photo: ${resources.landmark.credit} · ${resources.landmark.license}`}
                      url={resources.landmark.sourceUrl}
                    />
                  </>
                )}
                <T variant="small">{destination.description}</T>
                <View style={parts.row}>
                  <Button
                    label={`Plan ${destination.city}`}
                    small
                    onPress={() => openPlanner(destination.id)}
                  />
                  <Button
                    label={
                      state.savedDestinations.includes(destination.id)
                        ? "Saved"
                        : "Save destination"
                    }
                    accessibilityLabel={`${state.savedDestinations.includes(destination.id) ? "Unsave" : "Save"} ${destination.city}`}
                    icon="Heart"
                    small
                    variant="secondary"
                    onPress={() => toggleSaved(destination.id)}
                  />
                </View>
                {resources && (
                  <>
                    <View style={parts.rule} />
                    <View style={parts.resourceBlock}>
                      <T variant="h3">Destination travel guide</T>
                      <T variant="small" style={{ color: colors.muted }}>
                        {resources.guide.description}
                      </T>
                      <ExternalLink
                        label={resources.guide.label}
                        url={resources.guide.url}
                      />
                    </View>
                    <View style={parts.resourceBlock}>
                      <T variant="h3">Hotels & rentals</T>
                      <T variant="small" style={{ color: colors.muted }}>
                        Compare recent guest reviews and practical recovery
                        needs. AbroadMedClub does not inspect or guarantee any
                        accommodation.
                      </T>
                      {resources.stays.map((option) => (
                        <View
                          key={`${option.vendor}-${option.kind}`}
                          style={parts.resourceOption}
                        >
                          <View style={parts.row}>
                            <T variant="label">
                              {option.vendor} ·{" "}
                              {option.kind === "hotel" ? "Hotels" : "Rentals"}
                            </T>
                            {option.preferred && (
                              <T
                                variant="small"
                                style={parts.preferredBadge}
                              >
                                Preferred travel vendor · Editorial
                              </T>
                            )}
                          </View>
                          <T variant="small" style={{ color: colors.muted }}>
                            {option.description}
                          </T>
                          <ExternalLink
                            label={option.label}
                            url={travelVendorUrl(option, destination.id)}
                          />
                        </View>
                      ))}
                      <T variant="small" style={{ color: colors.muted }}>
                        Member rates or destination promotions may reduce travel
                        expenses. Eligibility and actual savings are set by the
                        vendor and are not guaranteed.
                      </T>
                    </View>
                    <View style={parts.resourceBlock}>
                      <T variant="h3">Entry rules & visa help</T>
                      <T variant="small" style={{ color: colors.muted }}>
                        Requirements vary by passport, route, purpose and length
                        of stay. Start with the government source.
                      </T>
                      <ExternalLink
                        label={resources.entry.label}
                        url={resources.entry.url}
                      />
                      <T variant="small" style={{ color: colors.muted }}>
                        {resources.entry.description}
                      </T>
                      <ExternalLink
                        label={resources.visaHelp.label}
                        url={resources.visaHelp.url}
                      />
                      <T variant="small" style={{ color: colors.muted }}>
                        {resources.visaHelp.description}
                      </T>
                    </View>
                  </>
                )}
              </View>
            </Card>
          );
        })}
      </View>
      {!!matching.length && (
        <Notice>
          Accommodation links open independent travel sites. Booking.com is the
          current preferred search option for editorial convenience, not a paid
          ranking or quality endorsement. If affiliate tracking is configured,
          AbroadMedClub may earn a commission at no extra cost to the traveler.
        </Notice>
      )}
      <View style={parts.row}>
        {(country || city) && (
          <Button
            label="Browse all travel destinations"
            variant="secondary"
            onPress={() => go({ page: "destinations" })}
          />
        )}
        <Button
          label="Explore the community"
          variant="ghost"
          icon="Users"
          onPress={() => navigate("club")}
        />
      </View>
    </View>
  );
}

const parts = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "flex-start",
  },
  external: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  choice: { gap: 8, flexGrow: 1, flexShrink: 1, flexBasis: 220, minWidth: 180 },
  choiceButton: {
    minHeight: 50,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  options: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
    padding: 10,
    gap: 4,
  },
  option: {
    minHeight: 44,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 6,
  },
  service: { padding: 24, gap: 14 },
  providerCard: {
    padding: 24,
    gap: 14,
    flexBasis: 310,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 650,
  },
  media: { gap: 7 },
  mediaCaption: { gap: 0 },
  providerImage: { width: "100%", height: 180, borderRadius: 12 },
  providerImageLarge: { height: 300 },
  symbol: {
    width: 48,
    height: 48,
    backgroundColor: colors.sage,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rule: { height: 1, backgroundColor: colors.line, marginVertical: 2 },
  travelCard: {
    flexBasis: 300,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 640,
    overflow: "hidden",
  },
  travelImage: { width: "100%", height: 210 },
  travelBody: { padding: 20, gap: 12 },
  resourceBlock: { gap: 8 },
  resourceOption: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
  },
  preferredBadge: {
    color: colors.teal,
    backgroundColor: colors.sage,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
});
