// pages/AdminServices.jsx
// Full CRUD management page for platform services.
// Connects to: app.use("/api/admin/service", adminServiceRoutes)

import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, Button, IconButton,
  TextField, MenuItem, Stack, Chip, Divider, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Snackbar, Alert, Tooltip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Switch, FormControlLabel,
  LinearProgress, InputAdornment,
} from "@mui/material";

import {
  Add, Edit, Delete, Refresh, Search,
  Star, StarBorder, Archive, Public, DraftsTwoTone,
  BarChart, Category, Link as LinkIcon, Image,
  CheckCircle, Close, Visibility, VisibilityOff,
} from "@mui/icons-material";

import {
  getAdminServices,
  getAdminService,
  createService,
  updateService,
  deleteService,
  getServiceStats,
} from "../services/serviceService";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const NAVY   = "#0B1F3A";
const GREEN  = "#1E7F4F";
const GOLD   = "#D4A017";
const BG     = "#F7F9FC";
const CARD   = "#FFFFFF";
const BORDER = "#E6E9F0";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  published: { label: "Published", bg: "#ECFDF5", color: GREEN,     icon: <Public      sx={{ fontSize: 12 }} /> },
  draft:     { label: "Draft",     bg: "#F1F5F9", color: MUTED,     icon: <DraftsTwoTone sx={{ fontSize: 12 }} /> },
  archived:  { label: "Archived",  bg: "#FFF7ED", color: "#C2410C", icon: <Archive     sx={{ fontSize: 12 }} /> },
};

const StatusChip = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      size="small"
      sx={{
        bgcolor: cfg.bg, color: cfg.color, fontWeight: 700,
        fontSize: 11, height: 22,
        "& .MuiChip-icon": { color: cfg.color },
      }}
    />
  );
};

const StatCard = ({ title, value, color = NAVY, icon }) => (
  <Paper elevation={0} sx={{
    border: `1px solid ${BORDER}`, borderRadius: 3, p: 2.5,
    bgcolor: CARD, display: "flex", flexDirection: "column", gap: 1,
  }}>
    <Box sx={{
      width: 38, height: 38, borderRadius: 2, bgcolor: `${color}18`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color, "& svg": { fontSize: 20 },
    }}>
      {icon}
    </Box>
    <Typography sx={{ fontSize: 11.5, color: MUTED, fontWeight: 600 }}>{title}</Typography>
    <Typography sx={{ fontSize: 24, fontWeight: 800, color: TEXT, lineHeight: 1 }}>{value ?? 0}</Typography>
  </Paper>
);

// ─────────────────────────────────────────────────────────────
// EMPTY FORM STATE
// ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: "",
  description: "",
  iconName: "",
  href: "",
  featured: false,
  category: "",
  order: 0,
  status: "draft",

  // Image fields
  imageFile: null,
  imagePreview: "",
  existingImageUrl: "",
};

