import type { Offering, Provider, Source } from "./types";

const checkedAt = "2026-09-15";
const source = (label: string, url: string): Source => ({
  label,
  url,
  checkedAt,
});

const sources = {
  velmarContact: source(
    "Hospital Velmar: official address and contact",
    "https://www.hospitalvelmar.com/contactenos.htm",
  ),
  velmarHospital: source(
    "Hospital Velmar: hospital services",
    "https://www.hospitalvelmar.com/english/",
  ),
  velmarStaff: source(
    "Hospital Velmar: specialties and medical staff",
    "https://www.hospitalvelmar.com/",
  ),
  velmarCardiology: source(
    "Hospital Velmar: cardiology consultations and diagnostics",
    "https://www.hospitalvelmar.com/especialidades_cardiologia.htm",
  ),
  velmarMri: source(
    "Hospital Velmar: MRI service",
    "https://www.hospitalvelmar.com/servicios_auxiliares_resonancia_magnetica.htm",
  ),
  velmarEndoscopy: source(
    "Hospital Velmar: endoscopy and colonoscopy unit",
    "https://www.hospitalvelmar.com/servicios_medicos_endoscopia_y_colonoscopia.htm",
  ),
  cereneoContact: source(
    "cereneo: Vitznau and Hertenstein clinic addresses",
    "https://cereneo.ch/kontaktieren-sie-uns/",
  ),
  cereneoRehab: source(
    "cereneo: inpatient rehabilitation, Vitznau facilities and language support",
    "https://cereneo.ch/stationaere-rehabilitation/",
  ),
  zihlschlachtContact: source(
    "Rehaklinik Zihlschlacht: contact and arrival",
    "https://www.rehaklinik-zihlschlacht.ch/de/ueber-uns/kontakt-und-anreise/",
  ),
  zihlschlachtRehab: source(
    "Rehaklinik Zihlschlacht: neurological rehabilitation and therapies",
    "https://www.rehaklinik-zihlschlacht.ch/de/leistungen/neurologische-rehabilitation/",
  ),
  zihlschlachtHospital: source(
    "Rehaklinik Zihlschlacht: clinical service areas",
    "https://www.rehaklinik-zihlschlacht.ch/de/",
  ),
  adatipContact: source(
    "Adatıp Hospital: Sakarya address in official contact-page footer",
    "https://www.adatiphastanesi.com/contact",
  ),
  adatipHospital: source(
    "Adatıp Hospital: medical departments",
    "https://www.adatiphastanesi.com/",
  ),
  adatipCardiology: source(
    "Adatıp Hospital: cardiology department",
    "https://www.adatiphastanesi.com/medical-units/cardiology",
  ),
  adatipIvf: source(
    "Adatıp Hospital: assisted reproductive treatment center",
    "https://www.adatiphastanesi.com/medical-units/ivf",
  ),
  dunaContact: source(
    "Duna Medical Center: hospital address and appointment information",
    "https://dunamedicalcenter.org/en/contact",
  ),
  dunaHospital: source(
    "Duna Medical Center: hospital, outpatient and maternity services",
    "https://dunamedicalcenter.org/en",
  ),
  dunaMri: source(
    "Duna Medical Center: MRI service and indicative prices",
    "https://dunamedicalcenter.org/en/services/outpatient-services/radiological-diagnostics/mr-scan",
  ),
  verdiCenter: source(
    "Centre Esthétique Verdi: practice, clinicians and Nice address",
    "https://www.docteur-foumenteze.fr/centre-esthetique-verdi",
  ),
  verdiDoctor: source(
    "Dr. Jean-Paul Foumentèze: practice and self-reported qualifications",
    "https://www.docteur-foumenteze.fr/",
  ),
};

// Vitalia24 Health is deliberately NOT a Provider. Checked 2026-09-15:
// https://vitalia24.com/about-us/ describes a practice but does not establish a
// location-specific clinical operator; https://vitalia24.com/treatment-location/
// identifies Emsey Hospital as the treatment facility and describes Vitalia24's
// partnership and hotel coordination. These pages do not establish that Vitalia24
// operates the hospital. Do not relabel the intermediary or silently substitute Emsey.
// The older adatiphospitals.com contact URL had an expired TLS certificate; the
// current adatiphastanesi.com site and its rendered contact footer support Sakarya.

