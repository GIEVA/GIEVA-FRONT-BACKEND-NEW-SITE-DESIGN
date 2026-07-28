// pages/ConsultationBooking.jsx
//
// Matches the UI in the screenshots:
//   Step 1 — Pick a date (calendar) + pick a time slot
//   Step 2 — Fill in details (Name, Email, Phone, Other Details) + Confirm
//
// Route: /consultations  (add to App.jsx — no ProtectedRoute, guests can book)

import { useState, useEffect, useCallback } from "react";
import {
  Box, Container, Typography, Paper, Grid, Button,
  TextField, MenuItem, CircularProgress, Alert,
  Chip, IconButton, Stack, Divider, LinearProgress,
} from "@mui/material";
import {
  ChevronLeft, ChevronRight, AccessTime, Phone,
  Language, CalendarMonth, CheckCircle, ArrowBack,
  ArrowForward,
} from "@mui/icons-material";
import { bookConsultation, getAvailableSlots } from "../services/consultationService";

// ─── Brand tokens ──────────────────────────────────────────────
const NAVY    = "#0B1F3A";
const GREEN   = "#1E7F4F";
const ORANGE  = "#E8651A";
const WHITE   = "#FFFFFF";
const OFF_WHITE = "#F7F9FC";
const MUTED   = "#64748B";
const TEXT    = "#1A2332";
const BORDER  = "#E6E9F0";

// ─── Config ────────────────────────────────────────────────────
const CONSULTATION_TYPES = [
  { value: "career_pathway",       label: "Career Pathway Consultation" },
  { value: "study_abroad",         label: "Study Abroad Advisory" },
  { value: "test_preparation",     label: "Test Preparation Strategy" },
  { value: "scholarship_guidance", label: "Scholarship Guidance" },
  { value: "general",              label: "General Consultation" },
];

