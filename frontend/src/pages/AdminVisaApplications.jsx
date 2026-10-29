// pages/AdminVisaApplications.jsx   Route (admin area): /admin/visa
import { useCallback, useEffect, useState } from "react";
import {
  Box, Typography, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Pagination,
  MenuItem, Button, InputAdornment, TextField, CircularProgress, Alert, Snackbar, Switch, FormControlLabel, Skeleton,
} from "@mui/material";
import { Search, Download, Refresh, Save, Payments, PendingActions, EventAvailable, TaskAlt } from "@mui/icons-material";

import { NAVY, GREEN, GOLD, MUTED, INK, LINE, SURFACE, Card, StatusChip, STATUS, money, fmtDate, errMsg, Txt } from "../components/visa/visaUi";
import VisaAdminDetail from "../components/visa/VisaAdminDetail";
import VisaFeeCard from "../components/visa/VisaFeeCard";
import {
  adminVisaStats, adminListVisaApplications, adminExportVisaCsv, adminGetVisaAvailability, adminUpdateVisaAvailability,
} from "../services/visaService";

const Stat = ({ icon, label, value, sub, tone = GREEN }) => (
  <Card sx={{ p: 2.25, display: "flex", gap: 1.75, alignItems: "center" }}>
    <Box sx={{ width: 46, height: 46, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: `${tone}18`, color: tone }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.9, color: MUTED }}>{label}</Typography>
      <Typography sx={{ fontSize: 24, fontWeight: 900, color: NAVY, lineHeight: 1.15 }}>{value}</Typography>
      {sub && <Typography sx={{ fontSize: 12, color: MUTED }}>{sub}</Typography>}
    </Box>
  </Card>
);

// ── Availability + instructions (fees have their own card) ──
function AvailabilityCard({ onToast }) {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { adminGetVisaAvailability().then(setS).catch((e) => onToast({ msg: errMsg(e, "Could not load settings"), severity: "error" })); }, [onToast]);
  if (!s) return <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress sx={{ color: GREEN }} /></Box>;

  const save = async () => {
    try {
      setSaving(true);
      const r = await adminUpdateVisaAvailability({ isOpen: s.isOpen, closedMessage: s.closedMessage, instructions: s.instructions });
      setS((x) => ({ ...x, ...r })); onToast({ msg: r.message, severity: "success" });
    } catch (e) { onToast({ msg: errMsg(e, "Could not save"), severity: "error" }); } finally { setSaving(false); }
  };

  return (
    <Card sx={{ p: { xs: 2.5, sm: 3.5 }, maxWidth: 720 }}>
      <Typography sx={{ fontWeight: 900, fontSize: 18, color: NAVY, mb: 1 }}>Applications</Typography>
      <FormControlLabel control={<Switch checked={!!s.isOpen} onChange={(e) => setS({ ...s, isOpen: e.target.checked })} />} label={s.isOpen ? "Open: accepting new applications" : "Paused: new applications and payments are blocked"} />
      {!s.isOpen && <Box sx={{ mt: 1.5 }}><Txt label="Message shown to applicants" value={s.closedMessage || ""} onChange={(v) => setS({ ...s, closedMessage: v })} /></Box>}
      <Box sx={{ mt: 2 }}>
        <Txt multiline rows={4} label="Instructions shown on the apply page (optional)" value={s.instructions || ""} onChange={(v) => setS({ ...s, instructions: v })} inputProps={{ maxLength: 4000 }} />
      </Box>
      <Button onClick={save} disabled={saving} variant="contained" disableElevation startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
        sx={{ mt: 3, textTransform: "none", fontWeight: 800, borderRadius: 3, bgcolor: NAVY, px: 3, "&:hover": { bgcolor: GREEN } }}>Save settings</Button>
    </Card>
  );
}

