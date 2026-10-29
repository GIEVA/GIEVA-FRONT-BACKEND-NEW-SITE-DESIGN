// components/visa/VisaAdminDetail.jsx
// Drawer with the full application for admins: data, documents, timeline, internal notes, payments,
// and the status-update dialog (the applicant is emailed on every change).

import { useCallback, useEffect, useState } from "react";
import {
  Drawer, Box, Typography, IconButton, Button, Tabs, Tab, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, TextField, FormControlLabel, Switch, Alert, Snackbar, Divider,
} from "@mui/material";
import { Close, PictureAsPdf, MarkEmailRead, SwapHoriz, VisibilityOutlined, Send } from "@mui/icons-material";

import { NAVY, GREEN, GOLD, MUTED, INK, LINE, StatusChip, STATUS, money, fmtDate, errMsg, Txt } from "./visaUi";
import VisaTimeline from "./VisaTimeline";
import {
  adminGetVisaApplication, adminUpdateVisaStatus, adminAddVisaNote, adminGetVisaDocumentUrl,
  adminDownloadVisaPdf, adminResendVisaEmail,
} from "../../services/visaService";

const KV = ({ l, v }) => (
  <Box sx={{ py: 0.9, borderBottom: `1px dashed ${LINE}`, display: "grid", gridTemplateColumns: "150px 1fr", gap: 1.5 }}>
    <Typography sx={{ fontSize: 12.5, color: MUTED }}>{l}</Typography>
    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: INK, wordBreak: "break-word" }}>{v || "-"}</Typography>
  </Box>
);
const H = ({ children }) => <Typography sx={{ fontWeight: 900, fontSize: 13, letterSpacing: 1, color: NAVY, mt: 3, mb: 0.75 }}>{String(children).toUpperCase()}</Typography>;
const cap = (s) => (s ? String(s).replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "");
const name = (o = {}) => [o.lastName, o.otherNames || o.firstName].filter(Boolean).join(" ");

