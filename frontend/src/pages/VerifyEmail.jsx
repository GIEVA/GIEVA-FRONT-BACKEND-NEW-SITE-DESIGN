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

 useEffect(() => {
  if (!token) {
    setStatus("error");
    setMessage("Invalid verification link");
    return;
  }

  let cancelled = false; // ← guard against double-fire

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

  return () => { cancelled = true; }; // ← cleanup cancels the second run
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