export const providersWest: Provider[] = [
  {
    id: "hospital-velmar",
    name: "Hospital Velmar",
    countryCode: "MX",
    city: "Ensenada",
    address:
      "Arenas 151, Fracc. Playa Ensenada, Ensenada, Baja California, Mexico",
    website: "https://www.hospitalvelmar.com/",
    summary:
      "Hospital in Ensenada with inpatient and surgical services, a cardiology department, and diagnostic units for MRI and digestive endoscopy. This record refers to the hospital on Arenas, not a medical-travel organizer.",
    languages: [],
    facilities: [
      "Operating rooms",
      "Clinical laboratory",
      "Intensive care unit",
      "Cardiac catheterization unit",
      "MRI service",
      "Digestive endoscopy unit",
    ],
    practitioners: [
      {
        name: "Dr. Ricardo Cabrera F.",
        role: "Cardiology — listed by the hospital",
        sourceUrl: sources.velmarStaff.url,
      },
    ],
    credentialClaims: [],
    sources: [
      sources.velmarContact,
      sources.velmarHospital,
      sources.velmarStaff,
      sources.velmarCardiology,
      sources.velmarMri,
      sources.velmarEndoscopy,
    ],
    status: "published",
    listingKind: "independent",
    contactUrl: sources.velmarContact.url,
    updatedAt: checkedAt,
  },
  {
    id: "cereneo-vitznau",
    name: "cereneo Schweiz AG — Vitznau",
    countryCode: "CH",
    city: "Vitznau",
    address: "Seestrasse 18, 6354 Vitznau, Switzerland",
    website: "https://cereneo.ch/",
    summary:
      "The Vitznau location of cereneo provides inpatient neurological rehabilitation with individually planned therapies and nursing support. The clinic is connected to Park Hotel Vitznau; cereneo's separate Hertenstein clinic and home services are not included as locations in this record.",
    languages: ["English", "German", "Russian", "Arabic", "French"],
    facilities: [
      "Inpatient rehabilitation",
      "Accessible patient rooms",
      "Rehabilitation therapy equipment",
      "Nursing support",
    ],
    practitioners: [],
    credentialClaims: [],
    sources: [sources.cereneoContact, sources.cereneoRehab],
    status: "published",
    listingKind: "independent",
    contactUrl: sources.cereneoContact.url,
    updatedAt: checkedAt,
  },
  {
    id: "rehaklinik-zihlschlacht",
    name: "Rehaklinik Zihlschlacht",
    countryCode: "CH",
    city: "Zihlschlacht",
    address: "Hauptstrasse 2, 8588 Zihlschlacht, Switzerland",
    website: "https://www.rehaklinik-zihlschlacht.ch/",
    summary:
      "Neurological rehabilitation clinic in Zihlschlacht. Its published services include early rehabilitation, Parkinson's and multiple-sclerosis rehabilitation, physiotherapy, speech therapy and robot-assisted movement therapy following individual assessment.",
    languages: [],
    facilities: [
      "Neurological rehabilitation",
      "Robot-assisted therapy center",
      "Parkinson's rehabilitation center",
      "Orthoptics unit",
      "Therapy pool",
    ],
    practitioners: [],
    credentialClaims: [],
    sources: [
      sources.zihlschlachtContact,
      sources.zihlschlachtRehab,
      sources.zihlschlachtHospital,
    ],
    status: "published",
    listingKind: "independent",
    contactUrl: sources.zihlschlachtContact.url,
    updatedAt: checkedAt,
  },
  {
    id: "adatip-sakarya",
    name: "ADATIP Hospital — Sakarya",
    countryCode: "TR",
    city: "Serdivan",
    address:
      "İstiklal Mahallesi, Şehit Mehmet Karabaşoğlu Caddesi No: 67, Serdivan, Sakarya, Türkiye",
    website: "https://www.adatiphastanesi.com/",
    summary:
      "Adatıp's hospital in Serdivan, Sakarya publishes cardiology, cardiovascular surgery, oncology and assisted-reproduction services. This location-specific listing uses the address on the current hospital website and does not represent any other Adatıp branch.",
    languages: [],
    facilities: [
      "Cardiology department",
      "Coronary intensive care",
      "Cardiac catheterization",
      "Assisted reproductive treatment center",
    ],
    practitioners: [],
    credentialClaims: [],
    sources: [
      sources.adatipContact,
      sources.adatipHospital,
      sources.adatipCardiology,
      sources.adatipIvf,
    ],
    status: "published",
    listingKind: "independent",
    contactUrl: sources.adatipContact.url,
    updatedAt: checkedAt,
  },
  {
    id: "duna-medical-center",
    name: "Duna Medical Center",
    countryCode: "HU",
    city: "Budapest",
    address: "1095 Budapest, Lechner Ödön fasor 5, Hungary",
    website: "https://dunamedicalcenter.org/en",
    summary:
      "Private hospital and outpatient center in Budapest with a maternity unit, surgical care and radiological diagnostics. Outpatient visits are by appointment. The MRI service publishes scan-specific indicative prices rather than a single all-inclusive examination price.",
    languages: [],
    facilities: [
      "Outpatient clinics",
      "Operating rooms",
      "Maternity unit",
      "MRI diagnostics",
    ],
    practitioners: [],
    credentialClaims: [],
    sources: [sources.dunaContact, sources.dunaHospital, sources.dunaMri],
    status: "published",
    listingKind: "independent",
    contactUrl: sources.dunaContact.url,
    updatedAt: checkedAt,
  },
  {
    id: "verdi-aesthetic-center",
    name: "Verdi Aesthetic Center — Centre Esthétique Verdi",
    countryCode: "FR",
    city: "Nice",
    address: "2 Rue Verdi, 06000 Nice, France",
    website: "https://www.docteur-foumenteze.fr/centre-esthetique-verdi",
    summary:
      "Medical aesthetics practice in Nice associated with Jean-Paul Foumentèze and Thierry Besins. Its official site describes aesthetic and plastic-surgery consultations, injectable treatments, thread lifts and peels, with a dedicated procedure room. This is a medical practice, not a general hospital.",
    languages: [],
    facilities: [
      "Consultation rooms",
      "Dedicated room for thread-lift and peeling procedures",
    ],
    practitioners: [
      {
        name: "Dr. Jean-Paul Foumentèze",
        role: "Aesthetic medicine — listed by the practice",
        sourceUrl: sources.verdiDoctor.url,
      },
      {
        name: "Dr. Thierry Besins",
        role: "Plastic surgery — listed by the practice",
        sourceUrl: sources.verdiCenter.url,
      },
    ],
    credentialClaims: [
      {
        label:
          "Dr. Foumentèze reports a medical doctorate from Nancy and an interuniversity diploma in morphological and anti-aging medicine from Paris",
        sourceUrl: sources.verdiDoctor.url,
        note: "Self-reported on the clinician's website; qualifications and current registration have not been independently verified by this directory.",
      },
    ],
    sources: [sources.verdiCenter, sources.verdiDoctor],
    status: "published",
    listingKind: "independent",
    contactUrl: "https://www.docteur-foumenteze.fr/contact",
    updatedAt: checkedAt,
  },
];