const Data = ({ a }) => (
  <>
    <H>Appointment</H>
    <KV l="Office" v={cap(a.interviewLocation)} /><KV l="Type" v={cap(a.appointmentType)} />
    <H>Bio-data</H>
    <KV l="Name" v={[a.firstName, a.middleName, a.lastName].filter(Boolean).join(" ")} /><KV l="Gender" v={cap(a.gender)} />
    <KV l="Date of birth" v={fmtDate(a.dateOfBirth)} /><KV l="Phone" v={a.phone} /><KV l="Alt. phone" v={a.altPhone} />
    <KV l="Email" v={a.email} /><KV l="Address" v={a.address} />
    <H>Travel history</H>
    {(a.travelHistory || []).filter((t) => t.country).map((t, i) => <KV key={i} l={t.country} v={`${fmtDate(t.from)} to ${fmtDate(t.to)}`} />)}
    {!(a.travelHistory || []).some((t) => t.country) && <KV l="Countries" v="None declared" />}
    <H>Sponsors</H>
    <KV l="Trip paid by" v={`${cap(a.tripSponsor?.type)} · ${name(a.tripSponsor)}`} />
    <KV l="Sponsor contact" v={[a.tripSponsor?.phone, a.tripSponsor?.email].filter(Boolean).join(" · ")} />
    <KV l="Education paid by" v={`${cap(a.educationSponsor?.type)} · ${name(a.educationSponsor)}`} />
    <KV l="Sponsor contact" v={[a.educationSponsor?.phone, a.educationSponsor?.email].filter(Boolean).join(" · ")} />
    <KV l="Scholarship" v={a.educationSponsor?.onScholarship ? `Yes (US$ ${a.educationSponsor.scholarshipAmountUsd || "-"})` : "No"} />
    {[["Current job", a.currentJob], ["Previous job", a.previousJob]].map(([t, j]) => (
      <Box key={t}>
        <H>{t}</H>
        <KV l="Status" v={cap(j?.status)} />
        {j?.status === "employed" && <>
          <KV l="Organization" v={j.organizationName} /><KV l="Address" v={j.organizationAddress} /><KV l="Role" v={j.jobDescription} />
          <KV l="Supervisor" v={[j.supervisorLastName, j.supervisorOtherNames].filter(Boolean).join(" ")} /><KV l="Org. phone" v={j.organizationPhone} />
          <KV l="Monthly income" v={j.monthlyIncome !== "" && j.monthlyIncome != null ? money(j.monthlyIncome) : ""} /><KV l="Period" v={`${fmtDate(j.fromDate)} to ${fmtDate(j.toDate)}`} />
        </>}
      </Box>
    ))}
    <H>Family</H>
    <KV l="Father" v={`${[a.father?.firstName, a.father?.lastName].filter(Boolean).join(" ")} ${a.father?.email || ""}`} />
    <KV l="Mother" v={`${[a.mother?.firstName, a.mother?.lastName].filter(Boolean).join(" ")} ${a.mother?.email || ""}`} />
    <H>Education</H>
    {(a.schools || []).filter((s) => s.name).map((s, i) => (
      <Box key={i}><KV l={`School ${i + 1}`} v={s.name} /><KV l="Attended" v={`${fmtDate(s.from)} to ${fmtDate(s.to)}`} /><KV l="Certificate" v={s.certificate} /><KV l="Contact" v={[s.phone, s.email].filter(Boolean).join(" · ")} /></Box>
    ))}
    <H>Awards</H>
    {(a.awards || []).filter((x) => x.name).map((x, i) => <KV key={i} l={fmtDate(x.dateObtained)} v={x.name} />)}
    <H>Volunteer</H>
    {(a.volunteer || []).filter((x) => x.organization).map((x, i) => <KV key={i} l={x.organization} v={`${fmtDate(x.from)} to ${fmtDate(x.to)}`} />)}
    <H>Relatives in the USA</H>
    {(a.usRelatives || []).filter((x) => x.lastName).map((x, i) => <KV key={i} l={name(x)} v={`${x.relationship || ""} · ${x.stateOfResidence || ""}`} />)}
    <H>Social media</H>
    {["facebook", "instagram", "twitter", "linkedin"].map((k) => <KV key={k} l={cap(k)} v={a.social?.[k]} />)}
    <H>References</H>
    {(a.references || []).map((r, i) => <Box key={i}><KV l={`Reference ${i + 1}`} v={name(r)} /><KV l="Contact" v={[r.phone, r.email].filter(Boolean).join(" · ")} /><KV l="Address" v={r.address} /></Box>)}
  </>
);

