// pages/VisaApply.jsx
// Protected route:  <Route path="/visa/apply" element={<ProtectedRoute><VisaApply /></ProtectedRoute>} />
//
// The answers are autosaved as a DRAFT. The application is submitted only when payment succeeds
// (the server does that after Paystack confirms), so there is no "submit" button without paying.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, LinearProgress, CircularProgress, Alert, Chip } from "@mui/material";
import { ArrowBack, ArrowForward, Check, CloudDone, CloudOff, FlightTakeoff } from "@mui/icons-material";

import { NAVY, GREEN, GOLD, MUTED, LINE, INK, SURFACE, Card, setIn, errMsg } from "../components/visa/visaUi";
import {
  StepAppointment, StepPersonal, StepTravelSponsors, StepWork, StepFamilyEducation,
  StepBackground, StepReferencesDocs, StepReview,
} from "../components/visa/visaSteps";
import { getVisaSettings, startVisaApplication, getMyVisaApplication, saveVisaDraft, initializeVisaPayment } from "../services/visaService";

const STEPS = [
  { key: "appointment", title: "Appointment", sub: "Office & fee" },
  { key: "personal", title: "Personal details", sub: "Bio-data & contact" },
  { key: "travel", title: "Travel & sponsors", sub: "History and funding" },
  { key: "work", title: "Work history", sub: "Current & previous" },
  { key: "family", title: "Family & education", sub: "Parents and schools" },
  { key: "background", title: "Background", sub: "Awards, volunteering, social" },
  { key: "docs", title: "References & documents", sub: "Contacts and uploads" },
  { key: "review", title: "Review & pay", sub: "Submit your application" },
];

// Only these keys are ever sent to the server on autosave.
const EDITABLE = ["interviewLocation", "appointmentType", "firstName", "middleName", "lastName", "gender", "dateOfBirth", "phone", "altPhone", "address", "email", "travelHistory", "tripSponsor", "educationSponsor", "currentJob", "previousJob", "father", "mother", "schools", "awards", "volunteer", "usRelatives", "social", "references"];

const toForm = (a) => ({ ...a, acceptTerms: !!a.consentAcceptedAt });
const payloadOf = (f) => ({ ...Object.fromEntries(EDITABLE.map((k) => [k, f[k]])), acceptTerms: !!f.acceptTerms });

