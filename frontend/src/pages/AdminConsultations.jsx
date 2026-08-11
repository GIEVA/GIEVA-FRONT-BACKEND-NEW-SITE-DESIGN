// pages/admin/AdminConsultations.jsx
//
// Admin dashboard for consultation bookings.
// Features: summary stats, filterable paginated list, detail drawer
// with reply, note, status change, meeting link, delete.

import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, Chip, Stack, Button,
  TextField, MenuItem, IconButton, Drawer, Divider,
  Avatar, CircularProgress, Snackbar, Alert, Tooltip,
  Pagination, List, ListItem, ListItemText, ListItemAvatar,
  InputAdornment,
} from "@mui/material";
import {
  Search, Refresh, Reply, StickyNote2, CheckCircle,
  Close, Delete, AccessTime, VideoCall, Inbox,
  CalendarMonth, Person, ArrowForward,
} from "@mui/icons-material";
import {
  adminGetSummary,
  adminListBookings,
  adminGetBooking,
  adminUpdateStatus,
  adminReply,
  adminAddNote,
  adminDeleteBooking,
} from "../services/consultationService";

// ─── Design tokens ─────────────────────────────────────────────
const NAVY   = "#0B1F3A";
const GREEN  = "#1E7F4F";
const GOLD   = "#D4A017";
const ORANGE = "#E8651A";
const BG     = "#F7F9FC";
const CARD   = "#FFFFFF";
const BORDER = "#E6E9F0";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";

const PER_PAGE = 15;

// ─── Config ────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:   { label: "Pending",   color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  confirmed: { label: "Confirmed", color: GREEN,     bg: `${GREEN}15` },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  completed: { label: "Completed", color: MUTED,     bg: "#F1F5F9" },
  no_show:   { label: "No Show",   color: GOLD,      bg: "rgba(212,160,23,0.1)" },
};

const TYPE_LABELS = {
  career_pathway:       "Career Pathway",
  study_abroad:         "Study Abroad",
  test_preparation:     "Test Preparation",
  scholarship_guidance: "Scholarship Guidance",
  general:              "General",
};

const STATUSES   = Object.keys(STATUS_CFG);
const TYPE_KEYS  = Object.keys(TYPE_LABELS);

const fmtDT = (d) => d ? new Date(d).toLocaleString("en-NG", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit",
}) : "—";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-NG", {
  day: "numeric", month: "short", year: "numeric",
}) : "—";

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";

// ─── Stat card ─────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <Paper elevation={0}
    sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 2.5, bgcolor: CARD }}>
    <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: `${color}18`,
               display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
      {icon}
    </Box>
    <Typography sx={{ fontSize: 26, fontWeight: 800, color }}>{value}</Typography>
    <Typography sx={{ fontSize: 13, color: MUTED }}>{label}</Typography>
  </Paper>
);

