import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Button, Alert, Paper } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { verifyHealsPayment } from "../services/healsPaymentService";

export default function HealsPaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reference = params.get("reference") || params.get("trxref");
  const ran = useRef(false); // avoids a double call in React StrictMode
  const [state, setState] = useState({ loading: true, ok: false, message: "", applicationId: null });

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!reference) {
      setState({ loading: false, ok: false, message: "Missing payment reference." });
      return;
    }

    verifyHealsPayment(reference)
      .then((res) =>
        setState({
          loading: false,
          ok: true,
          message: res.message,
          applicationId: res.payment?.applicationId,
        })
      )
      .catch((err) =>
        setState({
          loading: false,
          ok: false,
          message: err.response?.data?.message || "We couldn't verify your payment.",
        })
      );
  }, [reference]);

  return (
    <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
      <Paper sx={{ p: 5, maxWidth: 480, textAlign: "center", borderRadius: 4 }}>
        {state.loading ? (
          <>
            <CircularProgress sx={{ mb: 3 }} />
            <Typography fontWeight={700}>Confirming your payment…</Typography>
            <Typography variant="body2" color="text.secondary">Please don't close this page.</Typography>
          </>
        ) : state.ok ? (
          <>
            <CheckCircle sx={{ fontSize: 56, color: "success.main", mb: 2 }} />
            <Typography variant="h6" fontWeight={800} mb={1}>Application submitted!</Typography>
            <Typography color="text.secondary" mb={3}>
              {state.message} A confirmation has been sent to your email.
            </Typography>
            <Button variant="contained" onClick={() => navigate(`/heals/application/${state.applicationId}`)}>
              View Application
            </Button>
          </>
        ) : (
          <>
            <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>{state.message}</Alert>
            <Typography variant="body2" color="text.secondary" mb={3}>
              If you were charged, don't pay again. Your application will be submitted automatically
              once the payment is confirmed.
            </Typography>
            <Button variant="outlined" onClick={() => navigate("/heals/applications")}>
              My Applications
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}