export default function VisaApply() {
  const navigate = useNavigate();
  const [booting, setBooting] = useState(true);
  const [fatal, setFatal] = useState("");
  const [settings, setSettings] = useState(null);
  const [appId, setAppId] = useState(null);
  const [form, setForm] = useState({});
  const [step, setStep] = useState(0);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [missing, setMissing] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payErrors, setPayErrors] = useState([]);

  const formRef = useRef(form);
  const dirtyRef = useRef(false);
  const timer = useRef(null);
  const topRef = useRef(null);
  formRef.current = form;

  // ── boot: settings + draft (resume if one exists) ──
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await getVisaSettings();
        if (!alive) return;
        setSettings(s);
        if (!s.isOpen) return;
        const { application } = await startVisaApplication();
        if (!alive) return;
        setAppId(application.id);
        setForm(toForm(application));
        try { const saved = Number(sessionStorage.getItem(`visaStep:${application.id}`)); if (saved >= 0 && saved < STEPS.length) setStep(saved); } catch { /* storage may be blocked */ }
      } catch (err) {
        if (alive) setFatal(errMsg(err, "Could not load the visa service"));
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ── autosave ──
  const flush = useCallback(async () => {
    if (!appId || !dirtyRef.current) return true;
    clearTimeout(timer.current);
    dirtyRef.current = false;
    setSaveState("saving");
    try {
      await saveVisaDraft(appId, payloadOf(formRef.current));
      setSaveState("saved");
      return true;
    } catch (err) {
      dirtyRef.current = true;
      setSaveState("error");
      return false;
    }
  }, [appId]);

  const set = useCallback((path, value) => {
    setForm((f) => setIn(f, path, value));
    dirtyRef.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), 1200);
  }, [flush]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    const h = (e) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  const setDocument = useCallback((type, doc) => setForm((f) => ({ ...f, documents: { ...(f.documents || {}), [type]: doc || undefined } })), []);

  const goTo = useCallback(async (i) => {
    await flush();
    setStep(i);
    try { sessionStorage.setItem(`visaStep:${appId}`, String(i)); } catch { /* ignore */ }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [flush, appId]);

  // On the review step, ask the server what is still missing
  useEffect(() => {
    if (step !== STEPS.length - 1 || !appId) return;
    let alive = true;
    (async () => {
      await flush();
      try { const r = await getMyVisaApplication(appId); if (alive) setMissing(r.missing || { fields: [], documents: [] }); } catch { /* shown on pay */ }
    })();
    return () => { alive = false; };
  }, [step, appId, flush, form.documents]);

  const pay = async () => {
    setPayErrors([]);
    setPaying(true);
    try {
      if (!(await flush())) throw new Error("save");
      const res = await initializeVisaPayment(appId);
      window.location.href = res.authorization_url;
    } catch (err) {
      setPaying(false);
      setPayErrors(err?.response?.data?.errors || [errMsg(err, "Could not start the payment. Please try again.")]);
    }
  };

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  if (booting) return <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}><CircularProgress sx={{ color: GREEN }} /></Box>;
  if (fatal) return <Box sx={{ p: 4, maxWidth: 560, mx: "auto" }}><Alert severity="error" sx={{ borderRadius: 3 }}>{fatal}</Alert></Box>;
  if (settings && !settings.isOpen)
    return (
      <Box sx={{ p: 4, maxWidth: 560, mx: "auto" }}>
        <Card sx={{ p: 4, textAlign: "center" }}>
          <FlightTakeoff sx={{ fontSize: 44, color: GOLD }} />
          <Typography sx={{ fontWeight: 900, fontSize: 22, color: NAVY, mt: 1 }}>Visa applications are paused</Typography>
          <Typography sx={{ color: MUTED, mt: 1 }}>{settings.closedMessage || "We are not accepting new visa applications right now. Please check back soon."}</Typography>
          <Button onClick={() => navigate("/visa/applications")} sx={{ mt: 3, textTransform: "none", fontWeight: 700 }}>View my applications</Button>
        </Card>
      </Box>
    );

  const isLast = step === STEPS.length - 1;
  const saveLabel = { saving: "Saving...", saved: "All changes saved", error: "Not saved. Retrying on next change", idle: "Draft" }[saveState];

  const body = (() => {
    switch (STEPS[step].key) {
      case "appointment": return <StepAppointment form={form} set={set} settings={settings} />;
      case "personal": return <StepPersonal form={form} set={set} />;
      case "travel": return <StepTravelSponsors form={form} set={set} />;
      case "work": return <StepWork form={form} set={set} />;
      case "family": return <StepFamilyEducation form={form} set={set} />;
      case "background": return <StepBackground form={form} set={set} />;
      case "docs": return <StepReferencesDocs form={form} set={set} applicationId={appId} setDocument={setDocument} />;
      default: return <StepReview form={form} set={set} settings={settings} missing={missing} goTo={goTo} onPay={pay} paying={paying} />;
    }
  })();

  return (
    <Box sx={{ bgcolor: SURFACE, minHeight: "100vh", pb: { xs: 12, md: 8 } }}>
      {/* hero */}
      <Box sx={{ background: `linear-gradient(135deg, ${NAVY} 0%, #12315A 60%, #0f4c3a 120%)`, color: "#fff", pt: { xs: 4, md: 6 }, pb: { xs: 9, md: 11 }, px: 2 }}>
        <Box sx={{ maxWidth: 1080, mx: "auto" }}>
          <Chip label="VISA SERVICE" size="small" sx={{ bgcolor: "rgba(201,162,39,.18)", color: GOLD, fontWeight: 800, letterSpacing: 1.2, mb: 1.5 }} />
          <Typography sx={{ fontWeight: 900, fontSize: { xs: 26, md: 36 }, lineHeight: 1.15 }}>Visa application</Typography>
          <Typography sx={{ color: "#CBD5E1", mt: 1, maxWidth: 560, fontSize: { xs: 14, md: 15.5 } }}>
            Fill in your details once. Your progress is saved automatically, and you can pick up where you left off.
          </Typography>
        </Box>
      </Box>

      <Box ref={topRef} sx={{ maxWidth: 1080, mx: "auto", px: 2, mt: { xs: -6, md: -7 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "280px 1fr" }, gap: 3, alignItems: "start" }}>
        {/* desktop stepper */}
        <Card sx={{ display: { xs: "none", md: "block" }, p: 2.5, position: "sticky", top: 24 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: MUTED, mb: 2 }}>YOUR PROGRESS</Typography>
          {STEPS.map((s, i) => {
            const done = i < step, active = i === step;
            return (
              <Box key={s.key} onClick={() => goTo(i)} role="button" sx={{ display: "flex", gap: 1.5, cursor: "pointer", position: "relative", pb: i === STEPS.length - 1 ? 0 : 2.25 }}>
                {i < STEPS.length - 1 && <Box sx={{ position: "absolute", left: 15, top: 32, bottom: 0, width: 2, bgcolor: done ? GREEN : LINE }} />}
                <Box sx={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, bgcolor: done ? GREEN : active ? NAVY : "#fff", color: done || active ? "#fff" : MUTED, border: `2px solid ${done ? GREEN : active ? NAVY : LINE}`, zIndex: 1 }}>
                  {done ? <Check sx={{ fontSize: 17 }} /> : i + 1}
                </Box>
                <Box sx={{ pt: 0.25 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: active ? 800 : 600, color: active ? NAVY : INK }}>{s.title}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: MUTED }}>{s.sub}</Typography>
                </Box>
              </Box>
            );
          })}
        </Card>

        {/* main card */}
        <Card sx={{ p: { xs: 2.25, sm: 3.5 } }}>
          <Box sx={{ display: { xs: "block", md: "none" }, mb: 2.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: MUTED, mb: 0.75 }}>STEP {step + 1} OF {STEPS.length}</Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, bgcolor: "#EEF2F7", "& .MuiLinearProgress-bar": { bgcolor: GREEN, borderRadius: 3 } }} />
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 20, sm: 24 }, color: NAVY }}>{STEPS[step].title}</Typography>
              <Typography sx={{ color: MUTED, fontSize: 13.5 }}>{STEPS[step].sub}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: saveState === "error" ? "#B91C1C" : MUTED, whiteSpace: "nowrap" }}>
              {saveState === "error" ? <CloudOff sx={{ fontSize: 16 }} /> : <CloudDone sx={{ fontSize: 16 }} />}
              <Typography sx={{ fontSize: 12, display: { xs: "none", sm: "block" } }}>{saveLabel}</Typography>
            </Box>
          </Box>

          {payErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setPayErrors([])}>
              {payErrors.map((e) => <Typography key={e} sx={{ fontSize: 13.5 }}>{e}</Typography>)}
            </Alert>
          )}

          {body}
        </Card>
      </Box>

      {/* sticky nav */}
      {!isLast && (
        <Box sx={{ position: "fixed", left: 0, right: 0, bottom: 0, bgcolor: "rgba(255,255,255,.92)", backdropFilter: "blur(10px)", borderTop: `1px solid ${LINE}`, py: 1.5, px: 2, zIndex: 10 }}>
          <Box sx={{ maxWidth: 1080, mx: "auto", display: "flex", justifyContent: "space-between", gap: 2, pl: { md: "304px" } }}>
            <Button onClick={() => goTo(step - 1)} disabled={step === 0} startIcon={<ArrowBack />} sx={{ textTransform: "none", fontWeight: 700, color: NAVY }}>Back</Button>
            <Button onClick={() => goTo(step + 1)} variant="contained" disableElevation endIcon={<ArrowForward />}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: 3, px: 3.5, bgcolor: NAVY, "&:hover": { bgcolor: GREEN } }}>
              Continue
            </Button>
          </Box>
        </Box>
      )}
      {isLast && (
        <Box sx={{ maxWidth: 1080, mx: "auto", px: 2, mt: 2, pl: { md: "304px" } }}>
          <Button onClick={() => goTo(step - 1)} startIcon={<ArrowBack />} sx={{ textTransform: "none", fontWeight: 700, color: NAVY }}>Back</Button>
        </Box>
      )}
    </Box>
  );
}
