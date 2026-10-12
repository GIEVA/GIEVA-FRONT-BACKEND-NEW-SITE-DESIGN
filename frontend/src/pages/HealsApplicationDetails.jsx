import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Stack, Button, CircularProgress, Chip, Alert,
  Paper, Avatar, Stepper, Step, StepLabel,
} from "@mui/material";
import { Description, Launch, Edit, CheckCircle } from "@mui/icons-material";

import { getHealsApplicationById } from "../services/healsApplicationService";
import { getMyHealsPayments } from "../services/healsPaymentService";
import { HEALS_REQUIREMENTS } from "../config/healsRequirements";
import ApplicationStatusChip from "../components/ApplicationStatusChip";

const BRAND = "#0B1F3A";
const BORDER = "#E5E7EB";

const PIPELINE = [
  ["application", "Submitted"],
  ["document_review", "Document review"],
  ["school_matching", "School matching"],
  ["school_application", "School application"],
  ["offer_processing", "Offer"],
  ["visa_processing", "Visa"],
  ["travel_processing", "Travel"],
  ["completed", "Completed"],
];

// ── helpers ───────────────────────────────────────────────
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
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

const Field = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
    <Typography sx={{ whiteSpace: "pre-line", wordBreak: "break-word" }}>{value || "—"}</Typography>
  </Box>
);

