import {
  Box, Typography, TextField, Button, Card, CardContent, MenuItem, Stack, Divider,
  Alert, CircularProgress, IconButton, Checkbox, FormControlLabel, FormGroup, Chip, ListSubheader,
} from "@mui/material";

import Grid from "@mui/material/GridLegacy";

import { CloudUpload, Save, Payment, InsertDriveFile, Delete, CheckCircle } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createHealsApplication, saveHealsProgress, getHealsApplicationById,
} from "../services/healsApplicationService";
import { startHealsCheckout } from "../services/healsPaymentService";
import {
  HEALS_REQUIREMENTS, ALL_DOC_FIELDS, DEGREE_PROGRAMS, COUNTRIES, STUDY_AREAS, INTAKES,
  LANGUAGES, BUDGETS, INCOME_DOCS, FINANCIAL_NEEDS, QUALIFICATIONS, GRADE_SCALES, TEST_TYPES,
  categoryFromProgram, getMissingFields,
} from "../config/healsRequirements";

import { startHealsCheckout, getHealsFee } from "../services/healsPaymentService";

const BRAND = "#0B1F3A";
const MAX_FILE_SIZE = 2 * 1024 * 1024;
// const FEE = Number(process.env.REACT_APP_HEALS_FEE) || null; // display only; the server decides the real amount
const YEARS = Array.from({ length: 50 }, (_, i) => String(new Date().getFullYear() + 5 - i));

const ARRAY_KEYS = ["desiredCountries", "studyAreas", "intakePeriods", "mediumOfInstruction", "incomeDocuments"];
const DATE_KEYS  = ["dob", "passportIssueDate", "passportExpiryDate", "testDate"];

const emptyForm = {
  // basic
  degreeProgram: "", degreeProgramOther: "",
  desiredCountries: [], desiredCountryOther: "", fieldOfStudy: "",
  firstChoice: "", secondChoice: "", thirdChoice: "", fourthChoice: "",
  studyAreas: [], studyAreaOther: "", intakePeriods: [], mediumOfInstruction: [], mediumOther: "",
  // personal
  lastName: "", firstName: "", middleName: "", dob: "", gender: "", maritalStatus: "",
  passportNumber: "", passportIssueDate: "", passportExpiryDate: "", hasVisa: "",
  address: "", phone: "", email: "",
  // high school
  highSchool: "", highSchoolAddress: "", highSchoolStartYear: "", highSchoolEndYear: "",
  certificateObtained: "", examinationBody: "", waecCreditCount: "",
  // university
  universityAttended: "", universityAddress: "", universityWebsite: "", universityEmail: "",
  universityPhone: "", universityStartYear: "", universityEndYear: "", degreeReceived: "",
  // highest qualification
  highestQualification: "", qualificationInstitution: "", qualificationCourse: "",
  qualificationGrade: "", gradeScale: "", graduationYear: "",
  // tests
  testType: "", testScoreValue: "", testDate: "",
  // financials
  budgetRange: "", incomeDocuments: [], financialNeeds: "",
  // profile
  awardsObtained: "", leadershipRoles: "", otherTalents: "", workExperience: "", innovations: "",
  studentNotes: "",
  // terms
  signatureName: "", agreedToTerms: false,
};

const SectionTitle = ({ children }) => (
  <Grid item xs={12}>
    <Typography variant="h6" fontWeight="bold" sx={{ color: BRAND }}>{children}</Typography>
    <Divider sx={{ mt: 1 }} />
  </Grid>
);

function CheckGroup({ label, options, values, onToggle }) {
  return (
    <Grid item xs={12}>
      <Typography fontWeight={700} fontSize={14}>{label} *</Typography>
      <FormGroup row>
        {options.map((o) => (
          <FormControlLabel key={o} label={o}
            control={<Checkbox size="small" checked={values.includes(o)} onChange={() => onToggle(o)} />} />
        ))}
      </FormGroup>
    </Grid>
  );
}

export default function HealsApplicationForm() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({});
  const [existingDocs, setExistingDocs] = useState({});
  const [applicationId, setApplicationId] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fee, setFee] = useState(null);

  useEffect(() => { getHealsFee().then(setFee).catch(() => {}); }, []);

