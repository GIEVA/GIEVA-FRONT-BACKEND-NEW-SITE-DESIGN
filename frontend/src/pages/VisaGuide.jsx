// pages/VisaGuide.jsx   Route (public, inside <PublicLayout />): /visa
// Public guideline page: what GIEVA does, who can apply, the steps, documents, fees, FAQ.
// "Submit Visa Application" sends the person to /visa/apply (that route is protected, so signed-out
// visitors are asked to log in first).
//
// ✏️ All wording lives in the constants below the colours, so you can edit it without touching the layout.

import { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Container, Typography, Button, Chip, Accordion, AccordionSummary, AccordionDetails, Alert, Skeleton,
} from "@mui/material";
import {
  ExpandMore, ArrowForward, TaskAlt, FactCheck, EventAvailable, NotificationsActive, Description, SupportAgent,
  Place, MailOutline, Bolt, Schedule, Lock, CheckCircleOutline,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { getPublicVisaInfo } from "../services/visaService";

const INK = "#17153B";
const GREEN = "#1E7F4F";
const ORANGE = "#FF6B35";
const MUTED = "#5B6477";
const LINE = "rgba(23,21,59,.09)";
const SOFT = "#F5F8F6";

const money = (n, cur = "NGN") => (n || n === 0 ? `${cur === "NGN" ? "₦" : `${cur} `}${Number(n).toLocaleString("en-NG")}` : "");

// ── Content (edit freely) ──────────────────────────────────────────────────────
const HELPS = [
  { icon: <FactCheck />, title: "Get the application right", text: "One guided form instead of a paper one. It saves as you go, so you can stop and continue later, and it checks that nothing is missing before you pay." },
  { icon: <Description />, title: "Document check", text: "Upload your I-20, passport bio-data page and passport photograph once. Our team reviews them and tells you if anything needs replacing." },
  { icon: <EventAvailable />, title: "Interview appointment", text: "Choose Abuja or Lagos and a Normal or Expedited appointment. We take it from there and schedule your interview." },
  { icon: <NotificationsActive />, title: "Updates at every step", text: "Every status change is emailed to you and shown on a timeline in your account, so you are never left guessing." },
  { icon: <MailOutline />, title: "Your copy, instantly", text: "The moment your application is submitted you receive a PDF of everything you entered, by email." },
  { icon: <SupportAgent />, title: "A real team behind it", text: "If we need more information, we ask you inside the application. You answer in one place and we pick it up straight away." },
];

const CRITERIA = [
  "You are applying for a student visa and already hold an admission document (I-20) from your school.",
  "You have a valid international passport.",
  "You can provide a recent passport photograph (2x2 inches, plain white background).",
  "You can tell us who is funding your trip and your education, or whether you are on scholarship.",
  "You have an active email address and phone number we can reach you on.",
  "You can complete the online payment of the processing fee (card, bank transfer or USSD through Paystack).",
];

const STEPS = [
  { t: "Appointment", d: "Pick your interview location (Abuja or Lagos) and Normal or Expedited scheduling." },
  { t: "Personal details", d: "Name, date of birth, gender, phone numbers, address and email." },
  { t: "Travel and sponsors", d: "Countries you have travelled to, and who pays for your trip and education." },
  { t: "Work history", d: "Your current job and any previous employment, if any." },
  { t: "Family and education", d: "Your parents' details and the schools you attended." },
  { t: "Background", d: "Awards, volunteering and social media, if you have them." },
  { t: "References and documents", d: "Your referees, then upload the I-20, passport bio page and photograph." },
  { t: "Review and pay", d: "Check everything, pay the processing fee, and your application is submitted." },
];

const DOCS = [
  { t: "I-20 document", d: "PDF, JPG or PNG, up to 5 MB." },
  { t: "International passport (bio-data page)", d: "A clear scan or photo. PDF, JPG or PNG, up to 5 MB." },
  { t: "Passport photograph", d: "2x2 inches, white background. JPG or PNG, up to 5 MB." },
];

const AFTER = [
  ["Submitted", "We have your application and your payment."],
  ["Under review", "Our team is checking your details and documents."],
  ["Information required", "We need something from you. You will be emailed and can respond in your account."],
  ["Interview scheduled", "Your interview date and details are confirmed."],
  ["Approved or not approved", "The outcome, with notes from our team."],
  ["Completed", "Your application is closed out."],
];

const FAQ = [
  ["When do I pay?", "At the end, when you press Pay and submit. Your application is only submitted once the payment succeeds, so nothing is charged for a half-finished form."],
  ["Can I save and finish later?", "Yes. Your progress is saved automatically as you fill in the form. Sign in again and you continue where you stopped."],
  ["What is the difference between Normal and Expedited?", "Expedited is a priority scheduling option and costs more. Both fees are shown on this page, and you see the exact amount before you pay."],
  ["Will you guarantee my visa?", "No. The decision is made by the consular officers, not by GIEVA. We make sure your application is complete and correct, and we guide you through the process."],
  ["I paid but did not see a confirmation.", "Open My Visa Applications. If the payment went through, your application shows as Submitted and you will have an email with a PDF copy. If not, contact us and quote your payment reference."],
  ["Can I change something after submitting?", "If our team needs a correction, they will mark the application as Information required and you can update it in your account. Otherwise contact us."],
  ["Is my information safe?", "Your documents are only visible to you and our visa team, every download by our staff is logged, and payments are handled by Paystack. We never see your card details."],
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

export default function VisaGuide() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getPublicVisaInfo().then(setInfo).catch(() => setFailed(true));
  }, []);

  const closed = info && info.isOpen === false;
  const apply = () => navigate("/visa/apply");
  const cta = (extra = {}) => (
    <Button onClick={apply} disabled={closed} endIcon={<ArrowForward />} size="large" variant="contained" disableElevation
      sx={{ textTransform: "none", fontWeight: 800, borderRadius: 99, px: 3.5, py: 1.4, fontSize: 16, bgcolor: ORANGE, "&:hover": { bgcolor: "#e85a26" }, ...extra }}>
      Submit visa application
    </Button>
  );

  return (
    <Box sx={{ bgcolor: "#fff" }}>
      {/* HERO */}
      <Box sx={{ background: `linear-gradient(135deg, ${INK} 0%, #123d33 100%)`, color: "#fff", py: { xs: 7, md: 11 } }}>
        <Container maxWidth="lg">
          <Chip label="VISA ASSISTANCE" size="small" sx={{ bgcolor: "rgba(255,255,255,.14)", color: "#fff", fontWeight: 800, letterSpacing: 1.2, mb: 2.5 }} />
          <Typography component="h1" sx={{ fontWeight: 900, fontSize: { xs: 34, md: 54 }, lineHeight: 1.08, maxWidth: 820 }}>
            Your student visa application, done properly and tracked from start to finish.
          </Typography>
          <Typography sx={{ mt: 2.5, maxWidth: 680, fontSize: { xs: 16, md: 18.5 }, lineHeight: 1.65, opacity: 0.88 }}>
            Fill in one guided online form, upload your documents, pay securely, and GIEVA takes your application forward.
            You get a PDF copy by email and an update every time something changes.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 4, alignItems: "center" }}>
            {cta()}
            <Button href="#how-it-works" size="large" sx={{ textTransform: "none", fontWeight: 700, color: "#fff", borderRadius: 99, px: 2.5 }}>How it works</Button>
            {user && <Button component={RouterLink} to="/visa/applications" size="large" sx={{ textTransform: "none", fontWeight: 700, color: "#fff", borderRadius: 99, px: 2.5 }}>My applications</Button>}
          </Box>
          {closed && <Alert severity="warning" sx={{ mt: 3, maxWidth: 560, borderRadius: 3 }}>{info.closedMessage || "We are not accepting new visa applications right now. Please check back soon."}</Alert>}
          <Box sx={{ display: "flex", gap: { xs: 2, md: 4 }, flexWrap: "wrap", mt: 5, opacity: 0.9 }}>
            {[[<Place key="p" fontSize="small" />, "Interviews in Abuja and Lagos"], [<Lock key="l" fontSize="small" />, "Secure payment by Paystack"], [<MailOutline key="m" fontSize="small" />, "PDF copy sent to your email"]].map(([i, t]) => (
              <Box key={t} sx={{ display: "flex", alignItems: "center", gap: 0.8, fontSize: 14.5, fontWeight: 600 }}>{i}{t}</Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* WHAT WE HELP WITH */}
      <Section eyebrow="WHAT GIEVA DOES" title="Everything between “I have my I-20” and “my interview is booked”"
        intro="Visa paperwork is easy to get wrong and expensive to redo. We give you a clear process and a team that checks your work.">
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

      {/* WHO CAN APPLY */}
      <Section tint eyebrow="CRITERIA" title="Before you start" intro="You can use this service if the following describe you. Have these ready and the form takes about 20 minutes.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" }, gap: 4, alignItems: "start" }}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {CRITERIA.map((c) => (
              <Box key={c} sx={{ display: "flex", gap: 1.5, p: 2, borderRadius: 3, bgcolor: "#fff", border: `1px solid ${LINE}` }}>
                <TaskAlt sx={{ color: GREEN, mt: 0.2 }} />
                <Typography sx={{ color: INK, lineHeight: 1.6, fontSize: 15.5 }}>{c}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ p: 3, borderRadius: 4, bgcolor: INK, color: "#fff" }}>
            <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1.5 }}>Documents to upload</Typography>
            {DOCS.map((d) => (
              <Box key={d.t} sx={{ display: "flex", gap: 1.25, mb: 1.75 }}>
                <CheckCircleOutline sx={{ color: "#7ee2ae", mt: 0.2 }} />
                <Box><Typography sx={{ fontWeight: 700 }}>{d.t}</Typography><Typography sx={{ opacity: 0.75, fontSize: 14 }}>{d.d}</Typography></Box>
              </Box>
            ))}
            <Typography sx={{ opacity: 0.7, fontSize: 13, mt: 2, lineHeight: 1.6 }}>
              GIEVA prepares and submits your application. The visa decision belongs to the consular officers, and no one can guarantee an outcome.
            </Typography>
          </Box>
        </Box>
      </Section>

      {/* STEPS */}
      <Section id="how-it-works" eyebrow="STEP BY STEP" title="How the application works" intro="Eight short steps. Your progress saves automatically, so you can leave and come back.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2.5 }}>
          {STEPS.map((s, i) => (
            <Box key={s.t} sx={{ p: 2.75, borderRadius: 4, border: `1px solid ${LINE}`, position: "relative", overflow: "hidden" }}>
              <Typography sx={{ position: "absolute", right: 14, top: 2, fontSize: 64, fontWeight: 900, color: "rgba(30,127,79,.08)", lineHeight: 1 }}>{i + 1}</Typography>
              <Typography sx={{ color: GREEN, fontWeight: 800, fontSize: 12.5, letterSpacing: 1.2, mb: 0.75 }}>STEP {i + 1}</Typography>
              <Typography sx={{ fontWeight: 800, color: INK, fontSize: 17, mb: 0.75 }}>{s.t}</Typography>
              <Typography sx={{ color: MUTED, fontSize: 14.5, lineHeight: 1.6 }}>{s.d}</Typography>
            </Box>
          ))}
        </Box>
      </Section>

      {/* FEES */}
      <Section tint eyebrow="PROCESSING FEE" title="Simple, upfront pricing" intro="You pay once, at the end of the form. The amount shown is exactly what you are charged.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5, maxWidth: 820 }}>
          {[
            { name: "Normal", icon: <Schedule />, fee: info?.normalFee, note: "Standard scheduling of your interview." },
            { name: "Expedited", icon: <Bolt />, fee: info?.expeditedFee, note: "Priority scheduling for when time is short." },
          ].map((p) => (
            <Box key={p.name} sx={{ p: 3.5, borderRadius: 4, bgcolor: "#fff", border: `1px solid ${p.name === "Expedited" ? ORANGE : LINE}` }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: p.name === "Expedited" ? ORANGE : GREEN, fontWeight: 800 }}>{p.icon}{p.name}</Box>
              {info ? (
                <Typography sx={{ fontSize: 40, fontWeight: 900, color: INK, my: 1 }}>{p.fee ? money(p.fee, info.currency) : "Contact us"}</Typography>
              ) : failed ? (
                <Typography sx={{ my: 2, color: MUTED }}>Shown when you apply</Typography>
              ) : <Skeleton variant="text" width={160} height={64} />}
              <Typography sx={{ color: MUTED, fontSize: 14.5 }}>{p.note}</Typography>
            </Box>
          ))}
        </Box>
      </Section>

      {/* AFTER */}
      <Section eyebrow="AFTER YOU SUBMIT" title="You always know where things stand" intro="Each change below is emailed to you and appears on your application timeline.">
        <Box sx={{ display: "grid", gap: 0, maxWidth: 720, position: "relative", pl: 3.5, borderLeft: `2px solid ${LINE}` }}>
          {AFTER.map(([t, d]) => (
            <Box key={t} sx={{ position: "relative", pb: 3 }}>
              <Box sx={{ position: "absolute", left: -(14 + 8), top: 4, width: 14, height: 14, borderRadius: "50%", bgcolor: GREEN, border: "3px solid #fff", boxShadow: `0 0 0 2px ${GREEN}` }} />
              <Typography sx={{ fontWeight: 800, color: INK }}>{t}</Typography>
              <Typography sx={{ color: MUTED, fontSize: 15 }}>{d}</Typography>
            </Box>
          ))}
        </Box>
      </Section>

      {/* FAQ */}
      <Section tint eyebrow="QUESTIONS" title="Frequently asked">
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
            {user ? "Start your application now, or pick up a draft you already began." : "You will be asked to sign in or create a free account first."}
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
