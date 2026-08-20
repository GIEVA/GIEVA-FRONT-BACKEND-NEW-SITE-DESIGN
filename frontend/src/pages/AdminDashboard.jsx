
// pages/AdminDashboard.jsx

import { useEffect, useState } from "react";
import {
  Box, Typography, CircularProgress, Grid, Paper,
  Stack, Chip, Divider, Avatar, LinearProgress,
} from "@mui/material";
import {
  People, School, Campaign, Payments, Email,
  Notifications, TrendingUp, Public, MenuBook,
  CheckCircle, LiveTv,
} from "@mui/icons-material";

import DashboardStatCard          from "../components/DashboardStatCard";
import TopCampaignsTable          from "../components/TopCampaignsTable";
import RecentCampaignRegistrations from "../components/RecentCampaignRegistrations";
import { getAdminDashboardSummary } from "../services/adminDashboardService";
import TimeSeriesChart from "../components/dashboard/TimeSeriesChart";
import StatusPieChart from "../components/dashboard/StatusPieChart";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS  (matching your existing pages)
// ─────────────────────────────────────────────────────────────
const NAVY   = "#0B1F3A";
const GREEN  = "#1E7F4F";
const GOLD   = "#D4A017";
const BG     = "#F7F9FC";
const CARD   = "#FFFFFF";
const BORDER = "#E6E9F0";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";

// ─────────────────────────────────────────────────────────────
// SECTION CARD — consistent header + body pattern
// ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, avatar, children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      border:        `1px solid ${BORDER}`,
      borderRadius:  4,
      bgcolor:       CARD,
      overflow:      "hidden",
      ...sx,
    }}
  >
    {title && (
      <Box
        sx={{
          px:           3,
          py:           2.5,
          display:      "flex",
          justifyContent: "space-between",
          alignItems:   "center",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 800, color: TEXT }}>
          {title}
        </Typography>
        {avatar}
      </Box>
    )}
    <Box sx={{ p: 3 }}>{children}</Box>
  </Paper>
);

// ─────────────────────────────────────────────────────────────
// METRIC ROW — label + value/chip in a row
// ─────────────────────────────────────────────────────────────
const MetricRow = ({ label, value, chipColor, isBold }) => (
  <Box
    sx={{
      display:        "flex",
      justifyContent: "space-between",
      alignItems:     "center",
      py:             1.25,
    }}
  >
    <Typography sx={{ fontSize: 14, color: isBold ? TEXT : MUTED }}>
      {label}
    </Typography>
    {chipColor ? (
      <Chip
        label={value ?? 0}
        size="small"
        sx={{
          fontWeight: 700,
          minWidth:   40,
          ...(chipColor === "success" && { bgcolor: "#ECFDF5", color: GREEN }),
          ...(chipColor === "warning" && { bgcolor: "#FFFBEB", color: "#B45309" }),
          ...(chipColor === "error"   && { bgcolor: "#FEF2F2", color: "#DC2626" }),
          ...(chipColor === "info"    && { bgcolor: "#EFF6FF", color: "#1D4ED8" }),
          ...(chipColor === "default" && { bgcolor: "#F1F5F9", color: MUTED }),
        }}
      />
    ) : (
      <Typography sx={{ fontSize: 14, fontWeight: isBold ? 800 : 700, color: TEXT }}>
        {value ?? 0}
      </Typography>
    )}
  </Box>
);

