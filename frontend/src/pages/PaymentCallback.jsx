// pages/PaymentCallback.jsx
// Paystack redirects here after payment: /payment/callback?reference=xxx&trxref=xxx
// This page calls POST /api/payments/verify and shows the result.

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Typography, Button, Paper, CircularProgress,
  Alert, Divider,
} from "@mui/material";
import {
  CheckCircleOutline, Cancel, ArrowForward,
  Download, Home, Refresh,
} from "@mui/icons-material";
import { verifyPayment, downloadReceipt } from "../services/Courseservice";

const BRAND     = "#14532d";
const BRAND_MID = "#16a34a";
const BRAND_LIGHT = "#bbf7d0";
const SURFACE   = "#f9fafb";
const CARD      = "#ffffff";
const BORDER    = "#e5e7eb";
const TEXT_PRIMARY   = "#111827";
const TEXT_SECONDARY = "#6b7280";
const TEXT_MUTED     = "#9ca3af";

const formatPrice = (amount) =>
  amount != null ? `₦${Number(amount).toLocaleString("en-NG")}` : "—";

const PaymentCallback = () => {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();

  // Paystack sends ?reference=xxx OR ?trxref=xxx (both point to the same transaction)
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const [status, setStatus]       = useState("verifying"); // "verifying" | "success" | "failed" | "no_ref"
  const [result, setResult]       = useState(null);         // { amountPaid, courseUnlocked, paymentId }
  const [error, setError]         = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!reference) {
      setStatus("no_ref");
      return;
    }

    const verify = async () => {
      try {
        const data = await verifyPayment(reference);
        setResult(data);
        setStatus("success");
      } catch (err) {
        const msg = err?.response?.data?.message || "Payment verification failed.";
        // "Payment already verified" is actually a success — idempotent
        if (msg.toLowerCase().includes("already verified")) {
          setResult(err?.response?.data || {});
          setStatus("success");
        } else {
          setError(msg);
          setStatus("failed");
        }
      }
    };

    verify();
  }, [reference]);

  const handleDownload = async () => {
    if (!result?.paymentId) return;
    setDownloading(true);
    try {
      await downloadReceipt(result.paymentId);
    } catch {
      // silently fail — receipt download is non-critical
    } finally {
      setDownloading(false);
    }
  };

  // ── Verifying state ──────────────────────────────────────────────────────
  if (status === "verifying") {
    return (
      <Box bgcolor={SURFACE} minHeight="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
        <Paper elevation={0} sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: "20px", p: 5, maxWidth: 420, width: "100%", textAlign: "center" }}>
          <CircularProgress sx={{ color: BRAND_MID, mb: 3 }} size={48} thickness={4} />
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY, mb: 0.5 }}>
            Verifying your payment…
          </Typography>
          <Typography sx={{ fontSize: 14, color: TEXT_SECONDARY }}>
            Please wait while we confirm your transaction with Paystack.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // ── No reference ────────────────────────────────────────────────────────
  if (status === "no_ref") {
    return (
      <Box bgcolor={SURFACE} minHeight="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
        <Paper elevation={0} sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: "20px", p: 5, maxWidth: 420, width: "100%", textAlign: "center" }}>
          <Typography sx={{ fontSize: 44, mb: 2 }}>⚠️</Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY, mb: 1 }}>
            Invalid payment link
          </Typography>
          <Typography sx={{ fontSize: 14, color: TEXT_SECONDARY, mb: 3 }}>
            No payment reference found. If you completed a payment, please contact support.
          </Typography>
          <Button onClick={() => navigate("/dashboard")} startIcon={<Home />}
            sx={{ textTransform: "none", bgcolor: BRAND, color: "white", fontWeight: 700, borderRadius: "10px", px: 3, boxShadow: "none", "&:hover": { bgcolor: BRAND_MID, boxShadow: "none" } }}>
            Go to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  // ── Failed state ─────────────────────────────────────────────────────────
  if (status === "failed") {
    return (
      <Box bgcolor={SURFACE} minHeight="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
        <Paper elevation={0} sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: "20px", p: 5, maxWidth: 440, width: "100%", textAlign: "center" }}>
          <Box sx={{ width: 80, height: 80, borderRadius: "50%", bgcolor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
            <Cancel sx={{ fontSize: 42, color: "#dc2626" }} />
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 900, color: TEXT_PRIMARY, mb: 1, letterSpacing: "-0.4px" }}>
            Payment unsuccessful
          </Typography>
          <Typography sx={{ fontSize: 14, color: TEXT_SECONDARY, mb: 3 }}>
            We couldn't verify your payment. No charge has been made to your account.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "10px", textAlign: "left" }}>{error}</Alert>
          )}
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Button onClick={() => navigate("/courses")} variant="contained"
              sx={{ bgcolor: BRAND, color: "white", borderRadius: "12px", textTransform: "none", fontWeight: 700, py: 1.3, boxShadow: "none", "&:hover": { bgcolor: BRAND_MID, boxShadow: "none" } }}>
              Browse Courses
            </Button>
            <Button onClick={() => navigate("/dashboard")} startIcon={<Home />}
              sx={{ textTransform: "none", color: TEXT_SECONDARY, fontWeight: 600, border: `1px solid ${BORDER}`, borderRadius: "12px", py: 1.3 }}>
              Go to Dashboard
            </Button>
          </Box>
          <Typography sx={{ fontSize: 12, color: TEXT_MUTED, mt: 3 }}>
            Reference: <code style={{ fontFamily: "monospace" }}>{reference}</code>
          </Typography>
        </Paper>
      </Box>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  return (
    <Box bgcolor={SURFACE} minHeight="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Paper elevation={0}
        sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: "20px", p: { xs: 3, sm: 5 }, maxWidth: 460, width: "100%", textAlign: "center" }}>

        {/* Success icon */}
        <Box sx={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #dcfce7, #bbf7d0)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3, boxShadow: "0 4px 20px rgba(22,163,74,0.2)" }}>
          <CheckCircleOutline sx={{ fontSize: 48, color: BRAND_MID }} />
        </Box>

        <Typography sx={{ fontSize: 24, fontWeight: 900, color: TEXT_PRIMARY, mb: 0.5, letterSpacing: "-0.5px" }}>
          You're enrolled! 🎉
        </Typography>
        <Typography sx={{ fontSize: 14, color: TEXT_SECONDARY, mb: 3 }}>
          Your payment was successful and you now have full access to the course.
        </Typography>

        {/* Payment summary */}
        <Box sx={{ bgcolor: "#f0fdf4", border: `1px solid ${BRAND_LIGHT}`, borderRadius: "14px", p: 2.5, mb: 3, textAlign: "left" }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, mb: 1.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Payment Summary
          </Typography>
          {[
            { label: "Amount paid",  value: formatPrice(result?.amountPaid) },
            { label: "Reference",    value: reference },
            { label: "Status",       value: "✅ Confirmed" },
          ].map(({ label, value }) => (
            <Box key={label} display="flex" justifyContent="space-between" py={0.8} sx={{ borderBottom: `1px solid ${BORDER}`, "&:last-child": { borderBottom: "none" } }}>
              <Typography sx={{ fontSize: 13, color: TEXT_SECONDARY }}>{label}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: label === "Reference" ? "monospace" : "inherit", fontSize: label === "Reference" ? 11 : 13 }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Alert severity="success" sx={{ mb: 3, borderRadius: "12px", textAlign: "left" }}>
          A receipt has been emailed to you. You can also download it below.
        </Alert>

        {/* Actions */}
        <Box display="flex" flexDirection="column" gap={1.5}>
          <Button variant="contained" endIcon={<ArrowForward />}
            onClick={() => navigate("/dashboard")}
            sx={{ bgcolor: BRAND, color: "white", borderRadius: "12px", textTransform: "none", fontWeight: 700, py: 1.5, fontSize: 15, boxShadow: "none", "&:hover": { bgcolor: BRAND_MID, boxShadow: "none" } }}>
            Start Learning Now
          </Button>

          {result?.paymentId && (
            <Button variant="outlined" startIcon={downloading ? <CircularProgress size={14} /> : <Download />}
              onClick={handleDownload} disabled={downloading}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 600, py: 1.2, borderColor: BORDER, color: TEXT_SECONDARY, "&:hover": { borderColor: TEXT_SECONDARY, bgcolor: SURFACE } }}>
              {downloading ? "Downloading…" : "Download Receipt (PDF)"}
            </Button>
          )}

          <Button onClick={() => navigate("/courses")}
            sx={{ textTransform: "none", color: TEXT_MUTED, fontWeight: 500, fontSize: 13 }}>
            Browse more courses
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PaymentCallback;
