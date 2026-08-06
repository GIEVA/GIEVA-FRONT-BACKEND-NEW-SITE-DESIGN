import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, Button, IconButton,
  TextField, MenuItem, Stack, Chip, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Snackbar, Alert, Tooltip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, InputAdornment,
} from "@mui/material";

import {
  Add, Edit, Delete, Refresh, Search,
  Archive, Public, DraftsTwoTone, Diversity3,
  Image, CheckCircle, Close, Link as LinkIcon, Star, StarBorder,
} from "@mui/icons-material";

import {
  getAdminProjects,
  getAdminProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
} from "../services/projectService";

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
    <Chip icon={cfg.icon} label={cfg.label} size="small" sx={{
      bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11, height: 22,
      "& .MuiChip-icon": { color: cfg.color },
    }} />
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

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "General",
  partnerName: "",
  href: "",
  external: false,
  featured: false,
  order: 0,
  status: "draft",
  imageFile: null,
  imagePreview: "",
  existingImageUrl: "",
};

const ProjectFormDialog = ({ open, onClose, editId, onSaved, setToast, existingCategories }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open) { setForm(EMPTY_FORM); return; }
    if (!editId) return;

    (async () => {
      try {
        setFetching(true);
        const p = await getAdminProject(editId);
        setForm({
          title: p.title || "",
          description: p.description || "",
          category: p.category || "General",
          partnerName: p.partnerName || "",
          href: p.href || "",
          external: !!p.external,
          featured: !!p.featured,
          order: p.order ?? 0,
          status: p.status || "draft",
          imageFile: null,
          imagePreview: "",
          existingImageUrl: p.imageUrl || "",
        });
      } catch (err) {
        setToast({ msg: "Failed to load project data", severity: "error" });
        onClose();
      } finally { setFetching(false); }
    })();
  }, [open, editId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setToast({ msg: "Project title is required", severity: "error" });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description || "");
      formData.append("category", form.category || "General");
      formData.append("partnerName", form.partnerName || "");
      formData.append("href", form.href || "");
      formData.append("external", form.external);
      formData.append("featured", form.featured);
      formData.append("order", form.order);
      formData.append("status", form.status);

      if (form.imageFile) formData.append("image", form.imageFile);

      if (editId) {
        await updateProject(editId, formData);
        setToast({ msg: "Project updated successfully", severity: "success" });
      } else {
        await createProject(formData);
        setToast({ msg: "Project created successfully", severity: "success" });
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>

      <DialogTitle sx={{ px: 3, py: 2.5, display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: `1px solid ${BORDER}` }}>
        <Typography sx={{ fontWeight: 800, fontSize: 17, color: TEXT }}>
          {isEdit ? "Edit Project" : "Add New Project"}
        </Typography>
        <IconButton onClick={onClose} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>
      </DialogTitle>

      {fetching ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: GREEN }} />
        </Box>
      ) : (
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box component="form" id="project-form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  required fullWidth label="Project Title" value={form.title}
                  onChange={set("title")} placeholder="e.g. Strategic Transformative Education Program (STEP)"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth label="Description" value={form.description}
                  onChange={set("description")} multiline minRows={3}
                  placeholder="What this project/initiative involves..."
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: MUTED, mb: 1 }}>
                  Cover Image
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  {(form.imagePreview || form.existingImageUrl) && (
                    <Box sx={{ width: 120, height: 76, borderRadius: 2, overflow: "hidden",
                      border: `1px solid ${BORDER}`, flexShrink: 0, bgcolor: "#F8FAFC" }}>
                      <img src={form.imagePreview || form.existingImageUrl} alt="preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                  )}
                  <Button variant="outlined" component="label" startIcon={<Image />}
                    sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
                    {form.imageFile || form.existingImageUrl ? "Change Image" : "Upload Image"}
                    <input type="file" hidden accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const preview = URL.createObjectURL(file);
                        setForm((f) => ({ ...f, imageFile: file, imagePreview: preview }));
                      }}
                    />
                  </Button>
                </Stack>
                <Typography sx={{ fontSize: 12, color: MUTED, mt: 1 }}>
                  Use a wide landscape image (min 1200×800) for the sharpest look in the showcase grid.
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Category" value={form.category}
                  onChange={set("category")} placeholder="e.g. Education, Skills & Tech, Partnership"
                  helperText={existingCategories?.length ? `Existing: ${existingCategories.join(", ")}` : " "}
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Partner / Funder (optional)" value={form.partnerName}
                  onChange={set("partnerName")} placeholder="e.g. British Council, US Embassy Nigeria"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth label="Link (href, optional)" value={form.href}
                  onChange={set("href")} placeholder="https://... or leave blank"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LinkIcon sx={{ fontSize: 18, color: MUTED }} /></InputAdornment>,
                  }}
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={6} sm={3} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Switch checked={form.external}
                      onChange={(e) => setForm((f) => ({ ...f, external: e.target.checked }))} />
                  }
                  label={<Typography sx={{ fontSize: 13.5 }}>New tab</Typography>}
                />
              </Grid>

              <Grid item xs={6} sm={3} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Switch checked={form.featured}
                      onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
                  }
                  label={<Typography sx={{ fontSize: 13.5 }}>Featured</Typography>}
                />
              </Grid>

              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth label="Order" type="number"
                  value={form.order} onChange={set("order")}
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={6} sm={3}>
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
            </Grid>
          </Box>
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, py: 2.5, borderTop: `1px solid ${BORDER}`, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button
          type="submit" form="project-form" variant="contained"
          disabled={loading || fetching}
          startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <CheckCircle />}
          sx={{ bgcolor: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2.5, px: 3, "&:hover": { bgcolor: GREEN } }}
        >
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Project"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteDialog = ({ open, onClose, project, onDeleted, setToast }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteProject(project.id);
      setToast({ msg: `"${project.title}" removed.`, severity: "success" });
      onDeleted();
      onClose();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Delete failed", severity: "error" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>
      <DialogTitle sx={{ fontWeight: 800, color: TEXT }}>Remove Project</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14, color: MUTED }}>
          Remove <strong style={{ color: TEXT }}>{project?.title}</strong> from the showcase?
          This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button variant="contained" disabled={loading} onClick={handleDelete}
          sx={{ bgcolor: "#DC2626", textTransform: "none", fontWeight: 700, borderRadius: 2.5 }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : "Remove"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [toast, setToast] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [list, st] = await Promise.all([getAdminProjects(), getProjectStats()]);
      setProjects(Array.isArray(list) ? list : []);
      setStats(st);
    } catch (err) {
      setToast({ msg: "Failed to load projects", severity: "error" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const categories = Array.from(new Set(projects.map((p) => p.category).filter(Boolean)));

  const filtered = projects.filter((p) => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchCategory = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
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
                Projects & Initiatives
              </Typography>
              <Typography sx={{ fontSize: 13.5, opacity: 0.8, mt: 0.75 }}>
                Manage the project showcase shown on the public site
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
                Add Project
              </Button>
            </Stack>
          </Box>
        </Paper>

        {stats && (
          <Grid container spacing={2} mb={4}>
            {[
              { title: "Total Projects", value: stats.total,     color: NAVY,      icon: <Diversity3 /> },
              { title: "Published",      value: stats.published, color: GREEN,     icon: <Public />    },
              { title: "Drafts",         value: stats.drafts,    color: MUTED,     icon: <DraftsTwoTone /> },
              { title: "Archived",       value: stats.archived,  color: "#C2410C", icon: <Archive />   },
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
              size="small" placeholder="Search by title…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: MUTED }} /></InputAdornment> }}
              sx={{ flex: 1, minWidth: 220, "& fieldset": { borderColor: BORDER } }}
            />
            <TextField select size="small" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category" sx={{ minWidth: 170, "& fieldset": { borderColor: BORDER } }}>
              <MenuItem value="">All categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
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
              {filtered.length} of {projects.length} project{projects.length !== 1 ? "s" : ""}
            </Typography>
          </Box>

          {loading ? (
            <LinearProgress sx={{ "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    {["Project", "Category", "Partner", "Status", "Order", "Actions"].map((h) => (
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
                          <Diversity3 sx={{ fontSize: 40, color: BORDER, mb: 1, display: "block", mx: "auto" }} />
                          {search || statusFilter || categoryFilter ? "No projects match your filters." : "No projects yet. Add your first one!"}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((p) => (
                    <TableRow key={p.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ width: 60, height: 40, borderRadius: 1.5, overflow: "hidden",
                            bgcolor: "#F8FAFC", flexShrink: 0, border: `1px solid ${BORDER}` }}>
                            {p.imageUrl ? (
                              <Box component="img" src={p.imageUrl} alt={p.title}
                                sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
                                justifyContent: "center", color: MUTED, fontWeight: 700, fontSize: 13 }}>
                                {p.title?.[0] || "P"}
                              </Box>
                            )}
                          </Box>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {p.featured && <Star sx={{ fontSize: 15, color: GOLD }} />}
                            <Typography sx={{ fontWeight: 700, color: TEXT, fontSize: 14 }} noWrap>{p.title}</Typography>
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={p.category || "General"} size="small" sx={{
                          bgcolor: `${NAVY}0A`, color: NAVY, fontWeight: 600, fontSize: 11.5 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: MUTED, maxWidth: 160 }} noWrap>
                        {p.partnerName || "—"}
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
                          <Tooltip title="Remove">
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

      <ProjectFormDialog
        open={formOpen} onClose={() => setFormOpen(false)} editId={editId}
        onSaved={fetchAll} setToast={setToast} existingCategories={categories}
      />
      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} project={deleteTarget} onDeleted={fetchAll} setToast={setToast} />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}