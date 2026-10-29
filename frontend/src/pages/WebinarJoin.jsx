import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Videocam, Schedule } from "@mui/icons-material";

import {
  getWebinar,
  joinWebinar,
  getWebinarInfo,
  registerWebinarGuest,
  getWebinarGuestStatus,
} from "../services/webinarService";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";

const ROLE = {
  host: "Host",
  alt_host: "Alternative host",
  cohost: "Co-host",
  panelist: "Panelist",
  attendee: "Attendee",
};

export default function WebinarJoin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const timer = useRef(null);
  const mounted = useRef(false);
  const checkingGuestStatus = useRef(false);

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [waiting, setWaiting] = useState(false);

  const [guestMode, setGuestMode] = useState(
    () => !localStorage.getItem("token")
  );

  const [guestForm, setGuestForm] = useState({
    fullName: "",
    email: "",
    age: "",
    consent: false,
  });

  const [guestAccessKey, setGuestAccessKey] = useState(
    () => sessionStorage.getItem(`webinarAccessKey:${id}`) || ""
  );

  const [guestStatus, setGuestStatus] = useState("");
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [guestStatusRecoverable, setGuestStatusRecoverable] =
    useState(false);

  const clearPolling = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // Load webinar information for authenticated users and public guests.
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;

    const load = async () => {
      try {
        setError("");

        if (localStorage.getItem("token")) {
          const result = await getWebinar(id);

          if (!cancelled) {
            setData(result);
            setGuestMode(false);
          }
        } else {
          const result = await getWebinarInfo(id);

          if (!cancelled) {
            const webinar = result.webinar || result;

            setData({
              ...result,
              webinar,
              myRole: "attendee",
              canHost: false,
            });

            setGuestMode(true);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message ||
              "Could not load this webinar."
          );
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      mounted.current = false;
      clearPolling();
    };
  }, [id, clearPolling]);

  // Authenticated-user join flow.
  const enter = useCallback(async () => {
    try {
      setError("");
      setNote("");
      setWaiting(false);

      await joinWebinar(id);

      navigate(`/live/${data.webinar.roomName}/${id}`, {
        state: {
          role:
            data.canHost ||
            ["host", "alt_host", "cohost"].includes(data.myRole)
              ? "host"
              : "student",
        },
      });
    } catch (e) {
      if (e?.response?.data?.code === "NOT_STARTED") {
        setWaiting(true);
        setNote(
          "Waiting for the host to start. We will check again shortly."
        );

        clearPolling();

        timer.current = setTimeout(() => {
          enter();
        }, 10000);
      } else {
        setWaiting(false);
        setNote(
          e?.response?.data?.message ||
            "Could not join the webinar."
        );
      }
    }
  }, [id, data, navigate, clearPolling]);

  // Check guest admission and navigate only when the server returns
  // the required LiveKit connection details.
  const checkGuestStatus = useCallback(
    async (accessKey = guestAccessKey) => {
      if (!accessKey || checkingGuestStatus.current) {
        return;
      }

      checkingGuestStatus.current = true;
      clearPolling();
      setGuestStatusRecoverable(false);

      try {
        const result = await getWebinarGuestStatus(id, accessKey);

        if (!mounted.current) {
          return;
        }

        if (result.status === "admitted") {
          const roomName =
            result.webinar?.roomName || data?.webinar?.roomName;

          const registrationId =
            result.guest?.id || result.registrationId;

          const fullName =
            result.guest?.fullName ||
            result.fullName ||
            guestForm.fullName;

          if (
            !result.token ||
            !result.serverUrl ||
            !roomName ||
            !registrationId
          ) {
            setGuestStatus("error");
            setGuestStatusRecoverable(true);
            setNote(
              "You have been admitted, but the server did not return all connection details. Please check again or contact the webinar host."
            );
            return;
          }

          setGuestStatus("admitted");
          setNote("");

          navigate(`/live/${roomName}/${id}`, {
            replace: true,
            state: {
              role: "student",
              webinarGuest: {
                token: result.token,
                serverUrl: result.serverUrl,
                registrationId,
                fullName,
              },
            },
          });

          return;
        }

        if (result.status === "rejected") {
          setGuestStatus("rejected");
          setNote("Your registration was not approved by the host.");
          return;
        }

        if (result.status === "left") {
          setGuestStatus("left");
          setNote("This guest registration is no longer active.");
          return;
        }

        if (!["waiting", "pending"].includes(result.status)) {
          setGuestStatus("error");
          setGuestStatusRecoverable(true);
          setNote(
            "We could not verify this registration. You can try again or register again."
          );
          return;
        }

        setGuestStatus("waiting");
        setNote(
          "Registration received. Waiting for the host to admit you."
        );

        timer.current = setTimeout(() => {
          checkGuestStatus(accessKey);
        }, 5000);
      } catch (e) {
        if (!mounted.current) {
          return;
        }

        const statusCode = e?.response?.status;
        const invalidKey = [400, 401, 403, 404, 410].includes(
          statusCode
        );

        setGuestStatus("error");
        setGuestStatusRecoverable(invalidKey);

        setNote(
          e?.response?.data?.message ||
            "Could not check admission status. Please try again."
        );

        // Retry temporary/network failures.
        // Invalid or expired keys can be reset by the guest.
        if (!invalidKey) {
          timer.current = setTimeout(() => {
            checkGuestStatus(accessKey);
          }, 8000);
        }
      } finally {
        checkingGuestStatus.current = false;
      }
    },
    [
      id,
      guestAccessKey,
      navigate,
      clearPolling,
      data,
      guestForm.fullName,
    ]
  );

  // Register a guest.
  const handleGuestRegister = async (event) => {
    event.preventDefault();

    const fullName = guestForm.fullName.trim();
    const email = guestForm.email.trim();
    const age = Number(guestForm.age);

    if (!guestForm.consent) {
      setError("Please provide consent before registering.");
      return;
    }

    if (
      !fullName ||
      !email ||
      !Number.isFinite(age) ||
      age < 1 ||
      age > 120
    ) {
      setError(
        "Please enter your full name, a valid email address, and an age between 1 and 120."
      );
      return;
    }

    try {
      setGuestSubmitting(true);
      setError("");
      setNote("");

      const result = await registerWebinarGuest(id, {
        fullName,
        email,
        age,
        consent: guestForm.consent,
      });

      if (!result?.accessKey) {
        throw new Error(
          "The registration response did not contain an access key."
        );
      }

      sessionStorage.setItem(
        `webinarAccessKey:${id}`,
        result.accessKey
      );

      setGuestAccessKey(result.accessKey);
      setGuestStatus(result.status || "waiting");
      setGuestStatusRecoverable(false);

      setNote(
        "Registration successful. Checking admission status..."
      );

      await checkGuestStatus(result.accessKey);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e.message ||
          "Guest registration failed."
      );
    } finally {
      setGuestSubmitting(false);
    }
  };

  // Clear a saved access key if it is no longer usable.
  const resetGuestRegistration = useCallback(() => {
    clearPolling();

    sessionStorage.removeItem(`webinarAccessKey:${id}`);

    setGuestAccessKey("");
    setGuestStatus("");
    setGuestStatusRecoverable(false);
    setNote("");
    setError("");
  }, [id, clearPolling]);

  // Resume guest status checks after a page refresh.
  useEffect(() => {
    if (!guestMode || !guestAccessKey) {
      return;
    }

    checkGuestStatus(guestAccessKey);

    return () => {
      clearPolling();
    };
  }, [
    guestMode,
    guestAccessKey,
    id,
    checkGuestStatus,
    clearPolling,
  ]);

  if (error && !data) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Alert severity="error" sx={{ display: "inline-flex" }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 8, textAlign: "center" }}>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <CircularProgress />
        )}
      </Box>
    );
  }

  const w = data.webinar;
  const ended = ["ended", "cancelled"].includes(w.status);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F1F5F9",
        display: "grid",
        placeItems: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 5,
          maxWidth: 560,
          width: "100%",
        }}
      >
        <Chip
          label="WEBINAR"
          size="small"
          sx={{
            bgcolor: NAVY,
            color: "#fff",
            fontWeight: 800,
            mb: 2,
          }}
        />

        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 26,
            color: NAVY,
            lineHeight: 1.2,
          }}
        >
          {w.title}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "text.secondary",
            mt: 1.5,
          }}
        >
          <Schedule fontSize="small" />

          <Typography sx={{ fontSize: 14 }}>
            {w.scheduledAt
              ? new Date(w.scheduledAt).toLocaleString("en-NG", {
                  dateStyle: "full",
                  timeStyle: "short",
                })
              : "Schedule to be announced"}
            {" · "}
            {w.durationMinutes ?? "—"} min
          </Typography>
        </Box>

        {w.description && (
          <Typography
            sx={{
              mt: 2,
              color: "text.secondary",
              whiteSpace: "pre-wrap",
            }}
          >
            {w.description}
          </Typography>
        )}

        {!!w.team?.length && (
          <Typography sx={{ mt: 2, fontSize: 13.5 }}>
            <b>Hosted by:</b>{" "}
            {w.team
              .filter((m) =>
                ["host", "cohost", "alt_host"].includes(m.role)
              )
              .map((m) => m.name)
              .join(", ")}

            {w.team.some((m) => m.role === "panelist") && (
              <>
                {" · "}
                <b>Panelists:</b>{" "}
                {w.team
                  .filter((m) => m.role === "panelist")
                  .map((m) => m.name)
                  .join(", ")}
              </>
            )}
          </Typography>
        )}

        {!guestMode && (
          <Box sx={{ mt: 2 }}>
            <Chip
              size="small"
              label={`You join as: ${ROLE[data.myRole] || "Attendee"}`}
              sx={{
                bgcolor: `${GOLD}22`,
                fontWeight: 800,
              }}
            />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {guestMode ? (
          guestAccessKey ? (
            <Box sx={{ mt: 3 }}>
              <Alert
                severity={
                  guestStatus === "rejected" ||
                  guestStatus === "left"
                    ? "error"
                    : guestStatus === "error"
                      ? "warning"
                      : "info"
                }
              >
                {note ||
                  (guestStatus === "rejected"
                    ? "Your registration was rejected."
                    : guestStatus === "left"
                      ? "This guest registration is no longer active."
                      : guestStatus === "error"
                        ? "Could not verify your registration."
                        : "Waiting for the host to admit you...")}
              </Alert>

              {guestStatus !== "rejected" &&
                guestStatus !== "left" && (
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled={guestSubmitting}
                    onClick={() => checkGuestStatus(guestAccessKey)}
                    sx={{ mt: 2, textTransform: "none" }}
                  >
                    Check admission status
                  </Button>
                )}

              {(guestStatusRecoverable ||
                guestStatus === "rejected" ||
                guestStatus === "left") && (
                <Button
                  fullWidth
                  variant="text"
                  onClick={resetGuestRegistration}
                  sx={{ mt: 1, textTransform: "none" }}
                >
                  Register again
                </Button>
              )}
            </Box>
          ) : (
            <Box
              component="form"
              onSubmit={handleGuestRegister}
              sx={{ mt: 3 }}
            >
              <Typography
                sx={{ fontWeight: 800, color: NAVY, mb: 2 }}
              >
                Register as a guest
              </Typography>

              <TextField
                fullWidth
                required
                label="Full name"
                autoComplete="name"
                value={guestForm.fullName}
                onChange={(e) =>
                  setGuestForm((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                required
                type="email"
                label="Email address"
                autoComplete="email"
                value={guestForm.email}
                onChange={(e) =>
                  setGuestForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                required
                type="number"
                label="Age"
                value={guestForm.age}
                onChange={(e) =>
                  setGuestForm((prev) => ({
                    ...prev,
                    age: e.target.value,
                  }))
                }
                inputProps={{ min: 1, max: 120 }}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={guestForm.consent}
                    onChange={(e) =>
                      setGuestForm((prev) => ({
                        ...prev,
                        consent: e.target.checked,
                      }))
                    }
                  />
                }
                label="I consent to the processing of my registration details for this webinar."
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={
                  guestSubmitting ||
                  ended ||
                  !guestForm.consent
                }
                sx={{
                  mt: 2,
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: GREEN,
                  py: 1.3,
                  "&:hover": { bgcolor: "#166d3e" },
                }}
              >
                {guestSubmitting ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Register for webinar"
                )}
              </Button>
            </Box>
          )
        ) : (
          <>
            {note && (
              <Alert
                severity={waiting ? "info" : "warning"}
                sx={{ mt: 2 }}
              >
                {note}
              </Alert>
            )}

            <Button
              fullWidth
              size="large"
              variant="contained"
              disableElevation
              disabled={ended || waiting}
              onClick={enter}
              startIcon={
                waiting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <Videocam />
                )
              }
              sx={{
                mt: 3,
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 3,
                bgcolor: GREEN,
                py: 1.4,
                "&:hover": { bgcolor: "#166d3e" },
              }}
            >
              {ended
                ? w.status === "cancelled"
                  ? "Cancelled"
                  : "This webinar has ended"
                : waiting
                  ? "Waiting for the host"
                  : ["host", "alt_host", "cohost"].includes(
                        data.myRole
                      )
                    ? "Start / join webinar"
                    : "Join webinar"}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}