export default function AdminVisaApplications() {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "all", location: "", appointmentType: "", from: "", to: "", page: 1 });
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // debounce the search box
  useEffect(() => { const t = setTimeout(() => setFilters((f) => (f.search === search ? f : { ...f, search, page: 1 })), 400); return () => clearTimeout(t); }, [search]);

  const clean = useCallback(() => Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v !== "all")), [filters]);

  const load = useCallback(async () => {
    try {
      setError("");
      const [list, st] = await Promise.all([adminListVisaApplications({ ...clean(), limit: 15 }), adminVisaStats()]);
      setRows(list.applications); setTotal(list.total); setPages(list.pages); setStats(st);
    } catch (e) { setError(errMsg(e, "Could not load applications")); }
  }, [clean]);
  useEffect(() => { load(); }, [load]);

  const setF = (k) => (v) => setFilters((f) => ({ ...f, [k]: v, page: 1 }));

  return (
    <Box sx={{ bgcolor: SURFACE, minHeight: "100%", p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box>
          <Typography sx={{ color: GOLD, fontWeight: 800, letterSpacing: 1.4, fontSize: 12 }}>ADMIN</Typography>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: 24, md: 30 }, color: NAVY }}>Visa service</Typography>
        </Box>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ "& .Mui-selected": { color: NAVY }, "& .MuiTabs-indicator": { bgcolor: GREEN } }}>
          <Tab label="Applications" sx={{ textTransform: "none", fontWeight: 800 }} />
          <Tab label="Fees & settings" sx={{ textTransform: "none", fontWeight: 800 }} />
        </Tabs>
      </Box>

      {tab === 1 && (
        <Box sx={{ display: "grid", gap: 2.5 }}>
          <VisaFeeCard onToast={setToast} />
          <AvailabilityCard onToast={setToast} />
        </Box>
      )}

      {tab === 0 && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
            {stats ? (
              <>
                <Stat icon={<PendingActions />} label="NEW / UNREVIEWED" value={stats.status.submitted || 0} sub={`${stats.total} total submitted`} tone="#1D4ED8" />
                <Stat icon={<EventAvailable />} label="INTERVIEWS" value={stats.status.interview_scheduled || 0} sub={`${stats.status.info_required || 0} awaiting info`} tone="#0E7490" />
                <Stat icon={<TaskAlt />} label="APPROVED" value={stats.status.approved || 0} sub={`${stats.status.rejected || 0} not approved`} tone={GREEN} />
                <Stat icon={<Payments />} label="REVENUE" value={money(stats.revenue.total)} sub={`${money(stats.revenue.thisMonth)} this month`} tone={GOLD} />
              </>
            ) : [0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={92} sx={{ borderRadius: 4 }} />)}
          </Box>

          <Card sx={{ p: 2, mb: 2.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "2fr 1.2fr 1fr 1fr 1fr 1fr" }, gap: 1.5, alignItems: "center" }}>
              <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
                <TextField fullWidth size="small" placeholder="Search name, email, phone, number" value={search} onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} sx={{ "& fieldset": { borderRadius: 2.5, borderColor: LINE } }} />
              </Box>
              <Txt select label="Status" value={filters.status} onChange={setF("status")}>
                <MenuItem value="all">All (excl. drafts)</MenuItem>
                {Object.entries(STATUS).filter(([k]) => k !== "draft").map(([k, s]) => <MenuItem key={k} value={k}>{s.label}</MenuItem>)}
              </Txt>
              <Txt select label="Office" value={filters.location} onChange={setF("location")}><MenuItem value="">Any</MenuItem><MenuItem value="abuja">Abuja</MenuItem><MenuItem value="lagos">Lagos</MenuItem></Txt>
              <Txt select label="Type" value={filters.appointmentType} onChange={setF("appointmentType")}><MenuItem value="">Any</MenuItem><MenuItem value="normal">Normal</MenuItem><MenuItem value="expedited">Expedited</MenuItem></Txt>
              <Txt type="date" label="From" value={filters.from} onChange={setF("from")} />
              <Txt type="date" label="To" value={filters.to} onChange={setF("to")} />
            </Box>
            <Box sx={{ display: "flex", gap: 1, mt: 1.5, justifyContent: "flex-end" }}>
              <Button onClick={load} startIcon={<Refresh />} sx={{ textTransform: "none", fontWeight: 700 }}>Refresh</Button>
              <Button onClick={() => adminExportVisaCsv(clean()).catch((e) => setToast({ msg: errMsg(e, "Export failed"), severity: "error" }))} startIcon={<Download />} sx={{ textTransform: "none", fontWeight: 700 }}>Export CSV</Button>
            </Box>
          </Card>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

          <Card sx={{ overflow: "hidden" }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC", "& th": { fontWeight: 800, fontSize: 12, color: MUTED, letterSpacing: 0.6, py: 1.5 } }}>
                    <TableCell>APPLICANT</TableCell><TableCell>NUMBER</TableCell><TableCell>STATUS</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>OFFICE / TYPE</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>PAID</TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>SUBMITTED</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!rows && [0, 1, 2, 3, 4].map((i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton /></TableCell></TableRow>)}
                  {rows?.map((r) => (
                    <TableRow key={r.id} hover onClick={() => setOpenId(r.id)} sx={{ cursor: "pointer", "& td": { py: 1.4 } }}>
                      <TableCell><Typography sx={{ fontWeight: 800, fontSize: 14, color: INK }}>{[r.firstName, r.lastName].filter(Boolean).join(" ") || "-"}</Typography><Typography sx={{ fontSize: 12, color: MUTED }}>{r.email}</Typography></TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>{r.applicationCode}</TableCell>
                      <TableCell><StatusChip status={r.status} /></TableCell>
                      <TableCell sx={{ display: { xs: "none", md: "table-cell" }, textTransform: "capitalize", fontSize: 13 }}>{r.interviewLocation} · {r.appointmentType}</TableCell>
                      <TableCell sx={{ display: { xs: "none", md: "table-cell" }, fontSize: 13, fontWeight: 700 }}>{money(r.applicationFeeAmount, r.currency)}</TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" }, fontSize: 13 }}>{fmtDate(r.submittedAt)}</TableCell>
                    </TableRow>
                  ))}
                  {rows?.length === 0 && <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 6, color: MUTED }}>No applications match these filters.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, borderTop: `1px solid ${LINE}` }}>
              <Typography sx={{ fontSize: 12.5, color: MUTED }}>{total} application{total === 1 ? "" : "s"}</Typography>
              <Pagination count={pages} page={filters.page} onChange={(_, p) => setFilters((f) => ({ ...f, page: p }))} size="small" />
            </Box>
          </Card>
        </>
      )}

      <VisaAdminDetail id={openId} onClose={() => setOpenId(null)} onChanged={load} />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
