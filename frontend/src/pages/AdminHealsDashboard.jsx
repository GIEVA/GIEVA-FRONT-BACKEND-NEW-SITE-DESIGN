import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Avatar,
} from "@mui/material";

import {
  People,
  Payments,
  Verified,
  PendingActions,
} from "@mui/icons-material";

import {
  useEffect,
  useState,
} from "react";

import {
  getAllHealsApplications,
} from "../services/healsAdminService";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";

export default function AdminHealsDashboard() {

  const [loading,
    setLoading] =
    useState(true);

  const [stats,
    setStats] =
    useState({
      total: 0,
      submitted: 0,
      approved: 0,
      processing: 0,
    });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData =
    async () => {

      try {

        const res =
          await getAllHealsApplications();

        const apps =
          res.applications || [];

        setStats({
          total: apps.length,

          submitted:
            apps.filter(
              a => a.status === "submitted"
            ).length,

          approved:
            apps.filter(
              a =>
                a.status === "approved_for_payment"
            ).length,

          processing:
            apps.filter(
              a =>
                a.status === "processing"
            ).length,
        });

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);
      }
    };

  const cards = [
    {
      title: "Total Applications",
      value: stats.total,
      icon: <People />,
      color: NAVY,
    },

    {
      title: "Submitted",
      value: stats.submitted,
      icon: <PendingActions />,
      color: GOLD,
    },

    {
      title: "Approved",
      value: stats.approved,
      icon: <Verified />,
      color: GREEN,
    },

    {
      title: "Processing",
      value: stats.processing,
      icon: <Payments />,
      color: "#7C3AED",
    },
  ];

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

  return (
    <Box p={4}>

      <Typography
        variant="h4"
        fontWeight={800}
        mb={4}
      >
        HEALS Dashboard
      </Typography>

      <Grid container spacing={3}>

        {cards.map((card) => (

          <Grid item xs={12} md={6} lg={3} key={card.title}>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: "1px solid #E5E7EB",
              }}
            >

              <Stack
                direction="row"
                justifyContent="space-between"
              >

                <Box>

                  <Typography
                    color="text.secondary"
                  >
                    {card.title}
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight={800}
                  >
                    {card.value}
                  </Typography>

                </Box>

                <Avatar
                  sx={{
                    bgcolor: card.color,
                  }}
                >
                  {card.icon}
                </Avatar>

              </Stack>

            </Paper>

          </Grid>
        ))}

      </Grid>

    </Box>
  );
}