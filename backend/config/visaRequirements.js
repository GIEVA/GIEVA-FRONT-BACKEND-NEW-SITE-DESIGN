// config/visaRequirements.js
// Single source of truth for: which fields the form accepts (mass-assignment protection),
// how they are cleaned, and what must be present before the applicant is allowed to pay.

export const DOCUMENT_TYPES = {
  passportPhoto: { label: "Passport photograph (2x2, white background)", mimes: ["image/jpeg", "image/png"] },
  i20: { label: "I-20 document", mimes: ["application/pdf", "image/jpeg", "image/png"] },
  passportBio: { label: "Bio-data page of international passport", mimes: ["application/pdf", "image/jpeg", "image/png"] },
};
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// ── tiny cleaners ──
const str = (v, max = 200) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "");
const oneOf = (v, list) => (list.includes(v) ? v : "");
const bool = (v) => v === true || v === "true";
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const date = (v) => {
  if (typeof v !== "string" || !ISO.test(v)) return "";
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? "" : v;
};
const arr = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const money = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 && n < 1e12 ? n : "";
};

const person = (o) => ({ lastName: str(o.lastName, 80), otherNames: str(o.otherNames, 120), phone: str(o.phone, 40), email: str(o.email, 160).toLowerCase() });

const job = (o) => ({
  status: oneOf(o.status, ["employed", "unemployed"]),
  organizationName: str(o.organizationName, 160),
  organizationAddress: str(o.organizationAddress, 300),
  jobDescription: str(o.jobDescription, 400),
  supervisorLastName: str(o.supervisorLastName, 80),
  supervisorOtherNames: str(o.supervisorOtherNames, 120),
  monthlyIncome: money(o.monthlyIncome),
  organizationPhone: str(o.organizationPhone, 40),
  fromDate: date(o.fromDate),
  toDate: date(o.toDate),
});

// Whitelist + clean. Anything not listed here can never be written by an applicant
// (status, fee, userId, applicationCode, documents... are server-controlled).
export const sanitizeDraft = (b = {}) => {
  const out = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(b, k);

  if (has("interviewLocation")) out.interviewLocation = oneOf(b.interviewLocation, ["abuja", "lagos"]) || null;
  if (has("appointmentType")) out.appointmentType = oneOf(b.appointmentType, ["normal", "expedited"]) || "normal";
  if (has("firstName")) out.firstName = str(b.firstName, 80);
  if (has("middleName")) out.middleName = str(b.middleName, 80);
  if (has("lastName")) out.lastName = str(b.lastName, 80);
  if (has("gender")) out.gender = oneOf(b.gender, ["male", "female"]) || null;
  if (has("dateOfBirth")) out.dateOfBirth = date(b.dateOfBirth) || null;
  if (has("phone")) out.phone = str(b.phone, 40);
  if (has("altPhone")) out.altPhone = str(b.altPhone, 40);
  if (has("address")) out.address = str(b.address, 400);
  if (has("email")) out.email = str(b.email, 160).toLowerCase();

  if (has("travelHistory"))
    out.travelHistory = arr(b.travelHistory, 3).map((t) => ({ country: str(obj(t).country, 80), from: date(obj(t).from), to: date(obj(t).to) }));

  if (has("tripSponsor")) {
    const o = obj(b.tripSponsor);
    out.tripSponsor = { type: oneOf(o.type, ["parent", "relative", "other"]), ...person(o) };
  }
  if (has("educationSponsor")) {
    const o = obj(b.educationSponsor);
    out.educationSponsor = {
      type: oneOf(o.type, ["parent", "relative", "other"]),
      ...person(o),
      onScholarship: bool(o.onScholarship),
      scholarshipAmountUsd: bool(o.onScholarship) ? money(o.scholarshipAmountUsd) : "",
    };
  }
  if (has("currentJob")) out.currentJob = job(obj(b.currentJob));
  if (has("previousJob")) out.previousJob = job(obj(b.previousJob));
  const parent = (o) => ({ lastName: str(o.lastName, 80), firstName: str(o.firstName, 80), dateOfBirth: date(o.dateOfBirth), email: str(o.email, 160).toLowerCase() });
  if (has("father")) out.father = parent(obj(b.father));
  if (has("mother")) out.mother = parent(obj(b.mother));

  if (has("schools"))
    out.schools = arr(b.schools, 2).map((s) => {
      const o = obj(s);
      return { name: str(o.name, 160), address: str(o.address, 300), from: date(o.from), to: date(o.to), phone: str(o.phone, 40), email: str(o.email, 160).toLowerCase(), certificate: str(o.certificate, 160) };
    });
  if (has("awards"))
    out.awards = arr(b.awards, 3).map((a) => ({ name: str(obj(a).name, 200), dateObtained: date(obj(a).dateObtained) }));
  if (has("volunteer"))
    out.volunteer = arr(b.volunteer, 3).map((v) => ({ organization: str(obj(v).organization, 200), from: date(obj(v).from), to: date(obj(v).to) }));
  if (has("usRelatives"))
    out.usRelatives = arr(b.usRelatives, 3).map((r) => {
      const o = obj(r);
      return { lastName: str(o.lastName, 80), otherNames: str(o.otherNames, 120), relationship: str(o.relationship, 80), stateOfResidence: str(o.stateOfResidence, 80) };
    });
  if (has("social")) {
    const o = obj(b.social);
    out.social = { facebook: str(o.facebook, 200), instagram: str(o.instagram, 200), twitter: str(o.twitter, 200), linkedin: str(o.linkedin, 200) };
  }
  if (has("references"))
    out.references = arr(b.references, 2).map((r) => {
      const o = obj(r);
      return { lastName: str(o.lastName, 80), otherNames: str(o.otherNames, 120), email: str(o.email, 160).toLowerCase(), phone: str(o.phone, 40), address: str(o.address, 300) };
    });
  if (b.acceptTerms === true) out.consentAcceptedAt = new Date();
  if (b.acceptTerms === false) out.consentAcceptedAt = null;
  return out;
};

