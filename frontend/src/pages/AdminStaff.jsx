// pages/AdminStaff.jsx
// Full CRUD management page for staff members.
// Connects to: app.use("/api/admin/staff", adminStaffRoutes)

import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, Button, IconButton,
  TextField, MenuItem, Stack, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Snackbar, Alert, Tooltip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, InputAdornment,
} from "@mui/material";

import {
  Add, Edit, Delete, Refresh, Search,
  Archive, Public, DraftsTwoTone, Groups,
  Image, CheckCircle, Close,
  Facebook, LinkedIn, X as XIcon, Instagram, YouTube,
} from "@mui/icons-material";

import {
  getAdminStaffList,
  getAdminStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffStats,
} from "../services/staffService";

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

const SOCIAL_FIELDS = [
  { key: "facebook",  label: "Facebook",  icon: <Facebook fontSize="small" /> },
  { key: "linkedin",  label: "LinkedIn",  icon: <LinkedIn fontSize="small" /> },
  { key: "x",         label: "X (Twitter)", icon: <XIcon fontSize="small" /> },
  { key: "instagram", label: "Instagram", icon: <Instagram fontSize="small" /> },
  { key: "youtube",   label: "YouTube",   icon: <YouTube fontSize="small" /> },
];

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
  name: "",
  role: "",
  bio: "",
  order: 0,
  status: "draft",
  socials: { facebook: "", linkedin: "", x: "", instagram: "", youtube: "" },

  imageFile: null,
  imagePreview: "",
  existingImageUrl: "",
};

