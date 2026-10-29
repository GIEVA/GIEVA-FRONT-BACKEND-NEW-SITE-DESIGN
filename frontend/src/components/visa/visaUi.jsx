// components/visa/visaUi.jsx
// Shared design tokens and small components for the visa service (applicant + admin).

import { Box, Chip, Typography, TextField, Paper } from "@mui/material";

export const NAVY = "#0B1F3A";
export const NAVY2 = "#12315A";
export const GREEN = "#1E7F4F";
export const GOLD = "#C9A227";
export const INK = "#0F172A";
export const MUTED = "#64748B";
export const LINE = "#E2E8F0";
export const SURFACE = "#F6F8FB";

export const STATUS = {
  draft:               { label: "Draft",                      color: "#64748B", bg: "#F1F5F9" },
  submitted:           { label: "Submitted",                  color: "#1D4ED8", bg: "#DBEAFE" },
  under_review:        { label: "Under review",               color: "#7C3AED", bg: "#EDE9FE" },
  info_required:       { label: "More information required",  color: "#B45309", bg: "#FEF3C7" },
  interview_scheduled: { label: "Interview scheduled",        color: "#0E7490", bg: "#CFFAFE" },
  approved:            { label: "Approved",                   color: "#15803D", bg: "#DCFCE7" },
  rejected:            { label: "Not approved",               color: "#B91C1C", bg: "#FEE2E2" },
  completed:           { label: "Completed",                  color: "#065F46", bg: "#D1FAE5" },
  cancelled:           { label: "Cancelled",                  color: "#475569", bg: "#E2E8F0" },
};

export const StatusChip = ({ status, size = "small" }) => {
  const s = STATUS[status] || STATUS.draft;
  return (
    <Chip
      size={size}
      label={s.label}
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 800, fontSize: 11.5, borderRadius: 2, "& .MuiChip-label": { px: 1.25 } }}
    />
  );
};

export const money = (n, cur = "NGN") =>
  n === null || n === undefined || n === "" ? "-" : `${cur === "NGN" ? "₦" : `${cur} `}${Number(n).toLocaleString("en-NG")}`;

export const fmtDate = (d, withTime = false) => {
  if (!d) return "-";
  const dt = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? `${d}T00:00:00` : d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("en-GB", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
};

export const errMsg = (err, fallback = "Something went wrong") => err?.response?.data?.message || fallback;

// ── layout bits (defined at module level so inputs never remount while typing) ──
export const Card = ({ children, sx, ...rest }) => (
  <Paper
    elevation={0}
    sx={{ border: `1px solid ${LINE}`, borderRadius: 4, bgcolor: "#fff", boxShadow: "0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.04)", ...sx }}
    {...rest}
  >
    {children}
  </Paper>
);

export const FieldGrid = ({ children, cols = 2, sx }) => (
  <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: `repeat(${cols}, minmax(0, 1fr))` }, ...sx }}>{children}</Box>
);

export const SectionTitle = ({ title, hint, sx }) => (
  <Box sx={{ mb: 2, mt: 0.5, ...sx }}>
    <Typography sx={{ fontWeight: 800, fontSize: 15, color: NAVY }}>{title}</Typography>
    {hint && <Typography sx={{ fontSize: 12.5, color: MUTED, mt: 0.25 }}>{hint}</Typography>}
  </Box>
);

const inputSx = {
  "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#fff", "& fieldset": { borderColor: LINE }, "&:hover fieldset": { borderColor: "#CBD5E1" }, "&.Mui-focused fieldset": { borderColor: GREEN, borderWidth: 1.5 } },
  "& .MuiInputLabel-root.Mui-focused": { color: GREEN },
};

export const Txt = ({ label, value, onChange, type = "text", multiline, rows, required, helperText, inputProps, select, children, sx, ...rest }) => (
  <TextField
    fullWidth size="small" label={label} value={value ?? ""} type={type} required={required}
    multiline={multiline} rows={rows} select={select} helperText={helperText}
    onChange={(e) => onChange(e.target.value)}
    InputLabelProps={type === "date" || type === "datetime-local" ? { shrink: true } : undefined}
    inputProps={inputProps}
    sx={{ ...inputSx, ...sx }}
    {...rest}
  >
    {children}
  </TextField>
);

export const setIn = (obj, path, value) => {
  const keys = Array.isArray(path) ? path : path.split(".");
  const [head, ...rest] = keys;
  const key = /^\d+$/.test(head) ? Number(head) : head;
  const clone = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  clone[key] = rest.length ? setIn(clone[key] ?? (/^\d+$/.test(rest[0]) ? [] : {}), rest, value) : value;
  return clone;
};