// ─────────────────────────────────────────────────────────────
// SERVICE FORM DIALOG  (create + edit)
// ─────────────────────────────────────────────────────────────
const ServiceFormDialog = ({ open, onClose, editId, onSaved, setToast }) => {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching,setFetching]= useState(false);

  // Load existing service when editing
  useEffect(() => {
    if (!open) { setForm(EMPTY_FORM); return; }
    if (!editId) return;

    (async () => {
      try {
        setFetching(true);
        const svc = await getAdminService(editId);
        setForm({
          title:             svc.title             || "",
          description:       svc.description       || "",
          iconName:          svc.iconName          || "",
          href:              svc.href              || "",
          featured:          svc.featured          || false,
          category:          svc.category          || "",
          order:             svc.order             ?? 0,
          status:            svc.status            || "draft",
          imageFile: null,       // the actual File object
          imagePreview: "",      // local preview URL
          existingImageUrl: svc.imageUrl || "",  // when editing
        });
      } catch (err) {
        setToast({ msg: "Failed to load service data", severity: "error" });
        onClose();
      } finally { setFetching(false); }
    })();
  }, [open, editId]);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!form.title.trim()) {
  //     setToast({ msg: "Title is required", severity: "error" }); return;
  //   }
  //   try {
  //     setLoading(true);
  //     // Controller accepts JSON — the service file sends multipart but
  //     // the controller reads req.body fields directly, so JSON is fine.
  //     // We build a plain object (not FormData) for simplicity since
  //     // image upload is optional and handled via imageUrl/imageCloudinaryId.
  //     if (editId) {
  //       await updateService(editId, form);
  //       setToast({ msg: "Service updated successfully", severity: "success" });
  //     } else {
  //       await createService(form);
  //       setToast({ msg: "Service created successfully", severity: "success" });
  //     }
  //     onSaved();
  //     onClose();
  //   } catch (err) {
  //     setToast({ msg: err?.response?.data?.message || "Save failed", severity: "error" });
  //   } finally { setLoading(false); }
  // };

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
    formData.append("description", form.description || "");
    formData.append("iconName", form.iconName || "");
    formData.append("href", form.href || "/services");
    formData.append("featured", form.featured);
    formData.append("category", form.category || "General");
    formData.append("order", form.order);
    formData.append("status", form.status);

    // Only append image if a new file was selected
    if (form.imageFile) {
      formData.append("image", form.imageFile);
    }

    if (editId) {
      await updateService(editId, formData);
      setToast({ msg: "Service updated successfully", severity: "success" });
    } else {
      await createService(formData);
      setToast({ msg: "Service created successfully", severity: "success" });
    }

    onSaved();
    onClose();
  } catch (err) {
    setToast({
      msg: err?.response?.data?.message || "Save failed",
      severity: "error",
    });
  } finally {
    setLoading(false);
  }
};
  
  const isEdit = !!editId;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>

      {/* Header */}
      <DialogTitle sx={{
        px: 3, py: 2.5, display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: `1px solid ${BORDER}`,
      }}>
        <Typography sx={{ fontWeight: 800, fontSize: 17, color: TEXT }}>
          {isEdit ? "Edit Service" : "Create New Service"}
        </Typography>
        <IconButton onClick={onClose} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>
      </DialogTitle>

      {fetching ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: GREEN }} />
        </Box>
      ) : (
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box component="form" id="service-form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>

              {/* Title */}
              <Grid item xs={12} sm={8}>
                <TextField
                  required fullWidth label="Title" value={form.title}
                  onChange={set("title")} placeholder="e.g. SAT Registration"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              {/* Order */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Display Order" type="number"
                  value={form.order} onChange={set("order")}
                  helperText="Lower = appears first"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth multiline rows={3} label="Description"
                  value={form.description} onChange={set("description")}
                  placeholder="Short description shown on the service card"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Category" value={form.category}
                  onChange={set("category")} placeholder="e.g. Exams, HEALS, LMS"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Category sx={{ fontSize: 18, color: MUTED }} /></InputAdornment>,
                  }}
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              {/* Icon Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Icon Name" value={form.iconName}
                  onChange={set("iconName")} placeholder="e.g. School, Assessment"
                  helperText="MUI icon name (optional)"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              {/* Href / Link */}
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Link (href)" value={form.href}
                  onChange={set("href")} placeholder="/exam-register or https://..."
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LinkIcon sx={{ fontSize: 18, color: MUTED }} /></InputAdornment>,
                  }}
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              {/* Image Upload */}
              <Grid item xs={12}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: MUTED, mb: 1 }}>
                  Service Image
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                  {/* Preview */}
                  {(form.imagePreview || form.existingImageUrl) && (
                    <Box
                      sx={{
                        width: 100,
                        height: 70,
                        borderRadius: 2,
                        overflow: "hidden",
                        border: `1px solid ${BORDER}`,
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={form.imagePreview || form.existingImageUrl}
                        alt="preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Box>
                  )}

                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Image />}
                    sx={{
                      textTransform: "none",
                      borderColor: BORDER,
                      color: MUTED,
                      borderRadius: 2,
                    }}
                  >
                    {form.imageFile || form.existingImageUrl ? "Change Image" : "Upload Image"}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // local preview
                        const preview = URL.createObjectURL(file);
                        setForm((f) => ({
                          ...f,
                          imageFile: file,
                          imagePreview: preview,
                        }));
                      }}
                    />
                  </Button>

                  {(form.imageFile || form.existingImageUrl) && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          imageFile: null,
                          imagePreview: "",
                          existingImageUrl: "",
                        }))
                      }
                    >
                      Remove
                    </Button>
                  )}
                </Stack>
              </Grid>

              {/* Status + Featured */}
              <Grid item xs={12} sm={6}>
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

              <Grid item xs={12} sm={6} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!form.featured}
                      onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked":            { color: GOLD },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: GOLD },
                      }}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Star sx={{ fontSize: 18, color: form.featured ? GOLD : MUTED }} />
                      <Typography sx={{ fontSize: 14, color: form.featured ? GOLD : MUTED, fontWeight: 600 }}>
                        Featured service
                      </Typography>
                    </Stack>
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, py: 2.5, borderTop: `1px solid ${BORDER}`, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button
          type="submit" form="service-form" variant="contained"
          disabled={loading || fetching}
          startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <CheckCircle />}
          sx={{
            bgcolor: NAVY, textTransform: "none", fontWeight: 700,
            borderRadius: 2.5, px: 3, "&:hover": { bgcolor: GREEN },
          }}
        >
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Service"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────
// DELETE CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────
const DeleteDialog = ({ open, onClose, service, onDeleted, setToast }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteService(service.id);
      setToast({ msg: `"${service.title}" deleted.`, severity: "success" });
      onDeleted();
      onClose();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Delete failed", severity: "error" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>
      <DialogTitle sx={{ fontWeight: 800, color: TEXT }}>Delete Service</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14, color: MUTED }}>
          Are you sure you want to permanently delete{" "}
          <strong style={{ color: TEXT }}>{service?.title}</strong>?
          This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button
          variant="contained" disabled={loading} onClick={handleDelete}
          sx={{ bgcolor: "#DC2626", textTransform: "none", fontWeight: 700, borderRadius: 2.5 }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function AdminServices() {
  const [services,   setServices]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toast,      setToast]      = useState(null);

  // Dialog state
  const [formOpen,   setFormOpen]   = useState(false);
  const [editId,     setEditId]     = useState(null);   // null = create
  const [deleteTarget, setDeleteTarget] = useState(null); // service object

  // ── Fetch ────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [svcs, st] = await Promise.all([
        getAdminServices(),
        getServiceStats(),
      ]);
      setServices(Array.isArray(svcs) ? svcs : []);
      setStats(st);
    } catch (err) {
      setToast({ msg: "Failed to load services", severity: "error" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtered list ────────────────────────────────────────
  const filtered = services.filter((s) => {
    const matchSearch = !search ||
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Handlers ─────────────────────────────────────────────
  const openCreate = () => { setEditId(null); setFormOpen(true); };
  const openEdit   = (id) => { setEditId(id); setFormOpen(true); };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 4 } }}>

        {/* ══ HERO ════════════════════════════════════════ */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 5, mb: 4, overflow: "hidden",
            background: "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
            color: "#fff", p: { xs: 3, md: 4 },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography sx={{ fontSize: { xs: 22, md: 27 }, fontWeight: 800, lineHeight: 1.2 }}>
                Services Management
              </Typography>
              <Typography sx={{ fontSize: 13.5, opacity: 0.8, mt: 0.75 }}>
                Create, edit and manage all platform services
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchAll}
                sx={{
                  borderColor: "rgba(255,255,255,0.35)", color: "#fff",
                  textTransform: "none", fontWeight: 700, borderRadius: 3,
                  "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={openCreate}
                sx={{
                  bgcolor: GOLD, color: NAVY, textTransform: "none",
                  fontWeight: 800, borderRadius: 3, px: 2.5,
                  "&:hover": { bgcolor: "#C8970F" },
                }}
              >
                New Service
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* ══ STATS ════════════════════════════════════════ */}
        {stats && (
          <Grid container spacing={2} mb={4}>
            {[
              { title: "Total Services",  value: stats.total,     color: NAVY,    icon: <BarChart />   },
              { title: "Published",       value: stats.published, color: GREEN,   icon: <Public />     },
              { title: "Drafts",          value: stats.drafts,    color: MUTED,   icon: <DraftsTwoTone /> },
              { title: "Archived",        value: stats.archived,  color: "#C2410C", icon: <Archive /> },
              { title: "Featured",        value: stats.featured,  color: GOLD,    icon: <Star />       },
            ].map((s) => (
              <Grid item xs={6} sm={4} md key={s.title}>
                <StatCard {...s} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* ══ FILTERS ══════════════════════════════════════ */}
        <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", mb: 3 }}>
          <Box sx={{
            px: 3, py: 2.5,
            display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center",
            borderBottom: `1px solid ${BORDER}`,
          }}>
            <TextField
              size="small"
              placeholder="Search by title, category, description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: MUTED }} /></InputAdornment>,
              }}
              sx={{ flex: 1, minWidth: 220, "& fieldset": { borderColor: BORDER } }}
            />
            <TextField
              select size="small" value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{ minWidth: 150, "& fieldset": { borderColor: BORDER } }}
            >
              <MenuItem value="">All statuses</MenuItem>
              {["draft", "published", "archived"].map((s) => (
                <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            <Typography sx={{ fontSize: 13, color: MUTED }}>
              {filtered.length} of {services.length} service{services.length !== 1 ? "s" : ""}
            </Typography>
          </Box>

          {/* ══ TABLE ════════════════════════════════════ */}
          {loading ? (
            <LinearProgress sx={{ "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    {["Service", "Category", "Status", "Featured", "Order", "Actions"].map((h) => (
                      <TableCell key={h} sx={{
                        fontWeight: 700, color: NAVY, fontSize: 11.5,
                        textTransform: "uppercase", letterSpacing: 0.6, py: 1.5,
                      }}>
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
                          <BarChart sx={{ fontSize: 40, color: BORDER, mb: 1, display: "block", mx: "auto" }} />
                          {search || statusFilter
                            ? "No services match your filters."
                            : "No services yet. Create your first one!"}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((svc) => (
                    <TableRow key={svc.id} hover sx={{ "&:last-child td": { border: 0 } }}>

                      {/* Service name + image */}
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          {svc.imageUrl ? (
                            <Box
                              component="img"
                              src={svc.imageUrl}
                              alt={svc.title}
                              sx={{ width: 42, height: 42, borderRadius: 2, objectFit: "cover", flexShrink: 0 }}
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          ) : (
                            <Avatar sx={{ width: 42, height: 42, bgcolor: `${NAVY}14`, color: NAVY, borderRadius: 2, fontSize: 18 }}>
                              {svc.iconName?.[0] || svc.title?.[0] || "S"}
                            </Avatar>
                          )}
                          <Box minWidth={0}>
                            <Typography sx={{ fontWeight: 700, color: TEXT, fontSize: 14 }} noWrap>
                              {svc.title}
                            </Typography>
                            {svc.description && (
                              <Typography sx={{ fontSize: 12, color: MUTED, mt: 0.1 }}
                                noWrap style={{ maxWidth: 200 }}>
                                {svc.description}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        {svc.category
                          ? <Chip label={svc.category} size="small"
                              sx={{ bgcolor: `${NAVY}10`, color: NAVY, fontWeight: 600, fontSize: 11 }} />
                          : <Typography sx={{ fontSize: 13, color: MUTED }}>—</Typography>
                        }
                      </TableCell>

                      {/* Status */}
                      <TableCell><StatusChip status={svc.status} /></TableCell>

                      {/* Featured */}
                      <TableCell>
                        {svc.featured
                          ? <Star sx={{ fontSize: 20, color: GOLD }} />
                          : <StarBorder sx={{ fontSize: 20, color: BORDER }} />
                        }
                      </TableCell>

                      {/* Order */}
                      <TableCell sx={{ fontSize: 14, color: TEXT, fontWeight: 700 }}>
                        {svc.order ?? 0}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {svc.href && (
                            <Tooltip title="Open link">
                              <IconButton
                                size="small"
                                component="a" href={svc.href} target="_blank" rel="noreferrer"
                                sx={{ color: MUTED }}
                              >
                                <LinkIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(svc.id)} sx={{ color: NAVY }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => setDeleteTarget(svc)} sx={{ color: "#DC2626" }}>
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

      {/* ══ DIALOGS ══════════════════════════════════════════ */}
      <ServiceFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editId={editId}
        onSaved={fetchAll}
        setToast={setToast}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        service={deleteTarget}
        onDeleted={fetchAll}
        setToast={setToast}
      />

      {/* ══ TOAST ════════════════════════════════════════════ */}
      <Snackbar
        open={!!toast} autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
