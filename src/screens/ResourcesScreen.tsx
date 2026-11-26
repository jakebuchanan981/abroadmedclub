import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { request, useHealthcare } from "../healthcare/client";
import type { Guide, Source } from "../healthcare/types";
import {
  Button,
  Card,
  Chip,
  Choice,
  colors,
  EmptyState,
  Icon,
  Notice,
  Page,
  PageTitle,
  T,
  TextField,
} from "../ui";

const resourceLinks = [
  { label: "Learning center", page: "guides" },
  { label: "How it works", page: "how-it-works" },
  { label: "About", page: "about" },
  { label: "Contact & support", page: "contact" },
  { label: "Apply for a listing", page: "providers-join" },
  { label: "Privacy & data use", page: "privacy" },
  { label: "Terms & disclaimer", page: "terms" },
] as const;

type InformationPage = "about" | "how-it-works" | "privacy" | "terms";
type Section = { heading: string; paragraphs: string[]; bullets?: string[] };
const information: Record<
  InformationPage,
  { title: string; summary: string; sections: Section[] }
> = {
  about: {
    title: "A clearer starting point for care abroad",
    summary:
      "AbroadMedClub brings independent directory research, patient learning and personal travel planning into one place.",
    sections: [
      {
        heading: "What we are building",
        paragraphs: [
          "Use the directory to explore healthcare specialties, destinations and source-backed provider information. Some launch records begin with a hospital or clinic name and service categories found in another public medical-tourism directory; those basic records intentionally omit provider contact details. Neither a search result nor a comparison decides whether a treatment or destination is right for you.",
          "This is a local development service with a real operator inbox and account system. It is not an audited production healthcare service. A directory listing does not imply that the provider is a partner, has agreed to receive inquiries here or has been clinically vetted by AbroadMedClub.",
        ],
      },
      {
        heading: "How information is selected",
        paragraphs: [
          "Provider records identify the public sources and dates used for the record. A basic record may cite a third-party directory; a detailed record can include official provider pages. Service availability should be reconfirmed through a verified official channel. Source review establishes support for directory information, not current professional licensing, safety, accreditation or patient outcomes.",
          "Destination and facility photographs are labeled separately and link to their license sources. Our English-language guides are original planning material linked to official and professional sources. Their source-check dates are not clinical review credentials, and a link is not an endorsement.",
        ],
      },
      {
        heading: "Launch directory policy",
        paragraphs: [
          "Basic discovery records may be published before provider outreach, with no address, website or contact route displayed. AbroadMedClub will not initiate outreach to those professionals until the directory and its core site operations are mostly functional. An organization may still contact us first through the application form.",
          "There is no charge to be included or apply during this launch stage. Any future paid provider relationship, sponsored placement or commercial benefit would require a separate agreement and clear labeling; it would not create a clinical ranking.",
        ],
      },
      {
        heading: "Keep the roles clear",
        paragraphs: [
          "Clinicians assess and deliver care. Insurers determine coverage. Government agencies and regulators publish rules within their jurisdictions. Travel organizers may coordinate logistics under their own agreements. AbroadMedClub is not a substitute for any of those roles.",
          "Circles connect consenting members through chosen nicknames, private discussions and optional member messages. User-created travel groups coordinate possible overlapping journeys; they are not club or partner travel packages. Peer posts are not testimonials endorsed by AbroadMedClub, medical advice or proof of a clinical service.",
        ],
      },
    ],
  },
  "how-it-works": {
    title: "Research first. Confirm directly. Decide with your clinician.",
    summary:
      "A directory inquiry is a request to the AbroadMedClub team—not a booking, clinical consultation or message delivered to a clinic.",
    sections: [
      {
        heading: "1. Explore the directory",
        paragraphs: [
          "Browse a specialty, treatment or destination and review the available provider records. Read the cited public source links and checked dates. Basic discovery records may rely on third-party directories and omit contact details. A country or treatment can be part of the taxonomy even when there is no published provider match.",
        ],
      },
      {
        heading: "2. Prepare a shortlist and your questions",
        paragraphs: [
          "Compare published information without treating missing details as reassurance. Use the learning center to plan questions about credentials, costs, insurance, consent and aftercare. Ask your own clinician about suitability, alternatives and the implications of travel before making commitments.",
        ],
      },
      {
        heading: "3. Ask the directory team",
        paragraphs: [
          "Create an account or sign in from Profile to open a provider-related directory inquiry. The recipient is the AbroadMedClub operator inbox. Send only a minimal administrative question, not medical history, records, identification documents or payment information.",
          "A received request is stored on the local backend. It is not emailed or forwarded to the clinic, does not reserve an appointment and does not create a price quote. Account holders can read their own inquiry thread and any operator replies in Messages. The service does not promise a response deadline.",
        ],
      },
      {
        heading: "4. Confirm clinical and travel arrangements separately",
        paragraphs: [
          "When a verified official channel is available, contact the provider there for clinical assessment, current availability, an itemized estimate and a care agreement. A basic discovery record without contact details is a research lead, not an invitation to use an unverified channel. Organize insurance, travel and follow-up with the relevant services. The directory does not accept clinical payments or enter those contracts for you.",
          "Guest trip plans stay on-device. Signed-in travelers can save private account plans across the catalog countries, edit checklists and explicitly copy local plans without deleting their originals. Neither saving a plan nor joining a member-organized travel group arranges clinical care, accommodation, transport or a travel organizer. Keep health information out of planning fields and community messages.",
          "A signed-in traveler can ask the server to match the latest version of one owned account trip with its open destination circle and overlapping open travel groups, starting with the exact entered city or explicitly broadening to the country. Browsing is read-only: it does not publish the trip, join a circle or create a group. Creating from those results is a separate reviewed action that copies only country, city and dates into editable fields for independent public group metadata; it requires the existing publication consent and does not synchronize later trip edits or deletion.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy & data use",
    summary:
      "What this local development app stores, where it goes and who can access it. Updated 19 October 2026.",
    sections: [
      {
        heading: "Two different places for data",
        paragraphs: [
          "Device-local app storage holds saved destinations, guest trip dates and checklists, preferences, and retained legacy preview selections/drafts. Those old selections are not online memberships, and legacy drafts are never automatically sent. Ordinary app/browser storage is not an encrypted medical record. Reset local data before handing a shared device to someone else.",
          "Accounts, account trip plans, opt-in memberships, circle posts, member conversations, directory inquiries, support requests and provider applications use the operator backend. New private drafts remain in screen memory until submitted, not local storage. Copying guest plans to an account requires an explicit action and retains the device originals. No file-upload or medical-record transfer feature is provided.",
        ],
      },
      {
        heading: "Accounts and sessions",
        paragraphs: [
          "The backend stores account identity and role to authenticate users and enforce access. Names and email addresses are encrypted at rest; a separate email lookup hash is used for sign-in. Passwords are hashed rather than stored in readable form. Account creation does not verify control of an email address.",
          "Web authentication uses an HttpOnly session cookie; native authentication uses a token held in memory. These are separate from device-local trip storage. Signing out invalidates the current session, but does not erase local trip plans or previously submitted requests.",
        ],
      },
      {
        heading: "Private requests and staff access",
        paragraphs: [
          "The server encrypts account trip details, membership aliases/message preferences, posts, private messages, report reasons and operator-request content at rest using a locally stored key. Public circle metadata and relationship/index identifiers are not all encrypted. This is not end-to-end encryption: authorized server operations decrypt content, and a machine administrator with the database and key could access it. This local installation is not an audited production security or compliance service.",
          "Signed-in patients can access their own inquiry threads. Authorized staff can read and manage operator inquiries, support requests and provider applications, and review directory entries. Contact details support identifying and handling the request. Support requests and applications are not a public listing and are not automatically shared with providers. This service does not send email or transmit your inquiry to a clinic.",
          "Circle names, descriptions, general destination/travel dates and member counts are public by creation consent. Membership aliases and discussions are limited to active members and moderators; pending or declined travel-group requests do not grant access. Account names and email addresses are not member-directory identities. Circles are not confidential clinical spaces: another member could copy what you share.",
          "Starting a private conversation requires a shared open-circle membership and the recipient's opt-in. Existing conversations can continue after leaving a circle. Either person's block stops further messages; your Blocked members controls remain available after a thread is deleted. Staff moderation exposes only individually reported private messages, with the reporter's explicit consent, not unreported conversation history. No emergency monitoring or response deadline is promised.",
          "Account-trip community matching runs on the server against the latest owned trip and returns only the source country, city, dates and update time with open community matches. Browsing creates no publication, membership or group. If you explicitly create from a match, only country, city and dates are copied into editable fields; the new group's metadata is independently public after the existing consent step and is not synchronized with later trip edits or deletion.",
        ],
      },
      {
        heading: "Retention and removal",
        paragraphs: [
          "There is no automatic retention expiry. Deleting an account removes its identity, sessions, account plans, memberships, posts, directory inquiries, both sides of its private member conversations, related reports/blocks, and travel groups it owns with their discussions. A participant can also explicitly delete an entire shared member thread; that removes it for both people. Reported content is not kept as a separate snapshot after its source content is deleted. Audit records retain opaque actor/target identifiers; backups, if created, need separate retention controls.",
          "Deleting an imported account plan does not delete its device original. The account retains a legacy-ID marker to avoid silently resurrecting a deleted copy through repeated import; account deletion removes that marker. Separately submitted support requests and provider applications are not automatically linked to account deletion. Use Contact & support with the request ID to ask about access, correction or removal. Reset local data affects only the device, not online plans, memberships or messages.",
        ],
      },
      {
        heading: "External sites and deployment limits",
        paragraphs: [
          "Opening a source, provider, travel-guide, visa-support or accommodation link takes you to a third-party site under its own privacy rules; that site receives ordinary connection and referral information. A Booking.com link may include an AbroadMedClub affiliate identifier, but the app does not append form text, health information, account details or trip-plan content to these links.",
          "This notice describes the local development implementation, not legal approval, a privacy certification or a guarantee of security. A public deployment needs its own verified operator identity, hosting and retention arrangements, security review and jurisdiction-specific privacy assessment before receiving sensitive information.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms & medical disclaimer",
    summary:
      "Plain-language boundaries for this development service. Updated 19 October 2026. Not legally approved terms.",
    sections: [
      {
        heading: "Information, not medical advice",
        paragraphs: [
          "Directory records and learning materials are general information. They are not a diagnosis, treatment recommendation, assessment of suitability or emergency service. Do not delay care while waiting for an operator reply. In an emergency, contact the emergency services where you are.",
          "A listing, source-check date or comparison does not guarantee quality, safety, licensing, accreditation, availability or outcomes. Confirm information with the provider, the relevant regulator and your own qualified clinician. Educational sources may concern particular countries and should not be read as universal legal or clinical rules.",
        ],
      },
      {
        heading: "No care contract or payment service",
        paragraphs: [
          "Using this app, saving a trip or receiving an inquiry ID does not create a care contract, appointment, travel booking, insurance policy or financing agreement. AbroadMedClub does not accept treatment payments, deposits or card details here. Any clinical or travel arrangement must be made separately with the actual service provider under that provider's terms.",
          "Accommodation and other travel links open independent vendors. AbroadMedClub may earn a commission at no extra cost when affiliate tracking is configured. A preferred travel vendor label is an editorial starting point, not a guarantee of quality, availability, savings or suitability. Member rates and destination promotions may exist, but discounts and travel-expense reductions are determined by the vendor and are never guaranteed here.",
        ],
      },
      {
        heading: "Launch listings and provider participation",
        paragraphs: [
          "A basic discovery listing can be created from public directory research without provider contact details or provider participation. During launch, AbroadMedClub will defer its own provider outreach until the directory and core site operations are mostly functional.",
          "Directory inclusion and provider applications have no charge during the launch stage. A listing does not establish a partnership or endorsement. Receipt, review or an application decision does not guarantee publication or create a commercial relationship.",
        ],
      },
      {
        heading: "Use requests responsibly",
        paragraphs: [
          "Submit accurate administrative information that you are authorized to share. Do not submit medical records, detailed health histories, identity documents, payment details or another person's private information. Do not use the service for harassment, impersonation, unlawful content or attempts to access other users' data.",
          "Keep your password private and use the sign-out and account controls on shared devices. The operator inbox is not continuously monitored or a clinical triage service. A receipt confirms local storage, not that staff have read or acted on the request.",
          "Use your chosen circle nickname without impersonating others. Obtain consent before sharing anyone's information. Report inappropriate circle posts or explicitly share a concerning private message with moderators; blocking is available independently of reporting. A report receipt confirms storage, not that staff have reviewed it. Member-created travel groups are coordination spaces, not vetted organizers or paid packages.",
        ],
      },
      {
        heading: "Sources, corrections and legal limits",
        paragraphs: [
          "Information can change after its source-check date. External sites have their own rules, security practices and content. Tell the directory team about an inaccurate listing using its name or URL and the source of the correction, without disclosing patient data.",
          "These statements describe the intended scope of this local development service. They have not been legally reviewed or approved and do not determine your statutory rights or promise remedies in any jurisdiction. Obtain qualified advice for decisions about legal recourse, cross-border care or financial obligations. Nothing here claims a registered legal entity, an approved care service or production compliance.",
        ],
      },
    ],
  },
};

function ParagraphSections({ sections }: { sections: Section[] }) {
  return (
    <View style={styles.sections}>
      {sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <T variant="h2" accessibilityRole="header">
            {section.heading}
          </T>
          {section.paragraphs.map((paragraph) => (
            <T key={paragraph} style={styles.prose}>
              {paragraph}
            </T>
          ))}
          {section.bullets?.map((bullet) => (
            <View key={bullet} style={styles.bullet}>
              <T style={styles.bulletMark}>•</T>
              <T style={styles.bulletText}>{bullet}</T>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function SourceLink({ source }: { source: Source }) {
  const [error, setError] = useState(false);
  async function open() {
    setError(false);
    try {
      await Linking.openURL(source.url);
    } catch {
      setError(true);
    }
  }
  return (
    <View style={styles.source}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${source.label}, external website`}
        onPress={() => void open()}
        style={styles.sourceLink}
      >
        <Icon name="ArrowUpRight" size={18} color={colors.teal} />
        <T variant="label" style={styles.linkText}>
          {source.label}
        </T>
      </Pressable>
      <T variant="small" style={styles.muted}>
        Source checked {source.checkedAt}
      </T>
      {error && (
        <T selectable accessibilityRole="alert" style={styles.error}>
          Could not open this link. Open it in your browser: {source.url}
        </T>
      )}
    </View>
  );
}

function GuideArticle({ guide }: { guide: Guide }) {
  const { catalog, go } = useHealthcare();
  const related = (catalog?.guides ?? [])
    .filter((item) => item.id !== guide.id && item.category === guide.category)
    .slice(0, 3);
  return (
    <View style={styles.reading}>
      <PageTitle
        eyebrow={`${guide.category} · About ${guide.readMinutes} min read`}
        title={guide.title}
        description={guide.summary}
      />
      <Notice>
        General preparation, not personal medical advice. Source-check dates are
        not clinical review dates. Discuss your circumstances with qualified
        professionals.
      </Notice>
      <ParagraphSections sections={guide.sections} />
      <Card style={styles.sourceCard}>
        <T
          variant="h3"
          accessibilityRole="header"
          headingLevel={2}
        >
          Sources & further reading
        </T>
        <T variant="small" style={styles.muted}>
          Original English-language guide. Links go to external primary sources;
          their guidance may be jurisdiction-specific and can change.
        </T>
        {guide.sources.map((source) => (
          <SourceLink key={source.url} source={source} />
        ))}
      </Card>
      {related.length > 0 && (
        <View style={styles.section}>
          <T
            variant="h3"
            accessibilityRole="header"
            headingLevel={2}
          >
            Continue reading
          </T>
          {related.map((item) => (
            <Button
              key={item.id}
              variant="secondary"
              label={item.title}
              icon="ArrowRight"
              onPress={() => go({ page: "guides", id: item.id })}
            />
          ))}
        </View>
      )}
      <Button
        variant="ghost"
        label="All patient guides"
        icon="ArrowLeft"
        onPress={() => go({ page: "guides" })}
      />
    </View>
  );
}

function GuideLibrary() {
  const { catalog, loading, error, refreshCatalog, route, go } =
    useHealthcare();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Guide["category"] | "All">("All");
  const [reloadError, setReloadError] = useState<string | null>(null);
  async function reload() {
    setReloadError(null);
    try {
      await refreshCatalog();
    } catch (reason) {
      setReloadError(
        reason instanceof Error
          ? reason.message
          : "Could not load guides. Try again.",
      );
    }
  }
  if (!catalog)
    return (
      <View style={styles.section}>
        <PageTitle
          eyebrow="Patient resources"
          title="Learning center"
          description="Practical questions for planning, costs, safety and care after travel."
        />
        {loading ? (
          <ActivityIndicator
            accessibilityLabel="Loading patient guides"
            color={colors.teal}
          />
        ) : (
          <Notice>
            {reloadError ||
              error ||
              "The learning center is unavailable while the directory service is offline."}
          </Notice>
        )}
        {!loading && (
          <Button
            label="Try loading guides again"
            onPress={() => void reload()}
          />
        )}
      </View>
    );
  if (route.page === "guides" && route.id) {
    const guide = catalog.guides.find((item) => item.id === route.id);
    return guide ? (
      <GuideArticle key={guide.id} guide={guide} />
    ) : (
      <EmptyState
        icon="CircleHelp"
        title="Guide not found"
        body="This guide link does not match a published article."
        actionLabel="Browse all guides"
        onAction={() => go({ page: "guides" })}
      />
    );
  }
  const normalized = query.trim().toLocaleLowerCase();
  const filtered = catalog.guides.filter(
    (guide) =>
      (category === "All" || guide.category === category) &&
      (!normalized ||
        [
          guide.title,
          guide.summary,
          ...guide.sections.flatMap((section) => [
            section.heading,
            ...section.paragraphs,
            ...(section.bullets ?? []),
          ]),
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalized)),
  );
  return (
    <View style={styles.section}>
      <PageTitle
        eyebrow="Patient resources"
        title="Make room for the right questions"
        description="Original guides to help you investigate care abroad, understand the unknowns and prepare conversations with the people responsible for your care."
      />
      <Notice>
        Education, not medical advice. No destination or clinic is right for
        everyone. Read the dated primary sources and seek advice for your
        circumstances.
      </Notice>
      <TextField
        label="Search patient guides"
        placeholder="Try insurance, records or accessibility"
        value={query}
        onChangeText={setQuery}
        maxLength={160}
      />
      <View style={styles.wrap}>
        {(["All", "Planning", "Costs", "Safety", "Aftercare"] as const).map(
          (item) => (
            <Chip
              key={item}
              label={item}
              active={category === item}
              onPress={() => setCategory(item)}
            />
          ),
        )}
      </View>
      <T variant="small" accessibilityLiveRegion="polite" style={styles.muted}>
        {filtered.length} {filtered.length === 1 ? "guide" : "guides"} · English
      </T>
      <View style={styles.grid}>
        {filtered.map((guide) => (
          <Card key={guide.id} style={styles.guideCard}>
            <T variant="eyebrow" style={styles.muted}>
              {guide.category} · {guide.readMinutes} min
            </T>
            <T
              variant="h3"
              accessibilityRole="header"
              headingLevel={2}
            >
              {guide.title}
            </T>
            <T style={styles.prose}>{guide.summary}</T>
            <Button
              label="Read guide"
              variant="ghost"
              icon="ArrowRight"
              onPress={() => go({ page: "guides", id: guide.id })}
              accessibilityLabel={`Read ${guide.title}`}
            />
          </Card>
        ))}
      </View>
      {filtered.length === 0 && (
        <EmptyState
          icon="Search"
          title="No matching guides"
          body="Try another search or browse all topics."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery("");
            setCategory("All");
          }}
        />
      )}
    </View>
  );
}

const supportTopics = [
  "General directory question",
  "Listing correction",
  "Accessibility problem",
  "Account help",
  "Privacy or data request",
];

function OperatorForm({ kind }: { kind: "support" | "provider" }) {
  const {
    catalog,
    loading,
    error: catalogError,
    refreshCatalog,
    go,
  } = useHealthcare();
  const provider = kind === "provider";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [website, setWebsite] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [city, setCity] = useState("");
  const [topic, setTopic] = useState(supportTopics[0]);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const inFlight = useRef(false);
  const countries = catalog?.countries ?? [];
  const selectedCountry = countries.find(
    (country) => country.code === countryCode,
  );
  const filteredCountries = countries.filter((country) =>
    `${country.name} ${country.code}`
      .toLocaleLowerCase()
      .includes(countryQuery.trim().toLocaleLowerCase()),
  );

  async function submit() {
    if (inFlight.current) return;
    setError(null);
    const contactName = name.trim();
    const address = email.trim();
    const body = message.trim();
    if (!contactName || !address || !body) {
      setError(
        "Enter your name, email address and a short administrative message.",
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("Enter an email address such as name@example.com.");
      return;
    }
    if (!consent) {
      setError(
        "Please read the data-use notice and explicitly consent before submitting.",
      );
      return;
    }
    if (provider) {
      if (!organization.trim() || !city.trim() || !selectedCountry) {
        setError(
          "Enter the organization and city, and select a country from the directory list.",
        );
        return;
      }
      try {
        const url = new URL(website.trim());
        if (
          url.protocol !== "https:" ||
          !url.hostname ||
          url.username ||
          url.password
        )
          throw new Error();
      } catch {
        setError(
          "Enter the organization's full official HTTPS website, without login credentials.",
        );
        return;
      }
    }
    inFlight.current = true;
    setPending(true);
    try {
      const result = await request<{ id: string; status: "received" }>(
        provider ? "/provider-applications" : "/support",
        {
          method: "POST",
          body: provider
            ? {
                organization: organization.trim(),
                contactName,
                email: address,
                website: website.trim(),
                countryCode,
                city: city.trim(),
                message: body,
                consent: true,
              }
            : {
                name: contactName,
                email: address,
                topic,
                message: body,
                consent: true,
              },
        },
      );
      if (
        typeof result.id !== "string" ||
        !result.id ||
        result.status !== "received"
      )
        throw new Error(
          "The server did not return a valid receipt. Receipt of your request could not be confirmed.",
        );
      setReceipt(result.id);
      setMessage("");
      setName("");
      setEmail("");
      setOrganization("");
      setWebsite("");
      setCity("");
      setConsent(false);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Receipt could not be confirmed. Check your connection before trying again.",
      );
    } finally {
      setPending(false);
      inFlight.current = false;
    }
  }

  if (receipt)
    return (
      <Card style={styles.form}>
        <Icon name="CheckCircle2" size={30} color={colors.teal} />
        <T variant="h2" accessibilityRole="header">
          {provider ? "Application received" : "Support request received"}
        </T>
        <T selectable accessibilityLiveRegion="polite">
          Received ID: {receipt}
        </T>
        <T>
          The request is stored in the AbroadMedClub operator inbox on this
          local backend. Save this ID for reference. No email has been sent and
          nothing has been transmitted to a clinic.
        </T>
        <T>
          {provider
            ? "This is a request for editorial review, not an automatic listing, verification or partnership. Any publication requires a separate staff review."
            : "Receipt does not mean the team has read or resolved your request. This form is not a live conversation or a clinical service."}
        </T>
        <Notice>
          No response time is promised. Do not use this inbox for urgent medical
          concerns.
        </Notice>
        <Button
          label="Back to the directory"
          onPress={() => go({ page: "home" })}
        />
        <Button
          label={
            provider
              ? "Submit a different application"
              : "Send a different request"
          }
          variant="ghost"
          onPress={() => {
            setReceipt(null);
            setCountryCode("");
            setCountryQuery("");
            setTopic(supportTopics[0]);
          }}
        />
      </Card>
    );

  return (
    <Card style={styles.form}>
      <T variant="h2" accessibilityRole="header">
        {provider ? "Organization details" : "Write to the directory team"}
      </T>
      <T variant="small" style={styles.muted}>
        All fields are required. No records or uploads. This sends to the local
        operator backend, not to a clinic or email service.
      </T>
      {provider && (
        <TextField
          label="Organization name (up to 160 characters)"
          value={organization}
          onChangeText={setOrganization}
          maxLength={160}
          editable={!pending}
        />
      )}
      <TextField
        label={
          provider
            ? "Contact name (up to 120 characters)"
            : "Your name (up to 120 characters)"
        }
        value={name}
        onChangeText={setName}
        maxLength={120}
        autoComplete="name"
        editable={!pending}
      />
      <TextField
        label="Email address (up to 254 characters)"
        value={email}
        onChangeText={setEmail}
        maxLength={254}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        editable={!pending}
      />
      {provider ? (
        <>
          <TextField
            label="Official website (HTTPS, up to 500 characters)"
            placeholder="https://"
            value={website}
            onChangeText={setWebsite}
            maxLength={500}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!pending}
          />
          <TextField
            label="Find your country"
            placeholder="Country name or two-letter code"
            value={countryQuery}
            onChangeText={setCountryQuery}
            maxLength={100}
            editable={!pending}
          />
          <T variant="small" accessibilityLiveRegion="polite">
            {selectedCountry
              ? `Selected: ${selectedCountry.name}`
              : "Select the country where this organization provides services."}
          </T>
          {!catalog ? (
            <View style={styles.section}>
              <Notice>
                {loading
                  ? "Loading the directory country list…"
                  : catalogError ||
                    "The country list is unavailable. Connect to the directory service to apply."}
              </Notice>
              <Button
                label="Reload countries"
                variant="secondary"
                disabled={loading || pending}
                onPress={() => {
                  void refreshCatalog().catch((reason: unknown) =>
                    setError(
                      reason instanceof Error
                        ? reason.message
                        : "Could not load countries.",
                    ),
                  );
                }}
              />
            </View>
          ) : (
            <View style={styles.wrap}>
              {filteredCountries.map((country) => (
                <Chip
                  key={country.code}
                  label={country.name}
                  active={countryCode === country.code}
                  onPress={() => {
                    if (!pending) setCountryCode(country.code);
                  }}
                />
              ))}
            </View>
          )}
          {catalog && filteredCountries.length === 0 && (
            <T variant="small">
              No matching country. Clear the search or use Contact & support to
              ask about a country not in this list.
            </T>
          )}
          <TextField
            label="City (up to 120 characters)"
            value={city}
            onChangeText={setCity}
            maxLength={120}
            editable={!pending}
          />
        </>
      ) : (
        <View style={styles.section}>
          <T variant="label">Topic</T>
          <View style={styles.wrap}>
            {supportTopics.map((item) => (
              <Chip
                key={item}
                label={item}
                active={topic === item}
                onPress={() => {
                  if (!pending) setTopic(item);
                }}
              />
            ))}
          </View>
        </View>
      )}
      <TextField
        label={
          provider
            ? "Scope and public evidence (up to 2,000 characters)"
            : "Administrative message (up to 2,000 characters)"
        }
        placeholder={
          provider
            ? "Describe your organization's services and link to public evidence. Do not include patient information."
            : "Describe the directory issue. For corrections or privacy requests, include a listing link or received request ID—not medical details."
        }
        multiline
        value={message}
        onChangeText={setMessage}
        maxLength={2000}
        editable={!pending}
      />
      <T variant="small" style={styles.muted}>
        {message.length}/2,000 characters. Do not include medical histories,
        passwords, identity documents, payment details or information about
        patients.
      </T>
      <Notice>
        {provider
          ? "Only submit if you are authorized to represent this organization. Launch applications and listings have no charge. Staff review public evidence before publication; applying does not create a listing, partnership or accreditation."
          : "This is not an emergency service. For urgent medical concerns, seek local medical care rather than waiting for a directory reply."}
      </Notice>
      <Choice
        role="checkbox"
        checked={consent}
        disabled={pending}
        onPress={() => setConsent(!consent)}
        style={styles.consent}
      >
        <Icon
          name={consent ? "CheckCircle2" : "Circle"}
          color={colors.teal}
          size={24}
        />
        <T style={styles.bulletText}>
          {provider ? "I am authorized to submit this application. " : ""}I
          consent to the operator storing these contact details and this message
          on the local backend for handling this request. I understand
          authorized staff can read it, it is not sent to a clinic or by email,
          and it is retained until removed through an operator process.
        </T>
      </Choice>
      <View style={styles.wrap}>
        <Button
          label="Read privacy & data use"
          variant="ghost"
          small
          disabled={pending}
          onPress={() => go({ page: "privacy" })}
        />
        <Button
          label="Read terms & disclaimer"
          variant="ghost"
          small
          disabled={pending}
          onPress={() => go({ page: "terms" })}
        />
      </View>
      <T variant="small" style={styles.muted}>
        Leaving this page discards an unsent draft. This local development
        service has not been audited for production use.
      </T>
      {error && (
        <T
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          style={styles.error}
        >
          {error}
        </T>
      )}
      {error && (
        <T variant="small" style={styles.muted}>
          If the connection failed after submitting, receipt may be uncertain.
          There is no automatic retry; avoid repeatedly submitting the same
          request.
        </T>
      )}
      {pending && (
        <ActivityIndicator
          accessibilityLabel="Submitting to the operator inbox"
          color={colors.teal}
        />
      )}
      <Button
        label={
          pending
            ? "Submitting…"
            : provider
              ? "Submit for directory review"
              : "Submit to operator inbox"
        }
        disabled={pending || !consent || (provider && !catalog)}
        onPress={() => void submit()}
        icon="Send"
      />
    </Card>
  );
}

export function ResourcesScreen() {
  const { route, go } = useHealthcare();
  const page = route.page;
  const info =
    page === "about" ||
    page === "how-it-works" ||
    page === "privacy" ||
    page === "terms"
      ? information[page]
      : null;
  return (
    <Page style={styles.page}>
      <View style={styles.wrap}>
        <Button
          label="Directory home"
          variant="ghost"
          small
          icon="ArrowLeft"
          onPress={() => go({ page: "home" })}
        />
        {page === "guides" && route.id && (
          <Button
            label="Learning center"
            variant="ghost"
            small
            onPress={() => go({ page: "guides" })}
          />
        )}
      </View>
      {page === "guides" ? (
        <GuideLibrary />
      ) : info ? (
        <View style={styles.reading}>
          <PageTitle
            eyebrow="AbroadMedClub"
            title={info.title}
            description={info.summary}
          />
          <ParagraphSections sections={info.sections} />
          <View style={styles.wrap}>
            <Button
              label="Explore patient guides"
              icon="ArrowRight"
              onPress={() => go({ page: "guides" })}
            />
            <Button
              label="Contact the directory team"
              variant="secondary"
              onPress={() => go({ page: "contact" })}
            />
          </View>
        </View>
      ) : page === "contact" ? (
        <View style={styles.reading}>
          <PageTitle
            eyebrow="Contact & support"
            title="Talk to the directory team"
            description="Ask an administrative question, flag a listing correction or request help with app access or data. This is the local operator inbox, not a medical consultation."
          />
          <OperatorForm key="support" kind="support" />
        </View>
      ) : page === "providers-join" ? (
        <View style={styles.reading}>
          <PageTitle
            eyebrow="For healthcare organizations"
            title="Apply for a free launch listing"
            description="Introduce your organization with public source evidence. There is no charge to apply or be included during launch; review is editorial and does not create a partnership."
          />
          <Notice>
            AbroadMedClub may already hold a basic public-source record with no
            contact details. We are not initiating provider outreach until the
            directory and core site operations are mostly functional.
          </Notice>
          <OperatorForm key="provider" kind="provider" />
        </View>
      ) : (
        <EmptyState
          icon="CircleHelp"
          title="Resource not found"
          body="Choose a resource below or return to the directory."
          actionLabel="Learning center"
          onAction={() => go({ page: "guides" })}
        />
      )}
      <View style={styles.footer}>
        <T variant="h3">More from AbroadMedClub</T>
        <View style={styles.wrap}>
          {resourceLinks.map((link) => (
            <Button
              key={link.page}
              small
              label={link.label}
              variant={page === link.page ? "secondary" : "ghost"}
              onPress={() => go({ page: link.page })}
            />
          ))}
        </View>
        <T variant="small" style={styles.muted}>
          Independent directory information, not a care provider. Real operator
          requests and device-local travel examples are separate. In an
          emergency, contact local emergency services.
        </T>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { gap: 28, paddingBottom: 40 },
  reading: { width: "100%", maxWidth: 900, gap: 26, alignSelf: "center" },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  section: { gap: 14 },
  sections: { gap: 32 },
  prose: { color: colors.ink, lineHeight: 26 },
  muted: { color: colors.muted },
  bullet: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  bulletMark: { color: colors.teal, lineHeight: 26 },
  bulletText: { flex: 1, lineHeight: 25 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  guideCard: {
    flexGrow: 1,
    flexBasis: 300,
    padding: 24,
    gap: 18,
    justifyContent: "space-between",
  },
  sourceCard: { padding: 24, gap: 18, backgroundColor: colors.sage },
  source: { gap: 7 },
  sourceLink: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  linkText: { color: colors.teal, flex: 1, textDecorationLine: "underline" },
  form: { padding: 24, gap: 20 },
  consent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  error: { color: colors.red, lineHeight: 24 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 28,
    marginTop: 16,
    gap: 18,
  },
});
