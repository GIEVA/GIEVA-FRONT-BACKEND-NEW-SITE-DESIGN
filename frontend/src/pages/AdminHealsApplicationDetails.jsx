import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Stack, Chip, Button, CircularProgress, TextField,
  MenuItem, Paper, Avatar, Alert, Snackbar, ToggleButton, ToggleButtonGroup, LinearProgress,
} from "@mui/material";
import { Verified, CheckCircle, Description, Launch, School, Save } from "@mui/icons-material";

import {
  getHealsAdminApplicationById,
  verifyApplicationDocuments,
  updateHealsApplicationStatus,
  startHealsProcessing,
  completeHealsApplication,
  getHealsApplicationPayments,
} from "../services/healsAdminService";
import { HEALS_REQUIREMENTS } from "../config/healsRequirements";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const RED = "#DC2626";
const BORDER = "#E5E7EB";
const BG = "#F8FAFC";

const STATUS_OPTIONS = [
  { value: "under_review",   label: "Under Review" },
  { value: "info_requested", label: "Request More Information" },
  { value: "rejected",       label: "Reject Application" },
];

const STAGES = [
  ["school_matching", "School matching"],
  ["school_application", "School application"],
  ["offer_processing", "Offer processing"],
  ["visa_processing", "Visa processing"],
  ["travel_processing", "Travel processing"],
];

// ── helpers ───────────────────────────────────────────────
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const label = (s) => (s ? s.replaceAll("_", " ") : "");
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "");
const list = (arr, other) => [...(Array.isArray(arr) ? arr : []), other].filter(Boolean).join(", ");
const yesNo = (v) => (v === true ? "Yes" : v === false ? "No" : "");
const years = (a, b) => [a, b].filter(Boolean).join(" – ");
const money = (v, cur = "NGN") =>
  v === null || v === undefined || v === ""
    ? ""
    : new Intl.NumberFormat("en-NG", { style: "currency", currency: cur, maximumFractionDigits: 2 }).format(Number(v));

const gridSx = (cols = 2) => ({
  display: "grid",
  gap: 2.5,
  gridTemplateColumns: { xs: "1fr", sm: `repeat(${cols}, minmax(0, 1fr))` },
});