export default function VisaAdminDetail({ id, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [form, setForm] = useState({ status: "", note: "", interviewDate: "", notify: true });
  const [busy, setBusy] = useState(false);
  const [noteText, setNoteText] = useState("");

  const load = useCallback(async () => {
    try { setData(await adminGetVisaApplication(id)); } catch (e) { setToast({ msg: errMsg(e, "Could not load"), severity: "error" }); }
  }, [id]);
  useEffect(() => { setData(null); setTab(0); if (id) load(); }, [id, load]);

  const a = data?.application;
  const needsNote = ["info_required", "rejected"].includes(form.status);

  const submitStatus = async () => {
    try {
      setBusy(true);
      const res = await adminUpdateVisaStatus(id, { ...form, interviewDate: form.interviewDate ? new Date(form.interviewDate).toISOString() : undefined });
      setToast({ msg: res.emailed ? "Status updated and applicant emailed" : "Status updated (email not sent)", severity: res.emailed ? "success" : "warning" });
      setStatusOpen(false); setForm({ status: "", note: "", interviewDate: "", notify: true });
      await load(); onChanged?.();
    } catch (e) { setToast({ msg: errMsg(e, "Could not update"), severity: "error" }); } finally { setBusy(false); }
  };
  const viewDoc = async (type) => {
    try { const r = await adminGetVisaDocumentUrl(id, type); window.open(r.url, "_blank", "noopener"); } catch (e) { setToast({ msg: errMsg(e, "Could not open"), severity: "error" }); }
  };
  const addNote = async () => {
    if (!noteText.trim()) return;
    try { await adminAddVisaNote(id, noteText); setNoteText(""); await load(); } catch (e) { setToast({ msg: errMsg(e, "Could not save the note"), severity: "error" }); }
  };

  return (
    <Drawer anchor="right" open={!!id} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", md: 760 }, bgcolor: "#fff" } }}>
      {!a ? <Box sx={{ p: 6, textAlign: "center" }}><CircularProgress sx={{ color: GREEN }} /></Box> : (
        <>
          <Box sx={{ p: 2.5, background: `linear-gradient(135deg, ${NAVY}, #12315A)`, color: "#fff" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography sx={{ color: GOLD, fontWeight: 800, fontSize: 11.5, letterSpacing: 1.2 }}>{a.applicationCode}</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 22 }}>{[a.firstName, a.lastName].filter(Boolean).join(" ")}</Typography>
                <Box sx={{ mt: 1 }}><StatusChip status={a.status} /></Box>
              </Box>
              <IconButton onClick={onClose} sx={{ color: "#fff" }}><Close /></IconButton>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
              <Button disabled={!data.allowedNext.length} onClick={() => { setForm({ status: data.allowedNext[0], note: "", interviewDate: "", notify: true }); setStatusOpen(true); }}
                variant="contained" disableElevation startIcon={<SwapHoriz />} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2.5, bgcolor: GREEN, "&:hover": { bgcolor: "#166d3e" } }}>Update status</Button>
              <Button onClick={() => adminDownloadVisaPdf(a.id, `${a.applicationCode || a.id}.pdf`).catch((e) => setToast({ msg: errMsg(e, "Could not download"), severity: "error" }))}
                startIcon={<PictureAsPdf />} sx={{ textTransform: "none", fontWeight: 700, color: "#fff", bgcolor: "rgba(255,255,255,.12)", borderRadius: 2.5 }}>PDF</Button>
              <Button onClick={async () => { try { const r = await adminResendVisaEmail(a.id); setToast({ msg: r.message, severity: "success" }); } catch (e) { setToast({ msg: errMsg(e, "Email failed"), severity: "error" }); } }}
                startIcon={<MarkEmailRead />} sx={{ textTransform: "none", fontWeight: 700, color: "#fff", bgcolor: "rgba(255,255,255,.12)", borderRadius: 2.5 }}>Resend receipt</Button>
            </Box>
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ px: 1, borderBottom: `1px solid ${LINE}`, "& .Mui-selected": { color: NAVY }, "& .MuiTabs-indicator": { bgcolor: GREEN } }}>
            {["Application", "Documents", "Timeline", `Notes (${data.notes.length})`, "Payments"].map((t) => <Tab key={t} label={t} sx={{ textTransform: "none", fontWeight: 700 }} />)}
          </Tabs>

          <Box sx={{ p: 2.5, overflowY: "auto" }}>
            {tab === 0 && <Data a={a} />}
            {tab === 1 && ["passportPhoto", "i20", "passportBio"].map((t) => (
              <Box key={t} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, borderBottom: `1px dashed ${LINE}` }}>
                <Box><Typography sx={{ fontWeight: 800, fontSize: 14 }}>{{ passportPhoto: "Passport photograph", i20: "I-20 document", passportBio: "Passport bio-data page" }[t]}</Typography>
                  <Typography sx={{ fontSize: 12, color: MUTED }}>{a.documents?.[t] ? `${a.documents[t].name} · ${(a.documents[t].size / 1024).toFixed(0)} KB · ${fmtDate(a.documents[t].uploadedAt)}` : "Missing"}</Typography></Box>
                {a.documents?.[t] && <Button startIcon={<VisibilityOutlined />} onClick={() => viewDoc(t)} sx={{ textTransform: "none", fontWeight: 700 }}>Open</Button>}
              </Box>
            ))}
            {tab === 2 && <VisaTimeline events={data.events} />}
            {tab === 3 && (
              <>
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>Internal only. Applicants never see notes.</Alert>
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <TextField fullWidth size="small" multiline maxRows={4} placeholder="Add an internal note" value={noteText} onChange={(e) => setNoteText(e.target.value)} inputProps={{ maxLength: 3000 }} />
                  <Button onClick={addNote} variant="contained" disableElevation sx={{ bgcolor: NAVY, "&:hover": { bgcolor: GREEN } }}><Send fontSize="small" /></Button>
                </Box>
                {data.notes.map((n) => (
                  <Box key={n.id} sx={{ p: 1.5, mb: 1.25, borderRadius: 2.5, bgcolor: "#F8FAFC", border: `1px solid ${LINE}` }}>
                    <Typography sx={{ fontSize: 13.5, whiteSpace: "pre-wrap" }}>{n.body}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: MUTED, mt: 0.5 }}>{n.author?.fullName || [n.author?.firstName, n.author?.lastName].filter(Boolean).join(" ") || `Admin #${n.authorId}`} · {fmtDate(n.createdAt, true)}</Typography>
                  </Box>
                ))}
              </>
            )}
            {tab === 4 && data.payments.map((p) => (
              <Box key={p.id} sx={{ p: 1.5, mb: 1.25, borderRadius: 2.5, border: `1px solid ${LINE}` }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}><Typography sx={{ fontWeight: 900 }}>{money(p.totalAmount, p.currency)}</Typography><Typography sx={{ fontWeight: 800, color: p.status === "success" ? GREEN : MUTED, textTransform: "capitalize" }}>{p.status}</Typography></Box>
                <Typography sx={{ fontSize: 12, color: MUTED }}>{p.paymentCode} · {p.transactionRef}</Typography>
                <Typography sx={{ fontSize: 12, color: MUTED }}>{p.paymentMethod ? `${p.paymentMethod} · ` : ""}{fmtDate(p.paidAt || p.createdAt, true)}</Typography>
              </Box>
            ))}
          </Box>

          <Dialog open={statusOpen} onClose={() => !busy && setStatusOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ fontWeight: 900 }}>Update status</DialogTitle>
            <DialogContent>
              <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
                <Txt select label="New status" value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  {data.allowedNext.map((s) => <MenuItem key={s} value={s}>{STATUS[s]?.label || s}</MenuItem>)}
                </Txt>
                {form.status === "interview_scheduled" && (
                  <Txt required type="datetime-local" label="Interview date & time" value={form.interviewDate} onChange={(v) => setForm((f) => ({ ...f, interviewDate: v }))} />
                )}
                <Txt required={needsNote} multiline rows={4} label={needsNote ? "Message to applicant (required)" : "Message to applicant (optional)"}
                  value={form.note} onChange={(v) => setForm((f) => ({ ...f, note: v }))} inputProps={{ maxLength: 2000 }}
                  helperText="This text is shown on their dashboard and emailed to them." />
                <FormControlLabel control={<Switch checked={form.notify} onChange={(e) => setForm((f) => ({ ...f, notify: e.target.checked }))} />} label="Email the applicant about this change" />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setStatusOpen(false)} disabled={busy} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
              <Button onClick={submitStatus} disabled={busy || !form.status || (needsNote && !form.note.trim()) || (form.status === "interview_scheduled" && !form.interviewDate)}
                variant="contained" disableElevation sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2.5, bgcolor: GREEN, "&:hover": { bgcolor: "#166d3e" } }}>
                {busy ? "Saving..." : "Save & notify"}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>{toast?.msg}</Alert>
      </Snackbar>
    </Drawer>
  );
}
