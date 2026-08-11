// pages/AdminPrograms.jsx
import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, Button, IconButton,
  TextField, MenuItem, Stack, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Snackbar, Alert, Tooltip, Divider,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, InputAdornment,
} from "@mui/material";

import {
  Add, Edit, Delete, Refresh, Search,
  Archive, Public, DraftsTwoTone, Category as CategoryIcon,
  Image, CheckCircle, Close, ArrowUpward, ArrowDownward,
  ViewModule, Layers,
} from "@mui/icons-material";

import {
  getAdminPrograms,
  getAdminProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramStats,
} from "../services/programService";

const NAVY   = "#0B1F3A";
const GREEN  = "#1E7F4F";
const GOLD   = "#D4A017";
const BG     = "#F7F9FC";
const CARD   = "#FFFFFF";
const BORDER = "#E6E9F0";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";

const STATUS_CFG = {
  published: { label: "Published", bg: "#ECFDF5", color: GREEN,     icon: <Public sx={{ fontSize: 12 }} /> },
  draft:     { label: "Draft",     bg: "#F1F5F9", color: MUTED,     icon: <DraftsTwoTone sx={{ fontSize: 12 }} /> },
  archived:  { label: "Archived",  bg: "#FFF7ED", color: "#C2410C", icon: <Archive sx={{ fontSize: 12 }} /> },
};

const StatusChip = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      size="small"
      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11, height: 22,
        "& .MuiChip-icon": { color: cfg.color } }}
    />
  );
};

const StatCard = ({ title, value, color = NAVY, icon }) => (
  <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 2.5, bgcolor: CARD,
    display: "flex", flexDirection: "column", gap: 1 }}>
    <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: `${color}18`,
      display: "flex", alignItems: "center", justifyContent: "center", color, "& svg": { fontSize: 20 } }}>
      {icon}
    </Box>
    <Typography sx={{ fontSize: 11.5, color: MUTED, fontWeight: 600 }}>{title}</Typography>
    <Typography sx={{ fontSize: 24, fontWeight: 800, color: TEXT, lineHeight: 1 }}>{value ?? 0}</Typography>
  </Paper>
);

