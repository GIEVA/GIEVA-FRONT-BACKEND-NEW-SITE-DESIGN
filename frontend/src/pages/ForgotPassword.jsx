import { useState } from "react";
import { forgotPassword } from "../services/auth";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    // 🔍 Validation
    if (!email) {
      return setError("Email is required");
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return setError("Enter a valid email address");
    }

    try {
      setLoading(true);

      const res = await forgotPassword(email);

      setMessage(
        res.message || "Password reset link has been sent to your email"
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
        }}
      >
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h5" fontWeight="bold">
            Forgot Password
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Enter your email to receive a reset link
          </Typography>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Submit Button */}
          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
            sx={{
              mt: 2,
              py: 1.5,
              bgcolor: "#1E7F4F",
              "&:hover": {
                bgcolor: "#145A32",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;