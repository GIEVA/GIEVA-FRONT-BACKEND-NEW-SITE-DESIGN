// pages/VisaApplicationDetail.jsx   Route: /visa/applications/:id
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, Alert, TextField, Snackbar } from "@mui/material";
import { ArrowBack, PictureAsPdf, VisibilityOutlined, Event, Payments, Place } from "@mui/icons-material";

import { NAVY, GREEN, GOLD, MUTED, INK, LINE, SURFACE, Card, StatusChip, money, fmtDate, errMsg } from "../components/visa/visaUi";
import VisaTimeline from "../components/visa/VisaTimeline";
import { DocCard } from "../components/visa/visaSteps";
import { getMyVisaApplication, downloadVisaPdf, getVisaDocumentUrl, resubmitVisaApplication } from "../services/visaService";

const DOCS = [
  ["passportPhoto", "Passport photograph", "image/jpeg,image/png"],
  ["i20", "I-20 document", "application/pdf,image/jpeg,image/png"],
  ["passportBio", "Passport bio-data page", "application/pdf,image/jpeg,image/png"],
];

const Fact = ({ icon, label, value }) => (
  <Card sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
    <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: "rgba(30,127,79,.1)", color: GREEN }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.8, color: MUTED }}>{label}</Typography>
      <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: INK }}>{value || "-"}</Typography>
    </Box>
  </Card>
);

