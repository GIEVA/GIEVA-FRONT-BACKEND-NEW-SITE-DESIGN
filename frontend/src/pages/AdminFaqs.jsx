import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, Button, IconButton,
  TextField, MenuItem, Stack, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Snackbar, Alert, Tooltip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, InputAdornment,
} from "@mui/material";

import {
  Add, Edit, Delete, Refresh, Search,
  Archive, Public, DraftsTwoTone, QuestionAnswer,
  CheckCircle, Close,
} from "@mui/icons-material";

import {
  getAdminFaqs,
  getAdminFaq,
  createFaq,
  updateFaq,
  deleteFaq,
  getFaqStats,
} from "../services/faqService";

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
  question: "",
  answer: "",
  category: "General",
  order: 0,
  status: "draft",
};

const FaqFormDialog = ({ open, onClose, editId, onSaved, setToast, existingCategories }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open) { setForm(EMPTY_FORM); return; }
    if (!editId) return;

    (async () => {
      try {
        setFetching(true);
        const f = await getAdminFaq(editId);
        setForm({
          question: f.question || "",
          answer: f.answer || "",
          category: f.category || "General",
          order: f.order ?? 0,
          status: f.status || "draft",
        });
      } catch (err) {
        setToast({ msg: "Failed to load FAQ data", severity: "error" });
        onClose();
      } finally { setFetching(false); }
    })();
  }, [open, editId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      setToast({ msg: "Question and answer are required", severity: "error" });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        question: form.question,
        answer: form.answer,
        category: form.category || "General",
        order: form.order,
        status: form.status,
      };

      if (editId) {
        await updateFaq(editId, payload);
        setToast({ msg: "FAQ updated successfully", severity: "success" });
      } else {
        await createFaq(payload);
        setToast({ msg: "FAQ created successfully", severity: "success" });
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
          {isEdit ? "Edit FAQ" : "Add New FAQ"}
        </Typography>
        <IconButton onClick={onClose} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>
      </DialogTitle>

      {fetching ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: GREEN }} />
        </Box>
      ) : (
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box component="form" id="faq-form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  required fullWidth label="Question" value={form.question}
                  onChange={set("question")} placeholder="e.g. How do I apply for a program?"
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required fullWidth label="Answer" value={form.answer}
                  onChange={set("answer")} multiline minRows={4}
                  placeholder="Write the answer here..."
                  sx={{ "& fieldset": { borderColor: BORDER } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth freeSolo={undefined} label="Category" value={form.category}
                  onChange={set("category")} placeholder="e.g. Admissions"
                  helperText={existingCategories?.length ? `Existing: ${existingCategories.join(", ")}` : " "}
                  sx={{ "& fieldset": { borderColor: BORDER } }}
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
          type="submit" form="faq-form" variant="contained"
          disabled={loading || fetching}
          startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <CheckCircle />}
          sx={{ bgcolor: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2.5, px: 3, "&:hover": { bgcolor: GREEN } }}
        >
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Add FAQ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteDialog = ({ open, onClose, faq, onDeleted, setToast }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteFaq(faq.id);
      setToast({ msg: "FAQ removed.", severity: "success" });
      onDeleted();
      onClose();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Delete failed", severity: "error" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>
      <DialogTitle sx={{ fontWeight: 800, color: TEXT }}>Remove FAQ</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14, color: MUTED }}>
          Remove this FAQ? <br />
          <strong style={{ color: TEXT }}>{faq?.question}</strong> <br />
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

export default function AdminFaqs() {
  const [faqs, setFaqs] = useState([]);
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
      const [list, st] = await Promise.all([getAdminFaqs(), getFaqStats()]);
      setFaqs(Array.isArray(list) ? list : []);
      setStats(st);
    } catch (err) {
      setToast({ msg: "Failed to load FAQs", severity: "error" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const categories = Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)));

  const filtered = faqs.filter((f) => {
    const matchSearch = !search || f.question?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || f.status === statusFilter;
    const matchCategory = !categoryFilter || f.category === categoryFilter;
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
                FAQ Management
              </Typography>
              <Typography sx={{ fontSize: 13.5, opacity: 0.8, mt: 0.75 }}>
                Manage questions shown on the public FAQ page
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
                Add FAQ
              </Button>
            </Stack>
          </Box>
        </Paper>

        {stats && (
          <Grid container spacing={2} mb={4}>
            {[
              { title: "Total FAQs",  value: stats.total,     color: NAVY,      icon: <QuestionAnswer /> },
              { title: "Published",   value: stats.published, color: GREEN,     icon: <Public />    },
              { title: "Drafts",      value: stats.drafts,    color: MUTED,     icon: <DraftsTwoTone /> },
              { title: "Archived",    value: stats.archived,  color: "#C2410C", icon: <Archive />   },
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
              size="small" placeholder="Search by question…"
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
              {filtered.length} of {faqs.length} FAQ{faqs.length !== 1 ? "s" : ""}
            </Typography>
          </Box>

          {loading ? (
            <LinearProgress sx={{ "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    {["Question", "Category", "Status", "Order", "Actions"].map((h) => (
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
                          <QuestionAnswer sx={{ fontSize: 40, color: BORDER, mb: 1, display: "block", mx: "auto" }} />
                          {search || statusFilter || categoryFilter ? "No FAQs match your filters." : "No FAQs yet. Add your first one!"}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((f) => (
                    <TableRow key={f.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ maxWidth: 380 }}>
                        <Typography sx={{ fontWeight: 700, color: TEXT, fontSize: 14 }}>
                          {f.question}
                        </Typography>
                        <Typography sx={{ fontSize: 12.5, color: MUTED, mt: 0.25,
                          display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {f.answer}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={f.category || "General"} size="small" sx={{
                          bgcolor: `${NAVY}0A`, color: NAVY, fontWeight: 600, fontSize: 11.5 }} />
                      </TableCell>
                      <TableCell><StatusChip status={f.status} /></TableCell>
                      <TableCell sx={{ fontSize: 14, color: TEXT, fontWeight: 700 }}>{f.order ?? 0}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(f.id)} sx={{ color: NAVY }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => setDeleteTarget(f)} sx={{ color: "#DC2626" }}>
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

      <FaqFormDialog
        open={formOpen} onClose={() => setFormOpen(false)} editId={editId}
        onSaved={fetchAll} setToast={setToast} existingCategories={categories}
      />
      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} faq={deleteTarget} onDeleted={fetchAll} setToast={setToast} />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}