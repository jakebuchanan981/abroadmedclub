import type { Guide, Source } from "./types";

const checkedAt = "2026-09-15";
const sources: Record<string, Source> = {
  cdc: {
    label: "CDC Yellow Book 2026: Medical Tourism",
    url: "https://www.cdc.gov/yellow-book/hcp/health-care-abroad/medical-tourism.html",
    checkedAt,
  },
  acs: {
    label:
      "American College of Surgeons: Medical and Surgical Tourism (2009 statement)",
    url: "https://www.facs.org/about-acs/statements/medical-and-surgical-tourism/",
    checkedAt,
  },
  insurance: {
    label:
      "CDC Yellow Book 2026: Travel Insurance, Travel Health Insurance, and Medical Evacuation Insurance",
    url: "https://www.cdc.gov/yellow-book/hcp/health-care-abroad/travel-insurance.html",
    checkedAt,
  },
  medicines: {
    label:
      "CDC Yellow Book 2026: Traveling with Prohibited or Restricted Medications",
    url: "https://www.cdc.gov/yellow-book/hcp/travelers-with-additional-considerations/traveling-with-prohibited-or-restricted-medications.html",
    checkedAt,
  },
  gmc: {
    label: "General Medical Council: UK registers",
    url: "https://www.gmc-uk.org/registration-and-licensing/our-registers",
    checkedAt,
  },
  cqc: {
    label: "Care Quality Commission: Find a hospital in England",
    url: "https://www.cqc.org.uk/care-services/find-hospital",
    checkedAt,
  },
  travel: {
    label:
      "UK Foreign, Commonwealth & Development Office: Foreign travel advice",
    url: "https://www.gov.uk/foreign-travel-advice",
    checkedAt,
  },
  accessibility: {
    label:
      "UK Foreign, Commonwealth & Development Office: Disability and travel abroad",
    url: "https://www.gov.uk/government/publications/disabled-travellers/disability-and-travel-abroad",
    checkedAt,
  },
  credit: {
    label: "US Consumer Financial Protection Bureau: Credit cards key terms",
    url: "https://www.consumerfinance.gov/consumer-tools/credit-cards/answers/key-terms/",
    checkedAt,
  },
};

