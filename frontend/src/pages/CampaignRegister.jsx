import { useEffect, useState } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import {
  Alert, Box, Button, CircularProgress, Container,
  Paper, Stack, TextField, Typography,
} from "@mui/material";

import { getPublicCampaignById } from "../services/publicCampaignService";
import { createCampaignRegistration } from "../services/campaignRegistrationService";

export default function CampaignRegister() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "" });

  useEffect(() => {
    (async () => {
      try {
        const data = await getPublicCampaignById(id);
        // Externally handled registration: send them straight to the link
        if (!data.requiresRegistration && data.registrationLink) {
          window.location.href = data.registrationLink;
          return;
        }
        setCampaign(data);
      } catch {
        setError("Campaign not found or no longer active.");
      } finally {
        setPageLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim() || !form.email.trim()) {
      setError("Please enter your full name and email.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createCampaignRegistration({
        ...form,
        campaignId: campaign.id,
      });
      setSuccess(res.message || "Registration successful");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <Box py={10} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        <Typography variant="overline" color="primary">
          Registration
        </Typography>
        <Typography variant="h5" fontWeight="bold" mb={1}>
          {campaign.title}
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Fill in your details below to reserve your spot.
        </Typography>

        {success ? (
          <Stack spacing={2}>
            <Alert severity="success">
              {success}. A confirmation email is on its way.
            </Alert>
            <Button variant="contained" onClick={() => navigate("/campaigns")}>
              Browse more campaigns
            </Button>
          </Stack>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                fullWidth required
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
              />

              <TextField
                fullWidth required
                type="email"
                label="Email Address"
                name="email"
                value={form.email}
                onChange={handleChange}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
              >
                {submitting ? (
                  <CircularProgress size={24} sx={{ color: "#fff" }} />
                ) : (
                  "Register"
                )}
              </Button>

              <Button
                component={RouterLink}
                to={`/campaigns/${id}`}
                color="inherit"
              >
                Back to campaign details
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Container>
  );
}