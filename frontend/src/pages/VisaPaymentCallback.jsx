// pages/VisaPaymentCallback.jsx
// Route: /visa/payment/callback   (Paystack redirects here with ?reference=...&trxref=...)
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { CheckCircle, ErrorOutline, MailOutline } from "@mui/icons-material";

import { NAVY, GREEN, MUTED, SURFACE, Card, money, errMsg } from "../components/visa/visaUi";
import { verifyVisaPayment, downloadVisaPdf } from "../services/visaService";

export default function VisaPaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reference = params.get("reference") || params.get("trxref");
  const [state, setState] = useState({ phase: "verifying" });
  const ran = useRef(false); // StrictMode runs effects twice in dev

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!reference) return setState({ phase: "failed", message: "No payment reference was found." });
    verifyVisaPayment(reference)
      .then((r) => setState({ phase: "success", payment: r.payment, application: r.application }))
      .catch((err) => setState({ phase: "failed", message: errMsg(err, "We could not confirm your payment.") }));
  }, [reference]);

  const { phase, payment, application, message } = state;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: SURFACE, display: "grid", placeItems: "center", p: 2 }}>
      <Card sx={{ maxWidth: 480, width: "100%", p: { xs: 3, sm: 4.5 }, textAlign: "center" }}>
        {phase === "verifying" && (
          <>
            <CircularProgress sx={{ color: GREEN }} />
            <Typography sx={{ fontWeight: 900, fontSize: 20, color: NAVY, mt: 2.5 }}>Confirming your payment</Typography>
            <Typography sx={{ color: MUTED, mt: 0.5, fontSize: 14 }}>Please don't close this page.</Typography>
          </>
        )}
        {phase === "success" && (
          <>
            <CheckCircle sx={{ fontSize: 64, color: GREEN }} />
            <Typography sx={{ fontWeight: 900, fontSize: 24, color: NAVY, mt: 1 }}>Application submitted</Typography>
            <Typography sx={{ color: MUTED, mt: 0.75, fontSize: 14.5 }}>Your payment of <b>{money(payment?.totalAmount, payment?.currency)}</b> was successful.</Typography>
            {application?.applicationCode && (
              <Box sx={{ mt: 2.5, p: 1.75, borderRadius: 3, bgcolor: "rgba(30,127,79,.07)", border: `1px dashed ${GREEN}` }}>
                <Typography sx={{ fontSize: 11.5, color: MUTED, fontWeight: 800, letterSpacing: 1 }}>APPLICATION NUMBER</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 22, color: NAVY, letterSpacing: 1 }}>{application.applicationCode}</Typography>
              </Box>
            )}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "center", color: MUTED, mt: 2.5 }}>
              <MailOutline sx={{ fontSize: 18 }} /><Typography sx={{ fontSize: 13 }}>A receipt and a PDF copy are on their way to your email.</Typography>
            </Box>
            <Box sx={{ display: "grid", gap: 1.25, mt: 3.5 }}>
              <Button variant="contained" disableElevation onClick={() => navigate(`/visa/applications/${application?.id || ""}`)} sx={{ textTransform: "none", fontWeight: 800, py: 1.25, borderRadius: 3, bgcolor: NAVY, "&:hover": { bgcolor: GREEN } }}>Track my application</Button>
              {application?.id && <Button onClick={() => downloadVisaPdf(application.id, `${application.applicationCode}.pdf`).catch(() => {})} sx={{ textTransform: "none", fontWeight: 700 }}>Download PDF copy</Button>}
            </Box>
          </>
        )}
        {phase === "failed" && (
          <>
            <ErrorOutline sx={{ fontSize: 60, color: "#B91C1C" }} />
            <Typography sx={{ fontWeight: 900, fontSize: 22, color: NAVY, mt: 1 }}>Payment not completed</Typography>
            <Typography sx={{ color: MUTED, mt: 0.75, fontSize: 14.5 }}>{message} Your answers are saved. You have not been charged for an incomplete payment.</Typography>
            <Box sx={{ display: "grid", gap: 1.25, mt: 3.5 }}>
              <Button variant="contained" disableElevation onClick={() => navigate("/visa/apply")} sx={{ textTransform: "none", fontWeight: 800, py: 1.25, borderRadius: 3, bgcolor: NAVY, "&:hover": { bgcolor: GREEN } }}>Resume my application</Button>
              <Button onClick={() => navigate("/visa/applications")} sx={{ textTransform: "none", fontWeight: 700 }}>My applications</Button>
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
}
