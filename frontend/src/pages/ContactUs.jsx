// pages/ContactUs.jsx

import { useState, useRef } from "react";
import {
  Box, Container, Typography, Paper, Grid, TextField,
  MenuItem, Button, CircularProgress, Alert, Chip,
  IconButton, LinearProgress,
} from "@mui/material";
import {
  Send, AttachFile, Close, CheckCircle, ImageOutlined, PictureAsPdf,
} from "@mui/icons-material";
import { submitContactForm } from "../services/contactService";

const NAVY   = "#0B1F3A";
const GREEN  = "#1E7F4F";
const GOLD   = "#D4A017";
const BORDER = "#E6E9F0";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";
const BG     = "#F7F9FC";

const CATEGORIES = [
  { value: "general",        label: "General Inquiry" },
  { value: "support",        label: "Technical Support" },
  { value: "billing",        label: "Billing & Payments" },
  { value: "course_inquiry", label: "Course Inquiry" },
  { value: "partnership",    label: "Partnership" },
  { value: "complaint",      label: "Complaint" },
  { value: "other",          label: "Other" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

const fileIcon = (type) =>
  type === "application/pdf"
    ? <PictureAsPdf sx={{ fontSize: 20, color: "#ef4444" }} />
    : <ImageOutlined sx={{ fontSize: 20, color: NAVY }} />;

export default function ContactUs() {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "",
    subject: "", message: "", category: "general",
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [fileError,      setFileError]      = useState("");
  const [fieldErrors,    setFieldErrors]    = useState({});
  const [submitting,     setSubmitting]     = useState(false);
  const [success,        setSuccess]        = useState(null); // { message, reference }
  const [submitError,    setSubmitError]    = useState("");

  const setField = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setFieldErrors((p) => ({ ...p, [k]: "" }));
    // Clear attachment if user switches away from complaint
    if (k === "category" && e.target.value !== "complaint") {
      setAttachmentFile(null);
      setFileError("");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("Only images (JPG, PNG, WEBP, GIF) and PDFs are accepted.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File too large. Maximum size is 10 MB.");
      return;
    }
    setAttachmentFile(file);
    // Reset input so the same file can be re-selected after removal
    e.target.value = "";
  };

  const removeFile = () => { setAttachmentFile(null); setFileError(""); };

  const validate = () => {
    const errors = {};
    if (!form.fullName.trim())  errors.fullName = "Name is required.";
    if (!form.email.trim())     errors.email    = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                errors.email    = "Please enter a valid email.";
    if (!form.subject.trim())   errors.subject  = "Subject is required.";
    if (!form.message.trim())   errors.message  = "Message is required.";
    else if (form.message.trim().length < 10)
                                errors.message  = "Message must be at least 10 characters.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      const res = await submitContactForm({ ...form, attachmentFile });
      setSuccess(res);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────
  if (success) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center",
                 justifyContent: "center", bgcolor: BG, py: 8 }}>
        <Paper elevation={0}
          sx={{ border: `1px solid ${BORDER}`, borderRadius: 4, p: 5,
                maxWidth: 480, width: "100%", mx: 2, textAlign: "center" }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "50%", bgcolor: `${GREEN}15`,
                     display: "flex", alignItems: "center", justifyContent: "center",
                     mx: "auto", mb: 3 }}>
            <CheckCircle sx={{ fontSize: 40, color: GREEN }} />
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: TEXT, mb: 1 }}>
            Message sent!
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 15, mb: 2 }}>
            {success.message}
          </Typography>
          <Chip label={`Reference ${success.reference}`} size="small"
            sx={{ bgcolor: `${NAVY}10`, color: NAVY, fontWeight: 800, mb: 3 }} />
          <Typography sx={{ fontSize: 13, color: MUTED }}>
            We'll respond within 24–48 business hours. Check your email for a confirmation.
          </Typography>
          <Button variant="outlined" sx={{ mt: 3, textTransform: "none", borderColor: BORDER,
                                           color: MUTED, borderRadius: 2 }}
            onClick={() => { setSuccess(null); setForm({ fullName: "", email: "", phone: "",
              subject: "", message: "", category: "general" }); setAttachmentFile(null); }}>
            Send another message
          </Button>
        </Paper>
      </Box>
    );
  }

  const isComplaint = form.category === "complaint";

  return (
    <Box sx={{ bgcolor: BG, minHeight: "100vh" }}>
      {/* Hero */}
      <Box sx={{ background: "linear-gradient(135deg, #0B1F3A, #1E7F4F)", color: "#fff",
                 py: { xs: 6, md: 8 }, px: 3, textAlign: "center" }}>
        <Typography sx={{ fontSize: { xs: 28, md: 38 }, fontWeight: 800, mb: 1 }}>
          Contact Us
        </Typography>
        <Typography sx={{ fontSize: 16, opacity: 0.85, maxWidth: 520, mx: "auto" }}>
          Have a question, feedback, or complaint? We're here to help.
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
        <Grid container spacing={5}>
          {/* Info cards */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2.5}>
              {[
                { icon: "✉️", title: "Email Us",    body: process.env.REACT_APP_SUPPORT_EMAIL || "support@gieva.org" },
                { icon: "📞", title: "Call Us",     body: "+234 000 000 0000" },
                { icon: "🕐", title: "Office Hours", body: "Mon – Fri, 9 AM – 6 PM WAT" },
              ].map((c) => (
                <Paper key={c.title} elevation={0}
                  sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 2.5 }}>
                  <Box sx={{ fontSize: 28, mb: 1 }}>{c.icon}</Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }}>{c.title}</Typography>
                  <Typography sx={{ color: MUTED, fontSize: 14, mt: 0.25 }}>{c.body}</Typography>
                </Paper>
              ))}
            </Stack>
          </Grid>

          {/* Form */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} component="form" onSubmit={handleSubmit}
              sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: { xs: 3, md: 4 } }}>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: TEXT, mb: 3 }}>
                Send us a message
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField required fullWidth label="Full Name"
                    value={form.fullName} onChange={setField("fullName")}
                    error={!!fieldErrors.fullName} helperText={fieldErrors.fullName}
                    sx={{ "& fieldset": { borderColor: BORDER } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField required fullWidth label="Email Address" type="email"
                    value={form.email} onChange={setField("email")}
                    error={!!fieldErrors.email} helperText={fieldErrors.email}
                    sx={{ "& fieldset": { borderColor: BORDER } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone (optional)"
                    value={form.phone} onChange={setField("phone")}
                    sx={{ "& fieldset": { borderColor: BORDER } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Category"
                    value={form.category} onChange={setField("category")}
                    sx={{ "& fieldset": { borderColor: BORDER } }}>
                    {CATEGORIES.map((c) => (
                      <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField required fullWidth label="Subject"
                    value={form.subject} onChange={setField("subject")}
                    error={!!fieldErrors.subject} helperText={fieldErrors.subject}
                    sx={{ "& fieldset": { borderColor: BORDER } }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField required fullWidth multiline rows={5} label="Message"
                    value={form.message} onChange={setField("message")}
                    error={!!fieldErrors.message} helperText={fieldErrors.message}
                    sx={{ "& fieldset": { borderColor: BORDER } }} />
                </Grid>

                {/* Attachment — only shown for complaint */}
                {isComplaint && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, border: `1.5px dashed ${attachmentFile ? GREEN : BORDER}`,
                               borderRadius: 2.5, bgcolor: attachmentFile ? `${GREEN}08` : BG,
                               transition: "all 0.2s" }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT, mb: 1 }}>
                        Attach Evidence <Typography component="span" sx={{ color: MUTED, fontWeight: 400 }}>(optional)</Typography>
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: MUTED, mb: 1.5 }}>
                        Images (JPG, PNG, WEBP, GIF) or PDF · Max 10 MB
                      </Typography>

                      {attachmentFile ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          {fileIcon(attachmentFile.type)}
                          <Box flex={1} minWidth={0}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT }} noWrap>
                              {attachmentFile.name}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: MUTED }}>
                              {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                          </Box>
                          <IconButton size="small" onClick={removeFile}
                            sx={{ color: "#ef4444" }}>
                            <Close sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ) : (
                        <Button size="small" variant="outlined"
                          startIcon={<AttachFile sx={{ fontSize: 16 }} />}
                          onClick={() => fileInputRef.current?.click()}
                          sx={{ textTransform: "none", borderColor: BORDER, color: MUTED,
                                borderRadius: 2, fontWeight: 700 }}>
                          Choose file
                        </Button>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        onChange={handleFileChange}
                      />

                      {fileError && (
                        <Typography sx={{ fontSize: 12, color: "#ef4444", mt: 1 }}>
                          {fileError}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}
              </Grid>

              {submitError && (
                <Alert severity="error" sx={{ borderRadius: 2, mt: 2 }}>{submitError}</Alert>
              )}

              {submitting && <LinearProgress sx={{ mt: 2, borderRadius: 1, bgcolor: `${GREEN}22`,
                "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />}

              <Button type="submit" variant="contained" fullWidth disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Send />}
                sx={{ mt: 3, py: 1.5, bgcolor: NAVY, color: "#fff", textTransform: "none",
                      fontWeight: 700, borderRadius: 2.5, fontSize: 15,
                      "&:hover": { bgcolor: GREEN } }}>
                {submitting ? "Sending…" : "Send Message"}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

// Missing import needed at top of file
function Stack({ children, spacing = 2 }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: spacing }}>
      {children}
    </Box>
  );
}