const genId = () => `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const EMPTY_FORM = {
  title: "",
  slug: "",
  tagline: "",
  description: "",
  category: "",
  order: 0,
  status: "draft",
  heroFile: null,
  heroPreview: "",
  existingHeroUrl: "",
  sections: [], // { id, name, description, imageFile, imagePreview, existingImageUrl }
};

// ─────────────────────────────────────────────────────────────
// PROGRAM FORM DIALOG
// ─────────────────────────────────────────────────────────────
const ProgramFormDialog = ({ open, onClose, editId, onSaved, setToast }) => {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching,setFetching]= useState(false);

  useEffect(() => {
    if (!open) { setForm(EMPTY_FORM); return; }
    if (!editId) return;

    (async () => {
      try {
        setFetching(true);
        const p = await getAdminProgram(editId);
        setForm({
          title: p.title || "",
          slug: p.slug || "",
          tagline: p.tagline || "",
          description: p.description || "",
          category: p.category || "",
          order: p.order ?? 0,
          status: p.status || "draft",
          heroFile: null,
          heroPreview: "",
          existingHeroUrl: p.heroImageUrl || "",
          sections: (p.sections || []).map((s) => ({
            id: s.id,
            name: s.name || "",
            description: s.description || "",
            imageFile: null,
            imagePreview: "",
            existingImageUrl: s.imageUrl || "",
          })),
        });
      } catch (err) {
        setToast({ msg: "Failed to load program data", severity: "error" });
        onClose();
      } finally { setFetching(false); }
    })();
  }, [open, editId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const setSectionField = (id, key) => (e) =>
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) => (s.id === id ? { ...s, [key]: e.target.value } : s)),
    }));

  const setSectionImage = (id) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) => (s.id === id ? { ...s, imageFile: file, imagePreview: preview } : s)),
    }));
  };

  const removeSectionImage = (id) =>
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) =>
        s.id === id ? { ...s, imageFile: null, imagePreview: "", existingImageUrl: "" } : s
      ),
    }));

  const addSection = () =>
    setForm((f) => ({
      ...f,
      sections: [
        ...f.sections,
        { id: genId(), name: "", description: "", imageFile: null, imagePreview: "", existingImageUrl: "" },
      ],
    }));

  const removeSection = (id) =>
    setForm((f) => ({ ...f, sections: f.sections.filter((s) => s.id !== id) }));

  const moveSection = (index, direction) =>
    setForm((f) => {
      const next = [...f.sections];
      const target = index + direction;
      if (target < 0 || target >= next.length) return f;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, sections: next };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setToast({ msg: "Title is required", severity: "error" });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("slug", form.slug);
      formData.append("tagline", form.tagline || "");
      formData.append("description", form.description || "");
      formData.append("category", form.category || "General");
      formData.append("order", form.order);
      formData.append("status", form.status);

      // Sections metadata (no binary data)
      const sectionsPayload = form.sections.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
      }));
      formData.append("sections", JSON.stringify(sectionsPayload));

      if (form.heroFile) {
        formData.append("heroImage", form.heroFile);
      }

      form.sections.forEach((s) => {
        if (s.imageFile) {
          formData.append(`sectionImage_${s.id}`, s.imageFile);
        }
      });

      if (editId) {
        await updateProgram(editId, formData);
        setToast({ msg: "Program updated successfully", severity: "success" });
      } else {
        await createProgram(formData);
        setToast({ msg: "Program created successfully", severity: "success" });
      }

      onSaved();
      onClose();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Save failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!editId;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>

      <DialogTitle sx={{ px: 3, py: 2.5, display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: `1px solid ${BORDER}` }}>
        <Typography sx={{ fontWeight: 800, fontSize: 17, color: TEXT }}>
          {isEdit ? "Edit Program" : "Create New Program"}
        </Typography>
        <IconButton onClick={onClose} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>
      </DialogTitle>

      {fetching ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: GREEN }} />
        </Box>
      ) : (
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box component="form" id="program-form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>

              <Grid item xs={12} sm={7}>
                <TextField
                  required fullWidth label="Title" value={form.title}
                  onChange={set("title")} placeholder="e.g. CHOICES"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth label="Slug" value={form.slug}
                  onChange={set("slug")} placeholder="auto-generated if left blank"
                  helperText="Used in the URL: /programs/your-slug"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth label="Tagline" value={form.tagline}
                  onChange={set("tagline")}
                  placeholder="e.g. CREATIVE HANDS IN ORGANIZATIONAL INNOVATIONS..."
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth multiline rows={3} label="Intro Description"
                  value={form.description} onChange={set("description")}
                  placeholder="Short intro paragraph shown above the sections"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Category" value={form.category}
                  onChange={set("category")} placeholder="e.g. Youth Development"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><CategoryIcon sx={{ fontSize: 18, color: MUTED }} /></InputAdornment>,
                  }}
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth label="Display Order" type="number"
                  value={form.order} onChange={set("order")}
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select fullWidth label="Status" value={form.status}
                  onChange={set("status")}
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                >
                  {["draft", "published", "archived"].map((s) => (
                    <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Hero Image */}
              <Grid item xs={12}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: MUTED, mb: 1 }}>
                  Hero Image
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  {(form.heroPreview || form.existingHeroUrl) && (
                    <Box sx={{ width: 120, height: 70, borderRadius: 2, overflow: "hidden",
                      border: `1px solid ${BORDER}`, flexShrink: 0 }}>
                      <img src={form.heroPreview || form.existingHeroUrl} alt="preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                  )}
                  <Button variant="outlined" component="label" startIcon={<Image />}
                    sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
                    {form.heroFile || form.existingHeroUrl ? "Change Image" : "Upload Image"}
                    <input type="file" hidden accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const preview = URL.createObjectURL(file);
                        setForm((f) => ({ ...f, heroFile: file, heroPreview: preview }));
                      }}
                    />
                  </Button>
                  {(form.heroFile || form.existingHeroUrl) && (
                    <Button size="small" color="error"
                      onClick={() => setForm((f) => ({ ...f, heroFile: null, heroPreview: "", existingHeroUrl: "" }))}>
                      Remove
                    </Button>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12}><Divider /></Grid>

              {/* Sections */}
              <Grid item xs={12}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: TEXT, display: "flex", alignItems: "center", gap: 1 }}>
                    <Layers sx={{ fontSize: 18, color: GREEN }} /> Sub-sections / Clubs
                  </Typography>
                  <Button size="small" startIcon={<Add />} onClick={addSection}
                    sx={{ textTransform: "none", color: GREEN, fontWeight: 700 }}>
                    Add Section
                  </Button>
                </Stack>

                {form.sections.length === 0 && (
                  <Typography sx={{ fontSize: 13, color: MUTED, fontStyle: "italic" }}>
                    No sections yet. Click "Add Section" to add one (e.g. STEM Club, WASH Club).
                  </Typography>
                )}

                <Stack spacing={2}>
                  {form.sections.map((s, index) => (
                    <Paper key={s.id} elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: MUTED }}>
                          Section {index + 1}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Move up">
                            <span>
                              <IconButton size="small" disabled={index === 0} onClick={() => moveSection(index, -1)}>
                                <ArrowUpward sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Move down">
                            <span>
                              <IconButton size="small" disabled={index === form.sections.length - 1} onClick={() => moveSection(index, 1)}>
                                <ArrowDownward sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Remove section">
                            <IconButton size="small" color="error" onClick={() => removeSection(s.id)}>
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>

                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth size="small" label="Section Name" value={s.name}
                            onChange={setSectionField(s.id, "name")} placeholder="e.g. STEM Club"
                            sx={{ "& fieldset": { borderColor: BORDER } }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth size="small" multiline rows={2} label="Description"
                            value={s.description} onChange={setSectionField(s.id, "description")}
                            sx={{ "& fieldset": { borderColor: BORDER } }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            {(s.imagePreview || s.existingImageUrl) && (
                              <Box sx={{ width: 70, height: 50, borderRadius: 1.5, overflow: "hidden",
                                border: `1px solid ${BORDER}`, flexShrink: 0 }}>
                                <img src={s.imagePreview || s.existingImageUrl} alt="preview"
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </Box>
                            )}
                            <Button size="small" variant="outlined" component="label" startIcon={<Image sx={{ fontSize: 16 }} />}
                              sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2, fontSize: 12.5 }}>
                              {s.imageFile || s.existingImageUrl ? "Change Image" : "Add Image (optional)"}
                              <input type="file" hidden accept="image/*" onChange={setSectionImage(s.id)} />
                            </Button>
                            {(s.imageFile || s.existingImageUrl) && (
                              <Button size="small" color="error" onClick={() => removeSectionImage(s.id)}>
                                Remove
                              </Button>
                            )}
                          </Stack>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, py: 2.5, borderTop: `1px solid ${BORDER}`, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button
          type="submit" form="program-form" variant="contained"
          disabled={loading || fetching}
          startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <CheckCircle />}
          sx={{ bgcolor: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2.5, px: 3, "&:hover": { bgcolor: GREEN } }}
        >
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Program"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────
// DELETE CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────
const DeleteDialog = ({ open, onClose, program, onDeleted, setToast }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteProgram(program.id);
      setToast({ msg: `"${program.title}" deleted.`, severity: "success" });
      onDeleted();
      onClose();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Delete failed", severity: "error" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>
      <DialogTitle sx={{ fontWeight: 800, color: TEXT }}>Delete Program</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14, color: MUTED }}>
          Are you sure you want to permanently delete{" "}
          <strong style={{ color: TEXT }}>{program?.title}</strong>?
          All of its sections and images will be removed too. This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button variant="contained" disabled={loading} onClick={handleDelete}
          sx={{ bgcolor: "#DC2626", textTransform: "none", fontWeight: 700, borderRadius: 2.5 }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function AdminPrograms() {
  const [programs, setPrograms] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toast,    setToast]    = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [list, st] = await Promise.all([getAdminPrograms(), getProgramStats()]);
      setPrograms(Array.isArray(list) ? list : []);
      setStats(st);
    } catch (err) {
      setToast({ msg: "Failed to load programs", severity: "error" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = programs.filter((p) => {
    const matchSearch = !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setEditId(null); setFormOpen(true); };
  const openEdit = (id) => { setEditId(id); setFormOpen(true); };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 4 } }}>

        <Paper elevation={0} sx={{ borderRadius: 5, mb: 4, overflow: "hidden",
          background: "linear-gradient(135deg, #0B1F3A, #1E7F4F)", color: "#fff", p: { xs: 3, md: 4 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography sx={{ fontSize: { xs: 22, md: 27 }, fontWeight: 800, lineHeight: 1.2 }}>
                Programs Management
              </Typography>
              <Typography sx={{ fontSize: 13.5, opacity: 0.8, mt: 0.75 }}>
                Create and manage programs like CHOICES, and their sub-clubs
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Button variant="outlined" startIcon={<Refresh />} onClick={fetchAll}
                sx={{ borderColor: "rgba(255,255,255,0.35)", color: "#fff", textTransform: "none",
                  fontWeight: 700, borderRadius: 3, "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" } }}>
                Refresh
              </Button>
              <Button variant="contained" startIcon={<Add />} onClick={openCreate}
                sx={{ bgcolor: GOLD, color: NAVY, textTransform: "none", fontWeight: 800, borderRadius: 3, px: 2.5,
                  "&:hover": { bgcolor: "#C8970F" } }}>
                New Program
              </Button>
            </Stack>
          </Box>
        </Paper>

        {stats && (
          <Grid container spacing={2} mb={4}>
            {[
              { title: "Total Programs", value: stats.total,     color: NAVY,      icon: <ViewModule /> },
              { title: "Published",      value: stats.published, color: GREEN,     icon: <Public />     },
              { title: "Drafts",         value: stats.drafts,    color: MUTED,     icon: <DraftsTwoTone /> },
              { title: "Archived",       value: stats.archived,  color: "#C2410C", icon: <Archive />    },
            ].map((s) => (
              <Grid item xs={6} sm={4} md key={s.title}>
                <StatCard {...s} />
              </Grid>
            ))}
          </Grid>
        )}

        <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", mb: 3 }}>
          <Box sx={{ px: 3, py: 2.5, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center",
            borderBottom: `1px solid ${BORDER}` }}>
            <TextField
              size="small" placeholder="Search by title or category…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: MUTED }} /></InputAdornment> }}
              sx={{ flex: 1, minWidth: 220, "& fieldset": { borderColor: BORDER } }}
            />
            <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              label="Status" sx={{ minWidth: 150, "& fieldset": { borderColor: BORDER } }}>
              <MenuItem value="">All statuses</MenuItem>
              {["draft", "published", "archived"].map((s) => (
                <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            <Typography sx={{ fontSize: 13, color: MUTED }}>
              {filtered.length} of {programs.length} program{programs.length !== 1 ? "s" : ""}
            </Typography>
          </Box>

          {loading ? (
            <LinearProgress sx={{ "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    {["Program", "Sections", "Category", "Status", "Order", "Actions"].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: NAVY, fontSize: 11.5,
                        textTransform: "uppercase", letterSpacing: 0.6, py: 1.5 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: "center", py: 8, color: MUTED }}>
                        <Box>
                          <ViewModule sx={{ fontSize: 40, color: BORDER, mb: 1, display: "block", mx: "auto" }} />
                          {search || statusFilter ? "No programs match your filters." : "No programs yet. Create your first one!"}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((p) => (
                    <TableRow key={p.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          {p.heroImageUrl ? (
                            <Box component="img" src={p.heroImageUrl} alt={p.title}
                              sx={{ width: 42, height: 42, borderRadius: 2, objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: `${NAVY}14`,
                              display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, fontWeight: 700 }}>
                              {p.title?.[0] || "P"}
                            </Box>
                          )}
                          <Typography sx={{ fontWeight: 700, color: TEXT, fontSize: 14 }} noWrap>{p.title}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13.5, color: TEXT }}>
                        {(p.sections || []).length} section{(p.sections || []).length !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell>
                        {p.category
                          ? <Chip label={p.category} size="small" sx={{ bgcolor: `${NAVY}10`, color: NAVY, fontWeight: 600, fontSize: 11 }} />
                          : <Typography sx={{ fontSize: 13, color: MUTED }}>—</Typography>}
                      </TableCell>
                      <TableCell><StatusChip status={p.status} /></TableCell>
                      <TableCell sx={{ fontSize: 14, color: TEXT, fontWeight: 700 }}>{p.order ?? 0}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(p.id)} sx={{ color: NAVY }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => setDeleteTarget(p)} sx={{ color: "#DC2626" }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      <ProgramFormDialog open={formOpen} onClose={() => setFormOpen(false)} editId={editId} onSaved={fetchAll} setToast={setToast} />
      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} program={deleteTarget} onDeleted={fetchAll} setToast={setToast} />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}