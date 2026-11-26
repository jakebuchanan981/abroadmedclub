import type { CareCategory, Country, Treatment } from "./types";

const specialtiesSource = "https://medlineplus.gov/ency/article/001933.htm";
const dentalSource =
  "https://www.nhs.uk/live-well/healthy-teeth-and-gums/dental-treatments/";
const cosmeticSource =
  "https://www.nhs.uk/tests-and-treatments/cosmetic-procedures/";
const transplantSource =
  "https://www.nhs.uk/tests-and-treatments/stem-cell-or-bone-marrow-transplants/what-it-is/";
const dialysisSource =
  "https://www.nhs.uk/tests-and-treatments/dialysis/what-is-dialysis/";
const hairSource =
  "https://www.nhs.uk/tests-and-treatments/cosmetic-procedures/cosmetic-surgery/hair-transplant/";
const screeningSource =
  "https://www.nhs.uk/tests-and-treatments/nhs-screening/";
const physiotherapySource =
  "https://www.nhs.uk/tests-and-treatments/physiotherapy/";
const hyperbaricSource =
  "https://www.fda.gov/medical-devices/letters-health-care-providers/follow-instructions-safe-use-hyperbaric-oxygen-therapy-devices-letter-health-care-providers";
const regenerativeSource =
  "https://www.fda.gov/vaccines-blood-biologics/consumers-biologics/important-patient-and-consumer-information-about-regenerative-medicine-therapies";

