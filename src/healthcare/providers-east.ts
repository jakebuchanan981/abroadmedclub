import type { Offering, Provider, Source } from "./types";

const checkedAt = "2026-09-15";
const source = (label: string, url: string): Source => ({
  label,
  url,
  checkedAt,
});

const anadoluContact = source(
  "Anadolu Medical Center: address and international patient services",
  "https://www.anadolumedicalcenter.com/contact",
);
const anadoluProfile = source(
  "Anadolu Medical Center: hospital profile and clinical services",
  "https://www.anadolumedicalcenter.com/institutionals/about-us",
);
const turanContact = source(
  "Turan & Turan: distinct Osmangazi and Yıldırım locations",
  "https://turanturan.com.tr/en/contact-us/",
);
const turanProfile = source(
  "Turan & Turan Yıldırım: location and services",
  "https://turanturanyildirim.com/",
);
const turanOrthopedic = source(
  "Turan & Turan Yıldırım: orthopedic rehabilitation",
  "https://turanturanyildirim.com/ortopedik-rehabilitasyon/",
);
const turanNeurological = source(
  "Turan & Turan Yıldırım: neurological rehabilitation",
  "https://turanturanyildirim.com/norolojik-rehabilitasyon/",
);
const guvenContact = source(
  "Güven: hospital and Çayyolu campus addresses",
  "https://www.guven.com.tr/en/contact",
);
const guvenProfile = source(
  "Güven Hospital: Kavaklıdere site, departments and doctors",
  "https://www.guven.com.tr/en/hospitals/guven-hastanesi",
);
const florenceProfile = source(
  "Istanbul Florence Nightingale Hospital: site address, units and technologies",
  "https://www.florence.com.tr/en-us/hospitals/istanbul-florence-nightingale-hospital",
);
const yanheeContact = source(
  "Yanhee Hospital: Bangkok address and directions",
  "https://www.yanhee.net/contact-us/",
);
const yanheeProfile = source(
  "Yanhee Hospital: clinical services and doctors",
  "https://www.yanhee.net/",
);
const yanheeHair = source(
  "Yanhee Hospital: hair transplantation service",
  "https://www.yanhee.net/cosmetic-services/hair-transplant/",
);
const dentContact = source(
  "DentAkademi: Maltepe address and contact page",
  "https://www.dentakademi.com.tr/iletisim/",
);
const dentProfile = source(
  "DentAkademi: Maltepe treatment services and clinical team",
  "https://www.dentakademi.com.tr/",
);

