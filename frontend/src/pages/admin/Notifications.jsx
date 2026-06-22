// pages/Notifications.jsx
// Clickable notification cards → detail modal → auto-marks as read on open

import {
  Box, Typography, Card, CardContent, Chip, Stack,
  CircularProgress, Modal, IconButton, Divider, Avatar,
  Badge, Button, Tooltip,
} from "@mui/material";

import {
  useEffect, useState, useCallback,
} from "react";

import {
  Close, NotificationsNone, CheckCircleOutline,
  PaymentOutlined, VideoLibrary, QuizOutlined,
  SchoolOutlined, InfoOutlined, MarkEmailRead,
  DoneAll, Refresh,
} from "@mui/icons-material";

import {
  getNotifications,
  markNotificationRead,
} from "../../services/notificationService";

// ─── Design tokens ────────────────────────────────────────────
const BRAND       = "#14532d";
const BRAND_MID   = "#16a34a";
const BRAND_LIGHT = "#bbf7d0";
const SURFACE     = "#f9fafb";
const CARD_BG     = "#ffffff";
const BORDER      = "#e5e7eb";
const TEXT_PRIMARY   = "#111827";
const TEXT_SECONDARY = "#6b7280";
const TEXT_MUTED     = "#9ca3af";

// ─── Notification type config ─────────────────────────────────
const TYPE_META = {
  payment: {
    icon:  <PaymentOutlined sx={{ fontSize: 20 }} />,
    color: "#d97706",
    bg:    "#fef3c7",
    label: "Payment",
  },
  live_class: {
    icon:  <VideoLibrary sx={{ fontSize: 20 }} />,
    color: "#7c3aed",
    bg:    "#f5f3ff",
    label: "Live Class",
  },
  quiz: {
    icon:  <QuizOutlined sx={{ fontSize: 20 }} />,
    color: "#0284c7",
    bg:    "#eff6ff",
    label: "Quiz",
  },
  enrollment: {
    icon:  <SchoolOutlined sx={{ fontSize: 20 }} />,
    color: BRAND_MID,
    bg:    "#f0fdf4",
    label: "Enrollment",
  },
  general: {
    icon:  <InfoOutlined sx={{ fontSize: 20 }} />,
    color: TEXT_SECONDARY,
    bg:    SURFACE,
    label: "General",
  },
};

const getTypeMeta = (type) =>
  TYPE_META[type] || TYPE_META.general;

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);

  if (diffMins  < 1)  return "Just now";
  if (diffMins  < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays  < 7)  return `${diffDays}d ago`;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

// ─── Notification Detail Modal ────────────────────────────────
const NotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;
  const meta = getTypeMeta(notification.type);

  return (
    <Modal
      open={!!notification}
      onClose={onClose}
      aria-labelledby="notification-modal-title"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "92vw", sm: 500 },
          bgcolor: CARD_BG,
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          outline: "none",
          overflow: "hidden",
        }}
      >
        {/* Header strip */}
        <Box
          sx={{
            bgcolor: meta.bg,
            px: 3, py: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: "12px",
                bgcolor: `${meta.color}20`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: meta.color,
              }}
            >
              {meta.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {meta.label}
              </Typography>
              <Typography sx={{ fontSize: 12, color: TEXT_MUTED }}>
                {formatDate(notification.createdAt)}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {notification.isRead && (
              <Tooltip title="Read">
                <CheckCircleOutline sx={{ fontSize: 18, color: BRAND_MID }} />
              </Tooltip>
            )}
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: TEXT_MUTED, bgcolor: "rgba(0,0,0,0.05)", "&:hover": { bgcolor: "rgba(0,0,0,0.1)" } }}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Body */}
        <Box px={3} py={3}>
          <Typography
            id="notification-modal-title"
            sx={{ fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.3, mb: 1.5, letterSpacing: "-0.3px" }}
          >
            {notification.title}
          </Typography>

          <Typography
            sx={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.7, mb: 2.5 }}
          >
            {notification.message}
          </Typography>

          {/* Meta row */}
          <Box
            sx={{
              bgcolor: SURFACE,
              borderRadius: "12px",
              p: 2,
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.3 }}>
                Type
              </Typography>
              <Chip
                label={meta.label}
                size="small"
                sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: 11, border: "none", height: 22 }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.3 }}>
                Status
              </Typography>
              <Chip
                label={notification.isRead ? "Read" : "Unread"}
                size="small"
                sx={{
                  bgcolor: notification.isRead ? "#f0fdf4" : "#fef3c7",
                  color:   notification.isRead ? BRAND_MID  : "#92400e",
                  fontWeight: 700, fontSize: 11, border: "none", height: 22,
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.3 }}>
                Received
              </Typography>
              <Typography sx={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 500 }}>
                {notification.createdAt
                  ? new Date(notification.createdAt).toLocaleString("en-NG", {
                      weekday: "short", day: "numeric",
                      month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : "—"}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 3, pb: 3,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: TEXT_SECONDARY,
              border: `1px solid ${BORDER}`,
              borderRadius: "10px",
              px: 3,
              "&:hover": { bgcolor: SURFACE },
            }}
          >
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

