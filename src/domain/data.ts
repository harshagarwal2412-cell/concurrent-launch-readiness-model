import type { Item, MarketId, Market, Workstream } from "./types";

export const WORKSTREAMS: Workstream[] = [
  { id: "payer", label: "Payer contract and data" },
  { id: "legal", label: "Licensure and credentialing" },
  { id: "staff", label: "Clinical staffing" },
  { id: "train", label: "Training and onboarding" },
  { id: "tools", label: "Platform configuration" },
  { id: "vendor", label: "Vendors and supply" },
  { id: "flow", label: "Workflows and documentation" },
  { id: "golive", label: "Go-live and stabilization" },
];

export const MARKETS: Record<MarketId, Market> = {
  mi: { name: "Michigan", short: "MI", note: "Detroit, Grand Rapids and Lansing" },
  ca: { name: "California", short: "CA", note: "Los Angeles" },
};

/**
 * Readiness dependencies for launching in-home and virtual oncology care in a new state.
 * lead    = days before go-live the item must START (negative = after go-live)
 * dur     = working estimate of duration in days
 * central = owned by a shared function that serves both launches
 * notes   = market-specific caveats
 */
export const ITEMS: Item[] = [
  { id: "p1", ws: "payer", name: "Contract executed with performance terms and attribution logic agreed", owner: "Payer Growth", lead: 210, dur: 60, central: false },
  { id: "p2", ws: "payer", name: "Eligibility and claims file specification agreed, test file exchanged", owner: "Clinical Ops", lead: 150, dur: 45, central: true, notes: { ca: "Two payers on different file formats doubles this." } },
  { id: "p3", ws: "payer", name: "Attributed patient panel received and reconciled against oncology practice rosters", owner: "Clinical Ops", lead: 90, dur: 30, central: true },
  { id: "p4", ws: "payer", name: "Quality and total-cost measures mapped to an internal KPI with a named owner", owner: "Clinical Ops", lead: 75, dur: 25, central: true },
  { id: "p5", ws: "payer", name: "Joint operating committee cadence and escalation contacts set with the plan", owner: "Market Ops", lead: 45, dur: 15, central: false },
  { id: "l1", ws: "legal", name: "Entity, corporate practice structure and capital requirements confirmed for the state", owner: "Legal", lead: 200, dur: 70, central: true, notes: { ca: "California corporate practice of medicine rules make this the longest single item." } },
  { id: "l2", ws: "legal", name: "Professional liability coverage extended to the state and to home visits", owner: "Legal", lead: 140, dur: 40, central: true },
  { id: "l3", ws: "legal", name: "NP scope, supervision or collaboration requirements confirmed and documented", owner: "Legal", lead: 150, dur: 45, central: true, notes: { ca: "Differs materially from Michigan. Confirm before posting clinician roles, not after." } },
  { id: "l4", ws: "legal", name: "Clinician state licenses verified, including compact eligibility where it applies", owner: "People Ops", lead: 120, dur: 60, central: true },
  { id: "l5", ws: "legal", name: "Payer credentialing and delegated roster submitted", owner: "Credentialing", lead: 120, dur: 75, central: true },
  { id: "l6", ws: "legal", name: "Controlled substance registrations in place for prescribing clinicians", owner: "Credentialing", lead: 100, dur: 45, central: true },
  { id: "l7", ws: "legal", name: "Behavioral health licensure and supervision path confirmed for the state", owner: "Legal", lead: 110, dur: 40, central: true },
  { id: "l8", ws: "legal", name: "Business associate agreements signed with every vendor touching patient data", owner: "Legal", lead: 70, dur: 30, central: true },
  { id: "s1", ws: "staff", name: "Market dyad hired: medical director and market operations leader", owner: "Recruiting", lead: 180, dur: 90, central: false },
  { id: "s2", ws: "staff", name: "Panel-size assumption set and staffing ramp modelled against enrollment curve", owner: "Clinical Ops", lead: 135, dur: 30, central: true },
  { id: "s3", ws: "staff", name: "First cohort hired: nurse practitioners, RN care managers, health partners, social work", owner: "Recruiting", lead: 105, dur: 75, central: false },
  { id: "s4", ws: "staff", name: "Geographic coverage plan for home visits, including drive-time and after-hours zones", owner: "Market Ops", lead: 80, dur: 30, central: false, notes: { mi: "Three metros means three coverage plans, not one." } },
  { id: "s5", ws: "staff", name: "24/7 on-call rota built and the escalation tree tested end to end", owner: "Clinical Ops", lead: 45, dur: 25, central: true },
  { id: "s6", ws: "staff", name: "Backfill and surge plan for the first sixty days of enrollment", owner: "Market Ops", lead: 40, dur: 20, central: false },
  { id: "t1", ws: "train", name: "Care model standards localised to state rules and local provider landscape", owner: "Clinical Ops", lead: 110, dur: 40, central: true },
  { id: "t2", ws: "train", name: "Onboarding curriculum and training calendar sequenced against hire start dates", owner: "L&D", lead: 90, dur: 35, central: true, notes: { ca: "Same L&D owner is running the other market in the same weeks." } },
  { id: "t3", ws: "train", name: "Subject matter experts confirmed and released from clinical time to teach", owner: "L&D", lead: 65, dur: 25, central: true },
  { id: "t4", ws: "train", name: "Cohort one completes onboarding and is signed off for patient contact", owner: "L&D", lead: 35, dur: 30, central: true },
  { id: "t5", ws: "train", name: "Documentation and coding training delivered, including risk capture at the visit", owner: "Clinical Ops", lead: 30, dur: 20, central: true },
  { id: "t6", ws: "train", name: "Shadowing and precepting plan with the live market arranged", owner: "Clinical Ops", lead: 45, dur: 25, central: true },
  { id: "o1", ws: "tools", name: "State, market and program configured in the care platform", owner: "Product", lead: 100, dur: 40, central: true },
  { id: "o2", ws: "tools", name: "Care plan templates, assessments and note types built for the service line", owner: "Product", lead: 85, dur: 40, central: true },
  { id: "o3", ws: "tools", name: "Task routing and work queues configured per role, not per person", owner: "Product", lead: 70, dur: 30, central: true },
  { id: "o4", ws: "tools", name: "Scheduling configured for home visits, virtual visits and travel time", owner: "Product", lead: 70, dur: 30, central: true },
  { id: "o5", ws: "tools", name: "Telephony, secure fax and inbound patient line provisioned and routed", owner: "IT", lead: 60, dur: 25, central: true },
  { id: "o6", ws: "tools", name: "Provider data and referral source directory loaded for the market", owner: "Clinical Ops", lead: 55, dur: 25, central: true },
  { id: "o7", ws: "tools", name: "Operational dashboard live with enrollment, contact rate and visit completion", owner: "Product", lead: 45, dur: 30, central: true },
  { id: "o8", ws: "tools", name: "Role permissions, device provisioning and access review for new hires", owner: "IT", lead: 35, dur: 20, central: true },
  { id: "v1", ws: "vendor", name: "Interpretation and translation vendor contracted for the market language mix", owner: "Market Ops", lead: 90, dur: 35, central: false, notes: { ca: "Los Angeles language mix is wider than Rhode Island. Check coverage, not just contract." } },
  { id: "v2", ws: "vendor", name: "Lab, imaging and records release pathways established with local systems", owner: "Market Ops", lead: 85, dur: 40, central: false },
  { id: "v3", ws: "vendor", name: "Durable medical equipment and home supply routes confirmed", owner: "Market Ops", lead: 70, dur: 30, central: false },
  { id: "v4", ws: "vendor", name: "Courier, specimen handling and medical waste disposal set up", owner: "Market Ops", lead: 60, dur: 25, central: false },
  { id: "v5", ws: "vendor", name: "Hub or workspace secured where the model needs physical space", owner: "Market Ops", lead: 120, dur: 60, central: false },
  { id: "v6", ws: "vendor", name: "Community resource directory built by county, not by state", owner: "Market Ops", lead: 60, dur: 35, central: false, notes: { mi: "Detroit, Grand Rapids and Lansing share almost no local resources." } },
  { id: "v7", ws: "vendor", name: "Home visit safety protocol and field staff support line in place", owner: "Clinical Ops", lead: 50, dur: 25, central: true },
  { id: "f1", ws: "flow", name: "Referral intake path agreed with oncology practices and written down", owner: "Market Ops", lead: 90, dur: 40, central: false },
  { id: "f2", ws: "flow", name: "Enrollment and consent workflow documented, including the outreach script", owner: "Clinical Ops", lead: 80, dur: 35, central: true },
  { id: "f3", ws: "flow", name: "Handoffs mapped between engagement, care team and health partner", owner: "Clinical Ops", lead: 70, dur: 30, central: true },
  { id: "f4", ws: "flow", name: "Symptom escalation and after-hours triage pathway documented and rehearsed", owner: "Clinical Ops", lead: 60, dur: 30, central: true },
  { id: "f5", ws: "flow", name: "Documentation standard set so a note serves care, quality and risk capture at once", owner: "Clinical Ops", lead: 55, dur: 25, central: true },
  { id: "f6", ws: "flow", name: "Case conference and huddle cadence defined with an owner per meeting", owner: "Market Ops", lead: 35, dur: 15, central: false },
  { id: "f7", ws: "flow", name: "Patient-facing materials reviewed for reading level and translated", owner: "Marketing", lead: 55, dur: 30, central: true },
  { id: "g1", ws: "golive", name: "End-to-end dry run on test patients across every system and handoff", owner: "Clinical Ops", lead: 25, dur: 15, central: true },
  { id: "g2", ws: "golive", name: "Go, no-go criteria agreed in writing with a named decision owner", owner: "Clinical Ops", lead: 21, dur: 10, central: true },
  { id: "g3", ws: "golive", name: "Daily stabilization stand-up running with a live issue log", owner: "Market Ops", lead: 7, dur: 30, central: false },
  { id: "g4", ws: "golive", name: "KPI ownership confirmed for every launch metric before the first patient", owner: "Clinical Ops", lead: 14, dur: 10, central: true },
  { id: "g5", ws: "golive", name: "Day-thirty review scheduled and learnings written into the launch playbook", owner: "Clinical Ops", lead: -21, dur: 20, central: true },
];