// Publication means review of public directory sources, not partnership,
// onboarding, clinical suitability, licensure or accreditation verification.
export const providersEast: Provider[] = [
  {
    id: "anadolu-medical-center-gebze",
    name: "Anadolu Medical Center — Gebze Hospital",
    countryCode: "TR",
    city: "Gebze",
    address:
      "Cumhuriyet Mahallesi, 2255 Sokak No: 3, Gebze, 41400 Kocaeli, Türkiye",
    website: "https://www.anadolumedicalcenter.com/",
    summary:
      "Hospital in Gebze, Kocaeli, with oncology, diagnostic imaging and IVF services. This entry covers the Gebze hospital, not the separate Ataşehir outpatient center. The street address follows the hospital's contact and directions page.",
    languages: [
      "English",
      "Turkish",
      "French",
      "German",
      "Russian",
      "Uzbek",
      "Georgian",
      "Romanian",
      "Arabic",
      "Bulgarian",
      "Albanian",
      "Serbian",
      "Persian",
    ],
    facilities: [
      "Oncology center",
      "Bone marrow transplantation center",
      "MRI",
      "Hybrid operating rooms",
      "International patient services department",
    ],
    practitioners: [],
    credentialClaims: [],
    sources: [anadoluContact, anadoluProfile],
    status: "published",
    listingKind: "independent",
    contactUrl: anadoluContact.url,
    updatedAt: checkedAt,
  },
  {
    id: "turan-turan-yildirim",
    name: "Turan & Turan Health Group — Yıldırım Medical Center",
    countryCode: "TR",
    city: "Bursa",
    address:
      "Şirinevler Mahallesi, Ankara Yolu Caddesi No: 795, 16290 Yıldırım, Bursa, Türkiye",
    website: "https://turanturanyildirim.com/",
    summary:
      "The group's Yıldırım medical center in Bursa lists orthopedics, physical therapy and rehabilitation services. This record covers that location only; it does not assign the group's surgical services or its Osmangazi address to this center.",
    languages: [],
    facilities: [],
    practitioners: [],
    credentialClaims: [],
    sources: [turanContact, turanProfile, turanOrthopedic, turanNeurological],
    status: "published",
    listingKind: "independent",
    contactUrl: turanContact.url,
    updatedAt: checkedAt,
  },
  {
    id: "guven-hospital-ankara",
    name: "Güven Hospital — Kavaklıdere",
    countryCode: "TR",
    city: "Ankara",
    address:
      "Remzi Oğuz Arık Mahallesi, Şimşek Sokak No: 29, 06540 Kavaklıdere / Çankaya, Ankara, Türkiye",
    website: "https://www.guven.com.tr/en",
    summary:
      "Multispecialty hospital in Ankara's Kavaklıdere area. Its site-specific profile lists cardiology, IVF and diagnostic imaging among its departments and technologies. The separate Çayyolu medical center is not included in this record.",
    languages: [],
    facilities: [
      "MRI",
      "General intensive care unit",
      "Laboratory",
      "Emergency department",
    ],
    practitioners: [
      {
        name: "Mehmet Koray Akkan",
        role: "Interventional radiology and radiology; listed by the hospital",
        sourceUrl: guvenProfile.url,
      },
      {
        name: "Mehmet Levent Alkan",
        role: "Cardiology; listed by the hospital",
        sourceUrl: guvenProfile.url,
      },
    ],
    credentialClaims: [
      {
        label: "Hospital-reported JCI accreditation",
        sourceUrl: guvenProfile.url,
        note: "The hospital states that it has received JCI accreditation. Current validity and scope have not been independently checked with the accreditor; this is not a directory safety endorsement.",
      },
    ],
    sources: [guvenContact, guvenProfile],
    status: "published",
    listingKind: "independent",
    contactUrl: guvenContact.url,
    updatedAt: checkedAt,
  },
  {
    id: "istanbul-florence-nightingale",
    name: "Istanbul Florence Nightingale Hospital",
    countryCode: "TR",
    city: "Istanbul",
    address: "Abide-i Hürriyet Caddesi No: 166, Şişli, Istanbul, Türkiye",
    website: florenceProfile.url,
    summary:
      "The Florence Nightingale group's Şişli hospital lists inpatient care, diagnostic imaging and specialist departments. This listing is for the Istanbul hospital on Abide-i Hürriyet Caddesi, not the group's other Istanbul locations.",
    languages: [],
    facilities: [
      "Operating rooms",
      "Intensive care",
      "MRI",
      "Computed tomography",
      "Heliport",
    ],
    practitioners: [],
    credentialClaims: [
      {
        label: "Hospital-reported JCI accreditation",
        sourceUrl: florenceProfile.url,
        note: "The hospital's page describes JCI accreditation and renewals. The directory has not independently verified current status or scope with JCI, and makes no safety guarantee.",
      },
    ],
    sources: [florenceProfile],
    status: "published",
    listingKind: "independent",
    contactUrl: florenceProfile.url,
    updatedAt: checkedAt,
  },
  {
    id: "yanhee-hospital-bangkok",
    name: "Yanhee International Hospital",
    countryCode: "TH",
    city: "Bangkok",
    address:
      "454 Charansanitwong Road, Bang-O, Bangplad, Bangkok 10700, Thailand",
    website: "https://www.yanhee.net/",
    summary:
      "Bangkok hospital with cosmetic, medical and dental services. Its hair restoration page describes FUE and FUT techniques. This record concerns the hospital on Charansanitwong Road, not its overseas representatives.",
    languages: [],
    facilities: [
      "Operating theatre",
      "Inpatient wards",
      "Emergency department",
    ],
    practitioners: [
      {
        name: "Kittichai Sipiyarak",
        role: "Plastic surgery; listed by the hospital",
        sourceUrl: yanheeProfile.url,
      },
    ],
    credentialClaims: [],
    sources: [yanheeContact, yanheeProfile, yanheeHair],
    status: "published",
    listingKind: "independent",
    contactUrl: yanheeContact.url,
    updatedAt: checkedAt,
  },
  {
    id: "dentakademi-maltepe",
    name: "DENTAKADEMI — Maltepe",
    countryCode: "TR",
    city: "Istanbul",
    address:
      "Bağlarbaşı Mahallesi, Atatürk Caddesi No: 122, Maltepe, Istanbul, Türkiye",
    website: "https://www.dentakademi.com.tr/",
    summary:
      "Oral and dental health center in Istanbul's Maltepe district. Its treatment directory includes dental implants, root canal treatment, orthodontics and children's dentistry, with a published clinical team for this center.",
    languages: [],
    facilities: ["Children's dental clinic"],
    practitioners: [
      {
        name: "Gözde Aysel",
        role: "Endodontics; listed by the center",
        sourceUrl: dentProfile.url,
      },
      {
        name: "Umur Arıkan",
        role: "Oral diagnosis; listed by the center",
        sourceUrl: dentProfile.url,
      },
    ],
    credentialClaims: [],
    sources: [dentContact, dentProfile],
    status: "published",
    listingKind: "independent",
    contactUrl: dentContact.url,
    updatedAt: checkedAt,
  },
];

