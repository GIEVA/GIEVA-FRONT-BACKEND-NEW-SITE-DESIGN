import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert, Box, Button, Chip, CircularProgress, Container, Divider,
  Grid, Paper, Stack, TextField, Typography,
} from "@mui/material";
import { CalendarMonth, AccessTime } from "@mui/icons-material";
import DOMPurify from "dompurify";

import {
  getPublicCampaign,
  trackCampaignClick,
} from "../services/publicCampaignService";
import { createCampaignRegistration } from "../services/campaignRegistrationService";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

const PublicCampaignDetails = () => {
  const { id } = useParams();
  const formRef = useRef(null);

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ fullName: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ---------------- FETCH ----------------
  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicCampaign(id);
        setCampaign(res?.campaign ?? res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ---------------- COUNTDOWN ----------------
  const getRemainingTime = () => {
    if (!campaign?.startDate) return null;
    const diff = new Date(campaign.startDate) - new Date();
    if (diff <= 0) return "Campaign Started";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  };

  // ---------------- REGISTRATION MODE ----------------
  const hasExternalLink = !!campaign?.registrationLink;
  const needsInternalRegistration =
    !!campaign?.requiresRegistration && !hasExternalLink;

  // ---------------- ACTIONS ----------------
  const handleRegisterClick = async () => {
    try {
      await trackCampaignClick(campaign.id);
    } catch (err) {
      console.error(err);
    }

    if (hasExternalLink) {
      window.open(campaign.registrationLink, "_blank", "noopener,noreferrer");
    } else {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

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
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        campaignId: campaign.id,
      });
      setSuccess(res?.message || "Registration successful");
      setForm({ fullName: "", email: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- STATES ----------------
  if (loading) {
    return (
      <Box textAlign="center" py={12}>
        <CircularProgress />
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Box textAlign="center" py={10}>
        <Typography variant="h5">Campaign not found</Typography>
      </Box>
    );
  }

  const remaining = getRemainingTime();

  return (
    <Box>
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 } }}>
        {/* ============ BANNER: image only, nothing on top ============ */}
        {campaign.imageUrl && (
          <Box
            component="img"
            src={campaign.imageUrl}
            alt={campaign.title}
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              borderRadius: { xs: 2, md: 4 },
            }}
          />
        )}
      </Container>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={5}>
          {/* ============ MAIN ============ */}
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
              {campaign.type && (
                <Chip
                  label={campaign.type}
                  color="primary"
                  size="small"
                  sx={{ textTransform: "capitalize", fontWeight: 700 }}
                />
              )}
              {campaign.featured && (
                <Chip label="Featured" color="warning" size="small" />
              )}
            </Stack>

            <Typography
              variant="h3"
              fontWeight="bold"
              mb={3}
              sx={{ fontSize: { xs: "1.9rem", md: "2.8rem" }, lineHeight: 1.15 }}
            >
              {campaign.title}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Box
              sx={{
                lineHeight: 1.9,
                fontSize: "1.05rem",
                color: "text.secondary",
                "& p": { mb: 1.5 },
                "& strong": { fontWeight: 700, color: "text.primary" },
                "& ul, & ol": { pl: 3, mb: 1.5 },
                "& a": { color: "primary.main" },
                "& img": { maxWidth: "100%", height: "auto", borderRadius: 2 },
              }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(campaign.description || ""),
              }}
            />
          </Grid>

          {/* ============ SIDEBAR: details + form ============ */}
          <Grid item xs={12} md={4}>
            <Paper
              ref={formRef}
              sx={{
                p: 4,
                borderRadius: 4,
                position: { md: "sticky" },
                top: 120,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Campaign Details
              </Typography>

              <Stack spacing={1.5} mb={3}>
                {fmt(campaign.startDate) && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarMonth fontSize="small" color="action" />
                    <Typography variant="body2">
                      Starts: {fmt(campaign.startDate)}
                    </Typography>
                  </Stack>
                )}
                {fmt(campaign.endDate) && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarMonth fontSize="small" color="action" />
                    <Typography variant="body2">
                      Ends: {fmt(campaign.endDate)}
                    </Typography>
                  </Stack>
                )}
                {remaining && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTime fontSize="small" color="action" />
                    <Typography variant="body2">{remaining}</Typography>
                  </Stack>
                )}
              </Stack>

              <Divider sx={{ mb: 3 }} />

              {/* External registration */}
              {hasExternalLink && (
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={handleRegisterClick}
                  sx={{ py: 1.4, borderRadius: 100, fontWeight: 700 }}
                >
                  Register Now
                </Button>
              )}

              {/* Internal registration form */}
              {needsInternalRegistration && (
                <>
                  <Typography fontWeight="bold" mb={2}>
                    Register for this campaign
                  </Typography>

                  {success ? (
                    <Alert severity="success">
                      {success}. A confirmation email is on its way.
                    </Alert>
                  ) : (
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                      <Stack spacing={2}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <TextField
                          fullWidth
                          required
                          label="Full Name"
                          name="fullName"
                          value={form.fullName}
                          onChange={handleChange}
                        />

                        <TextField
                          fullWidth
                          required
                          type="email"
                          label="Email Address"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                        />

                        <Button
                          type="submit"
                          size="large"
                          variant="contained"
                          disabled={submitting}
                          sx={{ py: 1.4, borderRadius: 100, fontWeight: 700 }}
                        >
                          {submitting ? (
                            <CircularProgress size={24} sx={{ color: "#fff" }} />
                          ) : (
                            "Register"
                          )}
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </>
              )}

              {/* No registration needed */}
              {!hasExternalLink && !needsInternalRegistration && (
                <Alert severity="info">No registration is required for this campaign.</Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PublicCampaignDetails;