export default function VisaApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => getMyVisaApplication(id).then(setData).catch((e) => setError(errMsg(e, "Could not load this application"))), [id]);
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  if (error) return <Box sx={{ p: 4, maxWidth: 560, mx: "auto" }}><Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert></Box>;
  if (!data) return <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}><CircularProgress sx={{ color: GREEN }} /></Box>;

  const { application: a, events, payments } = data;
  const paid = payments.find((p) => p.status === "success");

  const viewDoc = async (type) => {
    try { const r = await getVisaDocumentUrl(a.id, type); window.open(r.url, "_blank", "noopener"); } catch (e) { setToast({ msg: errMsg(e, "Could not open the file"), severity: "error" }); }
  };
  const sendReply = async () => {
    try {
      setSending(true);
      await resubmitVisaApplication(a.id, reply);
      setToast({ msg: "Sent. We'll review your update.", severity: "success" });
      setReply(""); await load();
    } catch (e) { setToast({ msg: errMsg(e, "Could not send your update"), severity: "error" }); } finally { setSending(false); }
  };

  return (
    <Box sx={{ bgcolor: SURFACE, minHeight: "100vh", pb: 8 }}>
      <Box sx={{ background: `linear-gradient(135deg, ${NAVY}, #12315A)`, color: "#fff", pt: 3, pb: { xs: 9, md: 10 }, px: 2 }}>
        <Box sx={{ maxWidth: 940, mx: "auto" }}>
          <Button onClick={() => navigate("/visa/applications")} startIcon={<ArrowBack />} sx={{ color: "#CBD5E1", textTransform: "none", mb: 1.5, ml: -1 }}>My applications</Button>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography sx={{ color: GOLD, fontWeight: 800, letterSpacing: 1.4, fontSize: 12 }}>APPLICATION</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 26, md: 34 }, letterSpacing: 0.5 }}>{a.applicationCode}</Typography>
              <Typography sx={{ color: "#CBD5E1", fontSize: 14 }}>{[a.firstName, a.middleName, a.lastName].filter(Boolean).join(" ")}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
              <StatusChip status={a.status} size="medium" />
              <Button onClick={() => downloadVisaPdf(a.id, `${a.applicationCode}.pdf`).catch((e) => setToast({ msg: errMsg(e, "Could not download"), severity: "error" }))}
                variant="contained" disableElevation startIcon={<PictureAsPdf />} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 3, bgcolor: "rgba(255,255,255,.14)", "&:hover": { bgcolor: "rgba(255,255,255,.24)" } }}>
                Download PDF
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 940, mx: "auto", px: 2, mt: -5, display: "grid", gap: 2.5 }}>
        {a.statusNote && a.status !== "submitted" && (
          <Alert severity={a.status === "rejected" ? "error" : a.status === "approved" || a.status === "completed" ? "success" : a.status === "info_required" ? "warning" : "info"}
            sx={{ borderRadius: 3, "& .MuiAlert-message": { width: "100%" } }}>
            <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 0.25 }}>Message from the GIEVA team</Typography>
            <Typography sx={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{a.statusNote}</Typography>
          </Alert>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
          <Fact icon={<Place />} label="OFFICE" value={`${a.interviewLocation === "abuja" ? "Abuja" : "Lagos"} · ${a.appointmentType === "expedited" ? "Expedited" : "Normal"}`} />
          <Fact icon={<Event />} label="INTERVIEW" value={a.interviewDate ? fmtDate(a.interviewDate, true) : "Not scheduled yet"} />
          <Fact icon={<Payments />} label="FEE PAID" value={paid ? `${money(paid.totalAmount, paid.currency)} · ${fmtDate(paid.paidAt)}` : "-"} />
        </Box>

        {a.status === "info_required" && (
          <Card sx={{ p: 3, border: "2px solid #F59E0B" }}>
            <Typography sx={{ fontWeight: 900, fontSize: 17, color: NAVY }}>Action needed</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 2 }}>Replace any document we asked about, add a note, then send your update.</Typography>
            <Box sx={{ display: "grid", gap: 1.25, mb: 2 }}>
              {DOCS.map(([type, label, accept]) => (
                <DocCard key={type} applicationId={a.id} type={type} label={label} hint="Not uploaded" accept={accept} replaceOnly
                  doc={a.documents?.[type]} onChange={() => load()} />
              ))}
            </Box>
            <TextField fullWidth multiline rows={3} placeholder="Message to the team (optional)" value={reply} onChange={(e) => setReply(e.target.value)} inputProps={{ maxLength: 1000 }} />
            <Button onClick={sendReply} disabled={sending} variant="contained" disableElevation sx={{ mt: 2, textTransform: "none", fontWeight: 800, borderRadius: 3, bgcolor: GREEN, "&:hover": { bgcolor: "#166d3e" } }}>
              {sending ? "Sending..." : "Send update"}
            </Button>
          </Card>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" }, gap: 2.5, alignItems: "start" }}>
          <Card sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 16, color: NAVY, mb: 2 }}>Progress</Typography>
            <VisaTimeline events={events} />
          </Card>
          <Box sx={{ display: "grid", gap: 2.5 }}>
            <Card sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 16, color: NAVY, mb: 1.5 }}>Your documents</Typography>
              {DOCS.map(([type, label]) => (
                <Box key={type} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, borderBottom: `1px dashed ${LINE}` }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{label}</Typography>
                    <Typography noWrap sx={{ fontSize: 12, color: MUTED }}>{a.documents?.[type]?.name || "Missing"}</Typography>
                  </Box>
                  {a.documents?.[type] && <Button size="small" startIcon={<VisibilityOutlined />} onClick={() => viewDoc(type)} sx={{ textTransform: "none", fontWeight: 700 }}>View</Button>}
                </Box>
              ))}
            </Card>
            <Card sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 16, color: NAVY, mb: 1.5 }}>Payments</Typography>
              {payments.filter((p) => p.status !== "cancelled").map((p) => (
                <Box key={p.id} sx={{ display: "flex", justifyContent: "space-between", gap: 1, py: 1, borderBottom: `1px dashed ${LINE}` }}>
                  <Box><Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{money(p.totalAmount, p.currency)}</Typography><Typography sx={{ fontSize: 11.5, color: MUTED }}>{p.transactionRef}</Typography></Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: p.status === "success" ? GREEN : MUTED, textTransform: "capitalize" }}>{p.status}</Typography>
                </Box>
              ))}
            </Card>
          </Box>
        </Box>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
