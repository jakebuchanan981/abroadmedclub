import type { Offering, Provider, Source } from "./types";

type DiscoveryService = {
  treatmentId: string;
  scope: string;
  source?: Source;
};

type DiscoverySeed = {
  id: string;
  name: string;
  countryCode: string;
  city: string;
  summary: string;
  source: Source;
  services: DiscoveryService[];
};

const checkedAt = "2026-10-19";
const limitation =
  "Basic discovery record; current scope, availability and contact details still require direct confirmation.";

const seeds: DiscoverySeed[] = [
  {
    id: "memorial-bahcelievler",
    name: "Memorial Hospital Bahçelievler",
    countryCode: "TR",
    city: "Istanbul",
    summary:
      "Medical Departures lists this Istanbul hospital across surgical, cardiac and cancer-care categories. This is a basic discovery record assembled from that public directory profile.",
    source: {
      label: "Medical Departures profile",
      url: "https://www.medicaldepartures.com/clinic/memorial-hospital-bahcelievler",
      checkedAt,
    },
    services: [
      {
        treatmentId: "cancer-treatment-consultation",
        scope: "The linked directory profile lists oncology services.",
      },
      {
        treatmentId: "cardiac-surgery-consultation",
        scope: "The linked directory profile lists cardiology and cardiac surgery.",
      },
      {
        treatmentId: "bariatric-surgery-consultation",
        scope: "The linked directory profile lists bariatric surgery.",
      },
    ],
  },
  {
    id: "acibadem-altunizade",
    name: "Acibadem Altunizade Clinic",
    countryCode: "TR",
    city: "Istanbul",
    summary:
      "Bookimed lists this Istanbul facility for oncology, neurological care and diagnostic imaging. This basic record does not yet include provider contact information.",
    source: {
      label: "Bookimed profile",
      url: "https://us-uk.bookimed.com/clinic/acibadem/",
      checkedAt,
    },
    services: [
      {
        treatmentId: "cancer-treatment-consultation",
        scope: "The linked directory profile lists oncology care.",
      },
      {
        treatmentId: "neurosurgery-consultation",
        scope: "The linked directory profile lists neurological and neurosurgical care.",
      },
      {
        treatmentId: "imaging-consultation",
        scope: "The linked directory profile describes diagnostic imaging services.",
      },
    ],
  },
  {
    id: "bumrungrad-international-hospital",
    name: "Bumrungrad International Hospital",
    countryCode: "TH",
    city: "Bangkok",
    summary:
      "Bookimed lists this Bangkok hospital across cardiology, orthopedics and health-screening categories. This is a basic discovery record, not a verified-provider designation.",
    source: {
      label: "Bookimed profile",
      url: "https://us-uk.bookimed.com/clinic/bumrungrad-international-hospital/",
      checkedAt,
    },
    services: [
      {
        treatmentId: "cardiology-consultation",
        scope: "The linked directory profile lists cardiology services.",
      },
      {
        treatmentId: "orthopedic-surgery-consultation",
        scope: "The linked directory profile lists orthopedic care.",
      },
      {
        treatmentId: "medical-check-ups-consultation",
        scope: "The linked directory profile lists health-screening services.",
      },
    ],
  },
  {
    id: "samitivej-bangkok",
    name: "Samitivej Hospitals — Bangkok",
    countryCode: "TH",
    city: "Bangkok",
    summary:
      "Bookimed describes Samitivej's Bangkok hospital network as multispecialty, including adult and pediatric services. Exact facility details have not yet been added to this basic discovery record.",
    source: {
      label: "Bookimed profile",
      url: "https://us-uk.bookimed.com/clinic/samitivej-hospitals-samitivej-hospital-samitivej-hospitals-part-of-bdms-ai/",
      checkedAt,
    },
    services: [
      {
        treatmentId: "pediatrics-consultation",
        scope: "The linked directory profile lists pediatric care.",
      },
      {
        treatmentId: "gastroenterology-consultation",
        scope: "The linked directory profile lists gastroenterology services.",
      },
      {
        treatmentId: "orthopedic-surgery-consultation",
        scope: "The linked directory profile lists orthopedic care.",
      },
    ],
  },
  {
    id: "asan-medical-center",
    name: "Asan Medical Center",
    countryCode: "KR",
    city: "Seoul",
    summary:
      "Bookimed lists this Seoul medical center for oncology, cardiovascular care and neurosurgery. This basic record deliberately omits contact information until direct source research is added.",
    source: {
      label: "Bookimed profile",
      url: "https://us-uk.bookimed.com/clinic/asan-medical-center/",
      checkedAt,
    },
    services: [
      {
        treatmentId: "cancer-treatment-consultation",
        scope: "The linked directory profile lists oncology care.",
      },
      {
        treatmentId: "cardiology-consultation",
        scope: "The linked directory profile lists cardiovascular care.",
      },
      {
        treatmentId: "neurosurgery-consultation",
        scope: "The linked directory profile lists neurosurgery.",
      },
    ],
  },
  {
    id: "severance-hospital",
    name: "Severance Hospital",
    countryCode: "KR",
    city: "Seoul",
    summary:
      "Bookimed lists this Seoul hospital for cancer care, cardiology and medical checkups. This is a public-source discovery record with no provider contact route added yet.",
    source: {
      label: "Bookimed profile",
      url: "https://us-uk.bookimed.com/clinic/severance-hospital/",
      checkedAt,
    },
    services: [
      {
        treatmentId: "cancer-treatment-consultation",
        scope: "The linked directory profile lists oncology care.",
      },
      {
        treatmentId: "cardiology-consultation",
        scope: "The linked directory profile lists cardiology services.",
      },
      {
        treatmentId: "medical-check-ups-consultation",
        scope: "The linked directory profile lists medical checkups.",
      },
    ],
  },
  {
    id: "helvetic-clinics",
    name: "Helvetic Clinics",
    countryCode: "HU",
    city: "Budapest",
    summary:
      "Dental Departures lists this Budapest clinic for restorative and implant dentistry. This basic discovery record has no contact information or AbroadMedClub quality rating.",
    source: {
      label: "Dental Departures profile",
      url: "https://www.dentaldepartures.com/dentist/helvetic-clinics/",
      checkedAt,
    },
    services: [
      {
        treatmentId: "dental-implants",
        scope: "The linked directory profile lists dental implant services.",
      },
      {
        treatmentId: "dental-crowns",
        scope: "The linked directory profile lists dental crowns.",
      },
      {
        treatmentId: "root-canal-treatment",
        scope: "The linked directory profile lists root-canal treatment.",
      },
    ],
  },
  {
    id: "rosental-dental-budapest",
    name: "Rosental Dental and Oral Surgery Clinic",
    countryCode: "HU",
    city: "Budapest",
    summary:
      "Dental Departures lists this Budapest clinic for implants, crowns and oral-surgery services. It is included as a basic research lead, not a recommendation.",
    source: {
      label: "Dental Departures profile",
      url: "https://www.dentaldepartures.com/clinic/rosental-dental-oral-surgery-clinic",
      checkedAt,
    },
    services: [
      {
        treatmentId: "dental-implants",
        scope: "The linked directory profile lists dental implant services.",
      },
      {
        treatmentId: "dental-crowns",
        scope: "The linked directory profile lists dental crowns.",
      },
      {
        treatmentId: "root-canal-treatment",
        scope: "The linked directory profile lists root-canal treatment.",
      },
    ],
  },
  {
    id: "hospital-clinica-biblica",
    name: "Hospital Clínica Bíblica",
    countryCode: "CR",
    city: "San José",
    summary:
      "MedicalTourism.com lists this San José hospital across dental, dermatology and rehabilitation categories. Contact information has not yet been researched for this basic record.",
    source: {
      label: "MedicalTourism.com profile",
      url: "https://www.medicaltourism.com/providers/hospital-clinica-biblica",
      checkedAt,
    },
    services: [
      {
        treatmentId: "dental-care-consultation",
        scope: "The linked directory profile lists dental services.",
      },
      {
        treatmentId: "dermatology-consultation",
        scope: "The linked directory profile lists dermatology services.",
      },
      {
        treatmentId: "rehabilitation-consultation",
        scope: "The linked directory profile lists orthopedic rehabilitation.",
      },
    ],
  },
  {
    id: "hospital-cima",
    name: "Hospital CIMA",
    countryCode: "CR",
    city: "Escazú",
    summary:
      "Medical Tourism Costa Rica lists this Escazú hospital in its provider directory. Public CIMA specialty pages support the service categories below; this basic record has no contact details.",
    source: {
      label: "Medical Tourism Costa Rica profile",
      url: "https://www.medicaltourismcostarica.com/item/cima-hospital",
      checkedAt,
    },
    services: [
      {
        treatmentId: "orthopedic-surgery-consultation",
        scope: "CIMA's public directory lists orthopedics and traumatology.",
        source: {
          label: "CIMA orthopedics directory",
          url: "https://directorio.hospitalcima.com/en/search/specialty/orthopedics-and-traumatology",
          checkedAt,
        },
      },
      {
        treatmentId: "cardiology-consultation",
        scope: "CIMA's public directory lists cardiology.",
        source: {
          label: "CIMA cardiology directory",
          url: "https://directorio.hospitalcima.com/en/search/specialty/cardiology",
          checkedAt,
        },
      },
      {
        treatmentId: "gastroenterology-consultation",
        scope: "CIMA's public directory lists gastroenterology.",
        source: {
          label: "CIMA gastroenterology directory",
          url: "https://directorio.hospitalcima.com/en/search/specialty/gastroenterology",
          checkedAt,
        },
      },
    ],
  },
  {
    id: "clinica-lmr",
    name: "Clínica LMR",
    countryCode: "PT",
    city: "Lisbon",
    summary:
      "Bookimed lists this Lisbon clinic for plastic surgery, dermatology and non-surgical aesthetics. This basic record is a research starting point, not a quality endorsement.",
    source: {
      label: "Bookimed profile",
      url: "https://us-uk.bookimed.com/clinic/clinica-lmr/",
      checkedAt,
    },
    services: [
      {
        treatmentId: "cosmetic-surgery-consultation",
        scope: "The linked directory profile lists plastic-surgery services.",
      },
      {
        treatmentId: "dermatology-consultation",
        scope: "The linked directory profile lists dermatology services.",
      },
      {
        treatmentId: "aesthetics-non-surgical-consultation",
        scope: "The linked directory profile lists non-surgical aesthetic services.",
      },
    ],
  },
  {
    id: "upclinic-lisbon",
    name: "UPClinic",
    countryCode: "PT",
    city: "Lisbon",
    summary:
      "Bookimed lists this Lisbon clinic for plastic surgery and aesthetic medicine, including gynecologic-aesthetic services. This basic record has no clinic contact route yet.",
    source: {
      label: "Bookimed profile",
      url: "https://us-uk.bookimed.com/clinic/upclinic/",
      checkedAt,
    },
    services: [
      {
        treatmentId: "cosmetic-surgery-consultation",
        scope: "The linked directory profile lists plastic-surgery services.",
      },
      {
        treatmentId: "ob-gyn-consultation",
        scope: "The linked directory profile lists gynecologic-aesthetic services.",
      },
      {
        treatmentId: "aesthetics-non-surgical-consultation",
        scope: "The linked directory profile lists aesthetic-medicine services.",
      },
    ],
  },
];

export const providersDiscovery: Provider[] = seeds.map(
  ({ services: _services, source, ...seed }) => ({
    ...seed,
    address: "",
    website: "",
    languages: [],
    facilities: [],
    practitioners: [],
    credentialClaims: [],
    sources: [source],
    status: "published",
    listingKind: "independent",
    profileLevel: "basic",
    contactUrl: "",
    updatedAt: `${checkedAt}T00:00:00.000Z`,
  }),
);

export const offeringsDiscovery: Offering[] = seeds.flatMap((seed) =>
  seed.services.map((service) => ({
    id: `${seed.id}-${service.treatmentId}`,
    providerId: seed.id,
    treatmentId: service.treatmentId,
    summary:
      "Service category found in the linked public directory. Confirm the exact procedure, clinical fit and current availability independently.",
    scope: [service.scope],
    exclusions: [limitation],
    price: {
      kind: "not-published",
      includes: [],
      excludes: [],
    },
    source: service.source ?? seed.source,
  })),
);