const feeLabel = fee?.amount
  ? new Intl.NumberFormat("en-NG", { style: "currency", currency: fee.currency, maximumFractionDigits: 0 }).format(fee.amount)
  : "";

  const category = categoryFromProgram(form.degreeProgram);
  const docs = HEALS_REQUIREMENTS[category]?.documents || [];

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));
  const toggle = (name) => (value) =>
    setForm((f) => {
      const cur = f[name] || [];
      return { ...f, [name]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });

  // Small helpers to keep the JSX readable
  const text = (name, label, props = {}) => (
    <TextField fullWidth label={label} value={form[name]} onChange={set(name)} {...props} />
  );
  const select = (name, label, options, props = {}) => (
    <TextField fullWidth select label={label} value={form[name]} onChange={set(name)} {...props}>
      {options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
    </TextField>
  );
  const date = (name, label) => (
    <TextField fullWidth type="date" label={label} value={form[name]} onChange={set(name)}
      InputLabelProps={{ shrink: true }} />
  );

  const syncFromApplication = (app) => {
    setApplicationId(app.id);
    const saved = {};
    ALL_DOC_FIELDS.forEach((f) => { if (app[`${f}Url`]) saved[f] = app[`${f}Url`]; });
    setExistingDocs(saved);
    setFiles({});
  };

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await getHealsApplicationById(editId);
        const app = res.application || res;
        const next = { ...emptyForm };
        Object.keys(emptyForm).forEach((k) => {
          if (ARRAY_KEYS.includes(k)) next[k] = Array.isArray(app[k]) ? app[k] : [];
          else if (DATE_KEYS.includes(k)) next[k] = app[k] ? String(app[k]).slice(0, 10) : "";
          else if (k === "hasVisa") next[k] = app.hasVisa === true ? "true" : app.hasVisa === false ? "false" : "";
          else if (k === "agreedToTerms") next[k] = !!app.termsAcceptedAt;
          else next[k] = app[k] ?? "";
        });
        setForm(next);
        syncFromApplication(app);
      } catch (err) { console.error(err); }
    })();
  }, [editId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const field = e.target.name;
    if (!file) return;
    if (file.type !== "application/pdf") return setError("Documents must be PDF files");
    if (file.size > MAX_FILE_SIZE) return setError("File exceeds the 2MB limit");
    setError("");
    setFiles((prev) => ({ ...prev, [field]: file }));
  };
  const removeFile = (field) => setFiles((prev) => { const n = { ...prev }; delete n[field]; return n; });

  const buildFormData = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      fd.append(k, Array.isArray(v) ? JSON.stringify(v) : String(v ?? ""));
    });
    docs.forEach((d) => { if (files[d.field]) fd.append(d.field, files[d.field]); });
    return fd;
  };

  const persistDraft = async () => {
    const fd = buildFormData();
    const res = applicationId
      ? await saveHealsProgress(applicationId, fd)
      : await createHealsApplication(fd);
    syncFromApplication(res.application);
    return res.application.id;
  };

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true); setError(""); setSuccess("");
      await persistDraft();
      setSuccess("Draft saved. You can continue later from My Applications.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save draft");
    } finally { setSavingDraft(false); }
  };

  const handlePayAndSubmit = async () => {
    setError(""); setSuccess("");

    const missingFields = getMissingFields(form);
    if (missingFields.length) return setError(`Please complete: ${missingFields.join(", ")}`);

    const missingDocs = docs.filter((d) => d.required && !files[d.field] && !existingDocs[d.field]);
    if (missingDocs.length) return setError(`Please upload: ${missingDocs.map((d) => d.label).join(", ")}`);

    if (!form.agreedToTerms) return setError("Please accept the terms and conditions");

    try {
      setPaying(true);
      const id = await persistDraft();
      const res = await startHealsCheckout(id);
      window.location.assign(res.authorization_url);
    } catch (err) {
      const list = err.response?.data?.errors;
      setError(list?.length ? list.join(" • ") : err.response?.data?.message || "Could not start payment");
      setPaying(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" fontWeight="bold" mb={1}>HEALS Membership Application</Typography>
      <Typography color="text.secondary" mb={3}>Begin your international admissions journey</Typography>

      {/* ELIGIBILITY NOTE */}
      <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
        <Typography fontWeight={800} mb={1}>Eligibility requirements. Please read before applying.</Typography>
        <Grid container spacing={3}>
          {Object.entries(HEALS_REQUIREMENTS).map(([key, cfg]) => (
            <Grid item xs={12} md={6} key={key}>
              <Typography fontWeight={700}>{cfg.label} applicants</Typography>
              <ol style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                {cfg.documents.map((d) => (
                  <li key={d.field}>{d.label}{!d.required && <em> (optional)</em>}</li>
                ))}
              </ol>
            </Grid>
          ))}
        </Grid>
        <Typography variant="body2" mt={2}>
          <strong>How it works:</strong> complete the form, upload your documents and pay the HEALS enrolment
          fee{feeLabel ? ` (${feeLabel})` : ""}. Your application is submitted automatically once payment
          is confirmed. You can save a draft at any time and finish later.
        </Typography>
      </Alert>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Card sx={{ borderRadius: 5 }}>
        <CardContent>
          <Grid container spacing={3}>

            {/* ───────── BASIC INFORMATION ───────── */}
            <SectionTitle>Basic Information</SectionTitle>

            <Grid item xs={12} md={6}>
              <TextField fullWidth select required label="Degree program"
                value={form.degreeProgram} onChange={set("degreeProgram")}>
                {DEGREE_PROGRAMS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            {form.degreeProgram === "other" && (
              <Grid item xs={12} md={6}>{text("degreeProgramOther", "Other? Specify")}</Grid>
            )}

            <CheckGroup label="Desired country of study" options={COUNTRIES}
              values={form.desiredCountries} onToggle={toggle("desiredCountries")} />
            <Grid item xs={12}>{text("desiredCountryOther", "Other countries? Specify")}</Grid>

            <Grid item xs={12}>{text("fieldOfStudy", "Proposed specialty / major / field of study *")}</Grid>

            <Grid item xs={12}><Typography fontWeight={700} fontSize={14}>Choice of university (if available)</Typography></Grid>
            <Grid item xs={12} md={6}>{text("firstChoice", "First choice")}</Grid>
            <Grid item xs={12} md={6}>{text("secondChoice", "Second choice")}</Grid>
            <Grid item xs={12} md={6}>{text("thirdChoice", "Third choice")}</Grid>
            <Grid item xs={12} md={6}>{text("fourthChoice", "Fourth choice")}</Grid>

            <CheckGroup label="Anticipated area / course of study" options={STUDY_AREAS}
              values={form.studyAreas} onToggle={toggle("studyAreas")} />
            <Grid item xs={12}>{text("studyAreaOther", "Other area? Specify")}</Grid>

            <CheckGroup label="Anticipated period of resumption" options={INTAKES}
              values={form.intakePeriods} onToggle={toggle("intakePeriods")} />

            <CheckGroup label="Preferred medium of instruction" options={LANGUAGES}
              values={form.mediumOfInstruction} onToggle={toggle("mediumOfInstruction")} />
            <Grid item xs={12}>{text("mediumOther", "Other language? Specify")}</Grid>

            {/* ───────── PERSONAL DATA ───────── */}
            <SectionTitle>Personal Data</SectionTitle>

            <Grid item xs={12} md={4}>{text("lastName", "Last name", { required: true })}</Grid>
            <Grid item xs={12} md={4}>{text("firstName", "First name", { required: true })}</Grid>
            <Grid item xs={12} md={4}>{text("middleName", "Middle name")}</Grid>

            <Grid item xs={12} md={4}>{date("dob", "Date of birth (as in your international passport) *")}</Grid>
            <Grid item xs={12} md={4}>{select("gender", "Gender *", ["Female", "Male"])}</Grid>
            <Grid item xs={12} md={4}>{select("maritalStatus", "Marital status *", ["Single", "Married"])}</Grid>

            <Grid item xs={12} md={3}>{text("passportNumber", "International passport number *")}</Grid>
            <Grid item xs={12} md={3}>{date("passportIssueDate", "Passport issue date *")}</Grid>
            <Grid item xs={12} md={3}>{date("passportExpiryDate", "Passport expiration date *")}</Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth select label="Do you already have a student visa? *"
                value={form.hasVisa} onChange={set("hasVisa")}>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>{text("address", "Home address *", { multiline: true, rows: 2 })}</Grid>
            <Grid item xs={12} md={6}>{text("phone", "Valid phone number(s) *")}</Grid>
            <Grid item xs={12} md={6}>{text("email", "Email address *", { type: "email" })}</Grid>

            {/* ───────── EDUCATIONAL BACKGROUND ───────── */}
            <SectionTitle>Educational Background: High School</SectionTitle>

            <Grid item xs={12} md={6}>{text("highSchool", "High school attended *")}</Grid>
            <Grid item xs={12} md={6}>{text("highSchoolAddress", "High school address")}</Grid>
            <Grid item xs={6} md={3}>{select("highSchoolStartYear", "Attended from (year)", YEARS)}</Grid>
            <Grid item xs={6} md={3}>{select("highSchoolEndYear", "Attended to (year)", YEARS)}</Grid>
            <Grid item xs={12} md={3}>{text("certificateObtained", "Certificate obtained")}</Grid>
            <Grid item xs={12} md={3}>{text("examinationBody", "Examination body (WAEC, NECO...)")}</Grid>
            {category === "undergraduate" && (
              <Grid item xs={12} md={4}>
                {text("waecCreditCount", "Number of credits (min. 5) *", { type: "number", inputProps: { min: 0, max: 9 } })}
              </Grid>
            )}

            <SectionTitle>Colleges / University Attended (if applicable)</SectionTitle>
            <Grid item xs={12} md={6}>{text("universityAttended", "College / university attended")}</Grid>
            <Grid item xs={12} md={6}>{text("universityAddress", "Address")}</Grid>
            <Grid item xs={12} md={4}>{text("universityWebsite", "Website")}</Grid>
            <Grid item xs={12} md={4}>{text("universityEmail", "Email address", { type: "email" })}</Grid>
            <Grid item xs={12} md={4}>{text("universityPhone", "Official phone number(s)")}</Grid>
            <Grid item xs={6} md={3}>{select("universityStartYear", "Attended from (year)", YEARS)}</Grid>
            <Grid item xs={6} md={3}>{select("universityEndYear", "Attended to (year)", YEARS)}</Grid>
            <Grid item xs={12} md={6}>{text("degreeReceived", "Degree received")}</Grid>

            {/* ───────── HIGHEST QUALIFICATION ───────── */}
            <SectionTitle>Highest Qualification</SectionTitle>
            <Grid item xs={12} md={4}>{select("highestQualification", "Highest qualification *", QUALIFICATIONS)}</Grid>
            <Grid item xs={12} md={8}>{text("qualificationInstitution", "School / institution *")}</Grid>
            <Grid item xs={12} md={4}>{text("qualificationCourse", "Course / subject area")}</Grid>
            <Grid item xs={12} md={3}>{text("qualificationGrade", "Grade obtained * (e.g. 4.2, Second Class Upper)")}</Grid>
            <Grid item xs={12} md={3}>{select("gradeScale", "Grading scale *", GRADE_SCALES)}</Grid>
            <Grid item xs={12} md={2}>{select("graduationYear", "Year of graduation *", YEARS)}</Grid>

            <Grid item xs={12}>
              <Typography fontWeight={700} fontSize={14}>
                Standardised test results {category === "postgraduate" ? "(required)" : "(optional)"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>{select("testType", "Test taken", TEST_TYPES)}</Grid>
            <Grid item xs={12} md={4}>{text("testScoreValue", "Score")}</Grid>
            <Grid item xs={12} md={4}>{date("testDate", "Test date")}</Grid>

            {/* ───────── PROFILE ───────── */}
            {category && <SectionTitle>Achievements & Experience</SectionTitle>}
            {category === "postgraduate" && (
              <>
                <Grid item xs={12}>{text("workExperience", "Work experience", { multiline: true, rows: 3 })}</Grid>
                <Grid item xs={12}>{text("innovations", "Innovation / invention", { multiline: true, rows: 3 })}</Grid>
              </>
            )}
            {category === "undergraduate" && (
              <Grid item xs={12}>{text("awardsObtained", "Awards obtained", { multiline: true, rows: 3 })}</Grid>
            )}
            {category && (
              <>
                <Grid item xs={12}>{text("leadershipRoles", "Leadership roles played", { multiline: true, rows: 3 })}</Grid>
                <Grid item xs={12}>{text("otherTalents", "Other talents", { multiline: true, rows: 2 })}</Grid>
              </>
            )}

            {/* ───────── FINANCIALS ───────── */}
            <SectionTitle>Financials</SectionTitle>
            <Grid item xs={12} md={6}>{select("budgetRange", "What is your anticipated budget? *", BUDGETS)}</Grid>
            <CheckGroup label="Available family-income verification document" options={INCOME_DOCS}
              values={form.incomeDocuments} onToggle={toggle("incomeDocuments")} />
            <Grid item xs={12} md={8}>
              <TextField fullWidth select label="Financial needs *" value={form.financialNeeds} onChange={set("financialNeeds")}>
                {Object.entries(FINANCIAL_NEEDS).flatMap(([group, items]) => [
                  <ListSubheader key={group}>{group}</ListSubheader>,
                  ...items.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>),
                ])}
              </TextField>
            </Grid>

            {/* ───────── DOCUMENTS ───────── */}
            <SectionTitle>Upload Documents</SectionTitle>
            {!category && (
              <Grid item xs={12}>
                <Alert severity="warning">Select your degree program above to see the documents you need.</Alert>
              </Grid>
            )}
            {docs.map((d) => (
              <Grid item xs={12} md={6} key={d.field}>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={700}>{d.label}{d.required && " *"}</Typography>
                        {existingDocs[d.field] && !files[d.field] && (
                          <Chip size="small" icon={<CheckCircle />} color="success" label="Uploaded" />
                        )}
                      </Stack>
                      <Button component="label" variant="outlined" startIcon={<CloudUpload />} sx={{ py: 1.5, borderRadius: 3 }}>
                        {existingDocs[d.field] || files[d.field] ? "Replace PDF" : "Upload PDF"}
                        <input hidden type="file" accept=".pdf" name={d.field} onChange={handleFileChange} />
                      </Button>
                      <Typography variant="caption" color="text.secondary">PDF only • Max 2MB</Typography>
                      {files[d.field] && (
                        <Box sx={{ p: 1.5, bgcolor: "#f5f3ff", borderRadius: 2 }}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <InsertDriveFile sx={{ color: BRAND }} />
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{files[d.field].name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {(files[d.field].size / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                              </Box>
                            </Stack>
                            <IconButton onClick={() => removeFile(d.field)}><Delete /></IconButton>
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            <Grid item xs={12}>{text("studentNotes", "Additional notes", { multiline: true, rows: 3 })}</Grid>

            {/* ───────── TERMS ───────── */}
            <SectionTitle>Terms and Conditions</SectionTitle>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, fontSize: 14 }}>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Member administration fees are paid only when assessed and accepted as a member. Non-member administration fees are paid only per service indicated.</li>
                  <li>While we do our best to guide and prepare you for an effective visa interview, GIEVA does not issue student visas. Members must supply accurate and verifiable information.</li>
                  <li>Once services are initiated, performed and communicated, all basic and administrative fees paid are non-refundable. Additional expenses arising from the admission process are the responsibility of the member or non-member.</li>
                </ol>
                <Typography variant="body2" mt={1.5} color="text.secondary">
                  The HEALS enrolment fee excludes test registration, application fees, visa fees and any other
                  charges incurred in the process. Country-specific processing charges may apply.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={form.agreedToTerms}
                  onChange={(e) => setForm((f) => ({ ...f, agreedToTerms: e.target.checked }))} />}
                label="I have read the conditions, understood my role as outlined above, and agree to the terms and conditions."
              />
            </Grid>
            <Grid item xs={12} md={6}>{text("signatureName", "Signature: type your full name *")}</Grid>
          </Grid>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={4}>
            <Button variant="outlined"
              startIcon={savingDraft ? <CircularProgress size={18} /> : <Save />}
              onClick={handleSaveDraft} disabled={savingDraft || paying}>
              {savingDraft ? "Saving..." : "Save Draft"}
            </Button>
            <Button variant="contained"
              startIcon={paying ? <CircularProgress size={18} color="inherit" /> : <Payment />}
              onClick={handlePayAndSubmit} disabled={paying || savingDraft}
              sx={{ bgcolor: BRAND, px: 4, "&:hover": { bgcolor: "#0B1F3A" } }}>
              {paying ? "Redirecting to payment..." : `Pay${FEE ? ` ₦${FEE.toLocaleString()}` : ""} & Submit Application`}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

// import {
//   Box,
//   Typography,
//   Grid,
//   TextField,
//   Button,
//   Card,
//   CardContent,
//   MenuItem,
//   Stack,
//   Divider,
//   Alert,
//   CircularProgress,
//   IconButton,
// } from "@mui/material";

// import {
//   CloudUpload,
//   Save,
//   Send,
//   InsertDriveFile,
//   Delete,
// } from "@mui/icons-material";

// import {
//   useState, useEffect
// } from "react";

// import {
//   useNavigate,
// } from "react-router-dom";

// import {
//   createHealsApplication,
//   saveHealsProgress,
// } from "../services/healsApplicationService";

// import {
//   useSearchParams,
// } from "react-router-dom";

// import {
//   getHealsApplicationById,
// } from "../services/healsApplicationService";

// const BRAND = "#0B1F3A";

// const MAX_FILE_SIZE =
//   2 * 1024 * 1024;

// export default function HealsApplicationForm() {

//   const navigate =
//     useNavigate();

//     const [searchParams] =
//   useSearchParams();

// const editId =
//   searchParams.get("id");

//   const [loading,
//     setLoading] =
//     useState(false);

//   const [savingDraft,
//     setSavingDraft] =
//     useState(false);

//   const [applicationId,
//     setApplicationId] =
//     useState(null);

//   const [error,
//     setError] =
//     useState("");

//   const [success,
//     setSuccess] =
//     useState("");

//   const [form,
//     setForm] =
//     useState({

//       degreeProgram: "",
//       desiredCountry: "",
//       fieldOfStudy: "",

//       fullName: "",
//       gender: "",
//       email: "",
//       phone: "",
//       address: "",

//       highSchool: "",
//       universityAttended: "",
//       degreeReceived: "",

//       budgetRange: "",
//       financialNeeds: "",

//       studentNotes: "",
//     });

//   const [files,
//     setFiles] =
//     useState({});


//     useEffect(() => {

//   if (editId) {
//     fetchDraftApplication();
//   }

// }, [editId]);



// const fetchDraftApplication =
//   async () => {

//     try {

//       const res =
//         await getHealsApplicationById(
//           editId
//         );

//       const app =
//         res.application || res;

//       setApplicationId(
//         app.id
//       );

//       setForm({

//         degreeProgram:
//           app.degreeProgram || "",

//         desiredCountry:
//           app.desiredCountry || "",

//         fieldOfStudy:
//           app.fieldOfStudy || "",

//         fullName:
//           app.fullName || "",

//         gender:
//           app.gender || "",

//         email:
//           app.email || "",

//         phone:
//           app.phone || "",

//         address:
//           app.address || "",

//         highSchool:
//           app.highSchool || "",

//         universityAttended:
//           app.universityAttended || "",

//         degreeReceived:
//           app.degreeReceived || "",

//         budgetRange:
//           app.budgetRange || "",

//         financialNeeds:
//           app.financialNeeds || "",

//         studentNotes:
//           app.studentNotes || "",
//       });

//     } catch (err) {

//       console.error(err);
//     }
//   };


//   // ======================================================
//   // NORMAL FORM INPUTS
//   // ======================================================

//   const handleChange =
//     (e) => {

//       setForm({
//         ...form,
//         [e.target.name]:
//           e.target.value,
//       });
//     };



//   // ======================================================
//   // FILE UPLOADS
//   // ======================================================

//   const handleFileChange =
//     (e) => {

//       const file =
//         e.target.files[0];

//       const field =
//         e.target.name;

//       if (!file) return;

//       // PDF ONLY
//       if (
//         file.type !==
//         "application/pdf"
//       ) {

//         setError(
//           `${field} must be PDF`
//         );

//         return;
//       }

//       // MAX SIZE
//       if (
//         file.size >
//         MAX_FILE_SIZE
//       ) {

//         setError(
//           `${field} exceeds 2MB limit`
//         );

//         return;
//       }

//       setError("");

//       setFiles((prev) => ({
//         ...prev,
//         [field]: file,
//       }));
//     };



//   // ======================================================
//   // REMOVE FILE
//   // ======================================================

//   const removeFile =
//     (field) => {

//       const updated = {
//         ...files,
//       };

//       delete updated[field];

//       setFiles(updated);
//     };



//   // ======================================================
//   // BUILD FORMDATA
//   // ======================================================

//   const buildFormData =
//     () => {

//       const formData =
//         new FormData();

//       Object.keys(form).forEach(
//         (key) => {

//           formData.append(
//             key,
//             form[key]
//           );
//         }
//       );

//       Object.keys(files).forEach(
//         (key) => {

//           if (files[key]) {

//             formData.append(
//               key,
//               files[key]
//             );
//           }
//         }
//       );

//       return formData;
//     };



//   // ======================================================
//   // SAVE DRAFT
//   // ======================================================

//   const handleSaveDraft =
//     async () => {

//       try {

//         setSavingDraft(true);

//         setError("");

//         const formData =
//           buildFormData();

//         formData.append(
//         "status",
//         "draft"
//         );

//         let res;

//         if (applicationId) {

//           res =
//             await saveHealsProgress(
//               applicationId,
//               formData
//             );

//         } else {

//           res =
//             await createHealsApplication(
//               formData
//             );

//           setApplicationId(
//             res.application.id
//           );
//         }

//         setSuccess(
//           "Draft saved successfully"
//         );

//       } catch (err) {

//         console.error(err);

//         setError(
//           err.response?.data?.message ||
//           "Failed to save draft"
//         );

//       } finally {

//         setSavingDraft(false);
//       }
//     };



//   // ======================================================
//   // SUBMIT APPLICATION
//   // ======================================================

//   const handleSubmit =
//     async () => {

//       try {

//         setLoading(true);

//         setError("");

//         const formData =
//           buildFormData();

//         formData.append(
//         "status",
//         "submitted"
//         );

//         const res =
//           await createHealsApplication(
//             formData
//           );

//         setSuccess(
//           "Application submitted successfully"
//         );

//         setTimeout(() => {

//           navigate(
//             `/heals/application/${res.application.id}`
//           );

//         }, 1500);

//       } catch (err) {

//         console.error(err);

//         setError(
//           err.response?.data?.message ||
//           "Application failed"
//         );

//       } finally {

//         setLoading(false);
//       }
//     };



//   // ======================================================
//   // DOCUMENT FIELDS
//   // ======================================================

//   const documentFields = [
//     {
//       field: "passport",
//       label: "Passport",
//     },

//     {
//       field: "transcript",
//       label: "Transcript",
//     },

//     {
//       field: "sop",
//       label:
//         "Statement of Purpose",
//     },

//     {
//       field: "recommendation",
//       label:
//         "Recommendation Letter",
//     },

//     {
//       field: "bankStatement",
//       label:
//         "Bank Statement",
//     },

//     {
//       field: "otherDoc",
//       label:
//         "Other Document",
//     },
//   ];



//   return (

//     <Box
//       sx={{
//         p: {
//           xs: 2,
//           md: 4,
//         },

//         maxWidth: 1200,

//         mx: "auto",
//       }}
//     >

//       <Typography
//         variant="h4"
//         fontWeight="bold"
//         mb={1}
//       >
//         GIEVA HEALS Application
//       </Typography>

//       <Typography
//         color="text.secondary"
//         mb={4}
//       >
//         Begin your international
//         admissions journey
//       </Typography>



//       {error && (

//         <Alert
//           severity="error"
//           sx={{ mb: 3 }}
//         >
//           {error}
//         </Alert>
//       )}



//       {success && (

//         <Alert
//           severity="success"
//           sx={{ mb: 3 }}
//         >
//           {success}
//         </Alert>
//       )}



//       <Card
//         sx={{
//           borderRadius: 5,
//         }}
//       >

//         <CardContent>

//           <Grid
//             container
//             spacing={3}
//           >

//             {/* STUDY */}

//             <Grid item xs={12}>
//               <Typography
//                 variant="h6"
//                 fontWeight="bold"
//               >
//                 Study Preferences
//               </Typography>

//               <Divider sx={{ mt: 1 }} />
//             </Grid>



//             <Grid item xs={12} md={4}>
//               <TextField
//                 fullWidth
//                 label="Degree Program"
//                 name="degreeProgram"
//                 value={
//                   form.degreeProgram
//                 }
//                 onChange={
//                   handleChange
//                 }
//               />
//             </Grid>



//             <Grid item xs={12} md={4}>
//               <TextField
//                 fullWidth
//                 label="Desired Country"
//                 name="desiredCountry"
//                 value={
//                   form.desiredCountry
//                 }
//                 onChange={
//                   handleChange
//                 }
//               />
//             </Grid>



//             <Grid item xs={12} md={4}>
//               <TextField
//                 fullWidth
//                 label="Field of Study"
//                 name="fieldOfStudy"
//                 value={
//                   form.fieldOfStudy
//                 }
//                 onChange={
//                   handleChange
//                 }
//               />
//             </Grid>



//             {/* PERSONAL */}

//             <Grid item xs={12}>
//               <Typography
//                 variant="h6"
//                 fontWeight="bold"
//               >
//                 Personal Information
//               </Typography>

//               <Divider sx={{ mt: 1 }} />
//             </Grid>



//             <Grid item xs={12} md={6}>
//               <TextField
//                 fullWidth
//                 label="Full Name"
//                 name="fullName"
//                 value={form.fullName}
//                 onChange={
//                   handleChange
//                 }
//               />
//             </Grid>



//             <Grid item xs={12} md={6}>
//               <TextField
//                 fullWidth
//                 select
//                 label="Gender"
//                 name="gender"
//                 value={form.gender}
//                 onChange={
//                   handleChange
//                 }
//               >
//                 <MenuItem value="male">
//                   Male
//                 </MenuItem>

//                 <MenuItem value="female">
//                   Female
//                 </MenuItem>
//               </TextField>
//             </Grid>



//             <Grid item xs={12} md={6}>
//               <TextField
//                 fullWidth
//                 label="Email"
//                 name="email"
//                 value={form.email}
//                 onChange={
//                   handleChange
//                 }
//               />
//             </Grid>



//             <Grid item xs={12} md={6}>
//               <TextField
//                 fullWidth
//                 label="Phone"
//                 name="phone"
//                 value={form.phone}
//                 onChange={
//                   handleChange
//                 }
//               />
//             </Grid>



//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 multiline
//                 rows={3}
//                 label="Address"
//                 name="address"
//                 value={form.address}
//                 onChange={
//                   handleChange
//                 }
//               />
//             </Grid>



//             {/* DOCUMENTS */}

//             <Grid item xs={12}>
//               <Typography
//                 variant="h6"
//                 fontWeight="bold"
//               >
//                 Upload Documents
//               </Typography>

//               <Divider sx={{ mt: 1 }} />
//             </Grid>



//             {documentFields.map(
//               (item) => (

//               <Grid
//                 item
//                 xs={12}
//                 md={6}
//                 key={item.field}
//               >

//                 <Card
//                   variant="outlined"
//                   sx={{
//                     borderRadius: 3,
//                   }}
//                 >

//                   <CardContent>

//                     <Stack spacing={2}>

//                       <Typography
//                         fontWeight={700}
//                       >
//                         {item.label}
//                       </Typography>

//                       <Button
//                         component="label"
//                         variant="outlined"
//                         startIcon={
//                           <CloudUpload />
//                         }
//                         sx={{
//                           py: 1.5,
//                           borderRadius: 3,
//                         }}
//                       >
//                         Upload PDF

//                         <input
//                           hidden
//                           type="file"
//                           accept=".pdf"
//                           name={item.field}
//                           onChange={
//                             handleFileChange
//                           }
//                         />
//                       </Button>

//                       <Typography
//                         variant="caption"
//                         color="text.secondary"
//                       >
//                         PDF only • Max 2MB
//                       </Typography>



//                       {files[item.field] && (

//                         <Box
//                           sx={{
//                             p: 1.5,
//                             bgcolor:
//                               "#f5f3ff",
//                             borderRadius: 2,
//                           }}
//                         >

//                           <Stack
//                             direction="row"
//                             spacing={1}
//                             alignItems="center"
//                             justifyContent="space-between"
//                           >

//                             <Stack
//                               direction="row"
//                               spacing={1}
//                               alignItems="center"
//                             >

//                               <InsertDriveFile
//                                 sx={{
//                                   color:
//                                     BRAND,
//                                 }}
//                               />

//                               <Box>

//                                 <Typography
//                                   variant="body2"
//                                   fontWeight={600}
//                                 >
//                                   {
//                                     files[
//                                       item.field
//                                     ].name
//                                   }
//                                 </Typography>

//                                 <Typography
//                                   variant="caption"
//                                   color="text.secondary"
//                                 >
//                                   {(
//                                     files[
//                                       item.field
//                                     ].size /
//                                     1024 /
//                                     1024
//                                   ).toFixed(2)}
//                                   MB
//                                 </Typography>

//                               </Box>

//                             </Stack>



//                             <IconButton
//                               onClick={() =>
//                                 removeFile(
//                                   item.field
//                                 )
//                               }
//                             >
//                               <Delete />
//                             </IconButton>

//                           </Stack>

//                         </Box>
//                       )}

//                     </Stack>

//                   </CardContent>

//                 </Card>

//               </Grid>
//             ))}



//             {/* NOTES */}

//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 multiline
//                 rows={4}
//                 label="Additional Notes"
//                 name="studentNotes"
//                 value={
//                   form.studentNotes
//                 }
//                 onChange={
//                   handleChange
//                 }
//               />
//             </Grid>

//           </Grid>



//           {/* ACTIONS */}

//           <Stack
//             direction="row"
//             spacing={2}
//             mt={4}
//           >

//             <Button
//               variant="outlined"
//               startIcon={
//                 savingDraft
//                 ? (
//                   <CircularProgress
//                     size={18}
//                   />
//                 )
//                 : (
//                   <Save />
//                 )
//               }
//               onClick={
//                 handleSaveDraft
//               }
//               disabled={
//                 savingDraft
//               }
//             >
//               {savingDraft
//                 ? "Saving..."
//                 : "Save Draft"}
//             </Button>



//             <Button
//               variant="contained"
//               startIcon={
//                 loading
//                 ? (
//                   <CircularProgress
//                     size={18}
//                     color="inherit"
//                   />
//                 )
//                 : (
//                   <Send />
//                 )
//               }
//               onClick={
//                 handleSubmit
//               }
//               disabled={loading}
//               sx={{
//                 bgcolor: BRAND,
//                 px: 4,

//                 "&:hover": {
//                   bgcolor:
//                     "#0B1F3A",
//                 },
//               }}
//             >
//               {loading
//                 ? "Submitting..."
//                 : "Submit Application"}
//             </Button>

//           </Stack>

//         </CardContent>

//       </Card>

//     </Box>
//   );
// }