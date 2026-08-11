import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  IconButton,
  Divider,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import { adminGetHistory, saveHistory, resetHistory } from "../services/adminHistoryService";

const emptyTimelineItem = () => ({
  id: `t${Date.now()}`,
  year: "",
  title: "",
  text: "",
});

const blankForm = () => ({
  heroTitle: "",
  heroBreadcrumb: "",
  introEyebrow: "",
  introTitle: "",
  introParagraphs: [""],
  sidebarEyebrow: "",
  sidebarTitle: "",
  sidebarDescription: "",
  sidebarImageAlt: "",
  timeline: [emptyTimelineItem()],
  status: "draft",
});

const mapRecordToForm = (record) => ({
  heroTitle: record.heroTitle || "",
  heroBreadcrumb: record.heroBreadcrumb || "",
  introEyebrow: record.introEyebrow || "",
  introTitle: record.introTitle || "",
  introParagraphs: record.introParagraphs?.length ? record.introParagraphs : [""],
  sidebarEyebrow: record.sidebarEyebrow || "",
  sidebarTitle: record.sidebarTitle || "",
  sidebarDescription: record.sidebarDescription || "",
  sidebarImageAlt: record.sidebarImageAlt || "",
  timeline: record.timeline?.length ? record.timeline : [emptyTimelineItem()],
  status: record.status || "draft",
});

