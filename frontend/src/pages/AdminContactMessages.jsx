// pages/admin/AdminContactMessages.jsx
//
// Features:
//  - Summary stats strip (total, new, in-progress, complaints with attachments)
//  - Filterable, paginated message list (status, category, search)
//  - Message detail drawer: full message, attachment preview/download,
//    reply form, internal note, status change, assignment
//  - Complaint attachments shown inline (image preview or PDF link)

import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, Chip, Stack, Button,
  TextField, MenuItem, IconButton, Drawer, Divider,
  Avatar, CircularProgress, Snackbar, Alert, Tooltip,
  Pagination, Badge, List, ListItem, ListItemText,
  ListItemAvatar, InputAdornment,
} from "@mui/material";
import {
  Search, Refresh, OpenInNew, Reply, StickyNote2,
  CheckCircle, Close, Delete, Person, AttachFile,
  Image as ImageIcon, PictureAsPdf, Inbox,
  AssignmentInd, Circle,
} from "@mui/icons-material";

import {
  getContactSummary,
  listContactMessages,
  getContactMessage,
  updateContactStatus,
  replyToContact,
  addInternalNote,
  deleteContactMessage,
} from "../services/adminContactService";

// ─── Design tokens ────────────────────────────────────────────
const NAVY   = "#0B1F3A";
const GREEN  = "#1E7F4F";
const GOLD   = "#D4A017";
const BG     = "#F7F9FC";
const CARD   = "#FFFFFF";
const BORDER = "#E6E9F0";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";

const MESSAGES_PER_PAGE = 15;

// ─── Config maps ──────────────────────────────────────────────
const STATUS_CFG = {
  new:         { label: "New",         color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  in_progress: { label: "In Progress", color: GOLD,      bg: "rgba(212,160,23,0.1)" },
  resolved:    { label: "Resolved",    color: GREEN,     bg: `${GREEN}15` },
  closed:      { label: "Closed",      color: MUTED,     bg: "#F1F5F9" },
};

const CATEGORY_CFG = {
  general:        { label: "General",         color: MUTED },
  support:        { label: "Support",         color: "#3b82f6" },
  billing:        { label: "Billing",         color: GOLD },
  course_inquiry: { label: "Course Inquiry",  color: "#8b5cf6" },
  partnership:    { label: "Partnership",     color: GREEN },
  complaint:      { label: "Complaint",       color: "#ef4444" },
  other:          { label: "Other",           color: MUTED },
};

const STATUSES   = ["new", "in_progress", "resolved", "closed"];
const CATEGORIES = Object.keys(CATEGORY_CFG);

const fmtDate = (d) => new Date(d).toLocaleDateString("en-NG",
  { day: "numeric", month: "short", year: "numeric" });
const fmtDateTime = (d) => new Date(d).toLocaleString("en-NG",
  { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";

// ─── Stat card ────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <Paper elevation={0}
    sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 2.5, bgcolor: CARD }}>
    <Box sx={{ width: 44, height: 44, borderRadius: 2.5,
               bgcolor: `${color}18`, display: "flex",
               alignItems: "center", justifyContent: "center", mb: 1.5 }}>
      {icon}
    </Box>
    <Typography sx={{ fontSize: 26, fontWeight: 800, color }}>{value}</Typography>
    <Typography sx={{ fontSize: 13, color: MUTED }}>{label}</Typography>
  </Paper>
);

