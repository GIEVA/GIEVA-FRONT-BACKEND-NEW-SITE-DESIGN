import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Alert,
} from "@mui/material";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  // ── Guard against the ACTUAL duplicate request, not just the
  //    state update after it. ──
  //
  // The previous `cancelled` flag (declared fresh inside the effect
  // body) only stopped setState from firing on an unmounted instance
  // — it did nothing to stop the SECOND network request from going
  // out in the first place. Under React 18 StrictMode, the effect
  // runs, cleans up, and runs again on initial mount, so two real
  // requests for the same token were always being sent to the
  // backend; only one of their responses ever got applied to state.
  //
  // A useRef survives across that mount→unmount→remount cycle within
  // the same component instance (refs are not reset by re-running the
  // effect), so checking it BEFORE firing the request actually
  // prevents the second request from ever being sent.
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    if (hasRequestedRef.current) {
      // StrictMode's remount — the first request is already in
      // flight (or already completed). Don't send it again.
      return;
    }
    hasRequestedRef.current = true;

    let cancelled = false; // still useful to avoid setState-after-unmount warnings

    const verify = async () => {
      try {
        const res = await API.get(`/api/verify/${token}`);
        if (!cancelled) {
          setStatus("success");
          setMessage(res.data.message || "Email verified successfully");
          setTimeout(() => navigate("/login"), 3000);
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            err.response?.data?.message || "Verification failed or link expired"
          );
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
      // NOTE: hasRequestedRef is intentionally NOT reset here — that's
      // the whole point. It must persist across StrictMode's
      // mount→unmount→remount so the second mount sees it's already
      // been requested and skips firing again.
    };
  }, [token, navigate]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f9fafb",
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 4,
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        {/* Loading */}
        {status === "loading" && (
          <>
            <CircularProgress sx={{ color: "#1E7F4F" }} />
            <Typography mt={2} color="text.secondary">
              Verifying your account...
            </Typography>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Redirecting to login...
            </Typography>

            <Button
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                bgcolor: "#1E7F4F",
                "&:hover": { bgcolor: "#145A32" },
              }}
              onClick={() => navigate("/login")}
            >
              Go to Login
            </Button>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              {message}
            </Alert>

            <Button
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                bgcolor: "#1E7F4F",
                "&:hover": { bgcolor: "#145A32" },
              }}
              onClick={() => navigate("/register")}
            >
              Register Again
            </Button>

            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate("/forgot-password")}
            >
              Resend Verification Link
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default VerifyEmail;