// ─────────────────────────────────────────────────────────────
// RATE BAR — label + percentage bar
// ─────────────────────────────────────────────────────────────
const RateBar = ({ label, value = 0, color = GREEN }) => (
  <Box sx={{ py: 0.75 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
      <Typography sx={{ fontSize: 13, color: MUTED }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{value}%</Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={Math.min(Number(value) || 0, 100)}
      sx={{
        height:       5,
        borderRadius: 20,
        bgcolor:      "#EEF2F7",
        "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 20 },
      }}
    />
  </Box>
);

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAdminDashboardSummary();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh" bgcolor={BG}>
        <CircularProgress sx={{ color: GREEN }} />
      </Box>
    );
  }

  const overview                  = data?.overview                  || {};
  const topCampaigns              = data?.topCampaigns              || [];
  const analytics = data?.analytics || {};
  const recentApplications        = data?.recentApplications        || [];
  const recentCampaignRegistrations = data?.recentCampaignRegistrations || [];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box
        sx={{
          maxWidth: 1400,
          mx:       "auto",
          px:       { xs: 2, sm: 3, md: 4, lg: 5 },
          py:       { xs: 3, md: 4 },
        }}
      >

        {/* ══════════════════════════════════════════════════════
            HERO BANNER
        ══════════════════════════════════════════════════════ */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 5,
            mb:           4,
            overflow:     "hidden",
            background:   "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
            color:        "#fff",
            p:            { xs: 3, md: 4 },
          }}
        >
          <Typography
            sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 800, lineHeight: 1.2 }}
          >
            Admin Dashboard
          </Typography>
          <Typography sx={{ opacity: 0.8, mt: 0.75, fontSize: 14 }}>
            Platform intelligence and operational analytics overview
          </Typography>
        </Paper>

        {/* ══════════════════════════════════════════════════════
            PRIMARY KPI GRID
            xs: 1 col → sm: 2 col → md: 3 col → lg: 6 col
            Using Grid (not CSS grid) so MUI spacing is consistent
        ══════════════════════════════════════════════════════ */}
        <Grid container spacing={2.5} mb={4}>
          {[
            { title: "Total Users",    value: overview.totalUsers               ?? 0, icon: <People />,        color: NAVY        },
            { title: "Courses",        value: overview.totalCourses             ?? 0, icon: <School />,        color: GREEN       },
            { title: "Campaigns",      value: overview.totalCampaigns           ?? 0, icon: <Campaign />,      color: "#ED6C02"   },
            { title: "Revenue",        value: `₦${(overview.totalRevenue ?? 0).toLocaleString()}`,
                                                                                      icon: <Payments />,      color: "#7C3AED"   },
            { title: "Messages",       value: overview.totalCampaignMessages    ?? 0, icon: <Email />,         color: "#D32F2F"   },
            { title: "Notifications",  value: overview.unreadNotifications      ?? 0, icon: <Notifications />, color: NAVY        },
            { title: "Consultations", value: overview.totalConsultations ?? 0, icon: <Public />, color: "#0EA5E9" },
            { title: "Contact Messages", value: overview.totalContactMessages ?? 0, icon: <Email />, color: "#DC2626" },
            { title: "Staff", value: overview.totalStaff ?? 0, icon: <People />, color: GOLD },
            ].map((card) => (
            <Grid item xs={6} sm={6} md={4} lg={2} key={card.title}>
              <DashboardStatCard {...card} />
            </Grid>
          ))}
        </Grid>

        {/* ══════════════════════════════════════════════════════
            HEALS + LMS ANALYTICS
        ══════════════════════════════════════════════════════ */}
        <Grid container spacing={3} mb={4} alignItems="flex-start">

          {/* HEALS */}
          <Grid item xs={12} lg={6}>
            <SectionCard
              title="HEALS Analytics"
              avatar={
                <Avatar sx={{ width: 36, height: 36, bgcolor: GREEN }}>
                  <Public sx={{ fontSize: 18 }} />
                </Avatar>
              }
            >
              <MetricRow label="Total Applications"   value={overview.totalApplications}   chipColor="default" />
              <Divider />
              <MetricRow label="Pending"              value={overview.pendingApplications}  chipColor="warning" />
              <Divider />
              <MetricRow label="Processing"           value={overview.processingApplications} chipColor="info"  />
              <Divider />
              <MetricRow label="Completed"            value={overview.completedApplications} chipColor="success" />
              <Divider sx={{ my: 1.5 }} />
              <RateBar label="Approval Rate"        value={overview.approvalRate}         color={GREEN}   />
              <RateBar label="Completion Rate"      value={overview.completionRate}       color={NAVY}    />
              <RateBar label="Payment Conversion"   value={overview.paymentConversionRate} color={GOLD}  />
            </SectionCard>
          </Grid>

          {/* ══════════════════════════════════════════════════════
              TIME-SERIES ANALYTICS
          ══════════════════════════════════════════════════════ */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <SectionCard title="New Users (Last 30 Days)">
                <TimeSeriesChart data={analytics.usersPerDay || []} color={NAVY} />
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard title="Successful Payments (Last 30 Days)">
                <TimeSeriesChart data={analytics.paymentsPerDay || []} color={GREEN} />
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard title="Exam Registrations (Last 30 Days)">
                <TimeSeriesChart data={analytics.examsPerDay || []} color={GOLD} />
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard title="Live Sessions Created (Last 30 Days)">
                <TimeSeriesChart data={analytics.sessionsPerDay || []} color="#7C3AED" />
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={3} mb={4}>
            <Grid item xs={12}>
              <SectionCard title="New Users — Last 6 Months">
                <TimeSeriesChart data={analytics.usersPerMonth || []} xKey="month" color={NAVY} />
              </SectionCard>
            </Grid>
          </Grid>

          {/* ══════════════════════════════════════════════════════
              STATUS BREAKDOWNS
          ══════════════════════════════════════════════════════ */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <SectionCard>
                <StatusPieChart title="Exam Status" data={analytics.examStatusPie || []} />
              </SectionCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SectionCard>
                <StatusPieChart title="HEALS Status" data={analytics.healsStatusPie || []} />
              </SectionCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SectionCard>
                <StatusPieChart title="Payment Status" data={analytics.paymentStatusPie || []} />
              </SectionCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SectionCard>
                <StatusPieChart title="Consultation Status" data={analytics.consultationStatusPie || []} />
              </SectionCard>
            </Grid>
          </Grid>

          {/* LMS */}
          <Grid item xs={12} lg={6}>
            <SectionCard
              title="LMS Analytics"
              avatar={
                <Avatar sx={{ width: 36, height: 36, bgcolor: NAVY }}>
                  <MenuBook sx={{ fontSize: 18 }} />
                </Avatar>
              }
            >
              <MetricRow label="Total Enrollments"   value={overview.totalEnrollments}   chipColor="default" />
              <Divider />
              <MetricRow label="Active Enrollments"  value={overview.activeEnrollments}  chipColor="success" />
              <Divider />
              <MetricRow label="Live Sessions"       value={overview.liveSessions}       chipColor="error"   />
              <Divider />
              <MetricRow label="Upcoming Sessions"   value={overview.upcomingSessions}   chipColor="info"    />
              <Divider sx={{ my: 1.5 }} />
              <MetricRow label="Attendance Records"  value={overview.totalAttendance}    isBold />
              <Divider />
              <MetricRow label="Published Courses"   value={overview.publishedCourses}   isBold />
            </SectionCard>
          </Grid>
        </Grid>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={6}>
            <SectionCard>
              <StatusPieChart title="Users by Role" data={analytics.userRoleAnalytics || []} />
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard title="Consultations">
              <MetricRow label="Pending" value={overview.pendingConsultations} chipColor="warning" />
              <Divider />
              <MetricRow label="Confirmed" value={overview.confirmedConsultations} chipColor="info" />
              <Divider />
              <MetricRow label="Completed" value={overview.completedConsultations} chipColor="success" />
              <Divider />
              <MetricRow label="Cancelled / No-show" value={(overview.cancelledConsultations ?? 0) + (overview.noShowConsultations ?? 0)} chipColor="error" />
            </SectionCard>
          </Grid>
        </Grid>

        {/* ══════════════════════════════════════════════════════
            PAYMENTS + CAMPAIGNS
        ══════════════════════════════════════════════════════ */}
        <Grid container spacing={3} mb={4} alignItems="flex-start">

          {/* PAYMENTS */}
          <Grid item xs={12} md={6} lg={4}>
            <SectionCard title="Payments">
              {/* Success rate bar at top */}
              <Box
                sx={{
                  p:            2,
                  mb:           2,
                  bgcolor:      "#F8FAFC",
                  borderRadius: 2.5,
                  textAlign:    "center",
                }}
              >
                <Typography sx={{ fontSize: 32, fontWeight: 800, color: GREEN, lineHeight: 1 }}>
                  {overview.overallPaymentSuccessRate ?? 0}%
                </Typography>
                <Typography sx={{ fontSize: 12, color: MUTED, mt: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Success Rate
                </Typography>
              </Box>

              <MetricRow label="Successful" value={overview.totalSuccessfulPayments} chipColor="success" />
              <Divider />
              <MetricRow label="Pending"    value={overview.totalPendingPayments}    chipColor="warning" />
              <Divider />
              <MetricRow label="Failed"     value={overview.totalFailedPayments}     chipColor="error"   />
            </SectionCard>
          </Grid>

          {/* CAMPAIGNS */}
          <Grid item xs={12} md={6} lg={8}>
            <TopCampaignsTable campaigns={topCampaigns} />
          </Grid>
        </Grid>

        {/* ══════════════════════════════════════════════════════
            RECENT ACTIVITY
        ══════════════════════════════════════════════════════ */}
        <Grid container spacing={3} alignItems="flex-start">

          {/* RECENT HEALS APPLICATIONS */}
          <Grid item xs={12} lg={6}>
            <SectionCard title="Recent HEALS Applications">
              {recentApplications.length === 0 ? (
                <Typography sx={{ color: MUTED, fontSize: 13.5, textAlign: "center", py: 3 }}>
                  No applications yet.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {recentApplications.map((app) => (
                    <Paper
                      key={app.id}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 3, borderColor: BORDER }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                        <Box minWidth={0}>
                          <Typography sx={{ fontWeight: 700, color: TEXT, fontSize: 14 }} noWrap>
                            {app.fullName}
                          </Typography>
                          <Typography sx={{ fontSize: 12.5, color: MUTED }}>
                            {app.desiredCountry}
                          </Typography>
                        </Box>
                        <Chip
                          label={app.status}
                          size="small"
                          sx={{
                            fontWeight:  700,
                            fontSize:    11,
                            flexShrink:  0,
                            bgcolor:     "#EFF6FF",
                            color:       "#1D4ED8",
                          }}
                        />
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </SectionCard>
          </Grid>

          {/* RECENT CAMPAIGN REGISTRATIONS */}
          <Grid item xs={12} lg={6}>
            <RecentCampaignRegistrations registrations={recentCampaignRegistrations} />
          </Grid>
        </Grid>

      </Box>
    </Box>
  );
};

export default AdminDashboard;

// import {
//   useEffect,
//   useState,
// } from "react";

// import {

//   Box,
//   Typography,
//   CircularProgress,
//   Grid,
//   Paper,
//   Stack,
//   Chip,
//   Divider,
//   Avatar,

// } from "@mui/material";

// import {

//   People,
//   School,
//   Campaign,
//   Payments,
//   Email,
//   Article,
//   Notifications,
//   TrendingUp,
//   Public,
//   MenuBook,
//   CheckCircle,
//   PendingActions,
//   LiveTv,

// } from "@mui/icons-material";

// import DashboardStatCard
// from "../components/DashboardStatCard";

// import TopCampaignsTable
// from "../components/TopCampaignsTable";

// import RecentCampaignRegistrations
// from "../components/RecentCampaignRegistrations";

// import {
//   getAdminDashboardSummary,
// } from "../services/adminDashboardService";



// const NAVY = "#0B1F3A";
// const GREEN = "#1E7F4F";
// const GOLD = "#D4A017";



// const AdminDashboard =
// () => {

//   const [data,
//     setData] =
//       useState(null);

//   const [loading,
//     setLoading] =
//       useState(true);



//   useEffect(() => {

//     const fetchDashboard =
//       async () => {

//         try {

//           const res =
//             await getAdminDashboardSummary();

//           setData(res);

//         } catch (error) {

//           console.error(error);

//         } finally {

//           setLoading(false);
//         }
//       };



//     fetchDashboard();

//   }, []);




//   if (loading) {

//     return (

//       <Box
//         display="flex"
//         justifyContent="center"
//         alignItems="center"
//         minHeight="70vh"
//       >

//         <CircularProgress />

//       </Box>
//     );
//   }




//   const overview =
//     data?.overview || {};

//   const analytics =
//     data?.analytics || {};

//   const topCampaigns =
//     data?.topCampaigns || [];

//   const recentApplications =
//     data?.recentApplications || [];

//   const recentCampaignRegistrations =
//     data?.recentCampaignRegistrations || [];




//   return (

//     <Box
//       sx={{
//         px: 3,
//         py: 4,
//         background: "#F8FAFC",
//         minHeight: "100vh",
//       }}
//     >

//       {/* ====================================================== */}
//       {/* HERO */}
//       {/* ====================================================== */}

//       <Paper
//         elevation={0}
//         sx={{
//           p: 4,
//           mb: 4,
//           borderRadius: 5,

//           background:
//             "linear-gradient(135deg, #0B1F3A, #1E7F4F)",

//           color: "#fff",
//         }}
//       >

//         <Typography
//           variant="h3"
//           fontWeight={800}
//         >
//           Admin Dashboard
//         </Typography>

//         <Typography
//           sx={{
//             opacity: 0.9,
//             mt: 1,
//           }}
//         >
//           Platform intelligence and operational analytics overview
//         </Typography>

//       </Paper>




//       {/* ====================================================== */}
//       {/* PRIMARY KPI GRID */}
//       {/* ====================================================== */}

//       <Box
//         sx={{
//           display: "grid",

//           gridTemplateColumns: {
//             xs: "1fr",
//             sm: "1fr 1fr",
//             md: "repeat(3, 1fr)",
//             xl: "repeat(6, 1fr)",
//           },

//           gap: 3,
//           mb: 5,
//         }}
//       >

//         <DashboardStatCard
//           title="Total Users"
//           value={overview.totalUsers || 0}
//           icon={<People />}
//         />

//         <DashboardStatCard
//           title="Courses"
//           value={overview.totalCourses || 0}
//           icon={<School />}
//           color={GREEN}
//         />

//         <DashboardStatCard
//           title="Campaigns"
//           value={overview.totalCampaigns || 0}
//           icon={<Campaign />}
//           color="#ED6C02"
//         />

//         <DashboardStatCard
//           title="Revenue"
//           value={`₦${overview.totalRevenue || 0}`}
//           icon={<Payments />}
//           color="#7C3AED"
//         />

//         <DashboardStatCard
//           title="Messages"
//           value={overview.totalCampaignMessages || 0}
//           icon={<Email />}
//           color="#D32F2F"
//         />

//         <DashboardStatCard
//           title="Notifications"
//           value={overview.unreadNotifications || 0}
//           icon={<Notifications />}
//           color={NAVY}
//         />

//       </Box>




//       {/* ====================================================== */}
//       {/* HEALS + LMS */}
//       {/* ====================================================== */}

//       <Grid
//         container
//         spacing={3}
//         mb={4}
//       >

//         {/* HEALS */}

//         <Grid
//           item
//           xs={12}
//           lg={6}
//         >

//           <Paper
//             elevation={0}
//             sx={{
//               p: 4,
//               borderRadius: 5,
//               height: "100%",
//             }}
//           >

//             <Stack
//               direction="row"
//               justifyContent="space-between"
//               mb={3}
//             >

//               <Typography
//                 variant="h5"
//                 fontWeight={800}
//               >
//                 HEALS Analytics
//               </Typography>

//               <Avatar
//                 sx={{
//                   bgcolor: GREEN,
//                 }}
//               >
//                 <Public />
//               </Avatar>

//             </Stack>



//             <Stack spacing={2}>

//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Total Applications
//                 </Typography>

//                 <Chip
//                   label={
//                     overview.totalApplications
//                   }
//                 />
//               </Stack>



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Pending Applications
//                 </Typography>

//                 <Chip
//                   color="warning"
//                   label={
//                     overview.pendingApplications
//                   }
//                 />
//               </Stack>



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Processing
//                 </Typography>

//                 <Chip
//                   color="info"
//                   label={
//                     overview.processingApplications
//                   }
//                 />
//               </Stack>



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Completed
//                 </Typography>

//                 <Chip
//                   color="success"
//                   label={
//                     overview.completedApplications
//                   }
//                 />
//               </Stack>



//               <Divider />



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Approval Rate
//                 </Typography>

//                 <Typography
//                   fontWeight={700}
//                 >
//                   {overview.approvalRate}%
//                 </Typography>
//               </Stack>



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Completion Rate
//                 </Typography>

//                 <Typography
//                   fontWeight={700}
//                 >
//                   {overview.completionRate}%
//                 </Typography>
//               </Stack>



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Payment Conversion
//                 </Typography>

//                 <Typography
//                   fontWeight={700}
//                 >
//                   {
//                     overview.paymentConversionRate
//                   }%
//                 </Typography>
//               </Stack>

//             </Stack>

//           </Paper>

//         </Grid>




//         {/* LMS */}

//         <Grid
//           item
//           xs={12}
//           lg={6}
//         >

//           <Paper
//             elevation={0}
//             sx={{
//               p: 4,
//               borderRadius: 5,
//               height: "100%",
//             }}
//           >

//             <Stack
//               direction="row"
//               justifyContent="space-between"
//               mb={3}
//             >

//               <Typography
//                 variant="h5"
//                 fontWeight={800}
//               >
//                 LMS Analytics
//               </Typography>

//               <Avatar
//                 sx={{
//                   bgcolor: NAVY,
//                 }}
//               >
//                 <MenuBook />
//               </Avatar>

//             </Stack>



//             <Stack spacing={2}>

//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Total Enrollments
//                 </Typography>

//                 <Chip
//                   label={
//                     overview.totalEnrollments
//                   }
//                 />
//               </Stack>



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Active Enrollments
//                 </Typography>

//                 <Chip
//                   color="success"
//                   label={
//                     overview.activeEnrollments
//                   }
//                 />
//               </Stack>



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Live Sessions
//                 </Typography>

//                 <Chip
//                   color="error"
//                   label={
//                     overview.liveSessions
//                   }
//                 />
//               </Stack>



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Upcoming Sessions
//                 </Typography>

//                 <Chip
//                   color="info"
//                   label={
//                     overview.upcomingSessions
//                   }
//                 />
//               </Stack>



//               <Divider />



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Attendance Records
//                 </Typography>

//                 <Typography
//                   fontWeight={700}
//                 >
//                   {
//                     overview.totalAttendance
//                   }
//                 </Typography>
//               </Stack>



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >
//                 <Typography>
//                   Published Courses
//                 </Typography>

//                 <Typography
//                   fontWeight={700}
//                 >
//                   {
//                     overview.publishedCourses
//                   }
//                 </Typography>
//               </Stack>

//             </Stack>

//           </Paper>

//         </Grid>

//       </Grid>




//       {/* ====================================================== */}
//       {/* PAYMENT + CAMPAIGNS */}
//       {/* ====================================================== */}

//       <Grid
//         container
//         spacing={3}
//         mb={4}
//       >

//         {/* PAYMENTS */}

//         <Grid
//           item
//           xs={12}
//           lg={4}
//         >

//           <Paper
//             elevation={0}
//             sx={{
//               p: 4,
//               borderRadius: 5,
//               height: "100%",
//             }}
//           >

//             <Typography
//               variant="h5"
//               fontWeight={800}
//               mb={3}
//             >
//               Payments
//             </Typography>

//             <Stack spacing={3}>

//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >

//                 <Typography>
//                   Success Rate
//                 </Typography>

//                 <Typography
//                   fontWeight={700}
//                 >
//                   {
//                     overview.overallPaymentSuccessRate
//                   }%
//                 </Typography>

//               </Stack>



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >

//                 <Typography>
//                   Successful
//                 </Typography>

//                 <Chip
//                   color="success"
//                   label={
//                     overview.totalSuccessfulPayments
//                   }
//                 />

//               </Stack>



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >

//                 <Typography>
//                   Pending
//                 </Typography>

//                 <Chip
//                   color="warning"
//                   label={
//                     overview.totalPendingPayments
//                   }
//                 />

//               </Stack>



//               <Stack
//                 direction="row"
//                 justifyContent="space-between"
//               >

//                 <Typography>
//                   Failed
//                 </Typography>

//                 <Chip
//                   color="error"
//                   label={
//                     overview.totalFailedPayments
//                   }
//                 />

//               </Stack>

//             </Stack>

//           </Paper>

//         </Grid>




//         {/* CAMPAIGNS */}

//         <Grid
//           item
//           xs={12}
//           lg={8}
//         >

//           <TopCampaignsTable
//             campaigns={topCampaigns}
//           />

//         </Grid>

//       </Grid>




//       {/* ====================================================== */}
//       {/* RECENT ACTIVITY */}
//       {/* ====================================================== */}

//       <Grid
//         container
//         spacing={3}
//       >

//         {/* RECENT APPLICATIONS */}

//         <Grid
//           item
//           xs={12}
//           lg={6}
//         >

//           <Paper
//             elevation={0}
//             sx={{
//               p: 4,
//               borderRadius: 5,
//               height: "100%",
//             }}
//           >

//             <Typography
//               variant="h5"
//               fontWeight={800}
//               mb={3}
//             >
//               Recent HEALS Applications
//             </Typography>

//             <Stack spacing={2}>

//               {recentApplications.map(
//                 (app) => (

//                   <Paper
//                     key={app.id}
//                     variant="outlined"
//                     sx={{
//                       p: 2,
//                       borderRadius: 3,
//                     }}
//                   >

//                     <Stack
//                       direction="row"
//                       justifyContent="space-between"
//                     >

//                       <Box>

//                         <Typography
//                           fontWeight={700}
//                         >
//                           {app.fullName}
//                         </Typography>

//                         <Typography
//                           variant="body2"
//                           color="text.secondary"
//                         >
//                           {app.desiredCountry}
//                         </Typography>

//                       </Box>



//                       <Chip
//                         label={app.status}
//                         color="primary"
//                       />

//                     </Stack>

//                   </Paper>
//                 )
//               )}

//             </Stack>

//           </Paper>

//         </Grid>




//         {/* RECENT CAMPAIGN REGISTRATIONS */}

//         <Grid
//           item
//           xs={12}
//           lg={6}
//         >

//           <RecentCampaignRegistrations
//             registrations={
//               recentCampaignRegistrations
//             }
//           />

//         </Grid>

//       </Grid>

//     </Box>
//   );
// };

// export default
// AdminDashboard;