export const guides: Guide[] = [
  {
    id: "choosing-a-destination",
    title: "Choose a destination around care, not a holiday",
    category: "Planning",
    readMinutes: 3,
    summary:
      "Separate clinical suitability, practical access and travel conditions before you shortlist a country.",
    sections: [
      {
        heading: "Start with the decision at home",
        paragraphs: [
          "A place appearing in a directory is not a recommendation to travel there. Start with a clinician who knows your circumstances: what needs assessment, what alternatives exist locally, and what might be lost by delaying care? A low advertised price or an attractive destination cannot answer those questions.",
          "Make two shortlists: clinical options to discuss with your care team, and destinations you could realistically reach and remain in if plans change. Do not use country popularity as a measure of quality.",
        ],
      },
      {
        heading: "Compare the entire journey",
        paragraphs: [
          "Look at the exact city and facility rather than a country-wide impression. Consider language support during consent, distance to emergency services, accommodation suitable for recovery, and whether someone can accompany you. Ask who will provide follow-up at home before committing to travel.",
        ],
        bullets: [
          "Check current government advice for the destination and transit points; advice can change after booking.",
          "Confirm entry requirements with the relevant government for your nationality and the actual purpose of travel.",
          "Budget for changed flights, a longer stay and additional care, not just the planned appointment.",
          "Ask your clinician and carrier about your individual travel plan. There is no directory-wide safe-to-fly interval.",
        ],
      },
      {
        heading: "Keep unresolved questions visible",
        paragraphs: [
          "Write down what is confirmed, who confirmed it and what still needs checking. If a clinic cannot explain a material part of the plan, pause rather than treating silence as reassurance. Government travel advice concerns travel conditions; it does not certify a clinic. The FCDO resource below is written for British travelers, so also consult guidance from your own government.",
        ],
      },
    ],
    sources: [sources.cdc, sources.acs, sources.travel],
  },
  {
    id: "checking-clinics-and-doctors",
    title: "Check the clinic and the person treating you",
    category: "Safety",
    readMinutes: 3,
    summary:
      "Use exact names, current registers and specific questions rather than badges or testimonials.",
    sections: [
      {
        heading: "Establish who is responsible",
        paragraphs: [
          "Ask for the legal name and location of the treating facility, the name of the clinician expected to perform the procedure, and the regulator and registration number relevant to their role. A hospital brand can cover multiple sites; a clinician's membership of a society is not the same as a current licence.",
          "Check information with the issuing body rather than relying only on a screenshot supplied by a salesperson. Match the full name, location, profession and specialty where the register supplies them. Ask about restrictions or conditions you do not understand.",
        ],
      },
      {
        heading: "Ask about the actual service",
        paragraphs: [
          "A facility offering a specialty does not establish that every procedure in that specialty is available, or appropriate for you. Ask who assesses candidacy, who provides anesthesia if needed, and what happens if your named clinician changes.",
        ],
        bullets: [
          "What experience does the proposed team have with this procedure, and how are outcomes and complications recorded?",
          "Where would an unplanned admission or transfer occur, and who arranges and pays for it?",
          "How can you raise a concern with the facility and the relevant regulator?",
          "Who interprets clinical discussions, and can you receive documents in a language you understand?",
        ],
      },
      {
        heading: "Use the correct jurisdiction",
        paragraphs: [
          "The GMC register below covers UK doctors and other listed professions; CQC hospital information covers England. They are examples of official checks, not global registers. For another destination or profession, identify its competent regulator. Registration and inspection information can help inform questions, but neither a directory entry nor a register search guarantees the outcome of care.",
        ],
      },
    ],
    sources: [sources.gmc, sources.cqc, sources.cdc, sources.acs],
  },
  {
    id: "preparing-for-consultation",
    title: "Make a consultation a two-way decision",
    category: "Planning",
    readMinutes: 3,
    summary:
      "Prepare questions about options, uncertainty, consent and follow-up without committing to a procedure.",
    sections: [
      {
        heading: "Separate an inquiry from clinical assessment",
        paragraphs: [
          "An administrative reply or a proposed package is not a diagnosis, a treatment plan or informed consent. Ask whether you are speaking to a clinician, coordinator or sales team and what the conversation can establish. Remote assessment may leave questions that require an examination or further tests.",
          "Discuss your plans with your usual clinician before travel. Ask what information the overseas team needs and how to transfer it through an appropriate secure clinical channel. Do not send medical records through this directory's inquiry or support forms.",
        ],
      },
      {
        heading: "Bring a decision checklist",
        paragraphs: [
          "Ask for explanations in ordinary language and enough time to consider them. If communication is difficult, arrange suitable interpretation and confirm who is responsible for its accuracy.",
        ],
        bullets: [
          "What are the options, including local care, waiting or not having this intervention?",
          "What benefits are realistic in my circumstances, what remains uncertain, and what could go wrong?",
          "Who makes the final decision after examination, and what happens to my deposit if the plan changes?",
          "What aftercare is required, who will provide it, and what restrictions could affect work, travel or caring responsibilities?",
          "Can I receive the proposed plan, exclusions and consent information before deciding?",
        ],
      },
      {
        heading: "Do not let logistics decide for you",
        paragraphs: [
          "A booked flight or an expiring offer is not a clinical reason to proceed. If key questions remain unanswered, seek a second opinion or pause. This guide is a preparation aid, not a substitute for the clinician's explanation of your individual risks or local consent requirements.",
        ],
      },
    ],
    sources: [sources.cdc, sources.acs],
  },
  {
    id: "working-with-organizers",
    title: "Know what a travel organizer is responsible for",
    category: "Planning",
    readMinutes: 3,
    summary:
      "Clarify referrals, commissions, logistics and separate contracts before paying an intermediary.",
    sections: [
      {
        heading: "Map each participant",
        paragraphs: [
          "A travel organizer may arrange transport, interpretation or introductions without providing clinical care. Ask which organization supplies each service and who has authority to make medical decisions. A coordinator's reassurance cannot replace an assessment by the treating clinician.",
          "Request the organizer's actual business identity and its relationship to the facility. Ask whether it receives referral fees, which providers it considers, and whether you can contact the clinician directly. An introduction does not establish that the organizer independently checked credentials.",
        ],
      },
      {
        heading: "Get responsibilities in writing",
        paragraphs: [
          "Keep the clinical agreement separate from travel arrangements. Read each contract before paying, including where concerns can be raised and what happens if one part of a package fails.",
        ],
        bullets: [
          "Which charges belong to the clinic, the organizer, accommodation and transport?",
          "Who handles cancellation, refunds or changes after an in-person assessment?",
          "What support is actually available outside scheduled appointments, and who provides emergency care?",
          "Who can access your records, for what purpose, and can you arrange a direct clinical transfer instead?",
          "If the organizer stops operating, which reservations and care arrangements remain valid?",
        ],
      },
      {
        heading: "Understand this directory's role",
        paragraphs: [
          "AbroadMedClub's operator inbox receives directory questions; it is not a travel organizer booking desk or a clinic communication channel. A listing is not evidence of a commercial partnership. Legal protections and routes for compensation depend on the applicable contracts and jurisdictions; obtain qualified local advice if you need help interpreting them.",
        ],
      },
    ],
    sources: [sources.cdc, sources.acs],
  },
  {
    id: "itemized-costs-and-financing",
    title: "Build an itemized budget before discussing finance",
    category: "Costs",
    readMinutes: 3,
    summary:
      "Compare like-for-like quotes and understand borrowing terms without assuming advertised savings.",
    sections: [
      {
        heading: "Ask what the quote actually buys",
        paragraphs: [
          "Request a dated, written estimate in its original currency, naming the clinician or facility and the proposed scope. An initial estimate may change after clinical assessment. Ask when it expires and which items are fixed, estimated or excluded; do not compare package headlines as if their contents were identical.",
        ],
        bullets: [
          "Assessment, tests, procedure, anesthesia, facility stay, implants or devices where applicable.",
          "Medicines, interpretation, scheduled follow-up, rehabilitation and records or translation charges.",
          "Flights, accommodation, local transport, companion costs and lost earnings.",
          "Additional nights, unplanned treatment, complication management and a possible return visit.",
        ],
      },
      {
        heading: "Read the payment and refund conditions",
        paragraphs: [
          "Check the payee's identity independently before transferring funds. Ask about deposit timing, cancellation, a change in candidacy or treatment plan, and who refunds each part of a package. Keep dated invoices and correspondence. Exchange rates and bank fees can change the amount you pay even when the quoted price is unchanged.",
          "Do not assume an insurer or your home health service will pay later. Obtain a coverage decision before treating a possible reimbursement as part of your available budget.",
        ],
      },
      {
        heading: "Borrowing is a separate decision",
        paragraphs: [
          "For any proposed loan or medical credit product, request the full repayment schedule, interest rate or APR, fees, promotional end date and consequences of late payment. Compare the total repayable amount, not only the monthly installment. Ask what happens to the debt if treatment is cancelled or disputed.",
          "The CFPB source below explains US credit terminology; rules elsewhere may differ. This directory does not arrange financing, assess affordability or recommend a lender. A qualified financial adviser or local consumer service can help you evaluate terms independently of the seller.",
        ],
      },
    ],
    sources: [sources.cdc, sources.insurance, sources.credit],
  },
  {
    id: "insurance-and-coverage",
    title: "Check coverage for the trip you are actually taking",
    category: "Costs",
    readMinutes: 3,
    summary:
      "Planned treatment, emergencies, cancellation and evacuation are different insurance questions.",
    sections: [
      {
        heading: "Name the purpose of travel",
        paragraphs: [
          "Tell the insurer you are considering travel for planned medical care. Ordinary holiday cover or coverage for unexpected illness is not evidence that the planned procedure, or complications related to it, will be paid for. Ask the insurer to identify the applicable wording and provide its answer in writing.",
          "CDC distinguishes domestic health cover, travel disruption, travel health and medical evacuation insurance. A product combining several benefits can still have exclusions, authorization requirements or limits relevant to your trip.",
        ],
      },
      {
        heading: "Work through specific scenarios",
        paragraphs: [
          "Avoid asking only whether you are covered abroad. Describe the destination, dates, proposed treatment and any relevant information the insurer requests through its own appropriate channel.",
        ],
        bullets: [
          "Is the planned assessment or procedure covered, and is prior authorization required?",
          "Are treatment-related complications covered abroad and after I return?",
          "Who pays initially, what evidence is required, and is reimbursement subject to a deductible or limit?",
          "If I cannot travel home as booked, which extra transport or accommodation costs are covered?",
          "Who decides whether evacuation is medically necessary, and to which facility or country?",
          "What disclosures, exclusions and claim deadlines apply?",
        ],
      },
      {
        heading: "Plan around confirmed coverage only",
        paragraphs: [
          "Keep policy details and assistance contacts accessible during travel, along with a plan for costs you may have to pay directly. Obtain invoices and clinical documentation through the treating team for any claim. Coverage is determined by your policy and insurer, not by a directory listing or an informal quote. The CDC resource uses US examples; consult the insurer and relevant local consumer authority for your situation.",
        ],
      },
    ],
    sources: [sources.insurance, sources.cdc],
  },
  {
    id: "travel-preparation",
    title: "Prepare the journey without prescribing your recovery",
    category: "Planning",
    readMinutes: 3,
    summary:
      "Coordinate travel advice, medicines, documents and flexible arrangements before departure.",
    sections: [
      {
        heading: "Start early with the right professionals",
        paragraphs: [
          "Discuss travel and planned treatment with your usual clinician and a travel medicine professional where appropriate. They can assess your circumstances and destination-specific needs. This directory cannot decide vaccination requirements, medication changes or whether you are fit to fly.",
          "Do not build a return itinerary from someone else's recovery story. Confirm a review plan with the treating team and ask the airline about any required medical documentation or assistance. Leave room to change travel if your clinician advises it.",
        ],
      },
      {
        heading: "Check medicines across the whole route",
        paragraphs: [
          "A medicine that is lawful at home may be restricted at a destination or transit point. Check current requirements with the relevant official authorities, including any advance permission or quantity limit. A prescription alone does not necessarily authorize importation.",
          "Ask the prescriber about documentation, supply for possible delays and storage needs. CDC recommends keeping medicines in original labelled packaging and accessible during the journey. Do not stop or substitute a prescribed medicine based on a travel website; ask your clinician.",
        ],
      },
      {
        heading: "Create a practical departure checklist",
        paragraphs: [
          "Keep essential contacts and travel details accessible if your phone fails. Share logistics with a trusted person if you wish, using only the information they need.",
        ],
        bullets: [
          "Passport, relevant visa or entry permission, transit requirements and current government advice.",
          "Written appointment details, confirmed accommodation and transport suitable for your needs.",
          "Insurance documentation, assistance contacts and a plan for unexpected costs.",
          "Clinician-agreed follow-up arrangements, record transfer and emergency contacts at the destination.",
          "Carrier confirmation for equipment, assistance or any required medical forms.",
        ],
      },
    ],
    sources: [
      sources.cdc,
      sources.medicines,
      sources.travel,
      sources.accessibility,
    ],
  },
  {
    id: "medical-records-and-handover",
    title: "Plan the records handover before treatment",
    category: "Aftercare",
    readMinutes: 3,
    summary:
      "Agree what your next clinician will need and transfer it through a suitable clinical channel.",
    sections: [
      {
        heading: "Arrange continuity before departure",
        paragraphs: [
          "Ask your home clinician whether they can provide the follow-up being proposed and what information they need. Do not assume they can take over a specialist procedure or prescribe unfamiliar treatment. Arrange any required appointments and clarify fees before travel.",
          "Ask the overseas facility how you can obtain a complete copy of your records before leaving, what language they are supplied in, and whether translation or release fees apply. An appointment receipt is not a clinical handover.",
        ],
      },
      {
        heading: "Request a useful record set",
        paragraphs: [
          "The exact documents depend on the care received; agree the list with the clinicians rather than collecting only a marketing summary.",
        ],
        bullets: [
          "Assessment, consent documentation and relevant test results or imaging with their reports.",
          "Procedure or operation report, anesthesia record where relevant, and discharge summary.",
          "Medicines with generic names, instructions and the prescribing clinician's details.",
          "Device or implant identification where applicable, and information on any complication or change of plan.",
          "Written follow-up instructions and a clinical contact for questions from the receiving team.",
        ],
      },
      {
        heading: "Share deliberately",
        paragraphs: [
          "Confirm the recipient and the clinical service's secure transfer method before sending sensitive files. Keep an accessible copy for your own care while protecting it from unnecessary access. Ask how translations will be checked if the receiving clinician needs another language.",
          "AbroadMedClub does not accept uploads or store a medical record for you. Directory inquiries, support forms, local trip plans and example chats are not suitable record-transfer channels. When seeking care after returning, tell the clinician where and when you were treated and provide the relevant records.",
        ],
      },
    ],
    sources: [sources.acs, sources.cdc, sources.insurance],
  },
  {
    id: "aftercare-and-complications",
    title: "Make an aftercare plan that survives a change of plans",
    category: "Aftercare",
    readMinutes: 3,
    summary:
      "Identify clinical responsibility, urgent-care routes and the practical cost of unexpected recovery needs.",
    sections: [
      {
        heading: "Ask who takes over, and when",
        paragraphs: [
          "A follow-up promise is only useful when you know who provides it, where it happens, how to contact the service and what it costs. Agree arrangements with both the treating team and any clinician expected to care for you at home. Ask how they will communicate if there is uncertainty.",
          "Clarify what the team will review before you leave, which follow-up visits are required and whether remote contact is appropriate for each stage. A coordinator's message cannot replace an examination when one is needed.",
        ],
      },
      {
        heading: "Get individualized escalation instructions",
        paragraphs: [
          "Before discharge, ask your treating clinician to explain what to expect, what changes require a call, and what needs urgent assessment. Have those instructions in a language you understand, together with the local emergency route and a backup if the clinic cannot be reached.",
          "If you suspect a complication, seek medical care promptly rather than waiting for a directory reply or your flight home. In an emergency, use local emergency services. This article cannot diagnose symptoms or provide a universal warning-sign checklist for every procedure.",
        ],
        bullets: [
          "Who can assess a problem at the destination and after you return?",
          "Which costs are included, which are not, and what has the insurer confirmed?",
          "Who helps arrange a longer stay, changed travel or additional clinical care?",
          "What records should accompany you, and how can the next clinician contact the treating team?",
        ],
      },
      {
        heading: "Keep travel separate from clinical clearance",
        paragraphs: [
          "Do not use a package's departure date as evidence that travel or leisure activities are appropriate. Ask the clinician about your actual itinerary, activity and recovery needs, and confirm carrier requirements. On return, tell any clinician you consult about overseas treatment and travel, even if you are not sure the new concern is related.",
        ],
      },
    ],
    sources: [sources.cdc, sources.acs, sources.insurance],
  },
  {
    id: "accreditation-and-regulation",
    title: "Understand what accreditation can—and cannot—tell you",
    category: "Safety",
    readMinutes: 3,
    summary:
      "Distinguish facility licensing, professional registration, accreditation and directory source checks.",
    sections: [
      {
        heading: "Four different checks",
        paragraphs: [
          "Facility permission to operate, a professional's registration, a voluntary accreditation scheme and a directory's editorial review answer different questions. Do not treat them as interchangeable. An accreditation badge may apply to a particular site or service, while a doctor's permission to practise is governed by the relevant professional rules.",
          "A source-checked directory entry means information was supported by the stated public source at the time checked. It does not mean the directory inspected the facility, audited outcomes or verified that care is safe for you.",
        ],
      },
      {
        heading: "Examine the scope and date",
        paragraphs: [
          "If a provider claims accreditation, request the issuing organization, exact accredited entity, scope, validity dates and a record you can check with the issuer. Ask about a mismatch in names or locations. Accreditation does not guarantee a good clinical outcome, and standards differ across schemes and countries.",
        ],
        bullets: [
          "Which regulator authorizes this facility and this professional for the intended service?",
          "Does the evidence refer to this branch, this specialty and the current period?",
          "Are there public inspection findings or registration conditions that need explanation?",
          "What complaint and incident-reporting routes apply to an international patient?",
          "What rules apply to the specific treatment, medicines or devices being proposed?",
        ],
      },
      {
        heading: "Do not infer legal protection",
        paragraphs: [
          "The ability to complain, obtain records or pursue compensation depends on the destination, contract and circumstances. An international badge is not an assurance that your home country's remedies apply abroad. Seek qualified advice in the relevant jurisdiction for a legal decision. The UK regulator links below illustrate official records for their own jurisdictions, not rules for every country.",
        ],
      },
    ],
    sources: [sources.cdc, sources.acs, sources.gmc, sources.cqc],
  },
  {
    id: "accessible-medical-travel",
    title: "Check accessibility from your front door to follow-up",
    category: "Planning",
    readMinutes: 3,
    summary:
      "Replace a generic accessible label with written answers about your actual journey and support needs.",
    sections: [
      {
        heading: "Describe what you need, not just a label",
        paragraphs: [
          "Accessibility can differ between countries, buildings and transport operators. A hotel marked accessible may not have the transfer space, equipment or communication support you need. Confirm details directly with each service and request written answers before paying.",
          "Consider your likely needs after treatment as well as your usual needs. Ask your clinician what may change; do not assume a companion can provide personal or clinical care without the right skills or equipment.",
        ],
      },
      {
        heading: "Check each connection",
        paragraphs: [
          "Include your departure point, terminal, transit stops, arrival transport, accommodation, clinic and return journey. A single inaccessible transfer can undermine the rest of the plan.",
        ],
        bullets: [
          "Confirm step-free routes, lift and doorway dimensions, bathroom layout and transfer arrangements where relevant.",
          "Ask carriers about boarding assistance, onboard toilets and handling of mobility equipment, batteries or other devices.",
          "Confirm communication preferences, interpretation, hearing or visual support, and accessible clinical information.",
          "Ask who supplies any needed hoist, suitable bed, personal assistance or accessible vehicle and what it costs.",
          "Check backup arrangements if equipment is damaged, transport changes or you need to stay longer.",
        ],
      },
      {
        heading: "Confirm rather than assume",
        paragraphs: [
          "Reconfirm arrangements before departure, keep the written details available and identify who to contact if something is missing. Ask your carrier and relevant authority about rights and notice requirements for your route; rules are not universal. The FCDO guidance below is written for UK travelers and includes practical questions, but does not verify accessibility at any listing in this directory.",
        ],
      },
    ],
    sources: [sources.accessibility, sources.cdc],
  },
];