export default function HistoryAdminForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(blankForm());
  const [sidebarImageFile, setSidebarImageFile] = useState(null);
  const [sidebarImagePreview, setSidebarImagePreview] = useState(null);

  const loadHistory = () => {
    setLoading(true);
    return adminGetHistory()
      .then((record) => {
        setForm(mapRecordToForm(record));
        setSidebarImagePreview(record.sidebarImageUrl || null);
        setSidebarImageFile(null);
      })
      .catch(() => setError("Failed to load history page data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let isMounted = true;
    adminGetHistory()
      .then((record) => {
        if (!isMounted) return;
        setForm(mapRecordToForm(record));
        setSidebarImagePreview(record.sidebarImageUrl || null);
      })
      .catch(() => setError("Failed to load history page data."))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // ── Paragraphs ──
  const updateParagraph = (index, value) => {
    setForm((f) => {
      const next = [...f.introParagraphs];
      next[index] = value;
      return { ...f, introParagraphs: next };
    });
  };
  const addParagraph = () =>
    setForm((f) => ({ ...f, introParagraphs: [...f.introParagraphs, ""] }));
  const removeParagraph = (index) =>
    setForm((f) => ({
      ...f,
      introParagraphs: f.introParagraphs.filter((_, i) => i !== index),
    }));

  // ── Timeline ──
  const updateTimelineItem = (index, field, value) => {
    setForm((f) => {
      const next = [...f.timeline];
      next[index] = { ...next[index], [field]: value };
      return { ...f, timeline: next };
    });
  };
  const addTimelineItem = () =>
    setForm((f) => ({ ...f, timeline: [...f.timeline, emptyTimelineItem()] }));
  const removeTimelineItem = (index) =>
    setForm((f) => ({ ...f, timeline: f.timeline.filter((_, i) => i !== index) }));
  const moveTimelineItem = (index, direction) => {
    setForm((f) => {
      const next = [...f.timeline];
      const swapWith = index + direction;
      if (swapWith < 0 || swapWith >= next.length) return f;
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return { ...f, timeline: next };
    });
  };

  // ── Image ──
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSidebarImageFile(file);
    setSidebarImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const fd = new FormData();
      fd.append("heroTitle", form.heroTitle);
      fd.append("heroBreadcrumb", form.heroBreadcrumb);
      fd.append("introEyebrow", form.introEyebrow);
      fd.append("introTitle", form.introTitle);
      fd.append("introParagraphs", JSON.stringify(form.introParagraphs.filter((p) => p.trim() !== "")));
      fd.append("sidebarEyebrow", form.sidebarEyebrow);
      fd.append("sidebarTitle", form.sidebarTitle);
      fd.append("sidebarDescription", form.sidebarDescription);
      fd.append("sidebarImageAlt", form.sidebarImageAlt);
      fd.append("timeline", JSON.stringify(form.timeline));
      fd.append("status", form.status);
      if (sidebarImageFile) fd.append("sidebarImage", sidebarImageFile);

      await saveHistory(fd);
      setSuccess("History page saved successfully.");
    } catch (err) {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetConfirm = async () => {
    setResetDialogOpen(false);
    setResetting(true);
    setError("");
    setSuccess("");

    try {
      const { page } = await resetHistory();
      setForm(mapRecordToForm(page));
      setSidebarImagePreview(page.sidebarImageUrl || null);
      setSidebarImageFile(null);
      setSuccess("History page reset to defaults.");
    } catch (err) {
      setError("Failed to reset. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={800}>
          Edit History Page
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<RestartAltIcon />}
          onClick={() => setResetDialogOpen(true)}
          disabled={saving || resetting}
        >
          {resetting ? "Resetting..." : "Reset to Defaults"}
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={4}>
          {/* HERO */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Hero</Typography>
            <Stack spacing={2}>
              <TextField
                label="Hero Title"
                value={form.heroTitle}
                onChange={(e) => updateField("heroTitle", e.target.value)}
                fullWidth
              />
              <TextField
                label="Breadcrumb Label"
                value={form.heroBreadcrumb}
                onChange={(e) => updateField("heroBreadcrumb", e.target.value)}
                fullWidth
              />
            </Stack>
          </Paper>

          {/* INTRO */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Brief History (Intro)</Typography>
            <Stack spacing={2}>
              <TextField
                label="Eyebrow"
                value={form.introEyebrow}
                onChange={(e) => updateField("introEyebrow", e.target.value)}
                fullWidth
              />
              <TextField
                label="Title"
                value={form.introTitle}
                onChange={(e) => updateField("introTitle", e.target.value)}
                fullWidth
              />

              <Typography variant="subtitle2" fontWeight={700} mt={1}>Paragraphs</Typography>
              <Stack spacing={2}>
                {form.introParagraphs.map((p, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                    <TextField
                      label={`Paragraph ${i + 1}`}
                      value={p}
                      onChange={(e) => updateParagraph(i, e.target.value)}
                      multiline
                      minRows={3}
                      fullWidth
                    />
                    <IconButton
                      onClick={() => removeParagraph(i)}
                      disabled={form.introParagraphs.length === 1}
                      color="error"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
              <Button startIcon={<AddIcon />} onClick={addParagraph} sx={{ alignSelf: "flex-start" }}>
                Add Paragraph
              </Button>
            </Stack>
          </Paper>

          {/* SIDEBAR */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Sidebar</Typography>
            <Stack spacing={2}>
              <TextField
                label="Eyebrow"
                value={form.sidebarEyebrow}
                onChange={(e) => updateField("sidebarEyebrow", e.target.value)}
                fullWidth
              />
              <TextField
                label="Title"
                value={form.sidebarTitle}
                onChange={(e) => updateField("sidebarTitle", e.target.value)}
                fullWidth
              />
              <TextField
                label="Description"
                value={form.sidebarDescription}
                onChange={(e) => updateField("sidebarDescription", e.target.value)}
                multiline
                minRows={3}
                fullWidth
              />
              <TextField
                label="Image Alt Text"
                value={form.sidebarImageAlt}
                onChange={(e) => updateField("sidebarImageAlt", e.target.value)}
                fullWidth
              />

              <Box>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Sidebar Image</Typography>
                {sidebarImagePreview && (
                  <Box
                    component="img"
                    src={sidebarImagePreview}
                    alt="Preview"
                    sx={{
                      width: "100%",
                      maxWidth: 320,
                      height: 180,
                      objectFit: "cover",
                      borderRadius: 2,
                      border: "1px solid #E2E8F0",
                      mb: 1.5,
                      display: "block",
                    }}
                  />
                )}
                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                  {sidebarImagePreview ? "Replace Image" : "Upload Image"}
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </Button>
              </Box>
            </Stack>
          </Paper>

          {/* TIMELINE */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Timeline</Typography>
            <Stack spacing={3}>
              {form.timeline.map((item, i) => (
                <Box key={item.id} sx={{ border: "1px solid #E2E8F0", borderRadius: 2, p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                      Entry {i + 1}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => moveTimelineItem(i, -1)} disabled={i === 0}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => moveTimelineItem(i, 1)}
                        disabled={i === form.timeline.length - 1}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeTimelineItem(i)}
                        disabled={form.timeline.length === 1}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Stack spacing={2}>
                    <TextField
                      label="Year"
                      value={item.year}
                      onChange={(e) => updateTimelineItem(i, "year", e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Title"
                      value={item.title}
                      onChange={(e) => updateTimelineItem(i, "title", e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Text"
                      value={item.text}
                      onChange={(e) => updateTimelineItem(i, "text", e.target.value)}
                      multiline
                      minRows={3}
                      fullWidth
                    />
                  </Stack>
                </Box>
              ))}
            </Stack>
            <Button startIcon={<AddIcon />} onClick={addTimelineItem} sx={{ mt: 2 }}>
              Add Timeline Entry
            </Button>
          </Paper>

          {/* STATUS + SUBMIT */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 2 }}>
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              sx={{ width: 200, mb: 3 }}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="published">Published</MenuItem>
            </TextField>

            <Divider sx={{ mb: 3 }} />

            <Button type="submit" variant="contained" size="large" disabled={saving || resetting}>
              {saving ? "Saving..." : "Save History Page"}
            </Button>
          </Paper>
        </Stack>
      </Box>

      {/* RESET CONFIRMATION DIALOG */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset History Page?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently clear all hero, intro, sidebar, and timeline content — including the
            uploaded sidebar image — and set the page back to draft. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResetConfirm} color="error" variant="contained">
            Yes, Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}