// ─── Detail Drawer ─────────────────────────────────────────────
function BookingDrawer({ open, onClose, bookingId, onUpdated }) {
  const [booking,       setBooking]       = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [replyText,     setReplyText]     = useState("");
  const [noteText,      setNoteText]      = useState("");
  const [meetingLink,   setMeetingLink]   = useState("");
  const [newStatus,     setNewStatus]     = useState("");
  const [sending,       setSending]       = useState(false);
  const [savingNote,    setSavingNote]    = useState(false);
  const [savingStatus,  setSavingStatus]  = useState(false);
  const [showReply,     setShowReply]     = useState(false);
  const [showNote,      setShowNote]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast,         setToast]         = useState(null);

  const load = useCallback(async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      const res = await adminGetBooking(bookingId);
      setBooking(res.booking);
      setNewStatus(res.booking.status);
      setMeetingLink(res.booking.meetingLink || "");
    } catch {
      setToast({ msg: "Failed to load booking", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleStatusSave = async () => {
    try {
      setSavingStatus(true);
      await adminUpdateStatus(bookingId, { status: newStatus, meetingLink: meetingLink || undefined });
      setBooking((b) => ({ ...b, status: newStatus, meetingLink: meetingLink || b.meetingLink }));
      onUpdated?.();
      setToast({ msg: "Status updated", severity: "success" });
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to update status", severity: "error" });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      setSending(true);
      await adminReply(bookingId, {
        reply: replyText,
        meetingLink: meetingLink || undefined,
      });
      setBooking((b) => ({ ...b, adminReply: replyText, repliedAt: new Date() }));
      setReplyText("");
      setShowReply(false);
      onUpdated?.();
      setToast({ msg: "Reply sent", severity: "success" });
    } catch {
      setToast({ msg: "Failed to send reply", severity: "error" });
    } finally {
      setSending(false);
    }
  };

  const handleNote = async () => {
    if (!noteText.trim()) return;
    try {
      setSavingNote(true);
      await adminAddNote(bookingId, noteText);
      setBooking((b) => ({ ...b, internalNote: noteText }));
      setNoteText("");
      setShowNote(false);
      setToast({ msg: "Note saved", severity: "success" });
    } catch {
      setToast({ msg: "Failed to save note", severity: "error" });
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminDeleteBooking(bookingId);
      onClose();
      onUpdated?.();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to delete", severity: "error" });
    }
    setConfirmDelete(false);
  };

  const sCfg = booking ? STATUS_CFG[booking.status] || STATUS_CFG.pending : null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100vw", sm: 500 }, bgcolor: BG, display: "flex", flexDirection: "column" } }}>
      <Box sx={{ px: 3, py: 2.5, bgcolor: CARD, borderBottom: `1px solid ${BORDER}`,
                 display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 800, fontSize: 17, color: TEXT }}>Booking Detail</Typography>
        <IconButton onClick={onClose}><Close /></IconButton>
      </Box>

      {loading ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress sx={{ color: GREEN }} />
        </Box>
      ) : !booking ? null : (
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>

          {/* Status chip */}
          <Chip label={sCfg.label} size="small"
            sx={{ bgcolor: sCfg.bg, color: sCfg.color, fontWeight: 800, mb: 2 }} />

          {/* Booker */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Avatar sx={{ width: 42, height: 42, bgcolor: GREEN, fontWeight: 700 }}>
              {initials(booking.name)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }}>{booking.name}</Typography>
              <Typography sx={{ fontSize: 13, color: MUTED }}>{booking.email}</Typography>
              {booking.phoneNumber && (
                <Typography sx={{ fontSize: 13, color: MUTED }}>{booking.phoneNumber}</Typography>
              )}
            </Box>
          </Box>

          {/* Booking details */}
          <Paper elevation={0}
            sx={{ border: `1px solid ${BORDER}`, borderRadius: 2.5, p: 2.5, mb: 2.5 }}>
            {[
              ["Type",      TYPE_LABELS[booking.consultationType] || booking.consultationType],
              ["Scheduled", fmtDT(booking.scheduledAt)],
              ["Duration",  `${booking.duration} minutes`],
              ["Timezone",  booking.timezone],
              ["Ref #",     booking.id],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between",
                                     py: 0.75, borderBottom: `1px solid ${BORDER}`,
                                     "&:last-child": { borderBottom: "none" } }}>
                <Typography sx={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>{label}</Typography>
                <Typography sx={{ fontSize: 13, color: TEXT, fontWeight: 700, maxWidth: "65%",
                                   textAlign: "right" }}>{value}</Typography>
              </Box>
            ))}
          </Paper>

          {/* Other details */}
          {booking.otherDetails && (
            <Box sx={{ p: 2.5, border: `1px solid ${BORDER}`, borderRadius: 2.5, mb: 2.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: MUTED,
                                 textTransform: "uppercase", letterSpacing: 0.8, mb: 1 }}>
                Other Details
              </Typography>
              <Typography sx={{ fontSize: 14, color: TEXT, whiteSpace: "pre-wrap" }}>
                {booking.otherDetails}
              </Typography>
            </Box>
          )}

          {/* Meeting link */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT, mb: 1 }}>
              Meeting Link
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField fullWidth size="small" placeholder="https://meet.google.com/..."
                value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)}
                sx={{ "& fieldset": { borderColor: BORDER } }} />
            </Box>
          </Box>

          {/* Status change */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT, mb: 1.5 }}>
              Update Status
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
              {STATUSES.map((s) => {
                const cfg = STATUS_CFG[s];
                return (
                  <Chip key={s} label={cfg.label} clickable
                    onClick={() => setNewStatus(s)}
                    variant={newStatus === s ? "filled" : "outlined"}
                    sx={{ fontWeight: 700, fontSize: 12,
                          bgcolor: newStatus === s ? cfg.bg : "transparent",
                          color: cfg.color, borderColor: cfg.color }} />
                );
              })}
            </Box>
            <Button variant="contained" size="small" disabled={savingStatus}
              onClick={handleStatusSave}
              sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700,
                    borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
              {savingStatus ? <CircularProgress size={14} color="inherit" /> : "Save"}
            </Button>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* Previous reply */}
          {booking.adminReply && (
            <Box sx={{ p: 2.5, bgcolor: `${GREEN}08`, border: `1px solid ${GREEN}33`,
                       borderRadius: 2.5, mb: 2 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: GREEN,
                                 textTransform: "uppercase", letterSpacing: 0.8, mb: 1 }}>
                Reply sent {fmtDate(booking.repliedAt)}
              </Typography>
              <Typography sx={{ fontSize: 14, color: TEXT, whiteSpace: "pre-wrap" }}>
                {booking.adminReply}
              </Typography>
            </Box>
          )}

          {/* Internal note */}
          {booking.internalNote && (
            <Box sx={{ p: 2, bgcolor: "rgba(212,160,23,0.08)", border: `1px solid ${GOLD}44`,
                       borderRadius: 2.5, mb: 2 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: GOLD,
                                 textTransform: "uppercase", letterSpacing: 0.8, mb: 0.75 }}>
                Internal Note
              </Typography>
              <Typography sx={{ fontSize: 13, color: TEXT }}>{booking.internalNote}</Typography>
            </Box>
          )}

          {/* Reply */}
          {!showReply ? (
            <Button fullWidth variant="outlined" startIcon={<Reply />}
              onClick={() => setShowReply(true)}
              sx={{ textTransform: "none", borderColor: BORDER, color: NAVY,
                    fontWeight: 700, borderRadius: 2.5, mb: 1.5 }}>
              Reply to {booking.name}
            </Button>
          ) : (
            <Box mb={1.5}>
              <TextField fullWidth multiline rows={4}
                placeholder="Type your reply… (includes meeting link if set above)"
                value={replyText} onChange={(e) => setReplyText(e.target.value)}
                sx={{ mb: 1.5, "& fieldset": { borderColor: BORDER } }} />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" disabled={sending || !replyText.trim()}
                  onClick={handleReply}
                  sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700,
                        borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
                  {sending ? <CircularProgress size={16} color="inherit" /> : "Send Reply"}
                </Button>
                <Button variant="outlined" onClick={() => { setShowReply(false); setReplyText(""); }}
                  sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
                  Cancel
                </Button>
              </Stack>
            </Box>
          )}

          {/* Note */}
          {!showNote ? (
            <Button fullWidth variant="outlined" startIcon={<StickyNote2 />}
              onClick={() => setShowNote(true)}
              sx={{ textTransform: "none", borderColor: BORDER, color: MUTED,
                    fontWeight: 700, borderRadius: 2.5, mb: 1.5 }}>
              Add internal note
            </Button>
          ) : (
            <Box mb={1.5}>
              <TextField fullWidth multiline rows={3}
                placeholder="Internal note (not sent to client)…"
                value={noteText} onChange={(e) => setNoteText(e.target.value)}
                sx={{ mb: 1.5, "& fieldset": { borderColor: BORDER } }} />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" disabled={savingNote || !noteText.trim()}
                  onClick={handleNote}
                  sx={{ textTransform: "none", bgcolor: GOLD, color: NAVY,
                        fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "#C8970F" } }}>
                  {savingNote ? <CircularProgress size={16} color="inherit" /> : "Save Note"}
                </Button>
                <Button variant="outlined" onClick={() => { setShowNote(false); setNoteText(""); }}
                  sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
                  Cancel
                </Button>
              </Stack>
            </Box>
          )}

          {/* Delete */}
          {!confirmDelete ? (
            <Button fullWidth variant="outlined" startIcon={<Delete />}
              onClick={() => setConfirmDelete(true)}
              sx={{ textTransform: "none", borderColor: "rgba(239,68,68,0.3)",
                    color: "#ef4444", fontWeight: 700, borderRadius: 2.5 }}>
              Delete booking
            </Button>
          ) : (
            <Box sx={{ p: 2, border: "1px solid rgba(239,68,68,0.3)",
                       borderRadius: 2.5, bgcolor: "rgba(239,68,68,0.05)" }}>
              <Typography sx={{ fontSize: 13, color: "#ef4444", fontWeight: 700, mb: 1.5 }}>
                Permanently delete this booking? This cannot be undone.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handleDelete}
                  sx={{ textTransform: "none", bgcolor: "#ef4444", fontWeight: 700,
                        borderRadius: 2, "&:hover": { bgcolor: "#dc2626" } }}>
                  Yes, delete
                </Button>
                <Button variant="outlined" onClick={() => setConfirmDelete(false)}
                  sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
                  Cancel
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      )}

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}
          sx={{ borderRadius: 2 }}>{toast?.msg}</Alert>
      </Snackbar>
    </Drawer>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────