// Taxonomy describes topics, not available services or medical recommendations.
// Consultation IDs remain stable even when a category has no published providers.
const categoryDefinitions: (CareCategory & { sourceUrl: string })[] = [
  {
    id: "addiction-treatment",
    name: "Addiction Treatment",
    description:
      "Assessment and care planning for substance use and dependence, including discussions of treatment and support.",
    sourceUrl:
      "https://www.nhs.uk/live-well/addiction-support/drug-addiction-getting-help/",
  },
  {
    id: "aesthetics-non-surgical",
    name: "Aesthetics non surgical",
    description:
      "Consultations about cosmetic procedures that do not involve surgery, with attention to the specific procedure being considered.",
    sourceUrl: cosmeticSource,
  },
  {
    id: "anesthesiology",
    name: "Anesthesiology",
    description:
      "Assessment and planning for anesthesia and pain control around operations and other procedures.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "bariatric-surgery",
    name: "Bariatric Surgery",
    description:
      "Specialist assessment of weight-loss surgery, including procedures that change the stomach or digestive pathway.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/weight-loss-surgery/",
  },
  {
    id: "bone-marrow-transplant",
    name: "Bone Marrow Transplant",
    description:
      "Evaluation of blood-forming stem cell transplantation using a person's own cells or cells from a donor.",
    sourceUrl: transplantSource,
  },
  {
    id: "cancer-treatment",
    name: "Cancer Treatment",
    description:
      "Oncology assessment and discussion of cancer treatment approaches, which vary by diagnosis and clinical findings.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "cardiac-surgery",
    name: "Cardiac Surgery",
    description:
      "Surgical assessment of heart conditions, including discussion of operations on coronary arteries and other heart structures.",
    sourceUrl:
      "https://www.nhs.uk/tests-and-treatments/coronary-artery-bypass-graft/what-it-is/",
  },
  {
    id: "cardiology",
    name: "Cardiology",
    description:
      "Evaluation of heart conditions and discussion of cardiac testing, medical treatment and ongoing care.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "cosmetic-surgery",
    name: "Cosmetic Surgery",
    description:
      "Consultations about operations intended to change appearance and the scope of individual surgical procedures.",
    sourceUrl: cosmeticSource,
  },
  {
    id: "dental-care",
    name: "Dental Care",
    description:
      "Assessment of teeth and oral health, including restorative dentistry, orthodontics and other dental procedures.",
    sourceUrl: dentalSource,
  },
  {
    id: "dermatology",
    name: "Dermatology",
    description:
      "Specialist evaluation of skin disorders and discussion of investigations and treatment options.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "dialysis",
    name: "Dialysis",
    description:
      "Renal team assessment and planning for treatment that removes waste products from the blood when kidney function is impaired.",
    sourceUrl: dialysisSource,
  },
  {
    id: "ear-nose-and-throat",
    name: "Ear Nose and Throat",
    description:
      "Evaluation of ear, nose and throat conditions, including hearing-related concerns and specialist investigations.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "emergency-medicine",
    name: "Emergency Medicine",
    description:
      "Information about services for serious injuries and urgent illness. This directory is not an emergency response service; use local emergency services for immediate help.",
    sourceUrl:
      "https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-go-to-ae/",
  },
  {
    id: "endocrinology",
    name: "Endocrinology",
    description:
      "Evaluation of hormone and metabolic disorders, including diabetes and conditions affecting endocrine glands.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "eye-surgery",
    name: "Eye Surgery",
    description:
      "Ophthalmic assessment and discussion of operations involving the eye, including lens procedures.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "family-medicine",
    name: "Family Medicine",
    description:
      "General health assessment and continuing primary care for people at different stages of life.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "fertility-treatment",
    name: "Fertility Treatment",
    description:
      "Assessment of fertility concerns and discussion of assisted reproduction and other fertility care.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/ivf/",
  },
  {
    id: "gastroenterology",
    name: "Gastroenterology",
    description:
      "Evaluation of digestive system conditions, including investigations of the stomach and intestines.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "general-medicine",
    name: "General Medicine",
    description:
      "General medical assessment of health concerns and discussion of investigations or referral to specialist care.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "general-surgery",
    name: "General Surgery",
    description:
      "Assessment of conditions that may involve common surgical procedures and discussion of operative and non-operative care.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "geriatrics",
    name: "Geriatrics",
    description:
      "Medical assessment focused on older adults and the coordination of their health and care needs.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "hair-transplant",
    name: "Hair Transplant",
    description:
      "Assessment of hair transplantation, a procedure that relocates hair to an area with thinning or hair loss.",
    sourceUrl: hairSource,
  },
  {
    id: "hematology",
    name: "Hematology",
    description:
      "Evaluation of disorders affecting blood and discussion of blood investigations and specialist care.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "hyperbaric-therapy",
    name: "Hyperbaric Therapy",
    description:
      "Assessment of treatment involving oxygen in a pressurized chamber. Device authorization does not establish every advertised use.",
    sourceUrl: hyperbaricSource,
  },
  {
    id: "imaging",
    name: "Imaging",
    description:
      "Discussion of medical scans used to examine internal structures and support diagnosis or treatment monitoring.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/mri-scan/",
  },
  {
    id: "immunology",
    name: "Immunology",
    description:
      "Specialist evaluation of disorders involving the immune system and discussion of related investigations.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "infectious-diseases",
    name: "Infectious Diseases",
    description:
      "Evaluation of infections and discussion of diagnostic investigations and infection-specific care.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "internal-medicine",
    name: "Internal Medicine",
    description:
      "Medical assessment of adult health conditions, including concerns involving more than one body system.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "medical-check-ups",
    name: "Medical Check Ups",
    description:
      "Discussion of preventive health assessments and screening. A screening test is not a diagnosis or a guarantee of health.",
    sourceUrl: screeningSource,
  },
  {
    id: "neonatology",
    name: "Neonatology",
    description:
      "Assessment and medical care of newborn babies, including discussion of newborn examinations and health concerns.",
    sourceUrl:
      "https://www.nhs.uk/baby/newborn-screening/physical-examination/",
  },
  {
    id: "nephrology",
    name: "Nephrology",
    description:
      "Specialist assessment of kidney disorders and discussion of kidney function, investigations and ongoing care.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "neurology",
    name: "Neurology",
    description:
      "Evaluation of nervous system conditions and discussion of neurological testing and medical care.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "neurosurgery",
    name: "Neurosurgery",
    description:
      "Surgical assessment of nervous system conditions, including spinal conditions involving compressed nerves.",
    sourceUrl:
      "https://www.nhs.uk/tests-and-treatments/lumbar-decompression-surgery/",
  },
  {
    id: "ob-gyn",
    name: "Ob-Gyn",
    description:
      "Assessment of reproductive health and pregnancy-related care, including gynecological investigations.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "orthopedic-surgery",
    name: "Orthopedic Surgery",
    description:
      "Assessment of bone, joint and connective tissue conditions and discussion of orthopedic procedures.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "pathology",
    name: "Pathology",
    description:
      "Laboratory assessment of tissue and cell samples, including discussion of findings used in diagnosis.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/biopsy/",
  },
  {
    id: "pediatrics",
    name: "Pediatrics",
    description:
      "Medical assessment and continuing care of children, with attention to age-specific health concerns.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "psychiatry",
    name: "Psychiatry",
    description:
      "Specialist assessment of mental health conditions and discussion of treatment and continuing care.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "pulmonology",
    name: "Pulmonology",
    description:
      "Evaluation of lung and breathing conditions, including discussion of lung function investigations.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "rehabilitation",
    name: "Rehabilitation",
    description:
      "Assessment of movement and everyday function following illness, injury or disability and discussion of rehabilitation planning.",
    sourceUrl: physiotherapySource,
  },
  {
    id: "rheumatology",
    name: "Rheumatology",
    description:
      "Specialist evaluation of arthritis and other conditions affecting joints, muscles and connective tissues.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "sports-medicine",
    name: "Sports Medicine",
    description:
      "Assessment of exercise-related muscle and joint concerns and discussion of injury rehabilitation.",
    sourceUrl: physiotherapySource,
  },
  {
    id: "stem-cell-therapy",
    name: "Stem Cell Therapy",
    description:
      "Discussion of cell-based treatment claims and their regulatory status. This category does not endorse unapproved interventions; blood-forming cell transplantation is listed separately.",
    sourceUrl: regenerativeSource,
  },
  {
    id: "urology",
    name: "Urology",
    description:
      "Assessment of urinary tract conditions and discussion of investigations and urological procedures.",
    sourceUrl: specialtiesSource,
  },
  {
    id: "vascular-surgery",
    name: "Vascular Surgery",
    description:
      "Assessment of blood vessel conditions and discussion of vascular operations, including procedures on narrowed arteries.",
    sourceUrl:
      "https://www.nhs.uk/tests-and-treatments/carotid-endarterectomy/",
  },
];