// Turkeyana Clinic intentionally omitted after source review on 2026-09-15.
// https://turkeyanaclinic.com/en/contact-us/ lists a Küçükçekmece contact
// address and says all treatments take place at contracted health institutions.
// https://landing-pages.turkeyanaclinic.com/dental-ar lists a Bakırköy address
// and the same contracting limitation. Neither reviewed page identifies the
// treating institution at a specific site. A contact office is not a clinic
// location; publication requires that missing site-and-service evidence.

export const offeringsEast: Offering[] = [
  {
    id: "anadolu-gebze-oncology-consultation",
    providerId: "anadolu-medical-center-gebze",
    treatmentId: "cancer-treatment-consultation",
    summary:
      "Oncology assessment through the Gebze hospital's cancer services; the hospital describes multidisciplinary review.",
    scope: ["Oncology assessment", "Multidisciplinary treatment planning"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: anadoluProfile,
  },
  {
    id: "anadolu-gebze-mri",
    providerId: "anadolu-medical-center-gebze",
    treatmentId: "mri-scan",
    summary:
      "MRI is listed among the Gebze hospital's diagnostic technologies. The required examination must be determined clinically.",
    scope: ["MRI imaging"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: anadoluProfile,
  },
  {
    id: "anadolu-gebze-ivf",
    providerId: "anadolu-medical-center-gebze",
    treatmentId: "ivf",
    summary:
      "IVF is listed within the hospital's women's health services. Individual assessment determines the treatment plan.",
    scope: ["In vitro fertilization services"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: anadoluProfile,
  },
  {
    id: "turan-yildirim-orthopedic-consultation",
    providerId: "turan-turan-yildirim",
    treatmentId: "orthopedic-surgery-consultation",
    summary:
      "The Yıldırım center lists orthopedics and traumatology. This entry describes specialist assessment, not an on-site operation.",
    scope: ["Orthopedics and traumatology assessment"],
    exclusions: [
      "No surgical procedure is represented by this consultation listing",
    ],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: turanProfile,
  },
  {
    id: "turan-yildirim-physiotherapy",
    providerId: "turan-turan-yildirim",
    treatmentId: "physiotherapy",
    summary:
      "The Yıldırım center lists orthopedic rehabilitation for fractures, joint replacements and recovery following arthroscopy.",
    scope: [
      "Fracture rehabilitation",
      "Joint replacement rehabilitation",
      "Post-arthroscopy rehabilitation",
    ],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: turanOrthopedic,
  },
  {
    id: "turan-yildirim-neurorehabilitation",
    providerId: "turan-turan-yildirim",
    treatmentId: "neurorehabilitation",
    summary:
      "Neurological rehabilitation is listed at the Yıldırım center, including programs for stroke and spinal cord injury.",
    scope: [
      "Stroke rehabilitation",
      "Spinal cord injury rehabilitation",
      "Balance disorder rehabilitation",
    ],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: turanNeurological,
  },
  {
    id: "guven-ankara-mri",
    providerId: "guven-hospital-ankara",
    treatmentId: "mri-scan",
    summary:
      "The Kavaklıdere hospital profile lists MRI among its diagnostic technologies.",
    scope: ["MRI imaging"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: guvenProfile,
  },
  {
    id: "guven-ankara-ivf",
    providerId: "guven-hospital-ankara",
    treatmentId: "ivf",
    summary:
      "The hospital lists an in vitro fertilization center. Treatment eligibility and the scope of a cycle require an individual assessment.",
    scope: ["In vitro fertilization services"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: guvenProfile,
  },
  {
    id: "guven-ankara-cardiology-consultation",
    providerId: "guven-hospital-ankara",
    treatmentId: "cardiology-consultation",
    summary:
      "Cardiology is a listed department at the Kavaklıdere hospital, with cardiology clinicians included in its site profile.",
    scope: ["Cardiology assessment"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: guvenProfile,
  },
  {
    id: "florence-istanbul-mri",
    providerId: "istanbul-florence-nightingale",
    treatmentId: "mri-scan",
    summary:
      "The Istanbul hospital's technology list includes MRI. The appropriate protocol is a clinical decision, not selected by this directory.",
    scope: ["MRI imaging"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: florenceProfile,
  },
  {
    id: "florence-istanbul-ct",
    providerId: "istanbul-florence-nightingale",
    treatmentId: "ct-scan",
    summary:
      "Computed tomography is included in the Istanbul hospital's site-specific technology list.",
    scope: ["Computed tomography imaging"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: florenceProfile,
  },
  {
    id: "florence-istanbul-screening",
    providerId: "istanbul-florence-nightingale",
    treatmentId: "health-screening",
    summary:
      "A check-up and healthy living unit is listed at this hospital. No fixed screening package or test bundle is represented here.",
    scope: ["Check-up services"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: florenceProfile,
  },
  {
    id: "yanhee-bangkok-hair-transplant",
    providerId: "yanhee-hospital-bangkok",
    treatmentId: "hair-transplant",
    summary:
      "Yanhee describes FUE and FUT hair transplantation. Technique and graft count are determined in consultation, rather than by a directory package.",
    scope: [
      "Follicular unit excision (FUE)",
      "Follicular unit transplantation (FUT)",
    ],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: yanheeHair,
  },
  {
    id: "yanhee-bangkok-cosmetic-consultation",
    providerId: "yanhee-hospital-bangkok",
    treatmentId: "cosmetic-surgery-consultation",
    summary:
      "Plastic surgery assessment at Yanhee, whose official site lists cosmetic surgical services and plastic surgeons.",
    scope: ["Plastic surgery assessment"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: yanheeProfile,
  },
  {
    id: "dentakademi-maltepe-implants",
    providerId: "dentakademi-maltepe",
    treatmentId: "dental-implants",
    summary:
      "Dental implant treatment is listed at the Maltepe center. The implant plan and restoration are not a pre-defined package.",
    scope: ["Dental implant treatment"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: dentProfile,
  },
  {
    id: "dentakademi-maltepe-root-canal",
    providerId: "dentakademi-maltepe",
    treatmentId: "root-canal-treatment",
    summary:
      "Root canal treatment appears in the center's endodontic services, with endodontic practitioners listed on its website.",
    scope: ["Endodontic root canal treatment"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: dentProfile,
  },
  {
    id: "dentakademi-maltepe-whitening",
    providerId: "dentakademi-maltepe",
    treatmentId: "teeth-whitening",
    summary:
      "Teeth whitening is included in the Maltepe center's published treatment directory.",
    scope: ["Teeth whitening"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: dentProfile,
  },
  {
    id: "dentakademi-maltepe-consultation",
    providerId: "dentakademi-maltepe",
    treatmentId: "dental-care-consultation",
    summary:
      "The center lists oral diagnosis services for dental examination and assessment.",
    scope: ["Oral diagnosis and dental assessment"],
    exclusions: [],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: dentProfile,
  },
];
