
import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  Autocomplete,
  Divider,
} from "@mui/material";
import {
  Add,
  ContentCopy,
  Groups,
  Cancel,
  OpenInNew,
  Delete,
  PeopleAlt,
  Download,
  CheckCircleOutline,
  HighlightOff,
  Refresh,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ScheduleWebinarDialog from "../components/live/ScheduleWebinarDialog";
import {
  listWebinars,
  cancelWebinar,
  getWebinarTeam,
  assignWebinarTeamMember,
  removeWebinarTeamMember,
  searchWebinarUsers,
  getWebinarGuests,
  moderateWebinarGuest,
  exportWebinarGuests,
} from "../services/webinarService";

const NAVY = "#0B1F3A";
const GOLD = "#D4A017";

const ROLE = {
  host: "Host",
  alt_host: "Alt host",
  cohost: "Co-host",
  panelist: "Panelist",
};

const STATUS = {
  scheduled: ["Scheduled", GOLD],
  live: ["Live", "#ef4444"],
  ended: ["Ended", "#64748b"],
  cancelled: ["Cancelled", "#64748b"],
};

const GUEST_STATUS = {
  waiting: ["Waiting", "#D97706"],
  admitted: ["Admitted", "#15803D"],
  rejected: ["Rejected", "#DC2626"],
  left: ["Left", "#64748b"],
};

const fmt = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Allow the browser to start the download before releasing the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function TeamDialog({ webinar, onClose, onToast }) {
  const [team, setTeam] = useState(null);
  const [opts, setOpts] = useState([]);
  const [pick, setPick] = useState(null);
  const [role, setRole] = useState("cohost");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    return getWebinarTeam(webinar.id)
      .then((response) => setTeam(response.team || []))
      .catch(() => {
        onToast("Could not load the team", "error");
      });
  }, [webinar.id, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!pick || saving) return;

    setSaving(true);

    try {
      const response = await assignWebinarTeamMember(
        webinar.id,
        pick.id,
        role
      );

      onToast(response.message || "Team member added", "success");
      setPick(null);
      await load();
    } catch (error) {
      onToast(
        error?.response?.data?.message || "Could not add team member",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (userId) => {
    if (saving) return;

    setSaving(true);

    try {
      await removeWebinarTeamMember(webinar.id, userId);
      onToast("Team member removed", "success");
      await load();
    } catch (error) {
      onToast(
        error?.response?.data?.message || "Could not remove team member",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        Team: {webinar.title}
      </DialogTitle>

      <DialogContent>
        {team === null ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : team.length === 0 ? (
          <Typography sx={{ color: "text.secondary", py: 2 }}>
            No team members found.
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ mb: 2 }}>
            {team.map((member) => (
              <Box
                key={member.userId}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "#F8FAFC",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                    {member.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "text.secondary",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {member.email}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexShrink: 0,
                  }}
                >
                  <Chip
                    size="small"
                    label={ROLE[member.role] || member.role || "Member"}
                    sx={{ fontWeight: 700 }}
                  />
                  <Tooltip title="Remove team member">
                    <span>
                      <IconButton
                        size="small"
                        disabled={saving}
                        onClick={() => remove(member.userId)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Stack>
        )}

        <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 1 }}>
          Add or change a person
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Autocomplete
            fullWidth
            size="small"
            options={opts}
            value={pick}
            filterOptions={(options) => options}
            getOptionLabel={(option) =>
              `${option.name || ""} (${option.email || ""})`
            }
            isOptionEqualToValue={(option, value) =>
              option.id === value.id
            }
            onInputChange={async (_, query) => {
              if (query.trim().length < 2) {
                setOpts([]);
                return;
              }

              try {
                const response = await searchWebinarUsers(query);
                setOpts(response.users || []);
              } catch {
                setOpts([]);
              }
            }}
            onChange={(_, value) => setPick(value)}
            renderInput={(params) => (
              <TextField {...params} label="Search name or email" />
            )}
          />

          <TextField
            select
            size="small"
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            sx={{ minWidth: 140 }}
          >
            {Object.entries(ROLE).map(([key, value]) => (
              <MenuItem key={key} value={key}>
                {value}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            disabled={!pick || saving}
            onClick={add}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: NAVY,
              "&:hover": { bgcolor: "#16365d" },
            }}
          >
            {saving ? "Saving…" : "Add"}
          </Button>
        </Stack>

        <Typography
          sx={{ fontSize: 12, color: "text.secondary", mt: 1 }}
        >
          Making someone the host moves the current host to alternative host.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function GuestManagementDialog({ webinar, onClose, onToast }) {
  const [guests, setGuests] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [busyGuestId, setBusyGuestId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState("all");

  const loadGuests = useCallback(async (showLoader = true) => {
    if (showLoader) setRefreshing(true);
    setLoadError("");

    try {
      const response = await getWebinarGuests(webinar.id);

      if (!Array.isArray(response.guests)) {
        throw new Error("The server returned an unexpected guest list.");
      }

      setGuests(response.guests);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Could not load webinar guests";

      setLoadError(message);
      onToast(message, "error");
    } finally {
      setRefreshing(false);
    }
  }, [webinar.id, onToast]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  const counts = (guests || []).reduce(
    (result, guest) => {
      result.total += 1;

      if (Object.prototype.hasOwnProperty.call(result, guest.status)) {
        result[guest.status] += 1;
      }

      return result;
    },
    {
      total: 0,
      waiting: 0,
      admitted: 0,
      rejected: 0,
      left: 0,
    }
  );

  const visibleGuests =
    guests?.filter((guest) =>
      filter === "all" ? true : guest.status === filter
    ) || [];

  const moderate = async (guest, action) => {
    const verb = action === "admit" ? "admit" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${verb} ${guest.fullName}?`
      )
    ) {
      return;
    }

    setBusyGuestId(guest.id);

    try {
      const response = await moderateWebinarGuest(
        webinar.id,
        guest.id,
        action
      );

      onToast(
        response.message ||
          (action === "admit" ? "Guest admitted" : "Guest rejected"),
        "success"
      );

      await loadGuests(false);
    } catch (error) {
      onToast(
        error?.response?.data?.message ||
          `Could not ${verb} guest`,
        "error"
      );
    } finally {
      setBusyGuestId(null);
    }
  };

  const exportGuests = async () => {
    setExporting(true);

    try {
      const blob = await exportWebinarGuests(webinar.id);

      if (!(blob instanceof Blob)) {
        throw new Error("The server did not return a CSV file.");
      }

      downloadBlob(blob, `webinar-${webinar.id}-guests.csv`);
      onToast("Guest registrations exported", "success");
    } catch (error) {
      onToast(
        error?.response?.data?.message ||
          error.message ||
          "Could not export guest registrations",
        "error"
      );
    } finally {
      setExporting(false);
    }
  };

  const summaryCards = [
    { label: "Total", value: counts.total, color: NAVY },
    { label: "Waiting", value: counts.waiting, color: "#D97706" },
    { label: "Admitted", value: counts.admitted, color: "#15803D" },
    { label: "Rejected", value: counts.rejected, color: "#DC2626" },
  ];

  return (
    <Dialog
      open
      onClose={busyGuestId ? undefined : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 20, color: NAVY }}>
          Manage guests
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
          {webinar.title}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            disabled={refreshing}
            onClick={() => loadGuests()}
            sx={{
              textTransform: "none",
              borderColor: NAVY,
              color: NAVY,
            }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={
              exporting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Download />
              )
            }
            disabled={exporting}
            onClick={exportGuests}
            sx={{
              textTransform: "none",
              bgcolor: NAVY,
              "&:hover": { bgcolor: "#16365d" },
            }}
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1,
            mb: 2.5,
          }}
        >
          {summaryCards.map((item) => (
            <Paper
              key={item.label}
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 2.5 }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  color: "text.secondary",
                  fontWeight: 600,
                }}
              >
                {item.label}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 25,
                  color: item.color,
                  mt: 0.25,
                }}
              >
                {item.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ mb: 2, alignItems: { sm: "center" } }}
        >
          <Typography sx={{ fontWeight: 800, flex: 1 }}>
            Registrations
          </Typography>

          <TextField
            select
            size="small"
            label="Filter status"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All guests</MenuItem>
            <MenuItem value="waiting">Waiting</MenuItem>
            <MenuItem value="admitted">Admitted</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="left">Left</MenuItem>
          </TextField>
        </Stack>

        {refreshing && guests === null ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <CircularProgress />
            <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 13 }}>
              Loading guest registrations…
            </Typography>
          </Box>
        ) : loadError && guests === null ? (
          <Paper
            variant="outlined"
            sx={{ p: 3, textAlign: "center", borderRadius: 3 }}
          >
            <Typography sx={{ mb: 2 }}>{loadError}</Typography>
            <Button
              variant="contained"
              onClick={() => loadGuests()}
              sx={{ textTransform: "none", bgcolor: NAVY }}
            >
              Try again
            </Button>
          </Paper>
        ) : visibleGuests.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{ p: 4, textAlign: "center", borderRadius: 3 }}
          >
            <PeopleAlt sx={{ fontSize: 36, color: "#94A3B8", mb: 1 }} />
            <Typography sx={{ fontWeight: 700 }}>
              {guests?.length
                ? "No guests match this filter."
                : "No guest registrations yet."}
            </Typography>
            <Typography
              sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}
            >
              Guest registrations will appear here when people register.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.25}>
            {visibleGuests.map((guest) => {
              const [statusLabel, statusColor] =
                GUEST_STATUS[guest.status] || [
                  guest.status || "Unknown",
                  "#64748b",
                ];

              const isBusy = busyGuestId === guest.id;
              const canModerate = guest.status !== "left";

              return (
                <Paper
                  key={guest.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: guest.status === "waiting" ? "#FFFCF4" : "#fff",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ sm: "center" }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 800,
                            color: NAVY,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {guest.fullName}
                        </Typography>

                        <Chip
                          size="small"
                          label={statusLabel}
                          sx={{
                            bgcolor: `${statusColor}18`,
                            color: statusColor,
                            fontWeight: 800,
                          }}
                        />
                      </Stack>

                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "text.secondary",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {guest.email}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "text.secondary",
                          mt: 0.5,
                        }}
                      >
                        {guest.age != null ? `Age: ${guest.age} · ` : ""}
                        Registered: {fmt(guest.createdAt)}
                      </Typography>

                      {guest.admittedAt && (
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "text.secondary",
                            mt: 0.25,
                          }}
                        >
                          Admitted: {fmt(guest.admittedAt)}
                        </Typography>
                      )}

                      {guest.joinedAt && (
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "text.secondary",
                            mt: 0.25,
                          }}
                        >
                          Joined: {fmt(guest.joinedAt)}
                        </Typography>
                      )}

                      {guest.leftAt && (
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "text.secondary",
                            mt: 0.25,
                          }}
                        >
                          Left: {fmt(guest.leftAt)}
                        </Typography>
                      )}
                    </Box>

                    {canModerate && (
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {guest.status !== "admitted" && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<CheckCircleOutline />}
                            disabled={!!busyGuestId}
                            onClick={() => moderate(guest, "admit")}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              bgcolor: "#15803D",
                              "&:hover": { bgcolor: "#166534" },
                            }}
                          >
                            {isBusy ? "Updating…" : "Admit"}
                          </Button>
                        )}

                        {guest.status !== "rejected" && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<HighlightOff />}
                            disabled={!!busyGuestId}
                            onClick={() => moderate(guest, "reject")}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                            }}
                          >
                            Reject
                          </Button>
                        )}

                        {isBusy && (
                          <CircularProgress size={20} sx={{ alignSelf: "center" }} />
                        )}
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminWebinars({ embedded = false }) {
  const navigate = useNavigate();

  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  const [teamFor, setTeamFor] = useState(null);
  const [guestsFor, setGuestsFor] = useState(null);
  const [toast, setToast] = useState(null);

  const say = useCallback((message, severity = "info") => {
    setToast({ msg: message, severity });
  }, []);

  const load = useCallback(() => {
    return listWebinars("all")
      .then((response) => setRows(response.webinars || []))
      .catch(() => say("Could not load webinars", "error"));
  }, [say]);

  useEffect(() => {
    load();
  }, [load]);

  const link = (webinar) =>
    `${window.location.origin}/webinar/${webinar.id}`;

  const copy = async (webinar) => {
    try {
      await navigator.clipboard.writeText(link(webinar));
      say("Join link copied", "success");
    } catch {
      say(link(webinar), "info");
    }
  };

  const cancel = async (webinar) => {
    if (!window.confirm(`Cancel "${webinar.title}"?`)) return;

    try {
      await cancelWebinar(webinar.id);
      say("Webinar cancelled", "success");
      await load();
    } catch (error) {
      say(
        error?.response?.data?.message || "Could not cancel webinar",
        "error"
      );
    }
  };

  return (
    <Box sx={embedded ? {} : { p: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        {embedded ? (
          <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>
            Webinars, their hosting teams, guest registrations and join links.
          </Typography>
        ) : (
          <Box>
            <Typography
              sx={{
                color: GOLD,
                fontWeight: 800,
                letterSpacing: 1.4,
                fontSize: 12,
              }}
            >
              ADMIN
            </Typography>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: 24, md: 30 },
                color: NAVY,
              }}
            >
              Webinars
            </Typography>
          </Box>
        )}

        <Button
          startIcon={<Add />}
          variant="contained"
          disableElevation
          onClick={() => setOpen(true)}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            borderRadius: 3,
            bgcolor: NAVY,
            "&:hover": { bgcolor: "#16365d" },
          }}
        >
          Schedule webinar
        </Button>
      </Box>

      {!rows ? (
        <Box sx={{ textAlign: "center", p: 6 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ p: 5, textAlign: "center", borderRadius: 4 }}
        >
          <Typography>No webinars yet. Schedule the first one.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {rows.map((webinar) => {
            const [label, color] = STATUS[webinar.status] || [
              webinar.status || "Unknown",
              "#64748b",
            ];

            const host = webinar.team?.find(
              (member) => member.role === "host"
            );

            const active = ["scheduled", "live"].includes(webinar.status);

            return (
              <Paper
                key={webinar.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, color: NAVY }}>
                      {webinar.title}
                    </Typography>

                    <Chip
                      size="small"
                      label={label}
                      sx={{
                        bgcolor: `${color}22`,
                        color,
                        fontWeight: 800,
                      }}
                    />
                  </Box>

                  <Typography
                    sx={{ fontSize: 13, color: "text.secondary" }}
                  >
                    {fmt(webinar.scheduledAt)} · {webinar.durationMinutes} min
                    {" · "}up to {webinar.capacity} attendees
                    {host ? ` · Host: ${host.name}` : ""}
                  </Typography>

                  <Typography
                    sx={{ fontSize: 12, color: "text.secondary" }}
                  >
                    {webinar.team?.length || 0} on the team
                    {webinar.qaEnabled ? " · Q&A on" : ""}
                    {webinar.recordingEnabled ? " · recording on" : ""}
                  </Typography>
                </Box>

                <Tooltip title="Copy join link">
                  <IconButton
                    aria-label={`Copy join link for ${webinar.title}`}
                    onClick={() => copy(webinar)}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Manage team">
                  <span>
                    <IconButton
                      aria-label={`Manage team for ${webinar.title}`}
                      disabled={!active}
                      onClick={() => setTeamFor(webinar)}
                    >
                      <Groups fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Manage guest registrations">
                  <IconButton
                    aria-label={`Manage guests for ${webinar.title}`}
                    onClick={() => setGuestsFor(webinar)}
                  >
                    <PeopleAlt fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Open webinar">
                  <IconButton
                    aria-label={`Open ${webinar.title}`}
                    onClick={() => navigate(`/webinar/${webinar.id}`)}
                  >
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>

                {webinar.status === "scheduled" && (
                  <Tooltip title="Cancel webinar">
                    <IconButton
                      aria-label={`Cancel ${webinar.title}`}
                      onClick={() => cancel(webinar)}
                    >
                      <Cancel fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}

      <ScheduleWebinarDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          say("Webinar scheduled. The team has been emailed.", "success");
          load();
        }}
      />

      {teamFor && (
        <TeamDialog
          webinar={teamFor}
          onClose={() => {
            setTeamFor(null);
            load();
          }}
          onToast={say}
        />
      )}

      {guestsFor && (
        <GuestManagementDialog
          webinar={guestsFor}
          onClose={() => setGuestsFor(null)}
          onToast={say}
        />
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast?.severity || "info"}
          onClose={() => setToast(null)}
        >
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
