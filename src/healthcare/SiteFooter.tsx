import React from "react";
import { View, useWindowDimensions } from "react-native";
import { brand } from "../data";
import { colors, fonts, Icon, T } from "../ui";
import { DirectoryLink } from "./DirectoryLink";
import type { DirectoryRoute } from "./navigation";

const groups: {
  title: string;
  links: { label: string; route: DirectoryRoute }[];
}[] = [
  {
    title: "Explore care",
    links: [
      { label: "Find medical centers", route: { page: "providers" } },
      { label: "All medical specialties", route: { page: "specialties" } },
      { label: "Countries & destinations", route: { page: "destinations" } },
      { label: "Compare centers", route: { page: "compare" } },
    ],
  },
  {
    title: "Plan with perspective",
    links: [
      { label: "Patient guides", route: { page: "guides" } },
      { label: "How it works", route: { page: "how-it-works" } },
      { label: "About AbroadMedClub", route: { page: "about" } },
      { label: "List your medical center", route: { page: "providers-join" } },
    ],
  },
  {
    title: "Help & transparency",
    links: [
      { label: "Contact the directory team", route: { page: "contact" } },
      { label: "Privacy & your data", route: { page: "privacy" } },
      { label: "Terms & medical disclaimer", route: { page: "terms" } },
    ],
  },
];

export function SiteFooter() {
  const { width } = useWindowDimensions();
  return (
    <View
      role="contentinfo"
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.line,
        backgroundColor: "#EFF2EB",
        marginTop: "auto",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1380,
          alignSelf: "center",
          paddingHorizontal: width < 700 ? 20 : 48,
          paddingTop: 46,
          paddingBottom: 24,
          gap: 32,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 36,
            justifyContent: "space-between",
          }}
        >
          <View style={{ width: width < 700 ? "100%" : 260, gap: 16 }}>
            <DirectoryLink route={{ page: "home" }} label="AbroadMedClub home">
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
              >
                <Icon name="Leaf" size={25} />
                <T
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 22,
                    letterSpacing: -0.8,
                  }}
                >
                  {brand.name}
                </T>
              </View>
            </DirectoryLink>
            <T style={{ color: colors.muted, fontSize: 14, lineHeight: 23 }}>
              A clearer view of care abroad. Explore your options, ask better
              questions, and plan on your own terms.
            </T>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Icon name="Globe2" size={16} />
              <T variant="small">
                International perspective. Independent information.
              </T>
            </View>
          </View>
          {groups.map((group) => (
            <View
              key={group.title}
              style={{
                minWidth: width < 700 ? 145 : 170,
                flexGrow: 1,
                maxWidth: 250,
              }}
            >
              <T variant="eyebrow" style={{ marginBottom: 10 }}>
                {group.title}
              </T>
              {group.links.map((link) => (
                <DirectoryLink
                  key={link.label}
                  route={link.route}
                  label={link.label}
                />
              ))}
            </View>
          ))}
        </View>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.line,
            paddingTop: 20,
            gap: 7,
          }}
        >
          <T variant="small">
            Directory information is not medical advice, endorsement, or a
            guarantee of care. Discuss suitability, risks, costs, and follow-up
            with your own clinician and the treating facility. For an emergency,
            contact local emergency services.
          </T>
          <T variant="small" style={{ fontSize: 11 }}>
            AbroadMedClub · Independent listings are not provider partnerships.
            Guest plans stay on-device; account plans and inboxes use your
            private account. Community participation is opt-in.
          </T>
        </View>
      </View>
    </View>
  );
}