const Section = ({ title, rows, cols = 2 }) => (
  <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}` }}>
    <CardContent sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight="bold" mb={2.5}>{title}</Typography>
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", sm: `repeat(${cols}, minmax(0, 1fr))` } }}>
        {rows.map(([l, v]) => <Field key={l} label={l} value={v} />)}
      </Box>
    </CardContent>
  </Card>
);

export default function HealsApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getHealsApplicationById(id);
        setApplication(res.application || res);
      } catch (err) {
        console.error(err);
      }

      // The receipt is optional: a failure here shouldn't hide the application
      try {
        const all = await getMyHealsPayments();
        const mine = (Array.isArray(all) ? all : all?.payments || []).find(
          (p) => String(p.applicationId) === String(id) && p.status === "success"
        );
        setPayment(mine || null);
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  }

  if (!application) {
    return (
      <Box p={4}>
        <Alert severity="error">We couldn't load this application.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate("/heals/applications")}>Back to My Applications</Button>
      </Box>
    );
  }

  const a = application;
  const isDraft = a.status === "draft";
  const docs = HEALS_REQUIREMENTS[a.applicantCategory]?.documents || [];
  const reviews = a.documentReviews || {};
  const hasRejectedDocs = docs.some((d) => reviews[d.field] === "rejected");

  // Progress tracker
  const stageIndex = Math.max(
    PIPELINE.findIndex(([k]) => k === a.currentStage),
    a.status === "under_review" ? 1 : 0
  );
  const activeStep = a.status === "completed" ? PIPELINE.length : stageIndex;
  const showTracker = !isDraft && a.status !== "rejected";

  const sections = [
    {
      title: "Basic Information",
      rows: [
        ["Degree program", a.degreeProgram === "other" ? `Other: ${a.degreeProgramOther || "—"}` : cap(a.degreeProgram)],
        ["Desired countries", list(a.desiredCountries, a.desiredCountryOther) || a.desiredCountry],
        ["Field of study", a.fieldOfStudy],
        ["University choices", [a.firstChoice, a.secondChoice, a.thirdChoice, a.fourthChoice]
          .filter(Boolean).map((c, i) => `${i + 1}. ${c}`).join("\n")],
        ["Areas of study", list(a.studyAreas, a.studyAreaOther)],
        ["Intake period", list(a.intakePeriods)],
        ["Medium of instruction", list(a.mediumOfInstruction, a.mediumOther)],
      ],
    },
    {
      title: "Personal Data",
      rows: [
        ["Full name", a.fullName],
        ["Date of birth", fmtDate(a.dob)],
        ["Gender", a.gender],
        ["Marital status", a.maritalStatus],
        ["Passport number", a.passportNumber],
        ["Passport issued", fmtDate(a.passportIssueDate)],
        ["Passport expires", fmtDate(a.passportExpiryDate)],
        ["Has student visa", yesNo(a.hasVisa)],
        ["Email", a.email],
        ["Phone", a.phone],
        ["Home address", a.address],
      ],
    },
    {
      title: "High School",
      rows: [
        ["School", a.highSchool],
        ["Address", a.highSchoolAddress],
        ["Years attended", years(a.highSchoolStartYear, a.highSchoolEndYear)],
        ["Certificate obtained", a.certificateObtained],
        ["Examination body", a.examinationBody],
        ...(a.applicantCategory === "undergraduate" ? [["Credits", a.waecCreditCount]] : []),
      ],
    },
    {
      title: "College / University",
      rows: [
        ["Institution", a.universityAttended],
        ["Address", a.universityAddress],
        ["Website", a.universityWebsite],
        ["Email", a.universityEmail],
        ["Phone", a.universityPhone],
        ["Years attended", years(a.universityStartYear, a.universityEndYear)],
        ["Degree received", a.degreeReceived],
      ],
    },
    {
      title: "Highest Qualification & Tests",
      rows: [
        ["Qualification", a.highestQualification],
        ["Institution", a.qualificationInstitution],
        ["Course", a.qualificationCourse],
        ["Grade", a.qualificationGrade],
        ["Grading scale", a.gradeScale],
        ["Year of graduation", a.graduationYear],
        ["Test taken", a.testType],
        ["Test score", a.testScoreValue],
        ["Test date", fmtDate(a.testDate)],
      ],
    },
    {
      title: "Achievements & Experience",
      cols: 1,
      rows: [
        ["Awards obtained", a.awardsObtained],
        ["Work experience", a.workExperience],
        ["Innovation / invention", a.innovations],
        ["Leadership roles", a.leadershipRoles],
        ["Other talents", a.otherTalents],
        ["Additional notes", a.studentNotes],
      ],
    },
    {
      title: "Financials",
      rows: [
        ["Anticipated budget", a.budgetRange],
        ["Income documents available", list(a.incomeDocuments)],
        ["Financial needs", a.financialNeeds],
      ],
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto" }}>
      {/* HEADER */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Application Details</Typography>
          <Typography color="text.secondary">
            {a.applicationCode || (isDraft ? "Draft: not yet submitted" : `Application #${a.id}`)}
          </Typography>
          {a.submittedAt && (
            <Typography variant="body2" color="text.secondary">Submitted {fmtDateTime(a.submittedAt)}</Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          {a.applicantCategory && <Chip label={cap(a.applicantCategory)} variant="outlined" />}
          <ApplicationStatusChip status={a.status} />
        </Stack>
      </Stack>

      {/* STATUS MESSAGES */}
      {isDraft && (
        <Alert
          severity="warning" sx={{ mb: 3, borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" startIcon={<Edit />}
              onClick={() => navigate(`/heals/apply?id=${a.id}`)}>
              Continue & Pay
            </Button>
          }
        >
          This is a draft. It will be sent to our team only after you complete the form and pay the application fee.
        </Alert>
      )}
      {a.status === "info_requested" && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
          Our team needs more information from you. Please check your email ({a.email}) for the details, then reply to that message.
        </Alert>
      )}
      {a.status === "rejected" && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          This application was not approved. Please check your email for details, or contact us if you have questions.
        </Alert>
      )}
      {hasRejectedDocs && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
          One or more documents were flagged during review. They are marked below. Please contact us to send a corrected copy.
        </Alert>
      )}
      {a.status === "completed" && (
        <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3, borderRadius: 3 }}>
          Your HEALS application has been completed. Congratulations!
        </Alert>
      )}

      {/* PROGRESS */}
      {showTracker && (
        <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}`, mb: 3 }}>
          <CardContent sx={{ p: 3, overflowX: "auto" }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>Progress</Typography>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ minWidth: 640 }}>
              {PIPELINE.map(([k, l]) => (
                <Step key={k}><StepLabel>{l}</StepLabel></Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      )}

      <Stack spacing={3}>
        {sections.map((s) => <Section key={s.title} {...s} />)}

        {/* DOCUMENTS */}
        <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}` }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2.5}>Documents</Typography>

            {!docs.length && <Typography color="text.secondary">No documents uploaded yet.</Typography>}

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
              {docs.map((d) => {
                const url = a[`${d.field}Url`];
                const state = reviews[d.field];
                return (
                  <Paper key={d.field} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar sx={{ bgcolor: "#EEF2FF", color: BRAND }}><Description /></Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={700} fontSize={14}>{d.label}</Typography>
                          <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                            {!url && <Chip size="small" variant="outlined" label={d.required ? "Missing" : "Not provided"} color={d.required ? "error" : "default"} />}
                            {url && !state && <Chip size="small" variant="outlined" label="Uploaded" />}
                            {state === "verified" && <Chip size="small" color="success" label="Verified" />}
                            {state === "rejected" && <Chip size="small" color="error" label="Needs attention" />}
                          </Stack>
                        </Box>
                      </Stack>
                      {url && (
                        <Button href={url} target="_blank" rel="noreferrer" endIcon={<Launch />} size="small">View</Button>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* PAYMENT */}
        {payment && (
          <Section
            title="Payment Receipt"
            rows={[
              ["Amount paid", money(payment.totalAmount ?? payment.amount, payment.currency || "NGN")],
              ["Paid on", fmtDateTime(payment.paidAt)],
              ["Payment method", cap(payment.paymentMethod)],
              ["Receipt code", payment.paymentCode],
              ["Transaction reference", payment.transactionRef],
            ]}
          />
        )}

        {/* DECLARATION */}
        {a.termsAcceptedAt && (
          <Section
            title="Declaration"
            rows={[
              ["Signed as", a.signatureName],
              ["Terms accepted", fmtDateTime(a.termsAcceptedAt)],
            ]}
          />
        )}
      </Stack>

      <Button sx={{ mt: 4 }} variant="outlined" onClick={() => navigate("/heals/my-applications")}>
        Back to My Applications
      </Button>
    </Box>
  );
}