export const categories: CareCategory[] = categoryDefinitions.map(
  ({ id, name, description }) => ({ id, name, description }),
);

export const treatments: Treatment[] = [
  ...categoryDefinitions.map(({ id, name, description, sourceUrl }) => ({
    id: `${id}-consultation`,
    categoryId: id,
    name: `${name} consultation`,
    summary: description,
    sourceUrl,
  })),
  {
    id: "dental-implants",
    categoryId: "dental-care",
    name: "Dental implants",
    summary:
      "Placement of an implant in the jaw to support a replacement tooth, bridge or denture.",
    sourceUrl: dentalSource,
  },
  {
    id: "dental-crowns",
    categoryId: "dental-care",
    name: "Dental crowns",
    summary:
      "A fitted cap that covers a prepared tooth; the material and preparation are part of dental treatment planning.",
    sourceUrl: dentalSource,
  },
  {
    id: "root-canal-treatment",
    categoryId: "dental-care",
    name: "Root canal treatment",
    summary:
      "Treatment of the internal root canal system of a tooth, followed by filling and sealing the tooth.",
    sourceUrl: dentalSource,
  },
  {
    id: "teeth-whitening",
    categoryId: "dental-care",
    name: "Teeth whitening",
    summary:
      "Cosmetic dental treatment that changes tooth colour using whitening agents.",
    sourceUrl: dentalSource,
  },
  {
    id: "dental-bridges",
    categoryId: "dental-care",
    name: "Dental bridges",
    summary:
      "A fixed dental restoration that replaces one or more missing teeth and is supported by neighbouring teeth.",
    sourceUrl: dentalSource,
  },
  {
    id: "dental-fillings",
    categoryId: "dental-care",
    name: "Dental fillings",
    summary: "Placement of restorative material into a cavity in a tooth.",
    sourceUrl: dentalSource,
  },
  {
    id: "orthodontic-braces",
    categoryId: "dental-care",
    name: "Orthodontic braces",
    summary:
      "Fixed or removable dental appliances used to move teeth as part of an orthodontic plan.",
    sourceUrl: dentalSource,
  },
  {
    id: "dental-veneers",
    categoryId: "dental-care",
    name: "Dental veneers",
    summary:
      "Thin facings fitted to the front surface of teeth; preparation depends on the type of veneer.",
    sourceUrl: dentalSource,
  },
  {
    id: "mri-scan",
    categoryId: "imaging",
    name: "MRI scan",
    summary:
      "An imaging examination that produces detailed pictures of internal body structures for clinical interpretation.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/mri-scan/",
  },
  {
    id: "ct-scan",
    categoryId: "imaging",
    name: "CT scan",
    summary:
      "An imaging examination used to view internal structures and support diagnosis or treatment monitoring.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/ct-scan/",
  },
  {
    id: "colonoscopy",
    categoryId: "gastroenterology",
    name: "Colonoscopy",
    summary:
      "An examination of the bowel using a flexible tube with a camera passed through the anus.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/colonoscopy/",
  },
  {
    id: "upper-gi-endoscopy",
    categoryId: "gastroenterology",
    name: "Upper GI endoscopy (gastroscopy)",
    summary:
      "A camera examination of the esophagus, stomach and upper part of the small intestine.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/gastroscopy/",
  },
  {
    id: "cataract-surgery",
    categoryId: "eye-surgery",
    name: "Cataract surgery",
    summary:
      "An operation that replaces a cloudy natural lens in the eye with an artificial lens.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/cataract-surgery/",
  },
  {
    id: "ivf",
    categoryId: "fertility-treatment",
    name: "In vitro fertilization (IVF)",
    summary:
      "A fertility procedure in which eggs are fertilized in a laboratory and an embryo is transferred to the uterus.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/ivf/",
  },
  {
    id: "hip-replacement",
    categoryId: "orthopedic-surgery",
    name: "Hip replacement",
    summary:
      "An operation that replaces damaged parts of the hip joint with artificial components.",
    sourceUrl:
      "https://www.nhs.uk/tests-and-treatments/hip-replacement/what-is-a-hip-replacement/",
  },
  {
    id: "knee-replacement",
    categoryId: "orthopedic-surgery",
    name: "Knee replacement",
    summary:
      "An operation that replaces some or all of the damaged surfaces of a knee joint with artificial components.",
    sourceUrl:
      "https://www.nhs.uk/tests-and-treatments/knee-replacement/what-is-a-knee-replacement/",
  },
  {
    id: "coronary-bypass",
    categoryId: "cardiac-surgery",
    name: "Coronary artery bypass graft (CABG)",
    summary:
      "An operation using blood vessel grafts to create routes around narrowed or blocked coronary arteries.",
    sourceUrl:
      "https://www.nhs.uk/tests-and-treatments/coronary-artery-bypass-graft/what-it-is/",
  },
  {
    id: "hair-transplant",
    categoryId: "hair-transplant",
    name: "Hair transplant",
    summary:
      "A surgical procedure that moves hair from a donor area to an area of thinning or hair loss.",
    sourceUrl: hairSource,
  },
  {
    id: "health-screening",
    categoryId: "medical-check-ups",
    name: "Health screening",
    summary:
      "Tests offered to people without symptoms to identify possible health concerns. Screening results may require further diagnostic assessment.",
    sourceUrl: screeningSource,
  },
  {
    id: "physiotherapy",
    categoryId: "rehabilitation",
    name: "Physiotherapy",
    summary:
      "Assessment and treatment using movement, exercise, manual techniques and education as part of a rehabilitation plan.",
    sourceUrl: physiotherapySource,
  },
  {
    id: "neurorehabilitation",
    categoryId: "rehabilitation",
    name: "Neurorehabilitation",
    summary:
      "Rehabilitation addressing movement, communication, thinking or everyday activities after neurological illness such as stroke.",
    sourceUrl: "https://www.nhs.uk/conditions/stroke/recovery/",
  },
  {
    id: "gastric-bypass",
    categoryId: "bariatric-surgery",
    name: "Gastric bypass",
    summary:
      "An operation that creates a smaller stomach pouch and connects it to a lower part of the small intestine.",
    sourceUrl:
      "https://www.nhs.uk/tests-and-treatments/weight-loss-surgery/how-its-done/",
  },
  {
    id: "gastric-band",
    categoryId: "bariatric-surgery",
    name: "Gastric band",
    summary:
      "An operation placing an adjustable band around the upper part of the stomach.",
    sourceUrl:
      "https://www.nhs.uk/tests-and-treatments/weight-loss-surgery/how-its-done/",
  },
  {
    id: "hematopoietic-stem-cell-transplant",
    categoryId: "bone-marrow-transplant",
    name: "Blood-forming stem cell transplant",
    summary:
      "Transplantation of blood-forming stem cells from the patient or a donor, following a specialist preparation plan.",
    sourceUrl: transplantSource,
  },
  {
    id: "chemotherapy",
    categoryId: "cancer-treatment",
    name: "Chemotherapy",
    summary:
      "Cancer treatment using medicines, with the drug regimen and delivery method specified by the oncology team.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/chemotherapy/",
  },
  {
    id: "radiotherapy",
    categoryId: "cancer-treatment",
    name: "Radiotherapy",
    summary:
      "Cancer treatment using radiation, delivered externally or through other techniques specified in a treatment plan.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/radiotherapy/",
  },
  {
    id: "electrocardiogram",
    categoryId: "cardiology",
    name: "Electrocardiogram (ECG)",
    summary:
      "A recording of the heart's electrical activity, including its rate and rhythm.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/electrocardiogram/",
  },
  {
    id: "echocardiogram",
    categoryId: "cardiology",
    name: "Echocardiogram",
    summary:
      "An ultrasound examination that produces images of the heart and its movement.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/echocardiogram/",
  },
  {
    id: "rhinoplasty",
    categoryId: "cosmetic-surgery",
    name: "Nose reshaping (rhinoplasty)",
    summary: "An operation that changes the shape or size of the nose.",
    sourceUrl:
      "https://www.nhs.uk/tests-and-treatments/cosmetic-procedures/cosmetic-surgery/nose-reshaping-rhinoplasty/",
  },
  {
    id: "skin-biopsy",
    categoryId: "dermatology",
    name: "Skin biopsy",
    summary: "Removal of a small skin sample for laboratory examination.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/biopsy/",
  },
  {
    id: "dialysis-treatment",
    categoryId: "dialysis",
    name: "Dialysis treatment",
    summary:
      "A procedure that removes waste products from the blood when the kidneys are not doing so adequately; arrangements depend on the prescribed dialysis type.",
    sourceUrl: dialysisSource,
  },
  {
    id: "hearing-assessment",
    categoryId: "ear-nose-and-throat",
    name: "Hearing assessment",
    summary:
      "Testing of hearing using methods selected for the person's age and the concern being investigated.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/hearing-tests/",
  },
  {
    id: "inguinal-hernia-repair",
    categoryId: "general-surgery",
    name: "Inguinal hernia repair",
    summary:
      "An operation addressing a hernia in the groin, performed through an open or keyhole approach.",
    sourceUrl:
      "https://www.nhs.uk/tests-and-treatments/inguinal-hernia-repair/",
  },
  {
    id: "full-blood-count",
    categoryId: "hematology",
    name: "Full blood count",
    summary:
      "A laboratory blood test that measures blood cells as part of an investigation or monitoring plan.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/blood-tests/",
  },
  {
    id: "hyperbaric-oxygen-therapy",
    categoryId: "hyperbaric-therapy",
    name: "Hyperbaric oxygen therapy",
    summary:
      "Treatment involving oxygen delivered inside a chamber at increased pressure. A listing does not establish that any particular proposed use is authorized.",
    sourceUrl: hyperbaricSource,
  },
  {
    id: "newborn-examination",
    categoryId: "neonatology",
    name: "Newborn physical examination",
    summary:
      "A physical examination of a newborn that includes assessment of the eyes, heart, hips and other findings.",
    sourceUrl:
      "https://www.nhs.uk/baby/newborn-screening/physical-examination/",
  },
  {
    id: "electroencephalogram",
    categoryId: "neurology",
    name: "Electroencephalogram (EEG)",
    summary:
      "A test that records the brain's electrical activity using electrodes placed on the scalp.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/electroencephalogram/",
  },
  {
    id: "lumbar-decompression",
    categoryId: "neurosurgery",
    name: "Lumbar decompression surgery",
    summary:
      "An operation on the lower spine addressing structures that compress spinal nerves.",
    sourceUrl:
      "https://www.nhs.uk/tests-and-treatments/lumbar-decompression-surgery/",
  },
  {
    id: "hysteroscopy",
    categoryId: "ob-gyn",
    name: "Hysteroscopy",
    summary:
      "An examination inside the uterus using a thin instrument containing a camera.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/hysteroscopy/",
  },
  {
    id: "biopsy-analysis",
    categoryId: "pathology",
    name: "Biopsy sample analysis",
    summary:
      "Laboratory examination of a tissue or cell sample taken during a biopsy; sample collection is a separate clinical procedure.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/biopsy/",
  },
  {
    id: "spirometry",
    categoryId: "pulmonology",
    name: "Spirometry",
    summary:
      "A breathing test that measures exhaled air as part of a lung function assessment.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/spirometry/",
  },
  {
    id: "cystoscopy",
    categoryId: "urology",
    name: "Cystoscopy",
    summary:
      "An examination inside the bladder used in the investigation or treatment of urinary conditions.",
    sourceUrl: "https://www.nhs.uk/tests-and-treatments/cystoscopy/",
  },
  {
    id: "carotid-endarterectomy",
    categoryId: "vascular-surgery",
    name: "Carotid endarterectomy",
    summary:
      "An operation to remove fatty deposits from a carotid artery in the neck.",
    sourceUrl:
      "https://www.nhs.uk/tests-and-treatments/carotid-endarterectomy/",
  },
];

