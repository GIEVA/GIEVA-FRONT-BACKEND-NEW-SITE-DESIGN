// pages/exams/ExamPaymentInitiate.jsx
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, CircularProgress, Alert, Button, Divider,
} from "@mui/material";
import { initializeExamPayment } from "../../services/examRegistrationService";

const GREEN = "#1E7F4F";
const NAVY  = "#0B1F3A";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
    .format(amount);

export default function ExamPaymentInitiate() {
  const { id } = useParams();
  const { state } = useLocation(); // { registration, amount } passed via navigate()
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | error
  const [error, setError]   = useState("");

  useEffect(() => {
    let cancelled = false;

    initializeExamPayment(id)
      .then((res) => {
        if (cancelled) return;
        if (res?.authorization_url) {
          window.location.href = res.authorization_url; // hand off to Paystack
        } else {
          setStatus("error");
          setError("Payment session could not be created. Please try again.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setError(err?.response?.data?.message || "Unable to start payment.");
      });

    return () => { cancelled = true; };
  }, [id]);

  return (
    <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
      <Paper elevation={0} sx={{ border: "1px solid #E6E9F0", borderRadius: 3, p: 4, maxWidth: 420, width: "100%", textAlign: "center" }}>
        {state?.registration && (
          <>
            <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 0.5 }}>
              {state.registration.examType} Registration
            </Typography>
            <Typography sx={{ color: "#64748B", fontSize: 13, mb: 2 }}>
              Ref: {state.registration.registrationCode}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography sx={{ fontWeight: 800, fontSize: 24, color: GREEN, mb: 3 }}>
              {formatPrice(state.amount ?? state.registration.amount)}
            </Typography>
          </>
        )}

        {status === "loading" && (
          <>
            <CircularProgress sx={{ color: GREEN, mb: 2 }} />
            <Typography sx={{ color: "#64748B" }}>
              Redirecting you to secure payment…
            </Typography>
          </>
        )}

        {status === "error" && (
          <>
            <Alert severity="error" sx={{ borderRadius: 2, mb: 2, textAlign: "left" }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate(-1)}
              sx={{ bgcolor: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: GREEN } }}
            >
              Go Back
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}