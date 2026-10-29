// pages/MyVisaApplications.jsx   Route: /visa/applications
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, Alert } from "@mui/material";
import { Add, ChevronRight, FlightTakeoff } from "@mui/icons-material";

import { NAVY, GREEN, GOLD, MUTED, INK, SURFACE, Card, StatusChip, money, fmtDate, errMsg } from "../components/visa/visaUi";
import { listMyVisaApplications } from "../services/visaService";

export default function MyVisaApplications() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listMyVisaApplications().then((r) => setRows(r.applications)).catch((e) => setError(errMsg(e, "Could not load your applications")));
  }, []);

  const hasDraft = rows?.some((r) => r.status === "draft");

  return (
    <Box sx={{ bgcolor: SURFACE, minHeight: "100vh", pb: 8 }}>
      <Box sx={{ background: `linear-gradient(135deg, ${NAVY}, #12315A)`, color: "#fff", pt: { xs: 4, md: 6 }, pb: { xs: 8, md: 9 }, px: 2 }}>
        <Box sx={{ maxWidth: 860, mx: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ color: GOLD, fontWeight: 800, letterSpacing: 1.4, fontSize: 12 }}>VISA SERVICE</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 26, md: 34 } }}>My visa applications</Typography>
          </Box>
          <Button onClick={() => navigate("/visa/apply")} variant="contained" disableElevation startIcon={<Add />}
            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 3, bgcolor: GREEN, px: 2.5, "&:hover": { bgcolor: "#166d3e" } }}>
            {hasDraft ? "Resume draft" : "New application"}
          </Button>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 860, mx: "auto", px: 2, mt: -5 }}>
        {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}
        {!rows && !error && <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress sx={{ color: GREEN }} /></Box>}

        {rows?.length === 0 && (
          <Card sx={{ p: 5, textAlign: "center" }}>
            <FlightTakeoff sx={{ fontSize: 46, color: GOLD }} />
            <Typography sx={{ fontWeight: 900, fontSize: 20, color: NAVY, mt: 1 }}>No applications yet</Typography>
            <Typography sx={{ color: MUTED, mt: 0.5, mb: 3 }}>Start your visa application. It takes about 15 minutes and saves as you go.</Typography>
            <Button onClick={() => navigate("/visa/apply")} variant="contained" disableElevation sx={{ textTransform: "none", fontWeight: 800, borderRadius: 3, bgcolor: NAVY, "&:hover": { bgcolor: GREEN } }}>Start application</Button>
          </Card>
        )}

        <Box sx={{ display: "grid", gap: 1.75 }}>
          {rows?.map((a) => (
            <Card key={a.id} onClick={() => navigate(a.status === "draft" ? "/visa/apply" : `/visa/applications/${a.id}`)}
              sx={{ p: 2.5, cursor: "pointer", transition: "all .15s", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 30px rgba(15,23,42,.10)" } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: NAVY }}>{a.applicationCode || "Draft application"}</Typography>
                    <StatusChip status={a.status} />
                  </Box>
                  <Typography sx={{ fontSize: 13.5, color: INK }}>{[a.firstName, a.lastName].filter(Boolean).join(" ") || "Not named yet"}</Typography>
                  <Typography sx={{ fontSize: 12.5, color: MUTED, mt: 0.25 }}>
                    {a.status === "draft" ? `Last edited ${fmtDate(a.updatedAt)}` : `Submitted ${fmtDate(a.submittedAt)} · ${a.appointmentType} · ${a.interviewLocation} · ${money(a.applicationFeeAmount, a.currency)}`}
                  </Typography>
                  {a.status === "interview_scheduled" && a.interviewDate && <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#0E7490", mt: 0.5 }}>Interview: {fmtDate(a.interviewDate, true)}</Typography>}
                </Box>
                <ChevronRight sx={{ color: MUTED }} />
              </Box>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
