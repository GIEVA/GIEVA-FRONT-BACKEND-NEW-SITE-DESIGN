// pages/admin/AdminExamTypes.jsx
//
// Admin page: create / edit / publish exam types with a
// visual drag-and-drop-free field schema builder.
// No libraries beyond MUI needed.

import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, Button, Chip, Stack,
  CircularProgress, TextField, MenuItem, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar, Divider, Switch,
  FormControlLabel, Table, TableBody, TableCell,
  TableHead, TableRow, Collapse, InputAdornment,
} from "@mui/material";

import {
  Add, Edit, Delete, Publish, Archive, ExpandMore,
  ExpandLess, DragIndicator, Close, ArrowUpward,
  ArrowDownward, Visibility, CheckCircle,
} from "@mui/icons-material";

import {
  adminListExams,
  adminCreateExam,
  adminUpdateExam,
  adminSetExamStatus,
  adminDeleteExam,
} from "../../services/examTypeService";

// ─── Design tokens ────────────────────────────────────────────
const NAVY   = "#0B1F3A";
const GREEN  = "#1E7F4F";
const GOLD   = "#D4A017";
const BG     = "#F7F9FC";
const CARD   = "#FFFFFF";
const BORDER = "#E6E9F0";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";

const FIELD_TYPES = [
  { value: "text",     label: "Text" },
  { value: "email",    label: "Email" },
  { value: "tel",      label: "Phone" },
  { value: "date",     label: "Date" },
  { value: "number",   label: "Number" },
  { value: "select",   label: "Dropdown (Select)" },
  { value: "textarea", label: "Long Text (Textarea)" },
];