// ─── Notification Card ────────────────────────────────────────
const NotificationCard = ({ notification, onClick }) => {
  const meta    = getTypeMeta(notification.type);
  const isUnread = !notification.isRead;

  return (
    <Card
      onClick={() => onClick(notification)}
      elevation={0}
      sx={{
        border: `1px solid ${isUnread ? BRAND_LIGHT : BORDER}`,
        borderRadius: "14px",
        cursor: "pointer",
        bgcolor: isUnread ? "#f0fdf4" : CARD_BG,
        transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
        position: "relative",
        overflow: "visible",
        "&:hover": {
          boxShadow: "0 4px 18px rgba(0,0,0,0.09)",
          transform: "translateY(-2px)",
          borderColor: BRAND_LIGHT,
        },
      }}
    >
      {/* Unread dot */}
      {isUnread && (
        <Box
          sx={{
            position: "absolute",
            top: 14, right: 14,
            width: 9, height: 9,
            borderRadius: "50%",
            bgcolor: BRAND_MID,
            boxShadow: `0 0 0 2px ${CARD_BG}`,
          }}
        />
      )}

      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          {/* Icon avatar */}
          <Box
            sx={{
              width: 44, height: 44, borderRadius: "12px",
              bgcolor: meta.bg, color: meta.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {meta.icon}
          </Box>

          {/* Content */}
          <Box flex={1} minWidth={0}>
            <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1} mb={0.4}>
              <Typography
                sx={{
                  fontSize: 14, fontWeight: isUnread ? 800 : 700,
                  color: TEXT_PRIMARY, lineHeight: 1.35,
                  overflow: "hidden", textOverflow: "ellipsis",
                  display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical",
                }}
              >
                {notification.title}
              </Typography>
              <Typography sx={{ fontSize: 11, color: TEXT_MUTED, flexShrink: 0, mt: 0.2 }}>
                {formatDate(notification.createdAt)}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {notification.message}
            </Typography>

            <Box display="flex" alignItems="center" gap={0.8} mt={1.2}>
              <Chip
                label={meta.label}
                size="small"
                sx={{
                  bgcolor: meta.bg, color: meta.color,
                  fontWeight: 700, fontSize: 10, height: 20,
                  border: "none",
                }}
              />
              {!isUnread && (
                <Box display="flex" alignItems="center" gap={0.4}>
                  <CheckCircleOutline sx={{ fontSize: 13, color: BRAND_MID }} />
                  <Typography sx={{ fontSize: 11, color: BRAND_MID, fontWeight: 600 }}>Read</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ─── Empty State ──────────────────────────────────────────────
const EmptyState = () => (
  <Box textAlign="center" py={10}>
    <Box
      sx={{
        width: 80, height: 80, borderRadius: "50%",
        bgcolor: SURFACE, display: "flex",
        alignItems: "center", justifyContent: "center",
        mx: "auto", mb: 2,
      }}
    >
      <NotificationsNone sx={{ fontSize: 36, color: TEXT_MUTED }} />
    </Box>
    <Typography sx={{ fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY, mb: 0.5 }}>
      No notifications yet
    </Typography>
    <Typography sx={{ fontSize: 14, color: TEXT_SECONDARY }}>
      You're all caught up! Check back later.
    </Typography>
  </Box>
);

// ─── Main Notifications Page ──────────────────────────────────
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState(null); // notification open in modal
  const [markingAll,    setMarkingAll]    = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Open modal + auto-mark as read
  const handleOpen = async (notification) => {
    setSelected(notification);

    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        // Update local state optimistically
        setNotifications((prev) =>
          prev.map((n) => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        // Also update the selected item so modal shows "Read"
        setSelected((prev) => prev ? { ...prev, isRead: true } : prev);
      } catch (err) {
        console.error("markNotificationRead:", err);
      }
    }
  };

  const handleClose = () => setSelected(null);

  // Mark all unread as read
  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (!unread.length) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress sx={{ color: BRAND_MID }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: SURFACE,
        minHeight: "100vh",
        px: { xs: 2, sm: 3, md: 4 },
        py: 4,
        maxWidth: 720,
        mx: "auto",
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Badge badgeContent={unreadCount || null} color="error" max={99}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: "12px",
                bgcolor: BRAND, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <NotificationsNone sx={{ fontSize: 20, color: "white" }} />
            </Box>
          </Badge>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 900, color: TEXT_PRIMARY, letterSpacing: "-0.4px" }}>
              Notifications
            </Typography>
            <Typography sx={{ fontSize: 13, color: TEXT_MUTED }}>
              {unreadCount > 0
                ? `${unreadCount} unread · ${notifications.length} total`
                : `${notifications.length} notification${notifications.length !== 1 ? "s" : ""}`}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          {unreadCount > 0 && (
            <Button
              size="small"
              disabled={markingAll}
              onClick={handleMarkAllRead}
              startIcon={markingAll ? <CircularProgress size={13} /> : <DoneAll sx={{ fontSize: 15 }} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
                color: BRAND_MID,
                border: `1px solid ${BRAND_LIGHT}`,
                borderRadius: "9px",
                px: 1.8,
                bgcolor: "#f0fdf4",
                "&:hover": { bgcolor: "#dcfce7" },
              }}
            >
              Mark all read
            </Button>
          )}
          <Tooltip title="Refresh">
            <IconButton
              onClick={fetchNotifications}
              size="small"
              sx={{ border: `1px solid ${BORDER}`, borderRadius: "9px", color: TEXT_MUTED }}
            >
              <Refresh sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Divider + filter summary */}
      {notifications.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mb: 2.5,
            flexWrap: "wrap",
          }}
        >
          {unreadCount > 0 && (
            <Chip
              icon={<MarkEmailRead sx={{ fontSize: 13 }} />}
              label={`${unreadCount} unread`}
              size="small"
              sx={{
                bgcolor: "#fef3c7", color: "#92400e",
                fontWeight: 700, fontSize: 11, height: 24, border: "none",
                "& .MuiChip-icon": { color: "#92400e" },
              }}
            />
          )}
          <Chip
            label={`${notifications.length - unreadCount} read`}
            size="small"
            sx={{
              bgcolor: "#f0fdf4", color: BRAND_MID,
              fontWeight: 700, fontSize: 11, height: 24, border: "none",
            }}
          />
        </Box>
      )}

      {/* List */}
      {notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <Stack spacing={1.5}>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={handleOpen}
            />
          ))}
        </Stack>
      )}

      {/* Detail Modal */}
      <NotificationModal
        notification={selected}
        onClose={handleClose}
      />
    </Box>
  );
}