// ─────────────────────────────────────────────────────────────
// STAFF FORM DIALOG (create + edit)
// ─────────────────────────────────────────────────────────────
const StaffFormDialog = ({ open, onClose, editId, onSaved, setToast }) => {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching,setFetching]= useState(false);

  useEffect(() => {
    if (!open) { setForm(EMPTY_FORM); return; }
    if (!editId) return;

    (async () => {
      try {
        setFetching(true);
        const s = await getAdminStaff(editId);
        setForm({
          name:   s.name   || "",
          role:   s.role   || "",
          bio: s.bio || "",
          order:  s.order  ?? 0,
          status: s.status || "draft",
          socials: {
            facebook:  s.socials?.facebook  || "",
            linkedin:  s.socials?.linkedin  || "",
            x:         s.socials?.x         || "",
            instagram: s.socials?.instagram || "",
            youtube:   s.socials?.youtube   || "",
          },
          imageFile: null,
          imagePreview: "",
          existingImageUrl: s.imageUrl || "",
        });
      } catch (err) {
        setToast({ msg: "Failed to load staff data", severity: "error" });
        onClose();
      } finally { setFetching(false); }
    })();
  }, [open, editId]);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setSocial = (key) => (e) =>
    setForm((f) => ({ ...f, socials: { ...f.socials, [key]: e.target.value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setToast({ msg: "Name is required", severity: "error" });
      return;
    }
    if (!form.role.trim()) {
      setToast({ msg: "Role is required", severity: "error" });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("role", form.role);
      formData.append("bio", form.bio || "");
      formData.append("order", form.order);
      formData.append("status", form.status);

      // Only include socials that are actually filled in
      const cleanSocials = Object.fromEntries(
        Object.entries(form.socials).filter(([, v]) => v && v.trim() !== "")
      );
      formData.append("socials", JSON.stringify(cleanSocials));

      if (form.imageFile) {
        formData.append("image", form.imageFile);
      }

      if (editId) {
        await updateStaff(editId, formData);
        setToast({ msg: "Staff member updated successfully", severity: "success" });
      } else {
        await createStaff(formData);
        setToast({ msg: "Staff member created successfully", severity: "success" });
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

      <DialogTitle sx={{
        px: 3, py: 2.5, display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: `1px solid ${BORDER}`,
      }}>
        <Typography sx={{ fontWeight: 800, fontSize: 17, color: TEXT }}>
          {isEdit ? "Edit Staff Member" : "Add New Staff Member"}
        </Typography>
        <IconButton onClick={onClose} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>
      </DialogTitle>

      {fetching ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: GREEN }} />
        </Box>
      ) : (
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box component="form" id="staff-form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>

              {/* Name */}
              <Grid item xs={12} sm={7}>
                <TextField
                  required fullWidth label="Full Name" value={form.name}
                  onChange={set("name")} placeholder="e.g. Chinonso Lekwa"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              {/* Order */}
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth label="Display Order" type="number"
                  value={form.order} onChange={set("order")}
                  helperText="Lower = appears first"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              {/* Role */}
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Role / Title" value={form.role}
                  onChange={set("role")} placeholder="e.g. VP ICT, President, Educational Counselor"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              {/* Bio */}
            <Grid item xs={12}>
            <TextField
                fullWidth multiline rows={4} label="Short Bio (optional)"
                value={form.bio} onChange={set("bio")}
                placeholder="A sentence or two about this person — shown on their profile page"
                sx={{ "& fieldset": { borderColor: BORDER } }}
            />
            </Grid>

              {/* Image Upload */}
              <Grid item xs={12}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: MUTED, mb: 1 }}>
                  Photo
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                  {(form.imagePreview || form.existingImageUrl) && (
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: "50%",
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
                    sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}
                  >
                    {form.imageFile || form.existingImageUrl ? "Change Photo" : "Upload Photo"}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const preview = URL.createObjectURL(file);
                        setForm((f) => ({ ...f, imageFile: file, imagePreview: preview }));
                      }}
                    />
                  </Button>

                  {(form.imageFile || form.existingImageUrl) && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() =>
                        setForm((f) => ({ ...f, imageFile: null, imagePreview: "", existingImageUrl: "" }))
                      }
                    >
                      Remove
                    </Button>
                  )}
                </Stack>
              </Grid>

              {/* Socials */}
              <Grid item xs={12}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: MUTED, mb: 1.5 }}>
                  Social Links (optional)
                </Typography>
                <Grid container spacing={2}>
                  {SOCIAL_FIELDS.map(({ key, label, icon }) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <TextField
                        fullWidth
                        label={label}
                        placeholder="https://..."
                        value={form.socials[key]}
                        onChange={setSocial(key)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ color: MUTED }}>
                              {icon}
                            </InputAdornment>
                          ),
                        }}
                        sx={{ "& fieldset": { borderColor: BORDER } }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Status */}
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
            </Grid>
          </Box>
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, py: 2.5, borderTop: `1px solid ${BORDER}`, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button
          type="submit" form="staff-form" variant="contained"
          disabled={loading || fetching}
          startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <CheckCircle />}
          sx={{
            bgcolor: NAVY, textTransform: "none", fontWeight: 700,
            borderRadius: 2.5, px: 3, "&:hover": { bgcolor: GREEN },
          }}
        >
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Staff Member"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────
// DELETE CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────
const DeleteDialog = ({ open, onClose, staff, onDeleted, setToast }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteStaff(staff.id);
      setToast({ msg: `"${staff.name}" removed.`, severity: "success" });
      onDeleted();
      onClose();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Delete failed", severity: "error" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>
      <DialogTitle sx={{ fontWeight: 800, color: TEXT }}>Remove Staff Member</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14, color: MUTED }}>
          Are you sure you want to permanently remove{" "}
          <strong style={{ color: TEXT }}>{staff?.name}</strong>?
          This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button
          variant="contained" disabled={loading} onClick={handleDelete}
          sx={{ bgcolor: "#DC2626", textTransform: "none", fontWeight: 700, borderRadius: 2.5 }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : "Remove"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function AdminStaff() {
  const [staffList,  setStaffList]  = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toast,      setToast]      = useState(null);

  const [formOpen,   setFormOpen]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [list, st] = await Promise.all([
        getAdminStaffList(),
        getStaffStats(),
      ]);
      setStaffList(Array.isArray(list) ? list : []);
      setStats(st);
    } catch (err) {
      setToast({ msg: "Failed to load staff", severity: "error" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = staffList.filter((s) => {
    const matchSearch = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.role?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setEditId(null); setFormOpen(true); };
  const openEdit   = (id) => { setEditId(id); setFormOpen(true); };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 4 } }}>

        {/* HERO */}
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
                Staff Management
              </Typography>
              <Typography sx={{ fontSize: 13.5, opacity: 0.8, mt: 0.75 }}>
                Add, edit and manage GIEVA's team members
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
                Add Staff Member
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* STATS */}
        {stats && (
          <Grid container spacing={2} mb={4}>
            {[
              { title: "Total Staff",  value: stats.total,     color: NAVY,      icon: <Groups />     },
              { title: "Published",    value: stats.published, color: GREEN,     icon: <Public />     },
              { title: "Drafts",       value: stats.drafts,    color: MUTED,     icon: <DraftsTwoTone /> },
              { title: "Archived",     value: stats.archived,  color: "#C2410C", icon: <Archive />    },
            ].map((s) => (
              <Grid item xs={6} sm={4} md key={s.title}>
                <StatCard {...s} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* FILTERS */}
        <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", mb: 3 }}>
          <Box sx={{
            px: 3, py: 2.5,
            display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center",
            borderBottom: `1px solid ${BORDER}`,
          }}>
            <TextField
              size="small"
              placeholder="Search by name or role…"
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
              {filtered.length} of {staffList.length} member{staffList.length !== 1 ? "s" : ""}
            </Typography>
          </Box>

          {/* TABLE */}
          {loading ? (
            <LinearProgress sx={{ "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    {["Member", "Role", "Status", "Order", "Actions"].map((h) => (
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
                      <TableCell colSpan={5} sx={{ textAlign: "center", py: 8, color: MUTED }}>
                        <Box>
                          <Groups sx={{ fontSize: 40, color: BORDER, mb: 1, display: "block", mx: "auto" }} />
                          {search || statusFilter
                            ? "No staff match your filters."
                            : "No staff yet. Add your first member!"}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((s) => (
                    <TableRow key={s.id} hover sx={{ "&:last-child td": { border: 0 } }}>

                      {/* Photo + name */}
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          {s.imageUrl ? (
                            <Avatar
                              src={s.imageUrl}
                              alt={s.name}
                              sx={{ width: 42, height: 42, flexShrink: 0 }}
                            />
                          ) : (
                            <Avatar sx={{ width: 42, height: 42, bgcolor: `${NAVY}14`, color: NAVY, fontSize: 18 }}>
                              {s.name?.[0] || "S"}
                            </Avatar>
                          )}
                          <Typography sx={{ fontWeight: 700, color: TEXT, fontSize: 14 }} noWrap>
                            {s.name}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <Typography sx={{ fontSize: 13.5, color: TEXT }}>{s.role}</Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell><StatusChip status={s.status} /></TableCell>

                      {/* Order */}
                      <TableCell sx={{ fontSize: 14, color: TEXT, fontWeight: 700 }}>
                        {s.order ?? 0}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(s.id)} sx={{ color: NAVY }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => setDeleteTarget(s)} sx={{ color: "#DC2626" }}>
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

      <StaffFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editId={editId}
        onSaved={fetchAll}
        setToast={setToast}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        staff={deleteTarget}
        onDeleted={fetchAll}
        setToast={setToast}
      />

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