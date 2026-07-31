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
  Archive, Public, DraftsTwoTone, Handshake,
  Image, CheckCircle, Close, Link as LinkIcon,
} from "@mui/icons-material";

import {
  getAdminPartners,
  getAdminPartner,
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerStats,
} from "../services/partnerService";

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
  name: "",
  href: "",
  external: false,
  order: 0,
  status: "draft",
  logoFile: null,
  logoPreview: "",
  existingLogoUrl: "",
};

const PartnerFormDialog = ({ open, onClose, editId, onSaved, setToast }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open) { setForm(EMPTY_FORM); return; }
    if (!editId) return;

    (async () => {
      try {
        setFetching(true);
        const p = await getAdminPartner(editId);
        setForm({
          name: p.name || "",
          href: p.href || "",
          external: !!p.external,
          order: p.order ?? 0,
          status: p.status || "draft",
          logoFile: null,
          logoPreview: "",
          existingLogoUrl: p.logoUrl || "",
        });
      } catch (err) {
        setToast({ msg: "Failed to load partner data", severity: "error" });
        onClose();
      } finally { setFetching(false); }
    })();
  }, [open, editId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setToast({ msg: "Partner name is required", severity: "error" });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("href", form.href || "#");
      formData.append("external", form.external);
      formData.append("order", form.order);
      formData.append("status", form.status);

      if (form.logoFile) formData.append("logo", form.logoFile);

      if (editId) {
        await updatePartner(editId, formData);
        setToast({ msg: "Partner updated successfully", severity: "success" });
      } else {
        await createPartner(formData);
        setToast({ msg: "Partner created successfully", severity: "success" });
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
          {isEdit ? "Edit Partner" : "Add New Partner"}
        </Typography>
        <IconButton onClick={onClose} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>
      </DialogTitle>

      {fetching ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: GREEN }} />
        </Box>
      ) : (
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box component="form" id="partner-form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  required fullWidth label="Partner Name" value={form.name}
                  onChange={set("name")} placeholder="e.g. Drake University"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: MUTED, mb: 1 }}>
                  Logo
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  {(form.logoPreview || form.existingLogoUrl) && (
                    <Box sx={{ width: 100, height: 60, borderRadius: 2, overflow: "hidden",
                      border: `1px solid ${BORDER}`, flexShrink: 0, display: "flex",
                      alignItems: "center", justifyContent: "center", bgcolor: "#F8FAFC" }}>
                      <img src={form.logoPreview || form.existingLogoUrl} alt="preview"
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </Box>
                  )}
                  <Button variant="outlined" component="label" startIcon={<Image />}
                    sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
                    {form.logoFile || form.existingLogoUrl ? "Change Logo" : "Upload Logo"}
                    <input type="file" hidden accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const preview = URL.createObjectURL(file);
                        setForm((f) => ({ ...f, logoFile: file, logoPreview: preview }));
                      }}
                    />
                  </Button>
                  {(form.logoFile || form.existingLogoUrl) && (
                    <Button size="small" color="error"
                      onClick={() => setForm((f) => ({ ...f, logoFile: null, logoPreview: "", existingLogoUrl: "" }))}>
                      Remove
                    </Button>
                  )}
                </Stack>
                <Typography sx={{ fontSize: 12, color: MUTED, mt: 1 }}>
                  Use a transparent PNG or SVG-exported-as-PNG logo for the cleanest look on the marquee.
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth label="Link (href)" value={form.href}
                  onChange={set("href")} placeholder="https://partner-website.com or #"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LinkIcon sx={{ fontSize: 18, color: MUTED }} /></InputAdornment>,
                  }}
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12} sm={6} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.external}
                      onChange={(e) => setForm((f) => ({ ...f, external: e.target.checked }))}
                    />
                  }
                  label={<Typography sx={{ fontSize: 14 }}>Opens in new tab</Typography>}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth label="Order" type="number"
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
            </Grid>
          </Box>
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, py: 2.5, borderTop: `1px solid ${BORDER}`, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button
          type="submit" form="partner-form" variant="contained"
          disabled={loading || fetching}
          startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <CheckCircle />}
          sx={{ bgcolor: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2.5, px: 3, "&:hover": { bgcolor: GREEN } }}
        >
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Partner"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteDialog = ({ open, onClose, partner, onDeleted, setToast }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deletePartner(partner.id);
      setToast({ msg: `"${partner.name}" removed.`, severity: "success" });
      onDeleted();
      onClose();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Delete failed", severity: "error" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>
      <DialogTitle sx={{ fontWeight: 800, color: TEXT }}>Remove Partner</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14, color: MUTED }}>
          Remove <strong style={{ color: TEXT }}>{partner?.name}</strong> from the partners list?
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

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [list, st] = await Promise.all([getAdminPartners(), getPartnerStats()]);
      setPartners(Array.isArray(list) ? list : []);
      setStats(st);
    } catch (err) {
      setToast({ msg: "Failed to load partners", severity: "error" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = partners.filter((p) => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
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
                Partners Management
              </Typography>
              <Typography sx={{ fontSize: 13.5, opacity: 0.8, mt: 0.75 }}>
                Manage the logos shown in the partners marquee
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
                Add Partner
              </Button>
            </Stack>
          </Box>
        </Paper>

        {stats && (
          <Grid container spacing={2} mb={4}>
            {[
              { title: "Total Partners", value: stats.total,     color: NAVY,      icon: <Handshake /> },
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
              size="small" placeholder="Search by name…"
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
              {filtered.length} of {partners.length} partner{partners.length !== 1 ? "s" : ""}
            </Typography>
          </Box>

          {loading ? (
            <LinearProgress sx={{ "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    {["Partner", "Link", "Status", "Order", "Actions"].map((h) => (
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
                      <TableCell colSpan={5} sx={{ textAlign: "center", py: 8, color: MUTED }}>
                        <Box>
                          <Handshake sx={{ fontSize: 40, color: BORDER, mb: 1, display: "block", mx: "auto" }} />
                          {search || statusFilter ? "No partners match your filters." : "No partners yet. Add your first one!"}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((p) => (
                    <TableRow key={p.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          {p.logoUrl ? (
                            <Box sx={{ width: 60, height: 36, display: "flex", alignItems: "center",
                              justifyContent: "center", bgcolor: "#F8FAFC", borderRadius: 1.5, flexShrink: 0 }}>
                              <Box component="img" src={p.logoUrl} alt={p.name}
                                sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                            </Box>
                          ) : (
                            <Box sx={{ width: 60, height: 36, borderRadius: 1.5, bgcolor: `${NAVY}14`,
                              display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, fontWeight: 700, fontSize: 13 }}>
                              {p.name?.[0] || "P"}
                            </Box>
                          )}
                          <Typography sx={{ fontWeight: 700, color: TEXT, fontSize: 14 }} noWrap>{p.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: MUTED, maxWidth: 220 }} noWrap>
                        {p.href && p.href !== "#" ? p.href : "—"}
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

      <PartnerFormDialog open={formOpen} onClose={() => setFormOpen(false)} editId={editId} onSaved={fetchAll} setToast={setToast} />
      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} partner={deleteTarget} onDeleted={fetchAll} setToast={setToast} />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}