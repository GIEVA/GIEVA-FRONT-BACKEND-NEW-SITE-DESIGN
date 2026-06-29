import { useEffect, useState } from "react";
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

  // ── NOTE: a previous version of this file added a `hasRequestedRef`
  //    guard to stop StrictMode's double-mount from firing two
  //    requests. That guard has been REMOVED here, for two reasons:
  //
  //    1. The backend (`verifyAccount`) is now idempotent — a second
  //       request for an already-verified token returns the same
  //       success response instead of a false "expired" error. So
  //       there's no longer any need to suppress the duplicate
  //       request on the frontend; the backend handles it safely.
  //
  //    2. The ref-based guard is actively HARMFUL under dev hot-reload
  //       (Vite/CRA fast refresh): if this component is hot-reloaded
  //       without a full page navigation, the ref can persist as
  //       `true` from a previous mount, permanently skipping the
  //       effect's request on every future mount — which is exactly
  //       what produced the "stuck on Verifying your account...
  //       forever" symptom. A plain `cancelled` flag (scoped fresh
  //       inside each effect run) is sufficient and doesn't have
  //       this failure mode.
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        // `params: { _t: Date.now() }` busts any HTTP/browser cache
        // for this URL. Verification links are one-time-use tokens —
        // they must NEVER be served from cache. Without this, a
        // browser can return a cached 304 for the exact same URL on
        // a later visit instead of re-hitting the server (confirmed
        // in the network log: status 304, served from cache).
        const res = await API.get(`/api/verify/${token}`, {
          params: { _t: Date.now() },
        });

        if (!cancelled) {
          setStatus("success");
          setMessage(res?.data?.message || "Email verified successfully");
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
