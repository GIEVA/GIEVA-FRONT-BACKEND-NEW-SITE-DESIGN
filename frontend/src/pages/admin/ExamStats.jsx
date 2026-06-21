import {
  useEffect,
  useState,
} from "react";

import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";

import {
  School,
  Payments,
  CheckCircle,
  PendingActions,
  Cancel,
  Assignment,
} from "@mui/icons-material";

import {
  getExamStats,
} from "../../services/adminExamService";

function StatCard({
  title,
  value,
  icon,
}) {
  return (
    <Paper
      sx={{
        p: 3,
        height: "100%",
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Typography
            color="text.secondary"
          >
            {title}
          </Typography>

          <Typography
            variant="h4"
            fontWeight={700}
          >
            {value}
          </Typography>
        </Box>

        {icon}
      </Box>
    </Paper>
  );
}

export default function ExamStats() {

  const [stats, setStats] =
    useState(null);

  const [loading,
    setLoading] =
    useState(true);

  useEffect(() => {

    const loadStats =
      async () => {

        try {

          const data =
            await getExamStats();

          setStats(data);

        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

    loadStats();

  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        mt={10}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
  return (
    <Box p={4}>
      <Typography color="error">
        Failed to load statistics
      </Typography>
    </Box>
  );
}

  return (
    <Box p={4}>

      <Typography
        variant="h4"
        fontWeight={700}
        mb={4}
      >
        Exam Statistics
      </Typography>

      <Grid
        container
        spacing={3}
      >

        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Registrations"
            value={
              stats.totalRegistrations ||0
            }
            icon={<School />}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <StatCard
            title="Revenue"
            value={`₦${Number(
              stats.totalRevenue || 0
            ).toLocaleString()}`}
            icon={<Payments />}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <StatCard
            title="Successful Payments"
            value={
              stats.successfulPayments || 0
            }
            icon={<CheckCircle />}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            title="Submitted"
            value={
              stats.submitted || 0
            }
            icon={
              <Assignment />
            }
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            title="Under Review"
            value={
              stats.underReview || 0
            }
            icon={
              <PendingActions />
            }
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            title="Processing"
            value={
              stats.processing || 0
            }
            icon={
              <PendingActions />
            }
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            title="Completed"
            value={
              stats.completed || 0
            }
            icon={
              <CheckCircle />
            }
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            title="Rejected"
            value={
              stats.rejected || 0
            }
            icon={<Cancel />}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            title="Pending Payment"
            value={
              stats.pendingPayment || 0
            }
            icon={
              <PendingActions />
            }
          />
        </Grid>

      </Grid>

      {/* EXAM BREAKDOWN */}

      <Paper
        sx={{
          p: 4,
          mt: 4,
        }}
      >

        <Typography
          variant="h6"
          gutterBottom
        >
          Exam Breakdown
        </Typography>

        {stats.examBreakdown?.map(
          (exam) => (
            <Box
              key={
                exam.examType
              }
              display="flex"
              justifyContent="space-between"
              py={1}
            >
              <Typography>
                {
                  exam.examType
                }
              </Typography>

              <Typography
                fontWeight={700}
              >
                {
                  exam.count
                }
              </Typography>
            </Box>
          )
        )}

      </Paper>

    </Box>
  );
}