// Geographic subregions follow UN M49: https://unstats.un.org/unsd/methodology/m49/.
// Cities are geographic browsing examples, not evidence of listed clinics or services.
// The reference's r= region filters are intentionally not country records.
export const countries: Country[] = [
  {
    code: "AL",
    name: "Albania",
    region: "Southern Europe",
    cities: ["Tirana", "Durrës"],
  },
  {
    code: "AR",
    name: "Argentina",
    region: "South America",
    cities: ["Buenos Aires", "Córdoba", "Rosario"],
  },
  {
    code: "AT",
    name: "Austria",
    region: "Western Europe",
    cities: ["Vienna", "Graz", "Linz"],
  },
  {
    code: "BR",
    name: "Brazil",
    region: "South America",
    cities: ["São Paulo", "Rio de Janeiro", "Brasília"],
  },
  {
    code: "CN",
    name: "China",
    region: "Eastern Asia",
    cities: ["Beijing", "Shanghai", "Guangzhou"],
  },
  {
    code: "CO",
    name: "Colombia",
    region: "South America",
    cities: ["Bogotá", "Medellín", "Cali"],
  },
  {
    code: "CR",
    name: "Costa Rica",
    region: "Central America",
    cities: ["San José", "Alajuela", "Escazú"],
  },
  {
    code: "HR",
    name: "Croatia",
    region: "Southern Europe",
    cities: ["Zagreb", "Split", "Rijeka"],
  },
  {
    code: "CY",
    name: "Cyprus",
    region: "Western Asia",
    cities: ["Nicosia", "Limassol", "Larnaca"],
  },
  {
    code: "FR",
    name: "France",
    region: "Western Europe",
    cities: ["Paris", "Marseille", "Lyon"],
  },
  {
    code: "GE",
    name: "Georgia",
    region: "Western Asia",
    cities: ["Tbilisi", "Batumi", "Kutaisi"],
  },
  {
    code: "DE",
    name: "Germany",
    region: "Western Europe",
    cities: ["Berlin", "Hamburg", "Munich"],
  },
  {
    code: "GR",
    name: "Greece",
    region: "Southern Europe",
    cities: ["Athens", "Thessaloniki", "Patras"],
  },
  {
    code: "GT",
    name: "Guatemala",
    region: "Central America",
    cities: ["Guatemala City", "Quetzaltenango"],
  },
  {
    code: "HU",
    name: "Hungary",
    region: "Eastern Europe",
    cities: ["Budapest", "Debrecen", "Szeged"],
  },
  {
    code: "IN",
    name: "India",
    region: "Southern Asia",
    cities: ["New Delhi", "Mumbai", "Bengaluru", "Chennai"],
  },
  {
    code: "IL",
    name: "Israel",
    region: "Western Asia",
    cities: ["Tel Aviv", "Haifa", "Beersheba"],
  },
  {
    code: "IT",
    name: "Italy",
    region: "Southern Europe",
    cities: ["Rome", "Milan", "Naples"],
  },
  {
    code: "JO",
    name: "Jordan",
    region: "Western Asia",
    cities: ["Amman", "Zarqa", "Irbid"],
  },
  {
    code: "LT",
    name: "Lithuania",
    region: "Northern Europe",
    cities: ["Vilnius", "Kaunas", "Klaipėda"],
  },
  {
    code: "MK",
    name: "North Macedonia",
    region: "Southern Europe",
    cities: ["Skopje", "Bitola", "Kumanovo"],
  },
  {
    code: "MY",
    name: "Malaysia",
    region: "South-eastern Asia",
    cities: ["Kuala Lumpur", "George Town", "Johor Bahru"],
  },
  {
    code: "MT",
    name: "Malta",
    region: "Southern Europe",
    cities: ["Valletta", "Birkirkara", "Sliema"],
  },
  {
    code: "MX",
    name: "Mexico",
    region: "Central America",
    cities: ["Mexico City", "Guadalajara", "Monterrey"],
  },
  {
    code: "PA",
    name: "Panama",
    region: "Central America",
    cities: ["Panama City", "Colón", "David"],
  },
  {
    code: "PE",
    name: "Peru",
    region: "South America",
    cities: ["Lima", "Arequipa", "Trujillo"],
  },
  {
    code: "PH",
    name: "Philippines",
    region: "South-eastern Asia",
    cities: ["Manila", "Quezon City", "Cebu City", "Davao City"],
  },
  {
    code: "PL",
    name: "Poland",
    region: "Eastern Europe",
    cities: ["Warsaw", "Kraków", "Wrocław"],
  },
  {
    code: "PT",
    name: "Portugal",
    region: "Southern Europe",
    cities: ["Lisbon", "Porto", "Braga"],
  },
  {
    code: "RO",
    name: "Romania",
    region: "Eastern Europe",
    cities: ["Bucharest", "Cluj-Napoca", "Timișoara"],
  },
  {
    code: "RU",
    name: "Russia",
    region: "Eastern Europe",
    cities: ["Moscow", "Saint Petersburg", "Novosibirsk"],
  },
  {
    code: "SG",
    name: "Singapore",
    region: "South-eastern Asia",
    cities: ["Singapore"],
  },
  {
    code: "ZA",
    name: "South Africa",
    region: "Southern Africa",
    cities: ["Johannesburg", "Cape Town", "Durban"],
  },
  {
    code: "KR",
    name: "South Korea",
    region: "Eastern Asia",
    cities: ["Seoul", "Busan", "Incheon"],
  },
  {
    code: "ES",
    name: "Spain",
    region: "Southern Europe",
    cities: ["Madrid", "Barcelona", "Valencia"],
  },
  {
    code: "CH",
    name: "Switzerland",
    region: "Western Europe",
    cities: ["Zurich", "Geneva", "Basel"],
  },
  {
    code: "TH",
    name: "Thailand",
    region: "South-eastern Asia",
    cities: ["Bangkok", "Chiang Mai", "Phuket"],
  },
  {
    code: "TR",
    name: "Türkiye",
    region: "Western Asia",
    cities: ["Istanbul", "Ankara", "Izmir"],
  },
  {
    code: "UA",
    name: "Ukraine",
    region: "Eastern Europe",
    cities: ["Kyiv", "Kharkiv", "Odesa"],
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    region: "Western Asia",
    cities: ["Dubai", "Abu Dhabi", "Sharjah"],
  },
  {
    code: "GB",
    name: "United Kingdom",
    region: "Northern Europe",
    cities: ["London", "Birmingham", "Manchester", "Edinburgh"],
  },
  {
    code: "VN",
    name: "Vietnam",
    region: "South-eastern Asia",
    cities: ["Hanoi", "Ho Chi Minh City", "Da Nang"],
  },
];
