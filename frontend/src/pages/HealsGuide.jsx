// pages/HealsGuide.jsx   Route (public, inside <PublicLayout />): /heals
// Public guideline page for HEALS membership: what it is, who it is for, the requirements, the steps,
// the fee and the terms. "Apply now" goes to /heals/apply (that route is protected, so signed-out
// visitors are asked to log in first, exactly like the visa page).
//
// ✏️ All wording lives in the constants below the colours, so you can edit it without touching the layout.

import { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Box, Container, Typography, Button, Chip, Accordion, AccordionSummary, AccordionDetails, Skeleton } from "@mui/material";
import {
  ExpandMore, ArrowForward, TaskAlt, School, Public, Description, FactCheck, SupportAgent, Lock, MailOutline,
  CheckCircleOutline, Payments,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { getPublicHealsInfo } from "../services/healsPublicService";
import { HEALS_REQUIREMENTS, COUNTRIES } from "../config/healsRequirements";

const INK = "#17153B";
const GREEN = "#1E7F4F";
const ORANGE = "#FF6B35";
const MUTED = "#5B6477";
const LINE = "rgba(23,21,59,.09)";
const SOFT = "#F5F8F6";

const money = (n, cur = "NGN") => (n || n === 0 ? `${cur === "NGN" ? "₦" : `${cur} `}${Number(n).toLocaleString("en-NG")}` : "");

// ── Content (edit freely) ──────────────────────────────────────────────────────
const HELPS = [
  { icon: <School />, title: "Admissions guidance", text: "Tell us the degree you want, the countries you prefer and your field of study. Our team guides your international admissions journey from there." },
  { icon: <Public />, title: "Study-destination choices", text: "Name up to four preferred universities and the intakes and languages of instruction that suit you." },
  { icon: <Description />, title: "One organised application", text: "A single guided form and a checklist of the documents you need for your level of study, uploaded once as PDFs." },
  { icon: <FactCheck />, title: "Document review", text: "Our team checks your documents and your details, and tells you if anything is missing or needs replacing." },
  { icon: <SupportAgent />, title: "A team behind you", text: "You are not applying alone. Questions are answered inside your application and by our support team." },
  { icon: <MailOutline />, title: "Updates and records", text: "Your application status is tracked in your account, so you always know where things stand." },
];

const WHO = [
  "You want to study abroad at undergraduate or postgraduate level.",
  "You have, or can get, the documents listed for your level (see Requirements below).",
  "You have a valid international passport, or will have one before you travel.",
  "You can tell us your budget and how your studies will be funded.",
  "You have an active email address and phone number we can reach you on.",
  "You can pay the HEALS enrolment fee online (card, bank transfer or USSD through Paystack).",
];

const STEPS = [
  { t: "Create an account", d: "Sign in or register for free. This is the only time you are asked to log in." },
  { t: "Choose your programme", d: "Pick your degree programme, preferred countries, field of study and intake." },
  { t: "Personal and school details", d: "Your passport details, contact information and educational background." },
  { t: "Finances", d: "Your anticipated budget and how your studies will be funded." },
  { t: "Upload documents", d: "Upload the PDFs required for your level, each up to 2 MB." },
  { t: "Accept the terms and pay", d: "Sign with your name, pay the enrolment fee, and your application is submitted automatically." },
];

const TERMS = [
  "Member administration fees are paid only when assessed and accepted as a member. Non-member administration fees are paid only per service indicated.",
  "GIEVA does not issue student visas. While we do our best to guide and prepare you for an effective visa interview, members must supply accurate and verifiable information.",
  "Once services are initiated, performed and communicated, all basic and administrative fees paid are non-refundable.",
  "The HEALS enrolment fee excludes test registration, application fees, visa fees and any other charges incurred in the process. Country-specific processing charges may apply.",
];

const FAQ = [
  ["When do I pay?", "At the end, when you press Pay and Submit. Your application is submitted only once the payment succeeds, so you are not charged for a half-finished form."],
  ["Can I save and finish later?", "Yes. Use Save Draft at any time, then sign in again and continue from My Applications."],
  ["Do I need to log in to read about HEALS?", "No. This page is open to everyone. You are asked to sign in or create an account only when you press Apply now."],
  ["Does the fee cover everything?", "No. It covers the HEALS enrolment. Test registration, university application fees, visa fees and other charges in the process are separate."],
  ["Can GIEVA guarantee admission or a visa?", "No. Admission and visa decisions belong to the universities and the consular officers. We guide you and make sure your application is complete and correct."],
  ["What file format do my documents need?", "PDF only, with a maximum of 2 MB per file."],
];

const Section = ({ id, eyebrow, title, intro, children, tint }) => (
  <Box id={id} sx={{ py: { xs: 6, md: 9 }, bgcolor: tint ? SOFT : "#fff" }}>
    <Container maxWidth="lg">
      <Box sx={{ maxWidth: 720, mb: { xs: 4, md: 5.5 } }}>
        {eyebrow && <Typography sx={{ color: ORANGE, fontWeight: 800, letterSpacing: 1.6, fontSize: 12.5, mb: 1 }}>{eyebrow}</Typography>}
        <Typography component="h2" sx={{ color: INK, fontWeight: 900, fontSize: { xs: 26, md: 36 }, lineHeight: 1.15 }}>{title}</Typography>
        {intro && <Typography sx={{ color: MUTED, mt: 1.5, fontSize: { xs: 15, md: 16.5 }, lineHeight: 1.7 }}>{intro}</Typography>}
      </Box>
      {children}
    </Container>
  </Box>
);

export default function HealsGuide() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getPublicHealsInfo().then(setInfo).catch(() => setFailed(true));
  }, []);

  // /heals/apply is a protected route: visitors who are not signed in are sent to the login page first.
  const apply = () => navigate("/heals/apply");
  const cta = (extra = {}) => (
    <Button onClick={apply} endIcon={<ArrowForward />} size="large" variant="contained" disableElevation
      sx={{ textTransform: "none", fontWeight: 800, borderRadius: 99, px: 3.5, py: 1.4, fontSize: 16, bgcolor: ORANGE, "&:hover": { bgcolor: "#e85a26" }, ...extra }}>
      Apply now
    </Button>
  );

  return (
    <Box sx={{ bgcolor: "#fff" }}>
      {/* HERO */}
      <Box sx={{ background: `linear-gradient(135deg, ${INK} 0%, #123d33 100%)`, color: "#fff", py: { xs: 7, md: 11 } }}>
        <Container maxWidth="lg">
          <Chip label="HEALS MEMBERSHIP" size="small" sx={{ bgcolor: "rgba(255,255,255,.14)", color: "#fff", fontWeight: 800, letterSpacing: 1.2, mb: 2.5 }} />
          <Typography component="h1" sx={{ fontWeight: 900, fontSize: { xs: 34, md: 54 }, lineHeight: 1.08, maxWidth: 820 }}>
            Begin your international admissions journey with a team behind you.
          </Typography>
          <Typography sx={{ mt: 2.5, maxWidth: 680, fontSize: { xs: 16, md: 18.5 }, lineHeight: 1.65, opacity: 0.88 }}>
            Read what HEALS is, what you need and what it costs. When you are ready, apply with one guided online form,
            upload your documents and pay securely.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 4, alignItems: "center" }}>
            {cta()}
            <Button href="#requirements" size="large" sx={{ textTransform: "none", fontWeight: 700, color: "#fff", borderRadius: 99, px: 2.5 }}>See the requirements</Button>
            {user && <Button component={RouterLink} to="/heals/my-applications" size="large" sx={{ textTransform: "none", fontWeight: 700, color: "#fff", borderRadius: 99, px: 2.5 }}>My applications</Button>}
          </Box>
          <Box sx={{ display: "flex", gap: { xs: 2, md: 4 }, flexWrap: "wrap", mt: 5, opacity: 0.9 }}>
            {[[<Public key="p" fontSize="small" />, "Study destinations worldwide"], [<Lock key="l" fontSize="small" />, "Secure payment by Paystack"], [<Description key="d" fontSize="small" />, "Save a draft and finish later"]].map(([i, t]) => (
              <Box key={t} sx={{ display: "flex", alignItems: "center", gap: 0.8, fontSize: 14.5, fontWeight: 600 }}>{i}{t}</Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* WHAT HEALS DOES */}
      <Section eyebrow="WHAT HEALS DOES" title="Support from your first idea to a complete application"
        intro="Studying abroad has many moving parts. HEALS gives you a clear process and people who check your work.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {HELPS.map((h) => (
            <Box key={h.title} sx={{ p: 3, borderRadius: 4, border: `1px solid ${LINE}`, bgcolor: "#fff", transition: ".25s", "&:hover": { boxShadow: "0 18px 40px rgba(23,21,59,.08)", transform: "translateY(-3px)" } }}>
              <Box sx={{ width: 46, height: 46, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "rgba(30,127,79,.1)", color: GREEN, mb: 2 }}>{h.icon}</Box>
              <Typography sx={{ fontWeight: 800, color: INK, fontSize: 18, mb: 0.75 }}>{h.title}</Typography>
              <Typography sx={{ color: MUTED, lineHeight: 1.65, fontSize: 15 }}>{h.text}</Typography>
            </Box>
          ))}
        </Box>
      </Section>

      {/* WHO */}
      <Section tint eyebrow="WHO IT IS FOR" title="Is HEALS right for you?" intro="HEALS suits you if the following describe you.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" }, gap: 4, alignItems: "start" }}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {WHO.map((c) => (
              <Box key={c} sx={{ display: "flex", gap: 1.5, p: 2, borderRadius: 3, bgcolor: "#fff", border: `1px solid ${LINE}` }}>
                <TaskAlt sx={{ color: GREEN, mt: 0.2 }} />
                <Typography sx={{ color: INK, lineHeight: 1.6, fontSize: 15.5 }}>{c}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ p: 3, borderRadius: 4, bgcolor: INK, color: "#fff" }}>
            <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1.5 }}>Preferred study destinations</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {(COUNTRIES || []).map((c) => (
                <Chip key={c} label={c} size="small" sx={{ bgcolor: "rgba(255,255,255,.14)", color: "#fff", fontWeight: 600 }} />
              ))}
            </Box>
            <Typography sx={{ opacity: 0.7, fontSize: 13, mt: 2, lineHeight: 1.6 }}>
              You can also name other countries on the form.
            </Typography>
          </Box>
        </Box>
      </Section>

      {/* REQUIREMENTS */}
      <Section id="requirements" eyebrow="REQUIREMENTS" title="Documents you will need"
        intro="Your list depends on your level of study. Everything is uploaded as a PDF, up to 2 MB per file.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
          {Object.entries(HEALS_REQUIREMENTS).map(([key, cfg]) => (
            <Box key={key} sx={{ p: 3.5, borderRadius: 4, border: `1px solid ${LINE}`, bgcolor: "#fff" }}>
              <Typography sx={{ fontWeight: 900, color: INK, fontSize: 20, mb: 2 }}>{cfg.label} applicants</Typography>
              {cfg.documents.map((d) => (
                <Box key={d.field} sx={{ display: "flex", gap: 1.25, mb: 1.4 }}>
                  <CheckCircleOutline sx={{ color: GREEN, mt: 0.2 }} />
                  <Typography sx={{ color: INK, lineHeight: 1.55 }}>
                    {d.label}{!d.required && <Box component="span" sx={{ color: MUTED, fontStyle: "italic" }}> (optional)</Box>}
                  </Typography>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Section>

      {/* STEPS */}
      <Section tint id="how-it-works" eyebrow="STEP BY STEP" title="How applying works" intro="Your progress can be saved as a draft at any time.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {STEPS.map((s, i) => (
            <Box key={s.t} sx={{ p: 2.75, borderRadius: 4, border: `1px solid ${LINE}`, bgcolor: "#fff", position: "relative", overflow: "hidden" }}>
              <Typography sx={{ position: "absolute", right: 14, top: 2, fontSize: 64, fontWeight: 900, color: "rgba(30,127,79,.08)", lineHeight: 1 }}>{i + 1}</Typography>
              <Typography sx={{ color: GREEN, fontWeight: 800, fontSize: 12.5, letterSpacing: 1.2, mb: 0.75 }}>STEP {i + 1}</Typography>
              <Typography sx={{ fontWeight: 800, color: INK, fontSize: 17, mb: 0.75 }}>{s.t}</Typography>
              <Typography sx={{ color: MUTED, fontSize: 14.5, lineHeight: 1.6 }}>{s.d}</Typography>
            </Box>
          ))}
        </Box>
      </Section>

      {/* FEE */}
      <Section eyebrow="ENROLMENT FEE" title="Clear pricing" intro="You pay once, at the end of the form. The amount shown is exactly what you are charged.">
        <Box sx={{ p: 3.5, borderRadius: 4, bgcolor: SOFT, border: `1px solid ${LINE}`, maxWidth: 560 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: GREEN, fontWeight: 800 }}><Payments />HEALS enrolment fee</Box>
          {info ? (
            <Typography sx={{ fontSize: 44, fontWeight: 900, color: INK, my: 1 }}>{info.amount ? money(info.amount, info.currency) : "Contact us"}</Typography>
          ) : failed ? (
            <Typography sx={{ my: 2, color: MUTED }}>Shown when you apply</Typography>
          ) : <Skeleton variant="text" width={180} height={70} />}
          <Typography sx={{ color: MUTED, fontSize: 14.5, lineHeight: 1.65 }}>
            The fee excludes test registration, university application fees, visa fees and any other charges incurred in the process.
          </Typography>
        </Box>
      </Section>

      {/* TERMS */}
      <Section tint eyebrow="TERMS" title="Please read before you apply" intro="You will be asked to accept these when you apply.">
        <Box sx={{ maxWidth: 820, display: "grid", gap: 1.5 }}>
          {TERMS.map((t, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1.5, p: 2.25, borderRadius: 3, bgcolor: "#fff", border: `1px solid ${LINE}` }}>
              <Typography sx={{ color: GREEN, fontWeight: 900 }}>{i + 1}.</Typography>
              <Typography sx={{ color: INK, lineHeight: 1.65, fontSize: 15 }}>{t}</Typography>
            </Box>
          ))}
        </Box>
      </Section>

      {/* FAQ */}
      <Section eyebrow="QUESTIONS" title="Frequently asked">
        <Box sx={{ maxWidth: 820 }}>
          {FAQ.map(([q, a]) => (
            <Accordion key={q} disableGutters elevation={0} sx={{ border: `1px solid ${LINE}`, borderRadius: "16px !important", mb: 1.5, "&:before": { display: "none" }, overflow: "hidden" }}>
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, py: 0.5 }}>
                <Typography sx={{ fontWeight: 700, color: INK }}>{q}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 2.5 }}>
                <Typography sx={{ color: MUTED, lineHeight: 1.7 }}>{a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Section>

      {/* FINAL CTA */}
      <Box sx={{ background: `linear-gradient(135deg, ${GREEN}, #145c39)`, color: "#fff", py: { xs: 7, md: 9 }, textAlign: "center" }}>
        <Container maxWidth="md">
          <Typography sx={{ fontWeight: 900, fontSize: { xs: 28, md: 40 }, lineHeight: 1.15 }}>Ready when you are</Typography>
          <Typography sx={{ mt: 1.5, opacity: 0.9, fontSize: { xs: 15.5, md: 17.5 } }}>
            {user ? "Start your application now, or continue a draft you already began." : "You will be asked to sign in or create a free account first."}
          </Typography>
          <Box sx={{ mt: 3.5, display: "flex", justifyContent: "center", gap: 1.5, flexWrap: "wrap" }}>
            {cta()}
            <Button component={RouterLink} to="/contact" size="large" variant="outlined"
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 99, px: 3, borderColor: "rgba(255,255,255,.55)", color: "#fff" }}>
              Talk to us first
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
