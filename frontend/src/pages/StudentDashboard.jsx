// pages/StudentDashboard.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getStudentDashboard } from "../services/studentDashboard";

import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Alert,
  LinearProgress,
  Avatar,
  Button,
  Divider,
  Chip,
  Stack,
} from "@mui/material";

import {
  School,
  Quiz,
  Payments,
  PlayCircle,
  MenuBook,
  AccessTime,
  CheckCircle,
  CalendarMonth,
  TrendingUp,
  ArrowForward,
  Assignment,
  WorkspacePremium,
  PendingActions,
  ReceiptLong,
  Inbox,
} from "@mui/icons-material";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS — aligned with Admin / Tutor dashboards
// ─────────────────────────────────────────────────────────────

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";
const BG = "#F7F9FC";
const CARD = "#FFFFFF";
const BORDER = "#E6E9F0";
const TEXT = "#0F172A";
const MUTED = "#64748B";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const formatCurrency = (amount) =>
  `₦${Number(amount || 0).toLocaleString()}`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────

const SectionCard = ({ title, action, children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 5,
      border: `1px solid ${BORDER}`,
      bgcolor: CARD,
      p: { xs: 3, md: 4 },
      ...sx,
    }}
  >
    {title && (
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        gap={2}
      >
        <Typography sx={{ fontSize: 20, fontWeight: 800, color: TEXT }}>
          {title}
        </Typography>
        {action}
      </Box>
    )}
    {children}
  </Paper>
);

const ViewAllLink = ({ onClick, label = "View all" }) => (
  <Button
    onClick={onClick}
    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
    sx={{
      color: GREEN,
      textTransform: "none",
      fontWeight: 700,
      fontSize: 13,
      "&:hover": { bgcolor: "transparent", opacity: 0.75 },
    }}
  >
    {label}
  </Button>
);

const EmptyState = ({ icon, text }) => (
  <Box
    sx={{
      textAlign: "center",
      py: 5,
      color: MUTED,
    }}
  >
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        bgcolor: "#F1F5F9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mx: "auto",
        mb: 1.5,
        color: "#94A3B8",
      }}
    >
      {icon}
    </Box>
    <Typography sx={{ fontSize: 13.5 }}>{text}</Typography>
  </Box>
);

const StatCard = ({ title, value, icon, color = GREEN }) => (
  <Paper
    elevation={0}
    sx={{
      border: `1px solid ${BORDER}`,
      borderRadius: 4,
      p: 3,
      bgcolor: CARD,
      height: "100%",
      minHeight: 170,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      transition: "all .25s ease",
      "&:hover": {
      borderColor: color,
      transform: "translateY(-4px)",
      boxShadow: `0 12px 30px ${color}20`,
    },
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 3,
        bgcolor: `${color}14`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        mb: 2,
      }}
    >
      {icon}
    </Box>

    <Typography sx={{ fontSize: 13, color: MUTED, fontWeight: 600, mb: 0.5 }}>
      {title}
    </Typography>

    <Typography sx={{ fontSize: 26, fontWeight: 800, color: TEXT }}>
      {value}
    </Typography>
  </Paper>
);

const StatGroupHeader = ({ label }) => (
  <Typography
    sx={{
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 1.2,
      color: MUTED,
      textTransform: "uppercase",
      mb: 3,
    }}
  >
    {label}
  </Typography>
);