// ── completeness: what must be true before payment is allowed ──
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getMissingFields = (a) => {
  const m = [];
  const need = (v, label) => { if (v === undefined || v === null || String(v).trim() === "") m.push(label); };

  need(a.interviewLocation, "Interview location");
  need(a.firstName, "First name");
  need(a.lastName, "Last name");
  need(a.gender, "Gender");
  need(a.dateOfBirth, "Date of birth");
  if (a.dateOfBirth && new Date(a.dateOfBirth) >= new Date()) m.push("Date of birth must be in the past");
  need(a.phone, "Phone number");
  need(a.address, "Residential address");
  if (!EMAIL.test(a.email || "")) m.push("A valid email address");

  const ts = a.tripSponsor || {};
  need(ts.type, "Who is paying for your trip");
  need(ts.lastName, "Trip sponsor's last name");
  const es = a.educationSponsor || {};
  need(es.type, "Who is paying for your education");
  need(es.lastName, "Education sponsor's last name");

  const cj = a.currentJob || {};
  need(cj.status, "Current job status");
  if (cj.status === "employed") {
    need(cj.organizationName, "Current organization name");
    need(cj.jobDescription, "Current job description");
    need(cj.monthlyIncome, "Current monthly income");
  }

  need(a.father?.lastName, "Father's last name");
  need(a.father?.firstName, "Father's first name");
  need(a.mother?.lastName, "Mother's last name");
  need(a.mother?.firstName, "Mother's first name");

  if (!(a.schools || []).some((s) => s.name)) m.push("At least one school attended");

  const refs = a.references || [];
  [0, 1].forEach((i) => {
    const r = refs[i] || {};
    if (!r.lastName || !r.phone || !EMAIL.test(r.email || "")) m.push(`Reference ${i + 1} (name, phone and valid email)`);
  });
  return m;
};

export const getMissingDocuments = (a) =>
  Object.entries(DOCUMENT_TYPES)
    .filter(([key]) => !a.documents?.[key]?.url)
    .map(([, d]) => d.label);

export const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  info_required: "More information required",
  interview_scheduled: "Interview scheduled",
  approved: "Approved",
  rejected: "Not approved",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Which transitions an admin may make (prevents nonsense like draft → approved, or editing a closed file).
export const ALLOWED_TRANSITIONS = {
  submitted: ["under_review", "info_required", "interview_scheduled", "rejected", "cancelled"],
  under_review: ["info_required", "interview_scheduled", "approved", "rejected", "cancelled"],
  info_required: ["under_review", "interview_scheduled", "rejected", "cancelled"],
  interview_scheduled: ["under_review", "info_required", "approved", "rejected", "completed", "cancelled"],
  approved: ["completed", "under_review"],
  rejected: ["under_review"],
  completed: [],
  cancelled: [],
  draft: [],
};
