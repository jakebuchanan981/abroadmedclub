export type ExternalResource = {
  label: string;
  url: string;
  description: string;
};

export type StayOption = ExternalResource & {
  vendor: "Booking.com" | "Vrbo";
  kind: "hotel" | "rental";
  preferred?: boolean;
};

export type DestinationTravelResources = {
  landmark: {
    name: string;
    credit: string;
    license: string;
    sourceUrl: string;
  };
  guide: ExternalResource;
  entry: ExternalResource;
  visaHelp: ExternalResource;
  stays: StayOption[];
};

const stays = (place: string): StayOption[] => [
  {
    label: `Compare hotels in ${place}`,
    vendor: "Booking.com",
    kind: "hotel",
    preferred: true,
    url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(place)}`,
    description:
      "Compare guest ratings, recent reviews, cancellation terms, accessibility and distance from the facility before booking.",
  },
  {
    label: `Compare rentals in ${place}`,
    vendor: "Vrbo",
    kind: "rental",
    url: `https://www.vrbo.com/searchResults.html?destination=${encodeURIComponent(place)}`,
    description:
      "Compare apartments and entire-home rentals; verify stairs, lifts, cleaning, transport and cancellation terms with the host.",
  },
];

export const destinationTravelResources: Readonly<
  Record<string, DestinationTravelResources>
> = {
  istanbul: {
    landmark: {
      name: "Galata Tower",
      credit: "Alexxx1979",
      license: "CC BY-SA 3.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Istanbul_Galata_Tower_IMG_7475_1800.jpg",
    },
    guide: {
      label: "Official Istanbul travel guide",
      url: "https://goturkiye.com/istanbul",
      description: "GoTürkiye destination information for Istanbul.",
    },
    entry: {
      label: "Official Türkiye e-Visa portal",
      url: "https://www.evisa.gov.tr/en/",
      description:
        "Check requirements against your passport, purpose and length of stay before paying anyone.",
    },
    visaHelp: {
      label: "Independent Türkiye visa support",
      url: "https://cibtvisas.com/destination/tur/turkey-visa",
      description:
        "CIBTvisas offers optional professional document support. It is not a government service or AbroadMedClub endorsement.",
    },
    stays: stays("Istanbul, Türkiye"),
  },
  bangkok: {
    landmark: {
      name: "Wat Arun",
      credit: "Diego Delso",
      license: "CC BY-SA 3.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Templo_Wat_Arun,_Bangkok,_Tailandia,_2013-08-22,_DD_30.jpg",
    },
    guide: {
      label: "Official Bangkok travel guide",
      url: "https://www.tourismthailand.org/Destinations/Cities/Bangkok",
      description: "Tourism Authority of Thailand destination information.",
    },
    entry: {
      label: "Official Thailand e-Visa portal",
      url: "https://thaievisa.go.th/index.html",
      description:
        "Check requirements against your passport, purpose and length of stay before applying.",
    },
    visaHelp: {
      label: "Independent Thailand visa support",
      url: "https://cibtvisas.com/destination/tha/thailand-visa",
      description:
        "CIBTvisas offers optional professional document support. It is not a government service or AbroadMedClub endorsement.",
    },
    stays: stays("Bangkok, Thailand"),
  },
  seoul: {
    landmark: {
      name: "Gyeonghoeru at Gyeongbokgung Palace",
      credit: "Frank Schulenburg",
      license: "CC BY-SA 4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Gyeonghoeru_(Royal_Banquet_Hall)_at_Gyeongbokgung_Palace,_Seoul.jpg",
    },
    guide: {
      label: "Official Seoul travel guide",
      url: "https://english.visitseoul.net/",
      description: "Seoul Tourism Organization destination information.",
    },
    entry: {
      label: "Official Korea Visa Portal",
      url: "https://www.visa.go.kr/main/openMain.do?LANG_TYPE=EN",
      description:
        "Use the official visa navigator for passport- and purpose-specific requirements, including medical treatment travel.",
    },
    visaHelp: {
      label: "Independent South Korea visa support",
      url: "https://cibtvisas.com/destination/kor/korea-south-visa",
      description:
        "CIBTvisas offers optional professional document support. It is not a government service or AbroadMedClub endorsement.",
    },
    stays: stays("Seoul, South Korea"),
  },
  budapest: {
    landmark: {
      name: "Hungarian Parliament Building",
      credit: "Elkágyé",
      license: "Public domain",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Hungarian_Parliament.jpg",
    },
    guide: {
      label: "Official Budapest travel guide",
      url: "https://www.budapestinfo.hu/en",
      description: "Budapest Brand destination and visitor information.",
    },
    entry: {
      label: "Hungary Consular Service",
      url: "https://konzinfo.mfa.gov.hu/en",
      description:
        "Check official entry and consular information for your passport and circumstances.",
    },
    visaHelp: {
      label: "Independent Hungary visa support",
      url: "https://cibtvisas.com/destination/hun/hungary-visa",
      description:
        "CIBTvisas offers optional professional document support. It is not a government service or AbroadMedClub endorsement.",
    },
    stays: stays("Budapest, Hungary"),
  },
  "san-jose": {
    landmark: {
      name: "National Theatre of Costa Rica",
      credit: "Andres Alvarez",
      license: "CC BY-SA 3.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Costa_Rica-Teatro_Nacional.JPG",
    },
    guide: {
      label: "Official San José travel guide",
      url: "https://www.visitcostarica.com/en/costa-rica/knowing-costa-rica/san-jose",
      description: "Costa Rica Tourism Board destination information.",
    },
    entry: {
      label: "Official Costa Rica entry requirements",
      url: "https://www.visitcostarica.com/en/costa-rica/planning-your-trip/entry-requirements",
      description:
        "Check the Costa Rica Tourism Board's current entry guidance for your passport and route.",
    },
    visaHelp: {
      label: "Independent Costa Rica visa support",
      url: "https://cibtvisas.com/destination/cri/costa-rica-visa",
      description:
        "CIBTvisas offers optional professional document support. It is not a government service or AbroadMedClub endorsement.",
    },
    stays: stays("San José, Costa Rica"),
  },
  lisbon: {
    landmark: {
      name: "Belém Tower",
      credit: "Alvesgaspar",
      license: "CC BY-SA 3.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Torre_Bel%C3%A9m_April_2009-4a.jpg",
    },
    guide: {
      label: "Official Lisbon travel guide",
      url: "https://www.visitlisboa.com/en",
      description: "Turismo de Lisboa destination information.",
    },
    entry: {
      label: "Official Portugal visa portal",
      url: "https://vistos.mne.gov.pt/en/",
      description:
        "Check Portugal Ministry of Foreign Affairs requirements for your passport and purpose of travel.",
    },
    visaHelp: {
      label: "Independent Portugal visa support",
      url: "https://cibtvisas.com/destination/prt/portugal-visa",
      description:
        "CIBTvisas offers optional professional document support. It is not a government service or AbroadMedClub endorsement.",
    },
    stays: stays("Lisbon, Portugal"),
  },
};

export function travelVendorUrl(
  option: StayOption,
  destinationId: string,
  bookingAffiliateId = process.env.EXPO_PUBLIC_BOOKING_AFFILIATE_ID,
): string {
  if (option.vendor !== "Booking.com") return option.url;
  const affiliateId = bookingAffiliateId?.trim();
  if (!affiliateId || !/^\d+$/.test(affiliateId)) return option.url;
  const url = new URL(option.url);
  url.searchParams.set("aid", affiliateId);
  url.searchParams.set(
    "label",
    `abroadmedclub-${destinationId}-${option.kind}`,
  );
  return url.toString();
}
