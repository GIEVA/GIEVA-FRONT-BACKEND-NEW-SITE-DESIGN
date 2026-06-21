import {
  useEffect,
  useState,
} from "react";

import {

  Box,
  Typography,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Chip,
  Divider,
  Avatar,

} from "@mui/material";

import {

  People,
  School,
  Campaign,
  Payments,
  Email,
  Article,
  Notifications,
  TrendingUp,
  Public,
  MenuBook,
  CheckCircle,
  PendingActions,
  LiveTv,

} from "@mui/icons-material";

import DashboardStatCard
from "../components/DashboardStatCard";

import TopCampaignsTable
from "../components/TopCampaignsTable";

import RecentCampaignRegistrations
from "../components/RecentCampaignRegistrations";

import {
  getAdminDashboardSummary,
} from "../services/adminDashboardService";



const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";



const AdminDashboard =
() => {

  const [data,
    setData] =
      useState(null);

  const [loading,
    setLoading] =
      useState(true);



  useEffect(() => {

    const fetchDashboard =
      async () => {

        try {

          const res =
            await getAdminDashboardSummary();

          setData(res);

        } catch (error) {

          console.error(error);

        } finally {

          setLoading(false);
        }
      };



    fetchDashboard();

  }, []);




  if (loading) {

    return (

      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="70vh"
      >

        <CircularProgress />

      </Box>
    );
  }




  const overview =
    data?.overview || {};

  const analytics =
    data?.analytics || {};

  const topCampaigns =
    data?.topCampaigns || [];

  const recentApplications =
    data?.recentApplications || [];

  const recentCampaignRegistrations =
    data?.recentCampaignRegistrations || [];




  return (

    <Box
      sx={{
        px: 3,
        py: 4,
        background: "#F8FAFC",
        minHeight: "100vh",
      }}
    >

      {/* ====================================================== */}
      {/* HERO */}
      {/* ====================================================== */}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 5,

          background:
            "linear-gradient(135deg, #0B1F3A, #1E7F4F)",

          color: "#fff",
        }}
      >

        <Typography
          variant="h3"
          fontWeight={800}
        >
          Admin Dashboard
        </Typography>

        <Typography
          sx={{
            opacity: 0.9,
            mt: 1,
          }}
        >
          Platform intelligence and operational analytics overview
        </Typography>

      </Paper>




      {/* ====================================================== */}
      {/* PRIMARY KPI GRID */}
      {/* ====================================================== */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(3, 1fr)",
            xl: "repeat(6, 1fr)",
          },

          gap: 3,
          mb: 5,
        }}
      >

        <DashboardStatCard
          title="Total Users"
          value={overview.totalUsers || 0}
          icon={<People />}
        />

        <DashboardStatCard
          title="Courses"
          value={overview.totalCourses || 0}
          icon={<School />}
          color={GREEN}
        />

        <DashboardStatCard
          title="Campaigns"
          value={overview.totalCampaigns || 0}
          icon={<Campaign />}
          color="#ED6C02"
        />

        <DashboardStatCard
          title="Revenue"
          value={`₦${overview.totalRevenue || 0}`}
          icon={<Payments />}
          color="#7C3AED"
        />

        <DashboardStatCard
          title="Messages"
          value={overview.totalCampaignMessages || 0}
          icon={<Email />}
          color="#D32F2F"
        />

        <DashboardStatCard
          title="Notifications"
          value={overview.unreadNotifications || 0}
          icon={<Notifications />}
          color={NAVY}
        />

      </Box>




      {/* ====================================================== */}
      {/* HEALS + LMS */}
      {/* ====================================================== */}

      <Grid
        container
        spacing={3}
        mb={4}
      >

        {/* HEALS */}

        <Grid
          item
          xs={12}
          lg={6}
        >

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 5,
              height: "100%",
            }}
          >

            <Stack
              direction="row"
              justifyContent="space-between"
              mb={3}
            >

              <Typography
                variant="h5"
                fontWeight={800}
              >
                HEALS Analytics
              </Typography>

              <Avatar
                sx={{
                  bgcolor: GREEN,
                }}
              >
                <Public />
              </Avatar>

            </Stack>



            <Stack spacing={2}>

              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Total Applications
                </Typography>

                <Chip
                  label={
                    overview.totalApplications
                  }
                />
              </Stack>



              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Pending Applications
                </Typography>

                <Chip
                  color="warning"
                  label={
                    overview.pendingApplications
                  }
                />
              </Stack>



              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Processing
                </Typography>

                <Chip
                  color="info"
                  label={
                    overview.processingApplications
                  }
                />
              </Stack>



              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Completed
                </Typography>

                <Chip
                  color="success"
                  label={
                    overview.completedApplications
                  }
                />
              </Stack>



              <Divider />



              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Approval Rate
                </Typography>

                <Typography
                  fontWeight={700}
                >
                  {overview.approvalRate}%
                </Typography>
              </Stack>



              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Completion Rate
                </Typography>

                <Typography
                  fontWeight={700}
                >
                  {overview.completionRate}%
                </Typography>
              </Stack>



              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Payment Conversion
                </Typography>

                <Typography
                  fontWeight={700}
                >
                  {
                    overview.paymentConversionRate
                  }%
                </Typography>
              </Stack>

            </Stack>

          </Paper>

        </Grid>




        {/* LMS */}

        <Grid
          item
          xs={12}
          lg={6}
        >

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 5,
              height: "100%",
            }}
          >

            <Stack
              direction="row"
              justifyContent="space-between"
              mb={3}
            >

              <Typography
                variant="h5"
                fontWeight={800}
              >
                LMS Analytics
              </Typography>

              <Avatar
                sx={{
                  bgcolor: NAVY,
                }}
              >
                <MenuBook />
              </Avatar>

            </Stack>



            <Stack spacing={2}>

              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Total Enrollments
                </Typography>

                <Chip
                  label={
                    overview.totalEnrollments
                  }
                />
              </Stack>



              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Active Enrollments
                </Typography>

                <Chip
                  color="success"
                  label={
                    overview.activeEnrollments
                  }
                />
              </Stack>



              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Live Sessions
                </Typography>

                <Chip
                  color="error"
                  label={
                    overview.liveSessions
                  }
                />
              </Stack>



              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Upcoming Sessions
                </Typography>

                <Chip
                  color="info"
                  label={
                    overview.upcomingSessions
                  }
                />
              </Stack>



              <Divider />



              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Attendance Records
                </Typography>

                <Typography
                  fontWeight={700}
                >
                  {
                    overview.totalAttendance
                  }
                </Typography>
              </Stack>



              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Published Courses
                </Typography>

                <Typography
                  fontWeight={700}
                >
                  {
                    overview.publishedCourses
                  }
                </Typography>
              </Stack>

            </Stack>

          </Paper>

        </Grid>

      </Grid>




      {/* ====================================================== */}
      {/* PAYMENT + CAMPAIGNS */}
      {/* ====================================================== */}

      <Grid
        container
        spacing={3}
        mb={4}
      >

        {/* PAYMENTS */}

        <Grid
          item
          xs={12}
          lg={4}
        >

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 5,
              height: "100%",
            }}
          >

            <Typography
              variant="h5"
              fontWeight={800}
              mb={3}
            >
              Payments
            </Typography>

            <Stack spacing={3}>

              <Stack
                direction="row"
                justifyContent="space-between"
              >

                <Typography>
                  Success Rate
                </Typography>

                <Typography
                  fontWeight={700}
                >
                  {
                    overview.overallPaymentSuccessRate
                  }%
                </Typography>

              </Stack>



              <Stack
                direction="row"
                justifyContent="space-between"
              >

                <Typography>
                  Successful
                </Typography>

                <Chip
                  color="success"
                  label={
                    overview.totalSuccessfulPayments
                  }
                />

              </Stack>



              <Stack
                direction="row"
                justifyContent="space-between"
              >

                <Typography>
                  Pending
                </Typography>

                <Chip
                  color="warning"
                  label={
                    overview.totalPendingPayments
                  }
                />

              </Stack>



              <Stack
                direction="row"
                justifyContent="space-between"
              >

                <Typography>
                  Failed
                </Typography>

                <Chip
                  color="error"
                  label={
                    overview.totalFailedPayments
                  }
                />

              </Stack>

            </Stack>

          </Paper>

        </Grid>




        {/* CAMPAIGNS */}

        <Grid
          item
          xs={12}
          lg={8}
        >

          <TopCampaignsTable
            campaigns={topCampaigns}
          />

        </Grid>

      </Grid>




      {/* ====================================================== */}
      {/* RECENT ACTIVITY */}
      {/* ====================================================== */}

      <Grid
        container
        spacing={3}
      >

        {/* RECENT APPLICATIONS */}

        <Grid
          item
          xs={12}
          lg={6}
        >

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 5,
              height: "100%",
            }}
          >

            <Typography
              variant="h5"
              fontWeight={800}
              mb={3}
            >
              Recent HEALS Applications
            </Typography>

            <Stack spacing={2}>

              {recentApplications.map(
                (app) => (

                  <Paper
                    key={app.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 3,
                    }}
                  >

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                    >

                      <Box>

                        <Typography
                          fontWeight={700}
                        >
                          {app.fullName}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {app.desiredCountry}
                        </Typography>

                      </Box>



                      <Chip
                        label={app.status}
                        color="primary"
                      />

                    </Stack>

                  </Paper>
                )
              )}

            </Stack>

          </Paper>

        </Grid>




        {/* RECENT CAMPAIGN REGISTRATIONS */}

        <Grid
          item
          xs={12}
          lg={6}
        >

          <RecentCampaignRegistrations
            registrations={
              recentCampaignRegistrations
            }
          />

        </Grid>

      </Grid>

    </Box>
  );
};

export default
AdminDashboard;