export default function AdminConsultations() {
  const [bookings,  setBookings]  = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [filters,   setFilters]   = useState({ status: "", consultationType: "", search: "" });
  const [detailId,  setDetailId]  = useState(null);
  const [toast,     setToast]     = useState(null);

  const totalPages = Math.ceil(total / PER_PAGE);

  const loadBookings = useCallback(async (pg = page) => {
    try {
      setLoading(true);
      const params = { page: pg, limit: PER_PAGE };
      if (filters.status)           params.status           = filters.status;
      if (filters.consultationType) params.consultationType = filters.consultationType;
      if (filters.search)           params.search           = filters.search;
      const res = await adminListBookings(params);
      setBookings(res.bookings || []);
      setTotal(res.total || 0);
    } catch {
      setToast({ msg: "Failed to load bookings", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await adminGetSummary();
      setSummary(res);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadBookings(1); setPage(1); }, [filters]);
  useEffect(() => { loadBookings(page); }, [page]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  const getCount = (arr, key, val) =>
    Number((arr || []).find((r) => r[key] === val)?.count || 0);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>

        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between",
                   alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: 26, fontWeight: 800, color: TEXT }}>
              Consultation Bookings
            </Typography>
            <Typography sx={{ fontSize: 14, color: MUTED, mt: 0.5 }}>
              Manage and respond to consultation booking requests.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<Refresh />}
            onClick={() => { loadBookings(page); loadSummary(); }}
            sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
            Refresh
          </Button>
        </Box>

        {/* Stats */}
        {summary && (
          <Grid container spacing={2} mb={4}>
            {[
              { label: "Total",     value: summary.total || 0,     color: NAVY,     icon: <Inbox sx={{ fontSize: 22, color: NAVY }} /> },
              { label: "Today",     value: summary.todayCount || 0, color: ORANGE,   icon: <CalendarMonth sx={{ fontSize: 22, color: ORANGE }} /> },
              { label: "Upcoming",  value: summary.upcoming || 0,   color: GREEN,    icon: <AccessTime sx={{ fontSize: 22, color: GREEN }} /> },
              { label: "Pending",   value: getCount(summary.byStatus, "status", "pending"),   color: "#3b82f6", icon: <Person sx={{ fontSize: 22, color: "#3b82f6" }} /> },
              { label: "Confirmed", value: getCount(summary.byStatus, "status", "confirmed"), color: GREEN,     icon: <CheckCircle sx={{ fontSize: 22, color: GREEN }} /> },
            ].map((s) => (
              <Grid item xs={6} sm={4} md={2.4} key={s.label}>
                <StatCard {...s} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Filters */}
        <Paper elevation={0}
          sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 2.5, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField fullWidth size="small" placeholder="Search by name or email…"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: MUTED }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& fieldset": { borderColor: BORDER } }} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" select label="Status"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                sx={{ "& fieldset": { borderColor: BORDER } }}>
                <MenuItem value="">All Statuses</MenuItem>
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>{STATUS_CFG[s].label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" select label="Type"
                value={filters.consultationType}
                onChange={(e) => setFilters((f) => ({ ...f, consultationType: e.target.value }))}
                sx={{ "& fieldset": { borderColor: BORDER } }}>
                <MenuItem value="">All Types</MenuItem>
                {TYPE_KEYS.map((k) => (
                  <MenuItem key={k} value={k}>{TYPE_LABELS[k]}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {(filters.status || filters.consultationType || filters.search) && (
              <Grid item xs={12} sm={1}>
                <Button size="small"
                  onClick={() => setFilters({ status: "", consultationType: "", search: "" })}
                  sx={{ textTransform: "none", color: MUTED }}>
                  Clear
                </Button>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Booking list */}
        <Paper elevation={0}
          sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, overflow: "hidden" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: GREEN }} />
            </Box>
          ) : bookings.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 10 }}>
              <CalendarMonth sx={{ fontSize: 52, color: MUTED, mb: 2 }} />
              <Typography sx={{ fontWeight: 700, color: TEXT }}>No bookings found</Typography>
              <Typography sx={{ fontSize: 14, color: MUTED, mt: 0.5 }}>
                {filters.status || filters.consultationType || filters.search
                  ? "Try adjusting your filters." : "No consultations booked yet."}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {bookings.map((b, idx) => {
                const sCfg = STATUS_CFG[b.status] || STATUS_CFG.pending;
                const isPending = b.status === "pending";
                return (
                  <ListItem key={b.id} divider={idx < bookings.length - 1}
                    onClick={() => setDetailId(b.id)}
                    sx={{ cursor: "pointer", py: 2.5, px: 3,
                          bgcolor: isPending ? `${sCfg.bg}` : CARD,
                          transition: "background 0.15s",
                          "&:hover": { bgcolor: BG } }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: GREEN, fontWeight: 700, width: 42, height: 42 }}>
                        {initials(b.name)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography sx={{ fontWeight: isPending ? 800 : 600,
                                            fontSize: 14, color: TEXT }}>
                            {b.name}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: MUTED }}>{b.email}</Typography>
                          <Chip label={TYPE_LABELS[b.consultationType] || b.consultationType}
                            size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700,
                                               bgcolor: `${NAVY}10`, color: NAVY,
                                               "& .MuiChip-label": { px: 0.75 } }} />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                          <AccessTime sx={{ fontSize: 13, color: MUTED }} />
                          <Typography sx={{ fontSize: 12, color: MUTED }}>
                            {fmtDT(b.scheduledAt)} · {b.duration} min
                          </Typography>
                          {b.meetingLink && (
                            <VideoCall sx={{ fontSize: 13, color: GREEN }} />
                          )}
                        </Box>
                      }
                    />
                    <Box sx={{ ml: 2, display: "flex", flexDirection: "column",
                               alignItems: "flex-end", gap: 0.75, flexShrink: 0 }}>
                      <Chip label={sCfg.label} size="small"
                        sx={{ height: 20, fontSize: 10, fontWeight: 800,
                              bgcolor: sCfg.bg, color: sCfg.color,
                              "& .MuiChip-label": { px: 1 } }} />
                      <Typography sx={{ fontSize: 11, color: MUTED }}>
                        #{b.id}
                      </Typography>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}

          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center",
                       gap: 2, py: 3, borderTop: `1px solid ${BORDER}` }}>
              <Typography sx={{ fontSize: 13, color: MUTED }}>
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
              </Typography>
              <Pagination count={totalPages} page={page}
                onChange={(_, v) => setPage(v)} size="medium"
                sx={{ "& .MuiPaginationItem-root": { fontWeight: 700 },
                      "& .Mui-selected": { bgcolor: `${NAVY} !important`, color: "#fff" } }} />
            </Box>
          )}
        </Paper>
      </Box>

      <BookingDrawer
        open={!!detailId}
        onClose={() => setDetailId(null)}
        bookingId={detailId}
        onUpdated={() => { loadBookings(page); loadSummary(); }}
      />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}
          sx={{ borderRadius: 2 }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