const CourseCard = ({ course, navigate }) => {
  const progress = Number(course.progress || 0);
  const isComplete = progress >= 100;

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${BORDER}`,
        borderRadius: 4,
        overflow: "hidden",
        bgcolor: CARD,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.2s",
        "&:hover": {
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box
        sx={{
          height: 160,
          bgcolor: "#F0FDF4",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <MenuBook sx={{ fontSize: 56, color: GREEN }} />
        )}

        {isComplete && (
          <Chip
            label="Completed"
            size="small"
            icon={<CheckCircle sx={{ fontSize: 14 }} />}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              bgcolor: "rgba(15,23,42,0.85)",
              color: "#fff",
              fontWeight: 700,
              "& .MuiChip-icon": { color: "#86EFAC" },
            }}
          />
        )}
      </Box>

      <Box p={3} display="flex" flexDirection="column" flexGrow={1}>
        <Chip
          label={course.category}
          size="small"
          sx={{
            bgcolor: "#F0FDF4",
            color: GREEN,
            fontWeight: 700,
            alignSelf: "flex-start",
            mb: 1.5,
          }}
        />

        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 700,
            color: TEXT,
            mb: 0.5,
            lineHeight: 1.35,
          }}
        >
          {course.title}
        </Typography>

        <Typography sx={{ fontSize: 13, color: MUTED, mb: 2 }}>
          {course.completedLessons} / {course.totalLessons} lessons completed
        </Typography>

        <Box mt="auto">
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 20,
              mb: 1.5,
              bgcolor: "#EEF2F7",
              "& .MuiLinearProgress-bar": {
                bgcolor: isComplete ? GOLD : GREEN,
                borderRadius: 20,
              },
            }}
          />

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: MUTED }}>
              {progress}% completed
            </Typography>

            <Button
              variant="contained"
              size="small"
              onClick={() => navigate(`/courses/${course.id}`)}
              sx={{
                bgcolor: NAVY,
                textTransform: "none",
                borderRadius: 2,
                fontWeight: 700,
                px: 2.5,
                "&:hover": { bgcolor: GREEN },
              }}
            >
              Continue
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await getStudentDashboard();
      setDashboard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        bgcolor={BG}
      >
        <CircularProgress sx={{ color: GREEN }} />
      </Box>
    );
  }

  if (!dashboard) {
    return (
      <Box p={4} bgcolor={BG} minHeight="100vh">
        <Alert severity="error">Failed to load dashboard</Alert>
      </Box>
    );
  }

  const {
    profile,
    hero,
    stats,
    continueLearning,
    enrolledCourses,
    recentQuizAttempts,
    analytics,
    featuredCourses,
    upcomingSessions,
    assignedTutors,
    examStats,
    latestExamRegistration,
    recentExamRegistrations,
  } = dashboard;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box
        sx={{
          maxWidth: 1700,
          mx: "auto",
          px: { xs: 2, sm: 3, md: 5, lg: 6 },
          py: { xs: 3, md: 5 },
        }}
      >
        {/* ============================================================ */}
        {/* HERO HEADER */}
        {/* ============================================================ */}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 5,
            mb: 4,
            overflow: "hidden",
            background: `linear-gradient(135deg, ${NAVY}, ${GREEN})`,
            color: "#fff",
          }}
        >
          <Box
            sx={{
              p: { xs: 3, md: 5 },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              gap: 3,
            }}
          >
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Avatar
                src={profile?.profilePicUrl}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: GOLD,
                  color: NAVY,
                  fontWeight: 800,
                  fontSize: 22,
                  border: "3px solid rgba(255,255,255,0.25)",
                }}
              >
                {initials(profile?.fullName)}
              </Avatar>

              <Box>
                <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 800 }}>
                  {hero?.welcomeMessage}
                </Typography>

                <Typography sx={{ fontSize: 14, opacity: 0.85, mt: 0.5 }}>
                  Continue your learning journey and track your progress
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} width={{ xs: "100%", md: "auto" }}>
              <Button
                variant="outlined"
                startIcon={<MenuBook />}
                onClick={() => navigate("/courses")}
                sx={{
                  borderColor: "rgba(255,255,255,0.4)",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 3,
                  px: 3,
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                Browse Courses
              </Button>

              <Button
                variant="contained"
                startIcon={<Assignment />}
                onClick={() => navigate("/exam-catalog")}
                sx={{
                  bgcolor: GOLD,
                  color: NAVY,
                  textTransform: "none",
                  fontWeight: 800,
                  borderRadius: 3,
                  px: 3,
                  "&:hover": {
                    bgcolor: "#e3b32a",
                  },
                }}
              >
                Register for Exams
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* ============================================================ */}
        {/* CONTINUE LEARNING + LATEST EXAM REGISTRATION */}
        {/* ============================================================ */}

        {(continueLearning || latestExamRegistration) && (
          <Grid container spacing={3} mb={6}>
            {continueLearning && (
              <Grid item xs={12} md={latestExamRegistration ? 7 : 12}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 5,
                    border: `1px solid ${BORDER}`,
                    background:
                      "linear-gradient(135deg,#0B1F3A,#1E7F4F)",
                    color: "#fff",
                    p: { xs: 3, md: 4 },
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 3,
                    minHeight: 180,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      flexShrink: 0,
                      borderRadius: 3,
                      bgcolor: "#F0FDF4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: GREEN,
                    }}
                  >
                    <PlayCircle sx={{ fontSize: 32 }} />
                  </Box>

                  <Box flexGrow={1} minWidth={0}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: 1.2,
                        color: GREEN,
                        textTransform: "uppercase",
                        mb: 0.5,
                      }}
                    >
                      Continue Learning
                    </Typography>

                    <Typography
                      sx={{ fontSize: 17, fontWeight: 700, color: TEXT, mb: 0.25 }}
                      noWrap
                    >
                      {continueLearning?.continueLearning?.title}
                    </Typography>

                    <Typography sx={{ fontSize: 14, color: MUTED }} noWrap>
                      {continueLearning?.continueLearning?.lessonTitle}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={<PlayCircle />}
                    onClick={() => navigate(`/courses/${continueLearning.id}`)}
                    sx={{
                      flexShrink: 0,
                      bgcolor: GOLD,
                      color: NAVY,
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 3,
                      px: 3,
                      "&:hover": { bgcolor: GREEN },
                    }}
                  >
                    Resume
                  </Button>
                </Paper>
              </Grid>
            )}

            {latestExamRegistration && (
              <Grid item xs={12} md={continueLearning ? 5 : 12}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 5,
                    border: `1px solid ${BORDER}`,
                    bgcolor: CARD,
                    p: { xs: 3, md: 4 },
                    height: "100%",
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={1.5}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: 1.2,
                          color: GOLD,
                          textTransform: "uppercase",
                          mb: 0.5,
                        }}
                      >
                        Latest Exam Registration
                      </Typography>

                      <Typography sx={{ fontSize: 18, fontWeight: 800, color: TEXT }}>
                        {latestExamRegistration.examType}
                      </Typography>

                      <Typography sx={{ fontSize: 13, color: MUTED, mt: 0.25 }}>
                        {latestExamRegistration.registrationCode}
                      </Typography>
                    </Box>

                    <Chip
                      label={latestExamRegistration.status}
                      size="small"
                      sx={{
                        bgcolor: "#EFF6FF",
                        color: "#1D4ED8",
                        fontWeight: 700,
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography sx={{ fontSize: 18, fontWeight: 800, color: TEXT }}>
                      {formatCurrency(latestExamRegistration.amount)}
                    </Typography>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        navigate(`/exam-registrations/${latestExamRegistration.id}`)
                      }
                      sx={{
                        borderColor: NAVY,
                        color: NAVY,
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 2,
                        "&:hover": { borderColor: GREEN, color: GREEN },
                      }}
                    >
                      View Registration
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        {/* ============================================================ */}
        {/* LEARNING OVERVIEW */}
        {/* ============================================================ */}

       <Box
          sx={{
            mb: 6,
            mt: 2,
          }}
        >
          <StatGroupHeader label="Learning Overview" />
          <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,1fr)",
                  xl: "repeat(4,1fr)",
                },
                gap: 3,
              }}
            >
           
              <StatCard
                title="Enrolled Courses"
                value={stats.totalCourses}
                icon={<School />}
                color={GREEN}
              />
           

            
              <StatCard
                title="Quiz Attempts"
                value={stats.totalQuizAttempts}
                icon={<Quiz />}
                color="#7C3AED"
              />


            
              <StatCard
                title="Overall Progress"
                value={`${stats.overallProgress}%`}
                icon={<TrendingUp />}
                color={NAVY}
              />
           

            
              <StatCard
                title="Total Spent"
                value={formatCurrency(stats.totalSpent)}
                icon={<Payments />}
                color="#D32F2F"
              />
            
          </Box>
        </Box>

        {/* ============================================================ */}
        {/* EXAM OVERVIEW */}
        {/* ============================================================ */}

       <Box
        sx={{
          mb: 10,
          mt: 10,
        }}
      >
          <StatGroupHeader label="Exam Overview" />
         <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,1fr)",
                md: "repeat(3,1fr)",
                xl: "repeat(5,1fr)",
              },
              gap: 3,
            }}
          >
           
              <StatCard
                title="Registrations"
                value={examStats?.totalRegistrations || 0}
                icon={<Assignment />}
                color={NAVY}
              />
           

          
              <StatCard
                title="Submitted"
                value={examStats?.submitted || 0}
                icon={<CheckCircle />}
                color="#0284C7"
              />
           

            
              <StatCard
                title="Completed"
                value={examStats?.completed || 0}
                icon={<WorkspacePremium />}
                color={GREEN}
              />
            

            
              <StatCard
                title="Pending"
                value={examStats?.pending || 0}
                icon={<PendingActions />}
                color={GOLD}
              />
           

            
              <StatCard
                title="Exam Spending"
                value={formatCurrency(examStats?.totalSpent)}
                icon={<ReceiptLong />}
                color="#D32F2F"
              />
            
          </Box>
        </Box>

        {/* ============================================================ */}
        {/* MAIN CONTENT GRID */}
        {/* ============================================================ */}

        <Grid container spacing={5}>
          {/* LEFT COLUMN */}
          <Grid item xs={12} xl={8}>
            {/* MY COURSES */}
            <SectionCard
              title="My Courses"
              action={<ViewAllLink onClick={() => navigate("/courses")} />}
              sx={{ mb: 4 }}
            >
              {enrolledCourses?.length > 0 ? (
                <Grid container spacing={3}>
                  {enrolledCourses.map((course) => (
                    <Grid item xs={12} sm={6} key={course.id}>
                      <CourseCard course={course} navigate={navigate} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyState
                  icon={<MenuBook />}
                  text="You haven't enrolled in any courses yet."
                />
              )}
            </SectionCard>

            {/* RECENT EXAM REGISTRATIONS */}
            <SectionCard
              title="Recent Exam Registrations"
              action={
                <ViewAllLink onClick={() => navigate("/my-exam-registrations")} />
              }
              sx={{ mb: 4 }}
            >
              {recentExamRegistrations?.length > 0 ? (
                <Grid container spacing={2}>
                  {recentExamRegistrations.map((registration) => (
                    <Grid item xs={12} sm={6} key={registration.id}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          borderColor: BORDER,
                          height: "100%",
                        }}
                      >
                        <Typography sx={{ fontWeight: 700, color: TEXT }}>
                          {registration.examType}
                        </Typography>

                        <Typography sx={{ fontSize: 13, color: MUTED, mb: 1.5 }}>
                          {registration.registrationCode}
                        </Typography>

                        <Stack direction="row" spacing={1} mb={1.5}>
                          <Chip
                            size="small"
                            label={registration.status}
                            sx={{ bgcolor: "#F1F5F9", fontWeight: 600 }}
                          />

                          <Chip
                            size="small"
                            label={registration.paymentStatus}
                            sx={{
                              fontWeight: 600,
                              bgcolor:
                                registration.paymentStatus === "success"
                                  ? "#ECFDF5"
                                  : "#FFF7ED",
                              color:
                                registration.paymentStatus === "success"
                                  ? GREEN
                                  : "#C2410C",
                            }}
                          />
                        </Stack>

                        <Typography sx={{ fontWeight: 800, color: TEXT }}>
                          {formatCurrency(registration.amount)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyState
                  icon={<Assignment />}
                  text="No exam registrations yet."
                />
              )}
            </SectionCard>

            {/* LEARNING ACTIVITY */}
            <SectionCard title="Learning Activity">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics?.monthlyProgress}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GREEN} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: MUTED }} />
                  <YAxis tick={{ fontSize: 12, fill: MUTED }} />
                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={GREEN}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProgress)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>
          </Grid>

          {/* RIGHT COLUMN */}
          <Grid item xs={12} xl={4}>
            {/* RECENT QUIZ ATTEMPTS */}
            <SectionCard title="Recent Quiz Attempts" sx={{ mb: 4 }}>
              {recentQuizAttempts?.length > 0 ? (
                recentQuizAttempts.map((attempt, idx) => (
                  <Box key={attempt.id}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      py={1.5}
                    >
                      <Box minWidth={0}>
                        <Typography
                          sx={{ fontSize: 14.5, fontWeight: 700, color: TEXT }}
                          noWrap
                        >
                          {attempt.Quiz?.title}
                        </Typography>

                        <Typography sx={{ fontSize: 12, color: MUTED }}>
                          {formatDate(attempt.createdAt)}
                        </Typography>
                      </Box>

                      <Chip
                        label={`${attempt.score}%`}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          bgcolor: attempt.score >= 50 ? "#ECFDF5" : "#FEF2F2",
                          color: attempt.score >= 50 ? GREEN : "#DC2626",
                        }}
                      />
                    </Box>

                    {idx < recentQuizAttempts.length - 1 && <Divider />}
                  </Box>
                ))
              ) : (
                <EmptyState icon={<Quiz />} text="No quiz attempts yet." />
              )}
            </SectionCard>

            {/* UPCOMING SESSIONS */}
            <SectionCard title="Upcoming Sessions" sx={{ mb: 4 }}>
              {upcomingSessions?.length > 0 ? (
                <Stack spacing={2}>
                  {upcomingSessions.map((session) => (
                    <Paper
                      key={session.id}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 3, borderColor: BORDER }}
                    >
                      <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: TEXT }}>
                        {session.title}
                      </Typography>

                      <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                        <CalendarMonth sx={{ fontSize: 16, color: MUTED }} />
                        <Typography sx={{ fontSize: 13, color: MUTED }}>
                          {formatDate(session.scheduledAt)}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  icon={<CalendarMonth />}
                  text="No upcoming sessions scheduled."
                />
              )}
            </SectionCard>

            {/* ASSIGNED TUTORS */}
            <SectionCard title="Assigned Tutors" sx={{ mb: 4 }}>
              {assignedTutors?.length > 0 ? (
                <Stack spacing={2.5}>
                  {assignedTutors.map((item) => (
                    <Stack
                      key={item.id}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                    >
                      <Avatar
                        src={item.TutorProfile?.profilePicUrl}
                        sx={{ width: 44, height: 44, bgcolor: NAVY }}
                      >
                        {initials(item.TutorProfile?.fullName)}
                      </Avatar>

                      <Box minWidth={0}>
                        <Typography sx={{ fontWeight: 700, color: TEXT, fontSize: 14.5 }} noWrap>
                          {item.TutorProfile?.fullName}
                        </Typography>

                        <Typography sx={{ fontSize: 13, color: MUTED }} noWrap>
                          {item.Course?.title}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <EmptyState icon={<Inbox />} text="No tutors assigned yet." />
              )}
            </SectionCard>

            {/* RECOMMENDED COURSES */}
            <SectionCard title="Recommended Courses">
              {featuredCourses?.length > 0 ? (
                featuredCourses.map((course, idx) => (
                  <Box key={course.id}>
                    <Box py={2}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14.5, color: TEXT, mb: 0.25 }}>
                        {course.title}
                      </Typography>

                      <Typography sx={{ color: MUTED, fontSize: 13, mb: 1.5 }}>
                        {course.category}
                      </Typography>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ color: GREEN, fontWeight: 800 }}>
                          {formatCurrency(course.monthlyPrice)}
                        </Typography>

                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/courses/${course.id}`)}
                          sx={{
                            borderColor: NAVY,
                            color: NAVY,
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 2,
                            "&:hover": { borderColor: GREEN, color: GREEN },
                          }}
                        >
                          View
                        </Button>
                      </Box>
                    </Box>

                    {idx < featuredCourses.length - 1 && <Divider />}
                  </Box>
                ))
              ) : (
                <EmptyState icon={<MenuBook />} text="No recommendations yet." />
              )}
            </SectionCard>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default StudentDashboard;