// ─── Attachment preview ───────────────────────────────────────
const AttachmentPreview = ({ url, name, cloudinaryId }) => {
  const isPdf = name?.toLowerCase().endsWith(".pdf") ||
                cloudinaryId?.includes("raw") ||
                url?.includes("/raw/");
  return (
    <Box sx={{ mt: 2, p: 2, border: `1px solid ${BORDER}`, borderRadius: 2,
               bgcolor: BG, display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {isPdf
          ? <PictureAsPdf sx={{ fontSize: 20, color: "#ef4444" }} />
          : <ImageIcon sx={{ fontSize: 20, color: NAVY }} />}
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT, flex: 1 }} noWrap>
          {name || "Attachment"}
        </Typography>
        <Tooltip title="Open in new tab">
          <IconButton size="small" href={url} target="_blank" rel="noopener noreferrer"
            component="a" sx={{ color: NAVY }}>
            <OpenInNew sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
      {!isPdf && (
        <Box component="img" src={url} alt={name || "attachment"}
          sx={{ width: "100%", maxHeight: 260, objectFit: "contain",
                borderRadius: 1.5, border: `1px solid ${BORDER}` }} />
      )}
      {isPdf && (
        <Button size="small" href={url} target="_blank" rel="noopener noreferrer"
          component="a" variant="outlined"
          sx={{ textTransform: "none", borderColor: BORDER, color: MUTED,
                borderRadius: 2, alignSelf: "flex-start" }}>
          Open PDF
        </Button>
      )}
    </Box>
  );
};