const STATUS_CONFIG = {
  draft:     { label: "Draft",     color: MUTED,     bg: "#F1F5F9" },
  published: { label: "Published", color: GREEN,     bg: `${GREEN}15` },
  archived:  { label: "Archived",  color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
};

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
    .format(n);

// ─── Empty field template ─────────────────────────────────────
const emptyField = () => ({
  key:         "",
  label:       "",
  type:        "text",
  required:    true,
  options:     "",   // comma-separated string for select; saved as array
  placeholder: "",
  helperText:  "",
  section:     "Personal Information",
  _id:         Math.random().toString(36).slice(2),
});

// ─── Field Schema Builder ─────────────────────────────────────
const FieldSchemaBuilder = ({ fields, onChange }) => {
  const addField = () => onChange([...fields, emptyField()]);

  const removeField = (id) =>
    onChange(fields.filter((f) => f._id !== id));

  const updateField = (id, key, value) =>
    onChange(fields.map((f) => (f._id === id ? { ...f, [key]: value } : f)));

  const moveField = (id, dir) => {
    const idx  = fields.findIndex((f) => f._id === id);
    const next = [...fields];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }}>
          Form Fields ({fields.length})
        </Typography>
        <Button size="small" startIcon={<Add />} onClick={addField}
          variant="outlined"
          sx={{ textTransform: "none", fontWeight: 700, borderColor: BORDER,
                color: NAVY, borderRadius: 2 }}>
          Add Field
        </Button>
      </Box>

      {fields.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4, border: `2px dashed ${BORDER}`, borderRadius: 3 }}>
          <Typography sx={{ color: MUTED, fontSize: 14 }}>
            No fields yet. Click "Add Field" to build your form.
          </Typography>
        </Box>
      )}

      <Stack spacing={1.5}>
        {fields.map((field, idx) => (
          <Paper key={field._id} variant="outlined"
            sx={{ borderColor: BORDER, borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <DragIndicator sx={{ color: MUTED, fontSize: 18, cursor: "grab" }} />
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: MUTED, flex: 1 }}>
                Field {idx + 1}
                {field.label && ` — ${field.label}`}
              </Typography>
              <Tooltip title="Move up">
                <IconButton size="small" onClick={() => moveField(field._id, -1)} disabled={idx === 0}>
                  <ArrowUpward sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Move down">
                <IconButton size="small" onClick={() => moveField(field._id, 1)} disabled={idx === fields.length - 1}>
                  <ArrowDownward sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove field">
                <IconButton size="small" onClick={() => removeField(field._id)}
                  sx={{ color: "#ef4444" }}>
                  <Close sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            </Box>

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Field Key *"
                  value={field.key} placeholder="e.g. testDate"
                  onChange={(e) => updateField(field._id, "key", e.target.value.replace(/\s/g, ""))}
                  helperText="Unique identifier, no spaces"
                  sx={{ "& fieldset": { borderColor: BORDER } }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Label *"
                  value={field.label} placeholder="e.g. Preferred Test Date"
                  onChange={(e) => updateField(field._id, "label", e.target.value)}
                  sx={{ "& fieldset": { borderColor: BORDER } }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" select label="Type *"
                  value={field.type}
                  onChange={(e) => updateField(field._id, "type", e.target.value)}
                  sx={{ "& fieldset": { borderColor: BORDER } }}>
                  {FIELD_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {field.type === "select" && (
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Options (comma-separated) *"
                    value={field.options}
                    placeholder="e.g. Academic,General Training"
                    onChange={(e) => updateField(field._id, "options", e.target.value)}
                    helperText="Separate each option with a comma"
                    sx={{ "& fieldset": { borderColor: BORDER } }} />
                </Grid>
              )}

              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Section"
                  value={field.section}
                  placeholder="e.g. Personal Information"
                  onChange={(e) => updateField(field._id, "section", e.target.value)}
                  helperText="Groups fields under a heading"
                  sx={{ "& fieldset": { borderColor: BORDER } }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Placeholder"
                  value={field.placeholder}
                  onChange={(e) => updateField(field._id, "placeholder", e.target.value)}
                  sx={{ "& fieldset": { borderColor: BORDER } }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Helper text"
                  value={field.helperText}
                  onChange={(e) => updateField(field._id, "helperText", e.target.value)}
                  helperText="Shown below the field as a hint"
                  sx={{ "& fieldset": { borderColor: BORDER } }} />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={field.required}
                      onChange={(e) => updateField(field._id, "required", e.target.checked)}
                      sx={{ "& .Mui-checked": { color: GREEN } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: 13, color: MUTED }}>Required field</Typography>
                  }
                />
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

// ─── Pricing Config ───────────────────────────────────────────
const PricingConfig = ({ pricingType, flatPrice, priceVariants, onChange }) => {
  const addVariant = () =>
    onChange("priceVariants", [...priceVariants, { key: "", label: "", price: 0, _id: Math.random().toString(36).slice(2) }]);

  const updateVariant = (id, k, v) =>
    onChange("priceVariants", priceVariants.map((pv) => (pv._id === id ? { ...pv, [k]: v } : pv)));

  const removeVariant = (id) =>
    onChange("priceVariants", priceVariants.filter((pv) => pv._id !== id));

  return (
    <Box>
      <TextField fullWidth select label="Pricing Type" value={pricingType} size="small"
        onChange={(e) => onChange("pricingType", e.target.value)}
        sx={{ mb: 2, "& fieldset": { borderColor: BORDER } }}>
        <MenuItem value="flat">Flat price (single amount)</MenuItem>
        <MenuItem value="variants">Variants (different options, different prices)</MenuItem>
      </TextField>

      {pricingType === "flat" && (
        <TextField fullWidth size="small" type="number" label="Price (USD) *"
          value={flatPrice}
          onChange={(e) => onChange("flatPrice", Number(e.target.value))}
          InputProps={{
            inputProps: { min: 0, step: 0.01 },
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          helperText={flatPrice > 0 ? fmt(flatPrice) : ""}
          sx={{ "& fieldset": { borderColor: BORDER } }} />
      )}

      {pricingType === "variants" && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: MUTED }}>
              Price Variants
            </Typography>
            <Button size="small" startIcon={<Add />} onClick={addVariant}
              sx={{ textTransform: "none", fontWeight: 700, color: NAVY, fontSize: 12 }}>
              Add Variant
            </Button>
          </Box>
          <Stack spacing={1}>
            {priceVariants.map((pv) => (
              <Grid container spacing={1} key={pv._id || pv.key} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth size="small" label="Key" value={pv.key}
                    placeholder="e.g. F1"
                    onChange={(e) => updateVariant(pv._id || pv.key, "key", e.target.value)}
                    sx={{ "& fieldset": { borderColor: BORDER } }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Label" value={pv.label}
                    placeholder="e.g. F1 Student Visa"
                    onChange={(e) => updateVariant(pv._id || pv.key, "label", e.target.value)}
                    sx={{ "& fieldset": { borderColor: BORDER } }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" type="number" label="Price (USD)"
                    value={pv.price}
                    onChange={(e) => updateVariant(pv._id || pv.key, "price", Number(e.target.value))}
                    InputProps={{
                      inputProps: { min: 0, step: 0.01 },
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText={pv.price > 0 ? fmt(pv.price) : ""}
                    sx={{ "& fieldset": { borderColor: BORDER } }} />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <IconButton size="small" onClick={() => removeVariant(pv._id || pv.key)}
                    sx={{ color: "#ef4444" }}>
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

// ─── Create / Edit Dialog ─────────────────────────────────────
const ExamFormDialog = ({ open, exam, onClose, onSave, saving }) => {
  const isEdit = !!exam;

  const [form, setForm] = useState({
    examType:      "",
    title:         "",
    description:   "",
    imageUrl:      "",
    pricingType:   "flat",
    flatPrice:     0,
    priceVariants: [],
    fieldSchema:   [],
    sortOrder:     0,
  });

  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (exam) {
      // Attach _id to variants and fields for stable keys in the builder
      setForm({
        ...exam,
        priceVariants: (exam.priceVariants || []).map((pv) => ({ ...pv, _id: pv.key })),
        fieldSchema:   (exam.fieldSchema   || []).map((f)  => ({
          ...f,
          options: Array.isArray(f.options) ? f.options.join(",") : (f.options || ""),
          _id:     f.key || Math.random().toString(36).slice(2),
        })),
      });
    } else {
      setForm({
        examType: "", title: "", description: "", imageUrl: "",
        pricingType: "flat", flatPrice: 0,
        priceVariants: [], fieldSchema: [], sortOrder: 0,
      });
    }
    setLocalError("");
  }, [exam, open]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPricing = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title || !form.description) {
      setLocalError("Title and description are required.");
      return;
    }
    if (!isEdit && !form.examType) {
      setLocalError("Exam type identifier is required.");
      return;
    }
    for (const f of form.fieldSchema) {
      if (!f.key || !f.label || !f.type) {
        setLocalError(`Field is incomplete: every field needs a key, label, and type.`);
        return;
      }
    }
    setLocalError("");

    // Serialise: convert options string → array, strip _id
    const cleanSchema = form.fieldSchema.map(({ _id, options, ...rest }) => ({
      ...rest,
      ...(rest.type === "select"
        ? { options: options.split(",").map((o) => o.trim()).filter(Boolean) }
        : {}),
    }));

    const cleanVariants = form.priceVariants.map(({ _id, ...rest }) => rest);

    onSave({ ...form, fieldSchema: cleanSchema, priceVariants: cleanVariants });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: TEXT }}>
        {isEdit ? `Edit — ${exam?.title}` : "Create New Exam"}
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {localError && (
          <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{localError}</Alert>
        )}

        <Grid container spacing={2.5}>
          {/* Basic info */}
          {!isEdit && (
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Exam Type Key *"
                value={form.examType}
                onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value.toUpperCase().replace(/\s/g, "") }))}
                placeholder="e.g. SAT, IELTS"
                helperText="Unique ID, e.g. SAT. Cannot be changed after creation."
                sx={{ "& fieldset": { borderColor: BORDER } }} />
            </Grid>
          )}
          <Grid item xs={12} sm={isEdit ? 6 : 4}>
            <TextField fullWidth size="small" label="Title *"
              value={form.title} onChange={setField("title")}
              sx={{ "& fieldset": { borderColor: BORDER } }} />
          </Grid>
          <Grid item xs={12} sm={isEdit ? 6 : 4}>
            <TextField fullWidth size="small" type="number" label="Sort Order"
              value={form.sortOrder} onChange={setField("sortOrder")}
              helperText="Lower number = appears first"
              sx={{ "& fieldset": { borderColor: BORDER } }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" multiline rows={2} label="Description *"
              value={form.description} onChange={setField("description")}
              sx={{ "& fieldset": { borderColor: BORDER } }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Image URL"
              value={form.imageUrl} onChange={setField("imageUrl")}
              placeholder="https://images.unsplash.com/..."
              helperText="Unsplash or any public image URL"
              sx={{ "& fieldset": { borderColor: BORDER } }} />
          </Grid>

          <Grid item xs={12}>
            <Divider />
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT, mt: 2, mb: 1.5 }}>
              Pricing
            </Typography>
            <PricingConfig
              pricingType={form.pricingType}
              flatPrice={form.flatPrice}
              priceVariants={form.priceVariants}
              onChange={setPricing}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
            <Box mt={2}>
              <FieldSchemaBuilder
                fields={form.fieldSchema}
                onChange={(fields) => setForm((f) => ({ ...f, fieldSchema: fields }))}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined"
          sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}
          sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2,
                "&:hover": { bgcolor: GREEN } }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : isEdit ? "Save Changes" : "Create Exam"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function AdminExamTypes() {
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);
  const [saving,  setSaving]  = useState(false);

  const [dialogOpen,  setDialogOpen]  = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedId,  setExpandedId]  = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminListExams();
      setExams(res.exams || []);
    } catch (err) {
      setToast({ msg: "Failed to load exams", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    try {
      setSaving(true);
      await adminCreateExam(form);
      setToast({ msg: "Exam created as draft.", severity: "success" });
      setDialogOpen(false);
      await load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to create exam", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    try {
      setSaving(true);
      await adminUpdateExam(editTarget.id, form);
      setToast({ msg: "Exam updated.", severity: "success" });
      setEditTarget(null);
      await load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to update exam", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (exam, status) => {
    try {
      await adminSetExamStatus(exam.id, status);
      setToast({ msg: `Exam ${status}.`, severity: "success" });
      await load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to change status", severity: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await adminDeleteExam(deleteTarget.id);
      setToast({ msg: "Exam deleted.", severity: "success" });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to delete exam", severity: "error" });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>

        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between",
                   alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: 26, fontWeight: 800, color: TEXT }}>
              Exam Catalog Management
            </Typography>
            <Typography sx={{ fontSize: 14, color: MUTED, mt: 0.5 }}>
              Create, edit, and publish exam registration types. Students see published exams only.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />}
            onClick={() => { setEditTarget(null); setDialogOpen(true); }}
            sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700,
                  borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
            New Exam Type
          </Button>
        </Box>

        {/* Stats strip */}
        <Grid container spacing={2} mb={4}>
          {[
            { label: "Total",     value: exams.length,                                  color: NAVY },
            { label: "Published", value: exams.filter((e) => e.status === "published").length, color: GREEN },
            { label: "Draft",     value: exams.filter((e) => e.status === "draft").length,     color: GOLD },
            { label: "Archived",  value: exams.filter((e) => e.status === "archived").length,  color: "#ef4444" },
          ].map((s) => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Paper elevation={0}
                sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 2.5, bgcolor: CARD }}>
                <Typography sx={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</Typography>
                <Typography sx={{ fontSize: 13, color: MUTED }}>{s.label} Exams</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Exam list */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: GREEN }} />
          </Box>
        ) : (
          <Stack spacing={2}>
            {exams.map((exam) => {
              const cfg       = STATUS_CONFIG[exam.status] || STATUS_CONFIG.draft;
              const expanded  = expandedId === exam.id;
              const fieldCount = (exam.fieldSchema || []).length;

              return (
                <Paper key={exam.id} elevation={0}
                  sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, overflow: "hidden", bgcolor: CARD }}>

                  {/* Row header */}
                  <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", gap: 2,
                             flexWrap: "wrap" }}>
                    {/* Thumbnail */}
                    {exam.imageUrl && (
                      <Box sx={{ width: 52, height: 52, borderRadius: 2, overflow: "hidden",
                                 flexShrink: 0, bgcolor: BG }}>
                        <Box component="img" src={exam.imageUrl} alt={exam.title}
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </Box>
                    )}

                    <Box flex={1} minWidth={0}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography sx={{ fontWeight: 800, fontSize: 16, color: TEXT }}>
                          {exam.title}
                        </Typography>
                        <Chip label={exam.examType} size="small"
                          sx={{ bgcolor: `${NAVY}10`, color: NAVY, fontWeight: 700,
                                height: 20, fontSize: 11 }} />
                        <Chip label={cfg.label} size="small"
                          sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 800, height: 20, fontSize: 11 }} />
                      </Stack>
                      <Typography sx={{ fontSize: 13, color: MUTED, mt: 0.25 }} noWrap>
                        {exam.pricingType === "flat"
                          ? fmt(exam.flatPrice)
                          : `Variants: ${(exam.priceVariants || []).map((v) => v.label).join(", ")}`}
                        {" · "}
                        {fieldCount} form field{fieldCount !== 1 ? "s" : ""}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Stack direction="row" spacing={0.75} flexShrink={0}>
                      <Tooltip title="Expand / Preview schema">
                        <IconButton size="small" onClick={() => setExpandedId(expanded ? null : exam.id)}
                          sx={{ border: `1px solid ${BORDER}`, borderRadius: 1.5 }}>
                          {expanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => setEditTarget(exam)}
                          sx={{ border: `1px solid ${BORDER}`, borderRadius: 1.5 }}>
                          <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>

                      {exam.status !== "published" && (
                        <Tooltip title="Publish">
                          <IconButton size="small" onClick={() => handleStatusChange(exam, "published")}
                            sx={{ border: `1px solid ${GREEN}44`, color: GREEN, borderRadius: 1.5 }}>
                            <Publish sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {exam.status === "published" && (
                        <Tooltip title="Archive (hides from students)">
                          <IconButton size="small" onClick={() => handleStatusChange(exam, "archived")}
                            sx={{ border: `1px solid ${GOLD}44`, color: GOLD, borderRadius: 1.5 }}>
                            <Archive sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {exam.status === "archived" && (
                        <Tooltip title="Restore to draft">
                          <IconButton size="small" onClick={() => handleStatusChange(exam, "draft")}
                            sx={{ border: `1px solid ${BORDER}`, borderRadius: 1.5, color: MUTED }}>
                            <CheckCircle sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {exam.status === "draft" && (
                        <Tooltip title="Delete draft">
                          <IconButton size="small" onClick={() => setDeleteTarget(exam)}
                            sx={{ border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444",
                                  borderRadius: 1.5 }}>
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>

                  {/* Expanded schema preview */}
                  <Collapse in={expanded}>
                    <Divider />
                    <Box sx={{ px: 3, py: 2.5, bgcolor: BG }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: MUTED,
                                         textTransform: "uppercase", letterSpacing: 0.8, mb: 1.5 }}>
                        Form Field Schema Preview
                      </Typography>
                      {fieldCount === 0 ? (
                        <Typography sx={{ fontSize: 13, color: "#ef4444" }}>
                          No fields defined. This exam cannot be published until fields are added.
                        </Typography>
                      ) : (
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              {["Key", "Label", "Type", "Section", "Required", "Options"].map((h) => (
                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: MUTED,
                                                          borderColor: BORDER }}>
                                  {h}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(exam.fieldSchema || []).map((f) => (
                              <TableRow key={f.key}>
                                <TableCell sx={{ fontSize: 12, fontFamily: "monospace", borderColor: BORDER }}>
                                  {f.key}
                                </TableCell>
                                <TableCell sx={{ fontSize: 12, borderColor: BORDER }}>{f.label}</TableCell>
                                <TableCell sx={{ fontSize: 12, borderColor: BORDER }}>
                                  <Chip label={f.type} size="small"
                                    sx={{ height: 18, fontSize: 10, bgcolor: `${NAVY}10`, color: NAVY }} />
                                </TableCell>
                                <TableCell sx={{ fontSize: 12, color: MUTED, borderColor: BORDER }}>
                                  {f.section || "—"}
                                </TableCell>
                                <TableCell sx={{ borderColor: BORDER }}>
                                  {f.required
                                    ? <CheckCircle sx={{ fontSize: 14, color: GREEN }} />
                                    : <Close sx={{ fontSize: 14, color: MUTED }} />}
                                </TableCell>
                                <TableCell sx={{ fontSize: 11, color: MUTED, borderColor: BORDER }}>
                                  {f.options?.join(", ") || "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}

            {exams.length === 0 && !loading && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography sx={{ color: MUTED, fontSize: 15 }}>
                  No exam types yet. Click "New Exam Type" to create the first one.
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Box>

      {/* Create dialog */}
      <ExamFormDialog
        open={dialogOpen && !editTarget}
        exam={null}
        onClose={() => setDialogOpen(false)}
        onSave={handleCreate}
        saving={saving}
      />

      {/* Edit dialog */}
      <ExamFormDialog
        open={!!editTarget}
        exam={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleUpdate}
        saving={saving}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Draft Exam</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Delete <strong>"{deleteTarget?.title}"</strong>? This cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} variant="outlined"
            sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained"
            sx={{ textTransform: "none", bgcolor: "#ef4444", fontWeight: 700, borderRadius: 2,
                  "&:hover": { bgcolor: "#dc2626" } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}
          sx={{ borderRadius: 2, fontWeight: 600 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
