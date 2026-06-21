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
  Stack,
} from "@mui/material";

import {
  Article,
  PendingActions,
  FactCheck,
  Settings,
  CheckCircle,
  Cancel,
  Payments,
} from "@mui/icons-material";

import DashboardStatCard from "../../components/DashboardStatCard";

import {
  getExamStats,
} from "../../services/adminExamService";

const ExamDashboard = () => {
  const [stats, setStats] =
    useState(null);

  const [loading, setLoading] =
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
        alignItems="center"
        minHeight="70vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 4,
        background: "#F8FAFC",
        minHeight: "100vh",
      }}
    >
      {/* HERO */}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          background:
            "linear-gradient(135deg,#0B1F3A,#1E7F4F)",
          color: "#fff",
        }}
      >
        <Typography
          variant="h4"
          fontWeight={800}
        >
          Exam Services Dashboard
        </Typography>

        <Typography
          sx={{
            mt: 1,
            opacity: 0.9,
          }}
        >
          SAT, IELTS, TOEFL, GRE,
          ACT and SEVIS application
          analytics.
        </Typography>
      </Paper>

      {/* KPI CARDS */}

      <Grid
        container
        spacing={3}
        mb={4}
      >
        <Grid item xs={12} md={4}>
          <DashboardStatCard
            title="Total Registrations"
            value={
              stats?.total || 0
            }
            icon={<Article />}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <DashboardStatCard
            title="Submitted"
            value={
              stats?.submitted || 0
            }
            icon={
              <PendingActions />
            }
            color="#ED6C02"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <DashboardStatCard
            title="Under Review"
            value={
              stats?.underReview || 0
            }
            icon={<FactCheck />}
            color="#0288D1"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <DashboardStatCard
            title="Processing"
            value={
              stats?.processing || 0
            }
            icon={<Settings />}
            color="#7B1FA2"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <DashboardStatCard
            title="Completed"
            value={
              stats?.completed || 0
            }
            icon={
              <CheckCircle />
            }
            color="#2E7D32"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <DashboardStatCard
            title="Rejected"
            value={
              stats?.rejected || 0
            }
            icon={<Cancel />}
            color="#D32F2F"
          />
        </Grid>
      </Grid>

      {/* REVENUE */}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography
              variant="h6"
              color="text.secondary"
            >
              Total Revenue
            </Typography>

            <Typography
              variant="h3"
              fontWeight={800}
              color="success.main"
            >
              ₦
              {Number(
                stats?.totalRevenue || 0
              ).toLocaleString()}
            </Typography>
          </Box>

          <Payments
            sx={{
              fontSize: 60,
              color:
                "success.main",
            }}
          />
        </Stack>
      </Paper>

      {/* APPLICATION PIPELINE */}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          mt: 4,
          borderRadius: 4,
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
        >
          Registration Pipeline
        </Typography>

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={3}
          mt={2}
        >
          <PipelineCard
            title="Submitted"
            value={
              stats?.submitted || 0
            }
            color="#ED6C02"
          />

          <PipelineCard
            title="Under Review"
            value={
              stats?.underReview || 0
            }
            color="#0288D1"
          />

          <PipelineCard
            title="Processing"
            value={
              stats?.processing || 0
            }
            color="#7B1FA2"
          />

          <PipelineCard
            title="Completed"
            value={
              stats?.completed || 0
            }
            color="#2E7D32"
          />
        </Stack>
      </Paper>
    </Box>
  );
};

function PipelineCard({
  title,
  value,
  color,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        p: 3,
        textAlign: "center",
        borderTop: `5px solid ${color}`,
      }}
    >
      <Typography
        color="text.secondary"
      >
        {title}
      </Typography>

      <Typography
        variant="h4"
        fontWeight={800}
      >
        {value}
      </Typography>
    </Paper>
  );
}

export default ExamDashboard;