// ─── Message detail drawer ────────────────────────────────────
const MessageDrawer = ({ open, onClose, messageId, onUpdated }) => {
  const [msg,          setMsg]          = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [replyText,    setReplyText]    = useState("");
  const [noteText,     setNoteText]     = useState("");
  const [sending,      setSending]      = useState(false);
  const [savingNote,   setSavingNote]   = useState(false);
  const [toast,        setToast]        = useState(null);
  const [showReply,    setShowReply]    = useState(false);
  const [showNote,     setShowNote]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    if (!messageId) return;
    try {
      setLoading(true);
      const res = await getContactMessage(messageId);
      setMsg(res.message);
    } catch { setToast({ msg: "Failed to load message", severity: "error" }); }
    finally  { setLoading(false); }
  }, [messageId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleStatus = async (status) => {
    try {
      await updateContactStatus(messageId, status);
      setMsg((m) => ({ ...m, status }));
      onUpdated?.();
      setToast({ msg: "Status updated", severity: "success" });
    } catch { setToast({ msg: "Failed to update status", severity: "error" }); }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      setSending(true);
      await replyToContact(messageId, { reply: replyText });
      setMsg((m) => ({ ...m, adminReply: replyText, status: "resolved", repliedAt: new Date() }));
      setReplyText("");
      setShowReply(false);
      onUpdated?.();
      setToast({ msg: "Reply sent and message resolved", severity: "success" });
    } catch { setToast({ msg: "Failed to send reply", severity: "error" }); }
    finally  { setSending(false); }
  };

  const handleNote = async () => {
    if (!noteText.trim()) return;
    try {
      setSavingNote(true);
      await addInternalNote(messageId, noteText);
      setMsg((m) => ({ ...m, internalNote: noteText }));
      setNoteText("");
      setShowNote(false);
      setToast({ msg: "Note saved", severity: "success" });
    } catch { setToast({ msg: "Failed to save note", severity: "error" }); }
    finally  { setSavingNote(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteContactMessage(messageId);
      onClose();
      onUpdated?.();
      setToast({ msg: "Message deleted", severity: "success" });
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to delete", severity: "error" });
    }
    setConfirmDelete(false);
  };

  const statusCfg   = STATUS_CFG[msg?.status]   || STATUS_CFG.new;
  const categoryCfg = CATEGORY_CFG[msg?.category] || CATEGORY_CFG.general;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100vw", sm: 500 }, bgcolor: BG, display: "flex", flexDirection: "column" } }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2.5, bgcolor: CARD, borderBottom: `1px solid ${BORDER}`,
                 display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 800, fontSize: 17, color: TEXT }}>Message Detail</Typography>
        <IconButton onClick={onClose}><Close /></IconButton>
      </Box>

      {loading ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress sx={{ color: GREEN }} />
        </Box>
      ) : !msg ? null : (
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>

          {/* Status + category row */}
          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
            <Chip label={statusCfg.label} size="small"
              sx={{ bgcolor: statusCfg.bg, color: statusCfg.color, fontWeight: 800 }} />
            <Chip label={categoryCfg.label} size="small"
              sx={{ bgcolor: `${categoryCfg.color}15`, color: categoryCfg.color, fontWeight: 700 }} />
            {msg.attachmentUrl && (
              <Chip icon={<AttachFile sx={{ fontSize: 13 }} />} label="Has attachment"
                size="small" sx={{ bgcolor: `${NAVY}10`, color: NAVY, fontWeight: 700,
                                    "& .MuiChip-icon": { color: NAVY } }} />
            )}
          </Stack>

          {/* Subject + sender */}
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: TEXT, mb: 0.5 }}>
            {msg.subject}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: GREEN, fontSize: 14 }}>
              {initials(msg.fullName)}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{msg.fullName}</Typography>
              <Typography sx={{ fontSize: 12, color: MUTED }}>
                {msg.email}{msg.phone ? ` · ${msg.phone}` : ""}
              </Typography>
            </Box>
            <Box ml="auto">
              <Typography sx={{ fontSize: 12, color: MUTED }}>{fmtDateTime(msg.createdAt)}</Typography>
            </Box>
          </Box>

          {/* Message body */}
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2.5, p: 2.5, mb: 2 }}>
            <Typography sx={{ fontSize: 14, color: TEXT, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {msg.message}
            </Typography>
          </Paper>

          {/* Attachment */}
          {msg.attachmentUrl && (
            <AttachmentPreview
              url={msg.attachmentUrl}
              name={msg.attachmentOriginalName}
              cloudinaryId={msg.attachmentCloudinaryId}
            />
          )}

          {/* Previous admin reply */}
          {msg.adminReply && (
            <Box sx={{ mt: 2.5, p: 2.5, bgcolor: `${GREEN}08`, border: `1px solid ${GREEN}33`,
                       borderRadius: 2.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: GREEN,
                                 textTransform: "uppercase", letterSpacing: 0.8, mb: 1 }}>
                Reply sent {msg.repliedAt ? fmtDate(msg.repliedAt) : ""}
              </Typography>
              <Typography sx={{ fontSize: 14, color: TEXT, whiteSpace: "pre-wrap" }}>
                {msg.adminReply}
              </Typography>
            </Box>
          )}

          {/* Internal note */}
          {msg.internalNote && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "rgba(212,160,23,0.08)", border: `1px solid ${GOLD}44`,
                       borderRadius: 2.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: GOLD,
                                 textTransform: "uppercase", letterSpacing: 0.8, mb: 0.75 }}>
                Internal Note
              </Typography>
              <Typography sx={{ fontSize: 13, color: TEXT }}>{msg.internalNote}</Typography>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Status change */}
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: MUTED,
                             textTransform: "uppercase", letterSpacing: 0.8, mb: 1.5 }}>
            Change Status
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={3}>
            {STATUSES.map((s) => {
              const cfg = STATUS_CFG[s];
              return (
                <Chip key={s} label={cfg.label} clickable
                  onClick={() => handleStatus(s)}
                  variant={msg.status === s ? "filled" : "outlined"}
                  sx={{
                    fontWeight: 700, fontSize: 12,
                    bgcolor:     msg.status === s ? cfg.bg : "transparent",
                    color:       cfg.color,
                    borderColor: cfg.color,
                  }} />
              );
            })}
          </Stack>

          {/* Reply */}
          {!showReply ? (
            <Button fullWidth variant="outlined" startIcon={<Reply />}
              onClick={() => setShowReply(true)}
              sx={{ textTransform: "none", borderColor: BORDER, color: NAVY,
                    fontWeight: 700, borderRadius: 2.5, mb: 1.5 }}>
              Reply to sender
            </Button>
          ) : (
            <Box mb={1.5}>
              <TextField fullWidth multiline rows={4} placeholder="Type your reply…"
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

          {/* Internal note */}
          {!showNote ? (
            <Button fullWidth variant="outlined" startIcon={<StickyNote2 />}
              onClick={() => setShowNote(true)}
              sx={{ textTransform: "none", borderColor: BORDER, color: MUTED,
                    fontWeight: 700, borderRadius: 2.5, mb: 1.5 }}>
              Add internal note
            </Button>
          ) : (
            <Box mb={1.5}>
              <TextField fullWidth multiline rows={3} placeholder="Internal note (not sent to user)…"
                value={noteText} onChange={(e) => setNoteText(e.target.value)}
                sx={{ mb: 1.5, "& fieldset": { borderColor: BORDER } }} />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" disabled={savingNote || !noteText.trim()}
                  onClick={handleNote}
                  sx={{ textTransform: "none", bgcolor: GOLD, color: NAVY, fontWeight: 700,
                        borderRadius: 2, "&:hover": { bgcolor: "#C8970F" } }}>
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
              sx={{ textTransform: "none", borderColor: "rgba(239,68,68,0.3)", color: "#ef4444",
                    fontWeight: 700, borderRadius: 2.5 }}>
              Delete message
            </Button>
          ) : (
            <Box sx={{ p: 2, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 2.5, bgcolor: "rgba(239,68,68,0.05)" }}>
              <Typography sx={{ fontSize: 13, color: "#ef4444", fontWeight: 700, mb: 1.5 }}>
                Permanently delete this message? This cannot be undone.
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
          sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Drawer>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function AdminContactMessages() {
  const [messages,    setMessages]    = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [filters,     setFilters]     = useState({ status: "", category: "", search: "" });
  const [detailId,    setDetailId]    = useState(null);
  const [toast,       setToast]       = useState(null);

  const totalPages = Math.ceil(total / MESSAGES_PER_PAGE);

  const loadMessages = useCallback(async (pg = page) => {
    try {
      setLoading(true);
      const params = { page: pg, limit: MESSAGES_PER_PAGE };
      if (filters.status)   params.status   = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.search)   params.search   = filters.search;

      const res = await listContactMessages(params);
      setMessages(res.messages || []);
      setTotal(res.total || 0);
    } catch {
      setToast({ msg: "Failed to load messages", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await getContactSummary();
      setSummary(res);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadMessages(1); setPage(1); }, [filters]);
  useEffect(() => { loadMessages(page); }, [page]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  const handleFilterChange = (k) => (e) => {
    setFilters((f) => ({ ...f, [k]: e.target.value }));
  };

  const handleRefresh = () => { loadMessages(page); loadSummary(); };

  const handleUpdated = () => { loadMessages(page); loadSummary(); };

  // ── Compute stat values ───────────────────────────────────────
  const getCount = (arr, key, val) =>
    (arr || []).find((r) => r[key] === val)?.count || 0;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>

        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between",
                   alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: 26, fontWeight: 800, color: TEXT }}>
              Contact Messages
            </Typography>
            <Typography sx={{ fontSize: 14, color: MUTED, mt: 0.5 }}>
              Manage enquiries, support requests, and complaints from users.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh}
            sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
            Refresh
          </Button>
        </Box>

        {/* Stats strip */}
        {summary && (
          <Grid container spacing={2} mb={4}>
            {[
              {
                label: "Total",
                value: summary.total || 0,
                color: NAVY,
                icon: <Inbox sx={{ fontSize: 22, color: NAVY }} />,
              },
              {
                label: "New",
                value: getCount(summary.byStatus, "status", "new"),
                color: "#3b82f6",
                icon: <Circle sx={{ fontSize: 22, color: "#3b82f6" }} />,
              },
              {
                label: "In Progress",
                value: getCount(summary.byStatus, "status", "in_progress"),
                color: GOLD,
                icon: <AssignmentInd sx={{ fontSize: 22, color: GOLD }} />,
              },
              {
                label: "Complaints",
                value: getCount(summary.byCategory, "category", "complaint"),
                color: "#ef4444",
                icon: <AttachFile sx={{ fontSize: 22, color: "#ef4444" }} />,
              },
              {
                label: "Unresolved >24h",
                value: summary.recentUnreplied || 0,
                color: summary.recentUnreplied > 0 ? "#ef4444" : GREEN,
                icon: <CheckCircle sx={{ fontSize: 22, color: summary.recentUnreplied > 0 ? "#ef4444" : GREEN }} />,
              },
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
              <TextField fullWidth size="small" placeholder="Search by name, email or subject…"
                value={filters.search} onChange={handleFilterChange("search")}
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
                value={filters.status} onChange={handleFilterChange("status")}
                sx={{ "& fieldset": { borderColor: BORDER } }}>
                <MenuItem value="">All Statuses</MenuItem>
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>{STATUS_CFG[s].label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" select label="Category"
                value={filters.category} onChange={handleFilterChange("category")}
                sx={{ "& fieldset": { borderColor: BORDER } }}>
                <MenuItem value="">All Categories</MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{CATEGORY_CFG[c].label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {(filters.status || filters.category || filters.search) && (
              <Grid item xs={12} sm={1}>
                <Button size="small" onClick={() => setFilters({ status: "", category: "", search: "" })}
                  sx={{ textTransform: "none", color: MUTED }}>
                  Clear
                </Button>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Message list */}
        <Paper elevation={0}
          sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, overflow: "hidden" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: GREEN }} />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 10 }}>
              <Inbox sx={{ fontSize: 52, color: MUTED, mb: 2 }} />
              <Typography sx={{ fontWeight: 700, color: TEXT }}>No messages found</Typography>
              <Typography sx={{ fontSize: 14, color: MUTED, mt: 0.5 }}>
                {filters.status || filters.category || filters.search
                  ? "Try adjusting your filters."
                  : "No contact messages yet."}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {messages.map((msg, idx) => {
                const sCfg = STATUS_CFG[msg.status]     || STATUS_CFG.new;
                const cCfg = CATEGORY_CFG[msg.category] || CATEGORY_CFG.general;
                const isNew = msg.status === "new";

                return (
                  <ListItem key={msg.id} divider={idx < messages.length - 1}
                    onClick={() => setDetailId(msg.id)}
                    sx={{
                      cursor: "pointer", py: 2.5, px: 3,
                      bgcolor: isNew ? `${sCfg.bg}` : CARD,
                      transition: "background 0.15s",
                      "&:hover": { bgcolor: BG },
                    }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: GREEN, fontWeight: 700, width: 42, height: 42 }}>
                        {initials(msg.fullName)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography sx={{ fontWeight: isNew ? 800 : 600, fontSize: 14, color: TEXT }}>
                            {msg.fullName}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: MUTED }}>
                            {msg.email}
                          </Typography>
                          <Chip label={cCfg.label} size="small"
                            sx={{ height: 18, fontSize: 10, fontWeight: 800,
                                  bgcolor: `${cCfg.color}15`, color: cCfg.color,
                                  "& .MuiChip-label": { px: 0.75 } }} />
                          {msg.attachmentUrl && (
                            <Tooltip title="Has attachment">
                              <AttachFile sx={{ fontSize: 14, color: MUTED }} />
                            </Tooltip>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography sx={{ fontSize: 13, color: TEXT, fontWeight: isNew ? 700 : 400,
                                            mt: 0.25 }} noWrap>
                            {msg.subject}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: MUTED, mt: 0.25 }} noWrap>
                            {msg.message?.slice(0, 90)}…
                          </Typography>
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
                        {fmtDate(msg.createdAt)}
                      </Typography>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center",
                       gap: 2, py: 3, borderTop: `1px solid ${BORDER}` }}>
              <Typography sx={{ fontSize: 13, color: MUTED }}>
                Showing {(page - 1) * MESSAGES_PER_PAGE + 1}–
                {Math.min(page * MESSAGES_PER_PAGE, total)} of {total}
              </Typography>
              <Pagination count={totalPages} page={page}
                onChange={(_, v) => setPage(v)} size="medium"
                sx={{
                  "& .MuiPaginationItem-root": { fontWeight: 700 },
                  "& .Mui-selected": { bgcolor: `${NAVY} !important`, color: "#fff" },
                }} />
            </Box>
          )}
        </Paper>
      </Box>

      {/* Detail drawer */}
      <MessageDrawer
        open={!!detailId}
        onClose={() => setDetailId(null)}
        messageId={detailId}
        onUpdated={handleUpdated}
      />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}
          sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Inline Stack helper (avoids importing from @mui/material/Stack if not already in scope)
// function Stack({ children, direction = "column", spacing = 1, flexWrap, useFlexGap }) {
//   return (
//     <Box sx={{
//       display: "flex",
//       flexDirection: direction,
//       gap: spacing,
//       flexWrap: flexWrap || "nowrap",
//     }}>
//       {children}
//     </Box>
//   );
// }