// Available time slots (working hours, 30-min intervals)
const ALL_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const toLocaleDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const slotToDate = (dateStr, timeStr) => {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  const d = new Date(dateStr);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// ─── Calendar ──────────────────────────────────────────────────
function Calendar({ selectedDate, onSelectDate, bookedDates }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay  = new Date(viewYear, viewMonth, 1);
  const lastDay   = new Date(viewYear, viewMonth + 1, 0);
  // Monday-first grid
  const startDow  = (firstDay.getDay() + 6) % 7; // 0=Mon
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const canGoPrev = viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <Box>
      {/* Month header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <IconButton size="small" onClick={prevMonth} disabled={!canGoPrev}
          sx={{ color: canGoPrev ? TEXT : BORDER }}>
          <ChevronLeft />
        </IconButton>
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: TEXT }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Typography>
        <IconButton size="small" onClick={nextMonth} sx={{ color: TEXT }}>
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Day headers */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 0.5 }}>
        {DAY_NAMES.map((d) => (
          <Typography key={d} sx={{ textAlign: "center", fontSize: 11,
                                     fontWeight: 700, color: MUTED, py: 0.5 }}>
            {d}
          </Typography>
        ))}
      </Box>

      {/* Date cells */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.25 }}>
        {Array.from({ length: totalCells }).map((_, idx) => {
          const dayNum    = idx - startDow + 1;
          const isValid   = dayNum >= 1 && dayNum <= lastDay.getDate();
          const cellDate  = isValid ? new Date(viewYear, viewMonth, dayNum) : null;
          const dateStr   = cellDate ? toLocaleDateStr(cellDate) : null;
          const isPast    = cellDate && cellDate < today;
          const isWeekend = cellDate && (cellDate.getDay() === 0 || cellDate.getDay() === 6);
          const isSelected = dateStr === selectedDate;
          const isToday   = dateStr === toLocaleDateStr(today);
          const isDisabled = !isValid || isPast || isWeekend;

          return (
            <Box key={idx}
              onClick={() => !isDisabled && onSelectDate(dateStr)}
              sx={{
                aspectRatio: "1",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "50%", cursor: isDisabled ? "default" : "pointer",
                fontSize: 13, fontWeight: isToday ? 800 : 500,
                color:  isDisabled ? BORDER : isSelected ? WHITE : TEXT,
                bgcolor: isSelected ? GREEN : isToday && !isSelected ? `${GREEN}18` : "transparent",
                border:  isToday && !isSelected ? `1.5px solid ${GREEN}` : "none",
                "&:hover": isDisabled ? {} : {
                  bgcolor: isSelected ? GREEN : `${GREEN}15`,
                },
                transition: "all 0.12s",
              }}>
              {isValid ? dayNum : ""}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── BOOKING PAGE ──────────────────────────────────────────────
export default function ConsultationBookingPage() {
  const [step,          setStep]          = useState(1); // 1=calendar, 2=details
  const [selectedDate,  setSelectedDate]  = useState(null);
  const [selectedSlot,  setSelectedSlot]  = useState(null);
  const [bookedSlots,   setBookedSlots]   = useState([]);
  const [slotsLoading,  setSlotsLoading]  = useState(false);
  const [timeFormat,    setTimeFormat]    = useState("12h");
  const [submitting,    setSubmitting]    = useState(false);
  const [success,       setSuccess]       = useState(null);
  const [submitError,   setSubmitError]   = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phoneNumber: "",
    otherDetails: "", consultationType: "general",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    getAvailableSlots(selectedDate)
      .then((res) => setBookedSlots(res.bookedSlots || []))
      .catch(() => setBookedSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  const isSlotBooked = useCallback((slotStr) => {
    if (!selectedDate) return false;
    const slotDate = slotToDate(selectedDate, slotStr);
    return bookedSlots.some((b) => {
      const diff = Math.abs(new Date(b) - slotDate);
      return diff < 5 * 60000; // within 5 minutes
    });
  }, [selectedDate, bookedSlots]);

  const setField = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setFieldErrors((p) => ({ ...p, [k]: "" }));
  };

  const validateDetails = () => {
    const errors = {};
    if (!form.name.trim())  errors.name  = "Name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                            errors.email = "Please enter a valid email.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validateDetails()) return;
    const scheduledAt = slotToDate(selectedDate, selectedSlot).toISOString();
    try {
      setSubmitting(true);
      setSubmitError("");
      const res = await bookConsultation({
        ...form,
        scheduledAt,
        duration: 60,
      });
      setSuccess(res);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to book. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success ──
  if (success) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center",
                 justifyContent: "center", bgcolor: OFF_WHITE, py: 8 }}>
        <Paper elevation={0}
          sx={{ border: `1px solid ${BORDER}`, borderRadius: 4, p: 5,
                maxWidth: 480, width: "100%", mx: 2, textAlign: "center" }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "50%", bgcolor: `${GREEN}15`,
                     display: "flex", alignItems: "center", justifyContent: "center",
                     mx: "auto", mb: 3 }}>
            <CheckCircle sx={{ fontSize: 42, color: GREEN }} />
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: TEXT, mb: 1 }}>
            Consultation Booked!
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 15, mb: 2 }}>
            {success.message}
          </Typography>
          <Chip label={success.reference} size="small"
            sx={{ bgcolor: `${NAVY}10`, color: NAVY, fontWeight: 800, mb: 3 }} />
          <Typography sx={{ fontSize: 13, color: MUTED }}>
            Check your email for confirmation. We'll be in touch shortly.
          </Typography>
          <Button variant="outlined" sx={{ mt: 3, textTransform: "none",
                                           borderColor: BORDER, color: MUTED, borderRadius: 2 }}
            onClick={() => { setSuccess(null); setStep(1); setSelectedDate(null); setSelectedSlot(null); }}>
            Book another session
          </Button>
        </Paper>
      </Box>
    );
  }

  const selectedDateLabel = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-NG",
        { weekday: "long", day: "numeric", month: "long" })
    : null;

  return (
    <Box sx={{ bgcolor: OFF_WHITE, minHeight: "100vh", py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        {/* Page intro */}
        <Box mb={4}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: 2,
                             textTransform: "uppercase", color: ORANGE, mb: 1 }}>
            CONSULTATIONS
          </Typography>
          <Typography sx={{ fontSize: { xs: 26, md: 34 }, fontWeight: 900, color: WHITE,
                             mb: 1.5, lineHeight: 1.2,
                             // dark section like the screenshot
                             background: NAVY, px: 3, py: 2, borderRadius: 2, display: "inline-block" }}>
            CONSULATIONS
          </Typography>
          <Typography sx={{ fontSize: 15, color: TEXT, maxWidth: 700, mt: 2, lineHeight: 1.7 }}>
            Need a personalized roadmap? Speak 1-on-1 with an academic advisor to plan your future.
            Schedule consultation session with our academic advisors to receive personalized guidance on
            your study abroad goals.
          </Typography>

          <Box mt={2}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: TEXT, mb: 1 }}>
              Consultation Options
            </Typography>
            <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
              {["Career pathway consultation", "Study abroad advisory",
                "Test preparation strategy", "Scholarship guidance"].map((item) => (
                <Typography key={item} component="li"
                  sx={{ fontSize: 14, color: TEXT, mb: 0.5 }}>{item}</Typography>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Booking widget */}
        <Paper elevation={3}
          sx={{ borderRadius: 3, overflow: "hidden", display: "flex",
                flexDirection: { xs: "column", md: "row" }, minHeight: 480 }}>

          {/* LEFT — booking info panel */}
          <Box sx={{ bgcolor: WHITE, borderRight: { md: `1px solid ${BORDER}` },
                     p: 3.5, minWidth: { md: 240 }, maxWidth: { md: 280 } }}>
            {/* Logo area */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3,
                       pb: 2.5, borderBottom: `1px solid ${BORDER}` }}>
              <Box sx={{ width: 36, height: 36, borderRadius: "50%",
                         background: `linear-gradient(135deg, ${ORANGE}, ${GREEN})`,
                         display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ color: WHITE, fontWeight: 900, fontSize: 16 }}>G</Typography>
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: MUTED }}>
                Consultation Booking
              </Typography>
            </Box>

            <Typography sx={{ fontSize: 18, fontWeight: 900, color: TEXT, mb: 2.5 }}>
              GIEVA Consultation
            </Typography>

            <Stack spacing={1.5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTime sx={{ fontSize: 16, color: MUTED }} />
                <Typography sx={{ fontSize: 14, color: MUTED }}>60 minutes</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Phone sx={{ fontSize: 16, color: MUTED }} />
                <Typography sx={{ fontSize: 14, color: MUTED }}>Attendee Phone Number</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Language sx={{ fontSize: 16, color: MUTED }} />
                <Typography sx={{ fontSize: 14, color: MUTED }}>{form.timezone}</Typography>
              </Box>
              {selectedDate && selectedSlot && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                  <CalendarMonth sx={{ fontSize: 16, color: GREEN }} />
                  <Typography sx={{ fontSize: 13, color: GREEN, fontWeight: 700 }}>
                    {selectedSlot} · {selectedDateLabel}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* RIGHT — step content */}
          <Box sx={{ flex: 1, p: { xs: 2.5, md: 4 } }}>

            {/* ── STEP 1: Calendar + time slots ── */}
            {step === 1 && (
              <Grid container spacing={4}>
                {/* Calendar */}
                <Grid item xs={12} md={6}>
                  {/* 12h / 24h toggle — matches screenshot */}
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, gap: 0.5 }}>
                    {["12h", "24h"].map((f) => (
                      <Button key={f} size="small" variant={timeFormat === f ? "contained" : "outlined"}
                        onClick={() => setTimeFormat(f)}
                        sx={{ minWidth: 40, textTransform: "none", fontWeight: 700, fontSize: 12,
                              bgcolor: timeFormat === f ? NAVY : "transparent",
                              borderColor: BORDER, color: timeFormat === f ? WHITE : MUTED,
                              "&:hover": { bgcolor: timeFormat === f ? NAVY : OFF_WHITE } }}>
                        {f}
                      </Button>
                    ))}
                  </Box>
                  <Calendar
                    selectedDate={selectedDate}
                    onSelectDate={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                    bookedDates={[]}
                  />
                </Grid>

                {/* Time slots */}
                <Grid item xs={12} md={6}>
                  {!selectedDate ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center",
                               height: "100%", minHeight: 200 }}>
                      <Typography sx={{ color: MUTED, fontSize: 14, textAlign: "center" }}>
                        Select a date to see available times
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: TEXT, mb: 2 }}>
                        {selectedDateLabel}
                      </Typography>

                      {slotsLoading ? (
                        <LinearProgress sx={{ bgcolor: `${GREEN}22`,
                          "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1,
                                   maxHeight: 340, overflowY: "auto",
                                   pr: 0.5,
                                   "&::-webkit-scrollbar": { width: 4 },
                                   "&::-webkit-scrollbar-thumb": { bgcolor: BORDER, borderRadius: 2 } }}>
                          {ALL_SLOTS.map((slot) => {
                            const booked   = isSlotBooked(slot);
                            const selected = selectedSlot === slot;
                            return (
                              <Box key={slot} sx={{ display: "flex", gap: 1 }}>
                                <Button fullWidth variant={selected ? "contained" : "outlined"}
                                  disabled={booked}
                                  onClick={() => {
                                    if (selected) {
                                      // Second click on selected → proceed to step 2
                                      setStep(2);
                                    } else {
                                      setSelectedSlot(slot);
                                    }
                                  }}
                                  sx={{
                                    textTransform: "none", fontWeight: 700, fontSize: 13,
                                    borderRadius: 2, py: 1,
                                    bgcolor:     selected ? GREEN : "transparent",
                                    borderColor: selected ? GREEN : BORDER,
                                    color:       booked ? BORDER : selected ? WHITE : TEXT,
                                    "&:hover":   booked ? {} : { bgcolor: `${GREEN}15`, borderColor: GREEN },
                                  }}>
                                  {slot}
                                </Button>
                                {selected && (
                                  <Button variant="contained"
                                    onClick={() => setStep(2)}
                                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 13,
                                          borderRadius: 2, px: 2.5, whiteSpace: "nowrap",
                                          bgcolor: GREEN, "&:hover": { bgcolor: "#166d3e" } }}>
                                    Next <ArrowForward sx={{ fontSize: 15, ml: 0.5 }} />
                                  </Button>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}

            {/* ── STEP 2: Details form ── */}
            {step === 2 && (
              <Box>
                {/* Back button */}
                <Button startIcon={<ArrowBack />} onClick={() => setStep(1)}
                  sx={{ textTransform: "none", color: MUTED, mb: 3, pl: 0,
                        "&:hover": { color: TEXT, bgcolor: "transparent" } }}>
                  Details
                </Button>

                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <TextField required fullWidth label="Name"
                      placeholder="Name"
                      value={form.name} onChange={setField("name")}
                      error={!!fieldErrors.name} helperText={fieldErrors.name}
                      sx={{ "& fieldset": { borderColor: BORDER } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField required fullWidth label="Email" type="email"
                      placeholder="Email"
                      value={form.email} onChange={setField("email")}
                      error={!!fieldErrors.email} helperText={fieldErrors.email}
                      sx={{ "& fieldset": { borderColor: BORDER } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Phone Number"
                      placeholder="PhoneNumber"
                      value={form.phoneNumber} onChange={setField("phoneNumber")}
                      sx={{ "& fieldset": { borderColor: BORDER } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth select label="Consultation Type"
                      value={form.consultationType} onChange={setField("consultationType")}
                      sx={{ "& fieldset": { borderColor: BORDER } }}>
                      {CONSULTATION_TYPES.map((t) => (
                        <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={4} label="Other Details"
                      placeholder="Other Details"
                      value={form.otherDetails} onChange={setField("otherDetails")}
                      sx={{ "& fieldset": { borderColor: BORDER } }} />
                  </Grid>
                </Grid>

                {submitError && (
                  <Alert severity="error" sx={{ borderRadius: 2, mt: 2 }}>{submitError}</Alert>
                )}

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                  <Button variant="contained" onClick={handleConfirm}
                    disabled={submitting}
                    endIcon={submitting
                      ? <CircularProgress size={16} color="inherit" />
                      : <ArrowForward />}
                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 15,
                          bgcolor: GREEN, color: WHITE, borderRadius: 2.5, px: 4, py: 1.25,
                          "&:hover": { bgcolor: "#166d3e" } }}>
                    {submitting ? "Confirming…" : "Confirm"}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