const Field = ({ label: l, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={700}>{l}</Typography>
    <Typography sx={{ whiteSpace: "pre-line", wordBreak: "break-word" }}>{value || "—"}</Typography>
  </Box>
);

const Section = ({ title, children, cols = 2 }) => (
  <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}` }}>
    <CardContent sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={800} mb={2.5}>{title}</Typography>
      <Box sx={gridSx(cols)}>{children}</Box>
    </CardContent>
  </Card>
);

export default function AdminHealsApplicationDetails() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);
  const [payments, setPayments] = useState([]);

  const [reviews, setReviews] = useState({});
  const [savedReviews, setSavedReviews] = useState({});
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState("under_review");
  const [note, setNote] = useState("");
  const [stage, setStage] = useState("school_matching");

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  // ── load ────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const res = await getHealsAdminApplicationById(id);
      const a = res?.application || res;
      setApp(a);

      const r = { ...(a.documentReviews || {}) };
      // fall back to the old 3-flag columns for older records
      if (a.passportVerified && !r.passport) r.passport = "verified";
      if (a.transcriptVerified && !r.transcript) r.transcript = "verified";
      if (a.bankStatementVerified && !r.bankStatement) r.bankStatement = "verified";
      setReviews(r);
      setSavedReviews(r);
      setNotes(a.internalNotes || "");
      if (a.currentStage && a.currentStage !== "application") setStage(a.currentStage);
    } catch (err) {
      console.error(err);
    }

    try {
      const p = await getHealsApplicationPayments(id);
      setPayments(Array.isArray(p) ? p : p?.payments || []);
    } catch (err) {
      console.error(err);
      setPayments([]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── one place for every action ──────────────────────────
  const run = async (fn, okMsg) => {
    if (busy) return;
    try {
      setBusy(true);
      await fn();
      setNotice({ type: "success", text: okMsg });
      await load();
    } catch (err) {
      setNotice({ type: "error", text: err.response?.data?.message || "Action failed" });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  }
  if (!app) {
    return <Box p={4}><Typography color="error">Could not load this application.</Typography></Box>;
  }

  // ── derived values ──────────────────────────────────────
  const docs = HEALS_REQUIREMENTS[app.applicantCategory]?.documents || [];
  const requiredDocs = docs.filter((d) => d.required);
  const verifiedRequired = requiredDocs.filter((d) => reviews[d.field] === "verified").length;
  const dirty = JSON.stringify(reviews) !== JSON.stringify(savedReviews);
  const allVerified = requiredDocs.length > 0 && verifiedRequired === requiredDocs.length;

  const canStart =
    app.applicationFeePaid &&
    ["submitted", "under_review", "paid"].includes(app.status) &&
    allVerified && !dirty;
  const canComplete = app.status === "processing";

  const successPayment = payments.find((p) => p.status === "success");

  // ── handlers ────────────────────────────────────────────
  const setReview = (field, value) => setReviews((r) => ({ ...r, [field]: value || "pending" }));

  const saveVerification = () =>
    run(() => verifyApplicationDocuments(id, { reviews, internalNotes: notes }), "Verification saved");

  const saveNotesOnly = () =>
    run(() => verifyApplicationDocuments(id, { internalNotes: notes }), "Notes saved");

  const updateStatus = () => {
    if (status === "info_requested" && !note.trim())
      return setNotice({ type: "error", text: "Write the message the applicant should receive" });
    if (status === "rejected") {
      if (!note.trim()) return setNotice({ type: "error", text: "Please record the reason for rejection" });
      if (!window.confirm("Reject this application? The applicant will be emailed.")) return;
    }
    run(async () => {
      await updateHealsApplicationStatus(id, { status, note });
      setNote("");
    }, "Status updated");
  };

  const startProcessing = () => {
    if (!window.confirm("Start processing this application?")) return;
    run(() => startHealsProcessing(id), "Processing started");
  };

  const complete = () => {
    if (!window.confirm("Mark this application as completed?")) return;
    run(() => completeHealsApplication(id), "Application completed");
  };

  const updateStage = () =>
    run(() => updateHealsApplicationStatus(id, { status: "processing", currentStage: stage }), "Stage updated");

  // ── detail sections ─────────────────────────────────────
  const sections = [
    {
      title: "Basic Information",
      rows: [
        ["Degree program", app.degreeProgram === "other" ? `Other: ${app.degreeProgramOther || "—"}` : cap(app.degreeProgram)],
        ["Applicant category", cap(app.applicantCategory)],
        ["Desired countries", list(app.desiredCountries, app.desiredCountryOther) || app.desiredCountry],
        ["Field of study", app.fieldOfStudy],
        ["University choices", [app.firstChoice, app.secondChoice, app.thirdChoice, app.fourthChoice]
          .filter(Boolean).map((c, i) => `${i + 1}. ${c}`).join("\n")],
        ["Areas of study", list(app.studyAreas, app.studyAreaOther)],
        ["Intake period", list(app.intakePeriods)],
        ["Medium of instruction", list(app.mediumOfInstruction, app.mediumOther)],
      ],
    },
    {
      title: "Personal Data",
      rows: [
        ["Full name", app.fullName],
        ["Date of birth", fmtDate(app.dob)],
        ["Gender", app.gender],
        ["Marital status", app.maritalStatus],
        ["Passport number", app.passportNumber],
        ["Passport issued", fmtDate(app.passportIssueDate)],
        ["Passport expires", fmtDate(app.passportExpiryDate)],
        ["Has student visa", yesNo(app.hasVisa)],
        ["Email", app.email],
        ["Phone", app.phone],
        ["Home address", app.address],
      ],
    },
    {
      title: "High School",
      rows: [
        ["School", app.highSchool],
        ["Address", app.highSchoolAddress],
        ["Years attended", years(app.highSchoolStartYear, app.highSchoolEndYear)],
        ["Certificate obtained", app.certificateObtained],
        ["Examination body", app.examinationBody],
        ...(app.applicantCategory === "undergraduate" ? [["Credits", app.waecCreditCount]] : []),
      ],
    },
    {
      title: "College / University",
      rows: [
        ["Institution", app.universityAttended],
        ["Address", app.universityAddress],
        ["Website", app.universityWebsite],
        ["Email", app.universityEmail],
        ["Phone", app.universityPhone],
        ["Years attended", years(app.universityStartYear, app.universityEndYear)],
        ["Degree received", app.degreeReceived],
      ],
    },
    {
      title: "Highest Qualification & Tests",
      rows: [
        ["Qualification", app.highestQualification],
        ["Institution", app.qualificationInstitution],
        ["Course", app.qualificationCourse],
        ["Grade", app.qualificationGrade],
        ["Grading scale", app.gradeScale],
        ["Year of graduation", app.graduationYear],
        ["Test taken", app.testType],
        ["Test score", app.testScoreValue],
        ["Test date", fmtDate(app.testDate)],
      ],
    },
    {
      title: "Achievements & Experience",
      cols: 1,
      rows: [
        ["Awards obtained", app.awardsObtained],
        ["Work experience", app.workExperience],
        ["Innovation / invention", app.innovations],
        ["Leadership roles", app.leadershipRoles],
        ["Other talents", app.otherTalents],
        ["Applicant notes", app.studentNotes],
      ],
    },
    {
      title: "Financials",
      rows: [
        ["Anticipated budget", app.budgetRange],
        ["Income documents available", list(app.incomeDocuments)],
        ["Financial needs", app.financialNeeds],
      ],
    },
    {
      title: "Declaration",
      rows: [
        ["Signed as", app.signatureName],
        ["Terms accepted", fmtDateTime(app.termsAcceptedAt)],
      ],
    },
  ];

  return (
    <Box p={{ xs: 2, md: 4 }} sx={{ background: BG, minHeight: "100vh" }}>
      {/* HERO */}
      <Paper
        elevation={0}
        sx={{ p: 4, borderRadius: 5, mb: 4, color: "#fff", background: "linear-gradient(135deg, #0B1F3A, #1E7F4F)" }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={800}>{app.fullName || "Unnamed applicant"}</Typography>
            <Typography sx={{ opacity: 0.9 }}>{app.applicationCode || `Application #${app.id}`}</Typography>
            <Typography sx={{ opacity: 0.75 }} variant="body2" mt={0.5}>
              Submitted {fmtDateTime(app.submittedAt) || "—"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap" useFlexGap>
            {app.applicantCategory && (
              <Chip label={cap(app.applicantCategory)} sx={{ bgcolor: "rgba(255,255,255,.2)", color: "#fff", fontWeight: 700 }} />
            )}
            <Chip
              label={app.applicationFeePaid ? "Fee paid" : "Fee unpaid"}
              sx={{ bgcolor: app.applicationFeePaid ? "#D1FAE5" : "#FEE2E2", color: app.applicationFeePaid ? "#065F46" : "#991B1B", fontWeight: 700 }}
            />
            <Chip label={label(app.status)} sx={{ bgcolor: "#fff", color: NAVY, fontWeight: 700, textTransform: "capitalize" }} />
          </Stack>
        </Stack>
      </Paper>

      {!app.applicationFeePaid && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
          No successful payment is recorded for this application. Applications made after the pay-first change
          are submitted only once payment is confirmed, so this is probably an older record.
        </Alert>
      )}

      <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", lg: "minmax(0,2fr) minmax(0,1fr)" } }}>
        {/* ───────────── LEFT ───────────── */}
        <Stack spacing={3}>
          {sections.map((s) => (
            <Section key={s.title} title={s.title} cols={s.cols}>
              {s.rows.map(([l, v]) => <Field key={l} label={l} value={v} />)}
            </Section>
          ))}

          {/* DOCUMENTS + VERIFICATION */}
          <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}` }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                <Typography variant="h6" fontWeight={800}>Documents</Typography>
                <Chip
                  size="small"
                  color={allVerified ? "success" : "default"}
                  label={`${verifiedRequired} of ${requiredDocs.length} required verified`}
                />
              </Stack>
              <LinearProgress
                variant="determinate"
                value={requiredDocs.length ? (verifiedRequired / requiredDocs.length) * 100 : 0}
                sx={{ mb: 3, height: 6, borderRadius: 3 }}
                color="success"
              />

              {!docs.length && <Alert severity="info">No degree program selected, so there is no document checklist.</Alert>}

              <Stack spacing={1.5}>
                {docs.map((d) => {
                  const url = app[`${d.field}Url`];
                  const state = reviews[d.field] || "pending";
                  return (
                    <Paper key={d.field} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: "#EEF2FF", color: NAVY }}><Description /></Avatar>
                          <Box>
                            <Typography fontWeight={700}>{d.label}</Typography>
                            <Stack direction="row" spacing={1} mt={0.5}>
                              {d.required ? <Chip size="small" label="Required" /> : <Chip size="small" variant="outlined" label="Optional" />}
                              {!url && d.required && <Chip size="small" color="error" label="Not uploaded" />}
                              {!url && !d.required && <Chip size="small" variant="outlined" label="Not provided" />}
                            </Stack>
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center">
                          {url && (
                            <Button href={url} target="_blank" rel="noreferrer" endIcon={<Launch />} size="small">Open</Button>
                          )}
                          <ToggleButtonGroup
                            exclusive size="small" value={state === "pending" ? null : state}
                            onChange={(_, v) => setReview(d.field, v)}
                            disabled={!url}
                          >
                            <ToggleButton value="verified" sx={{ textTransform: "none", "&.Mui-selected": { bgcolor: "#D1FAE5", color: "#065F46" } }}>
                              Verified
                            </ToggleButton>
                            <ToggleButton value="rejected" sx={{ textTransform: "none", "&.Mui-selected": { bgcolor: "#FEE2E2", color: "#991B1B" } }}>
                              Rejected
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>

              {docs.length > 0 && (
                <Stack direction="row" spacing={2} alignItems="center" mt={3}>
                  <Button
                    variant="contained" startIcon={<Verified />} onClick={saveVerification}
                    disabled={busy || !dirty} sx={{ bgcolor: NAVY }}
                  >
                    Save Verification
                  </Button>
                  {dirty && <Typography variant="body2" color="warning.main">Unsaved changes</Typography>}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* PAYMENTS */}
          <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}` }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={800} mb={2}>Payment History</Typography>
              {!payments.length && <Typography color="text.secondary">No payments recorded.</Typography>}
              <Stack spacing={1.5}>
                {payments.map((p) => (
                  <Paper key={p.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography fontWeight={700}>{p.title}</Typography>
                        <Typography color="text.secondary">
                          {money(p.totalAmount ?? p.amount, p.currency || "NGN")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Ref: {p.transactionRef || "—"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.paidAt ? `Paid ${fmtDateTime(p.paidAt)}` : `Created ${fmtDateTime(p.createdAt)}`}
                          {p.paymentMethod ? ` · ${p.paymentMethod}` : ""}
                        </Typography>
                      </Box>
                      <Chip
                        label={p.status} size="small"
                        color={p.status === "success" ? "success" : p.status === "failed" ? "error" : "warning"}
                        sx={{ alignSelf: "flex-start", textTransform: "capitalize" }}
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
              {app.status === "rejected" && successPayment && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This applicant paid before the application was reviewed. Decide whether a refund applies and handle it manually in Paystack.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Stack>

        {/* ───────────── RIGHT ───────────── */}
        <Stack spacing={3}>
          {/* STATUS */}
          <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}` }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={800} mb={0.5}>Review Decision</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Current status: <strong style={{ textTransform: "capitalize" }}>{label(app.status)}</strong>
              </Typography>
              <Stack spacing={2}>
                <TextField select label="Set status" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <TextField
                  multiline rows={4} value={note} onChange={(e) => setNote(e.target.value)}
                  label={
                    status === "info_requested" ? "Message to applicant (emailed) *"
                    : status === "rejected" ? "Reason for rejection (kept in the log) *"
                    : "Note (optional)"
                  }
                />
                <Button
                  fullWidth variant="contained" onClick={updateStatus} disabled={busy}
                  color={status === "rejected" ? "error" : "success"}
                >
                  Update Status
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* WORKFLOW */}
          <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}` }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={800} mb={2}>Workflow</Typography>
              <Stack spacing={2}>
                <Button
                  fullWidth variant="contained" startIcon={<School />} onClick={startProcessing}
                  disabled={busy || !canStart} sx={{ bgcolor: GREEN }}
                >
                  Start Processing
                </Button>
                {!canStart && !["processing", "completed", "rejected"].includes(app.status) && (
                  <Typography variant="caption" color="text.secondary">
                    {!app.applicationFeePaid ? "Waiting for payment. "
                      : dirty ? "Save your document verification first. "
                      : !allVerified ? "Verify all required documents first. " : ""}
                  </Typography>
                )}

                {app.status === "processing" && (
                  <>
                    <TextField select label="Pipeline stage" value={stage} onChange={(e) => setStage(e.target.value)}>
                      {STAGES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                    </TextField>
                    <Button fullWidth variant="outlined" onClick={updateStage} disabled={busy}>Update Stage</Button>
                  </>
                )}

                <Button
                  fullWidth variant="contained" startIcon={<CheckCircle />} onClick={complete}
                  disabled={busy || !canComplete} sx={{ bgcolor: NAVY }}
                >
                  Mark Completed
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* INTERNAL NOTES */}
          <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}` }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={800} mb={0.5}>Internal Notes</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>Only staff can see these.</Typography>
              <TextField fullWidth multiline rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button
                fullWidth sx={{ mt: 2 }} variant="outlined" startIcon={<Save />}
                onClick={saveNotesOnly} disabled={busy || notes === (app.internalNotes || "")}
              >
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <Snackbar open={!!notice} autoHideDuration={4000} onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={notice?.type || "info"} onClose={() => setNotice(null)} sx={{ borderRadius: 2 }}>
          {notice?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}