export const offeringsWest: Offering[] = [
  {
    id: "velmar-cardiology-consultation",
    providerId: "hospital-velmar",
    treatmentId: "cardiology-consultation",
    summary:
      "General cardiology consultation at Hospital Velmar. The department also describes ECG, echocardiography and ambulatory monitoring, which require their own clinical and cost arrangements.",
    scope: [
      "General cardiology assessment",
      "Discussion of clinically appropriate cardiac investigations",
    ],
    exclusions: [
      "No diagnostic-test or procedure package is specified by this listing.",
    ],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: sources.velmarCardiology,
  },
  {
    id: "velmar-mri",
    providerId: "hospital-velmar",
    treatmentId: "mri-scan",
    summary:
      "MRI examinations at the Ensenada hospital. The service page lists musculoskeletal, brain, spine, breast, abdominal and pelvic examinations; the required scan and preparation must be agreed with the clinical team.",
    scope: ["MRI of the clinically selected body region"],
    exclusions: [
      "Contrast, additional sequences and reporting arrangements are not specified as an inclusive package.",
    ],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: sources.velmarMri,
  },
  {
    id: "velmar-colonoscopy",
    providerId: "hospital-velmar",
    treatmentId: "colonoscopy",
    summary:
      "Colonoscopy through the hospital's digestive endoscopy unit, with biopsy or other interventions considered by the treating team when indicated.",
    scope: ["Endoscopic examination of the colon"],
    exclusions: [
      "Sedation, pathology and additional interventions are not confirmed as included in a price.",
    ],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: sources.velmarEndoscopy,
  },
  {
    id: "velmar-upper-gi-endoscopy",
    providerId: "hospital-velmar",
    treatmentId: "upper-gi-endoscopy",
    summary:
      "Upper gastrointestinal videoendoscopy is listed by Hospital Velmar's endoscopy unit. Its published scope covers examination of the esophagus, stomach and duodenum.",
    scope: ["Upper gastrointestinal endoscopic examination"],
    exclusions: [
      "Biopsy, pathology and anesthesia costs require clarification with the hospital.",
    ],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: sources.velmarEndoscopy,
  },
  {
    id: "cereneo-vitznau-neurorehabilitation",
    providerId: "cereneo-vitznau",
    treatmentId: "neurorehabilitation",
    summary:
      "Individual inpatient neurorehabilitation in Vitznau. The clinic reviews medical information before proposing a therapy and nursing plan; this directory does not assess admission eligibility or predict recovery.",
    scope: [
      "Initial interdisciplinary assessment",
      "Individual rehabilitation plan",
      "Inpatient therapy and nursing support",
    ],
    exclusions: [
      "Program duration, companion accommodation, travel and post-discharge services require a written clinic proposal.",
    ],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: sources.cereneoRehab,
  },
  {
    id: "zihlschlacht-neurorehabilitation",
    providerId: "rehaklinik-zihlschlacht",
    treatmentId: "neurorehabilitation",
    summary:
      "Neurological rehabilitation following individual assessment. The published approach combines relevant medical, nursing and therapy disciplines for neurological illness or injury.",
    scope: [
      "Neurological rehabilitation assessment",
      "Individual interdisciplinary therapy planning",
    ],
    exclusions: [
      "Admission, therapy intensity and duration are clinical decisions, not confirmed by this listing.",
    ],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: sources.zihlschlachtRehab,
  },
  {
    id: "zihlschlacht-physiotherapy",
    providerId: "rehaklinik-zihlschlacht",
    treatmentId: "physiotherapy",
    summary:
      "Physiotherapy within neurological rehabilitation, including work on movement, walking and balance. Robot-assisted or pool-based therapy may be selected as part of an individual plan.",
    scope: [
      "Neurological physiotherapy",
      "Movement and mobility rehabilitation",
    ],
    exclusions: [
      "A stand-alone outpatient session or a particular therapy device is not guaranteed by this listing.",
    ],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: sources.zihlschlachtRehab,
  },
  {
    id: "adatip-sakarya-cardiology",
    providerId: "adatip-sakarya",
    treatmentId: "cardiology-consultation",
    summary:
      "Cardiology outpatient evaluation in Sakarya. The department lists cardiac investigations; the cardiologist determines which tests are appropriate after assessment.",
    scope: ["Cardiology assessment", "Investigation and treatment planning"],
    exclusions: [
      "Cardiac tests, catheterization and inpatient care are not included as a package in this listing.",
    ],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: sources.adatipCardiology,
  },
  {
    id: "adatip-sakarya-ivf",
    providerId: "adatip-sakarya",
    treatmentId: "ivf",
    summary:
      "IVF services through Adatıp's assisted reproductive treatment center. The center describes an initial specialist consultation, partner assessment, egg retrieval and embryo transfer. Its stated eligibility requires legally married couples and a marriage certificate.",
    scope: [
      "Initial fertility assessment",
      "IVF planning and procedures subject to eligibility",
    ],
    exclusions: [
      "Medication, laboratory add-ons, storage and repeat cycles are not confirmed as included in a price.",
      "Treatment eligibility must be confirmed directly with the center; no outcome is promised.",
    ],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: sources.adatipIvf,
  },
  {
    id: "duna-mri-noncontrast-region",
    providerId: "duna-medical-center",
    treatmentId: "mri-scan",
    summary:
      "Non-contrast MRI of one body region. The published starting price is indicative, excludes the care-package charge and is not the price for every MRI examination. Confirm the appropriate scan and complete cost with Duna Medical Center.",
    scope: ["Non-contrast MRI, by region"],
    exclusions: [
      "Care-package charge",
      "Contrast-enhanced studies",
      "Additional body regions",
      "Foreign-language report surcharge",
    ],
    price: {
      kind: "from",
      currency: "HUF",
      amountMinor: 5300000,
      minorUnit: 2,
      unit: "non-contrast MRI of one body region",
      includes: ["Listed non-contrast MRI examination, by region"],
      excludes: [
        "Care-package charge",
        "Contrast-enhanced examination",
        "Foreign-language report surcharge",
      ],
      sourceUrl: sources.dunaMri.url,
    },
    source: sources.dunaMri,
  },
  {
    id: "verdi-aesthetics-consultation",
    providerId: "verdi-aesthetic-center",
    treatmentId: "aesthetics-non-surgical-consultation",
    summary:
      "Consultation about non-surgical aesthetic options at Centre Esthétique Verdi. The practice describes injectables, thread lifts and peels; the choice of any procedure requires an individual clinical assessment and consent.",
    scope: [
      "Aesthetic medicine consultation",
      "Discussion of available non-surgical options",
    ],
    exclusions: [
      "An injectable treatment, thread lift or peel is not included by this consultation listing.",
    ],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: sources.verdiCenter,
  },
  {
    id: "verdi-cosmetic-surgery-consultation",
    providerId: "verdi-aesthetic-center",
    treatmentId: "cosmetic-surgery-consultation",
    summary:
      "The practice offers consultation with plastic surgeon Thierry Besins, including joint assessment with Jean-Paul Foumentèze. A consultation at this address is not evidence that a particular operation is performed on site.",
    scope: [
      "Plastic-surgery consultation",
      "Joint aesthetic assessment when arranged with the practice",
    ],
    exclusions: [
      "Operations, anesthesia and inpatient admission are not included or booked by this listing.",
    ],
    price: { kind: "not-published", includes: [], excludes: [] },
    source: sources.verdiCenter,
  },
];
