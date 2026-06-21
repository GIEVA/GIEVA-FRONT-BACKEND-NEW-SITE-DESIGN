import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {

  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Stack,
  Avatar,

} from "@mui/material";

import {

  Visibility,
  Mouse,
  Group,
  TrendingUp,

} from "@mui/icons-material";

import {

  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,

} from "recharts";

import {
  getCampaign,
} from "../services/campaignService";



const COLORS = [
  "#1976d2",
  "#2e7d32",
  "#ed6c02",
  "#9c27b0",
];



const CampaignAnalytics =
() => {

  const { id } =
    useParams();



  const [campaign,
    setCampaign] =
      useState(null);

  const [loading,
    setLoading] =
      useState(true);



  // ======================================================
  // FETCH
  // ======================================================

  const fetchCampaign =
    async () => {

      try {

        const data =
          await getCampaign(id);

        setCampaign(data);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    };



  useEffect(() => {

    fetchCampaign();

  }, [id]);



  if (loading) {

    return (

      <Box
        textAlign="center"
        mt={10}
      >

        <CircularProgress />

      </Box>
    );
  }



  // ======================================================
  // METRICS
  // ======================================================

  const views =
    campaign.views || 0;

  const clicks =
    campaign.clicks || 0;

  const registrations =
    campaign.registrationCount || 0;



  const conversionRate =

    views > 0

      ? (
          (
            registrations /
            views
          ) * 100
        ).toFixed(2)

      : 0;



  const clickRate =

    views > 0

      ? (
          (
            clicks /
            views
          ) * 100
        ).toFixed(2)

      : 0;



  // ======================================================
  // MOCK TREND DATA
  // ======================================================

  const trendData = [

    {
      day: "Mon",
      views: 120,
      clicks: 40,
      registrations: 12,
    },

    {
      day: "Tue",
      views: 240,
      clicks: 80,
      registrations: 28,
    },

    {
      day: "Wed",
      views: 380,
      clicks: 120,
      registrations: 40,
    },

    {
      day: "Thu",
      views: 420,
      clicks: 160,
      registrations: 55,
    },

    {
      day: "Fri",
      views: 500,
      clicks: 220,
      registrations: 70,
    },

    {
      day: "Sat",
      views: 620,
      clicks: 300,
      registrations: 95,
    },

    {
      day: "Sun",
      views: views,
      clicks: clicks,
      registrations: registrations,
    },
  ];



  // ======================================================
  // PIE
  // ======================================================

  const pieData = [

    {
      name: "Views",
      value: views,
    },

    {
      name: "Clicks",
      value: clicks,
    },

    {
      name: "Registrations",
      value: registrations,
    },
  ];



  return (

    <Box p={3}>

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <Box mb={4}>

        <Typography
          variant="h4"
          fontWeight="bold"
        >

          Campaign Analytics

        </Typography>



        <Typography
          color="text.secondary"
        >

          Performance insights,
          engagement metrics and
          conversion tracking.

        </Typography>

      </Box>



      {/* ====================================================== */}
      {/* KPI CARDS */}
      {/* ====================================================== */}

      <Grid
        container
        spacing={3}
        mb={4}
      >

        {/* VIEWS */}

        <Grid
          item
          xs={12}
          md={3}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >

              <Avatar
                sx={{
                  bgcolor:
                    "#1976d2",
                }}
              >

                <Visibility />

              </Avatar>



              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >

                  {views}

                </Typography>



                <Typography
                  color="text.secondary"
                >

                  Total Views

                </Typography>

              </Box>

            </Stack>

          </Paper>

        </Grid>



        {/* CLICKS */}

        <Grid
          item
          xs={12}
          md={3}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >

              <Avatar
                sx={{
                  bgcolor:
                    "#9c27b0",
                }}
              >

                <Mouse />

              </Avatar>



              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >

                  {clicks}

                </Typography>



                <Typography
                  color="text.secondary"
                >

                  Total Clicks

                </Typography>

              </Box>

            </Stack>

          </Paper>

        </Grid>



        {/* REGISTRATIONS */}

        <Grid
          item
          xs={12}
          md={3}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >

              <Avatar
                sx={{
                  bgcolor:
                    "#2e7d32",
                }}
              >

                <Group />

              </Avatar>



              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >

                  {registrations}

                </Typography>



                <Typography
                  color="text.secondary"
                >

                  Registrations

                </Typography>

              </Box>

            </Stack>

          </Paper>

        </Grid>



        {/* CONVERSION */}

        <Grid
          item
          xs={12}
          md={3}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >

              <Avatar
                sx={{
                  bgcolor:
                    "#ed6c02",
                }}
              >

                <TrendingUp />

              </Avatar>



              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >

                  {conversionRate}%

                </Typography>



                <Typography
                  color="text.secondary"
                >

                  Conversion Rate

                </Typography>

              </Box>

            </Stack>

          </Paper>

        </Grid>

      </Grid>



      {/* ====================================================== */}
      {/* CHARTS */}
      {/* ====================================================== */}

      <Grid
        container
        spacing={3}
      >

        {/* LINE CHART */}

        <Grid
          item
          xs={12}
          lg={8}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              height: 450,
            }}
          >

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={3}
            >

              Engagement Trends

            </Typography>



            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={trendData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="day"
                />

                <YAxis />

                <Tooltip />



                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#1976d2"
                  strokeWidth={3}
                />



                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#9c27b0"
                  strokeWidth={3}
                />



                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="#2e7d32"
                  strokeWidth={3}
                />

              </LineChart>

            </ResponsiveContainer>

          </Paper>

        </Grid>



        {/* PIE */}

        <Grid
          item
          xs={12}
          lg={4}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              height: 450,
            }}
          >

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={3}
            >

              Traffic Distribution

            </Typography>



            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie

                  data={pieData}

                  dataKey="value"

                  outerRadius={120}

                  label
                >

                  {pieData.map(
                    (
                      entry,
                      index
                    ) => (

                      <Cell

                        key={index}

                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

          </Paper>

        </Grid>



        {/* BAR CHART */}

        <Grid
          item
          xs={12}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              height: 450,
            }}
          >

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={3}
            >

              Weekly Performance

            </Typography>



            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={trendData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="day"
                />

                <YAxis />

                <Tooltip />



                <Bar
                  dataKey="views"
                  fill="#1976d2"
                />



                <Bar
                  dataKey="clicks"
                  fill="#9c27b0"
                />



                <Bar
                  dataKey="registrations"
                  fill="#2e7d32"
                />

              </BarChart>

            </ResponsiveContainer>

          </Paper>

        </Grid>

      </Grid>



      {/* ====================================================== */}
      {/* EXTRA METRICS */}
      {/* ====================================================== */}

      <Grid
        container
        spacing={3}
        mt={1}
      >

        <Grid
          item
          xs={12}
          md={6}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={2}
            >

              Engagement Metrics

            </Typography>



            <Typography mb={1}>

              Click-through Rate:
              {" "}
              <strong>
                {clickRate}%
              </strong>

            </Typography>



            <Typography mb={1}>

              Conversion Rate:
              {" "}
              <strong>
                {conversionRate}%
              </strong>

            </Typography>



            <Typography>

              Average Engagement:
              {" "}
              <strong>

                {(
                  (
                    clicks +
                    registrations
                  ) /
                  (
                    views || 1
                  )
                ).toFixed(2)}

              </strong>

            </Typography>

          </Paper>

        </Grid>



        <Grid
          item
          xs={12}
          md={6}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={2}
            >

              Campaign Summary

            </Typography>



            <Typography mb={1}>

              Status:
              {" "}
              <strong>
                {campaign.status}
              </strong>

            </Typography>



            <Typography mb={1}>

              Type:
              {" "}
              <strong>
                {campaign.type}
              </strong>

            </Typography>



            <Typography mb={1}>

              Featured:
              {" "}
              <strong>

                {campaign.featured
                  ? "Yes"
                  : "No"}

              </strong>

            </Typography>



            <Typography>

              Registration Required:
              {" "}
              <strong>

                {campaign.requiresRegistration
                  ? "Yes"
                  : "No"}

              </strong>

            </Typography>

          </Paper>

        </Grid>

      </Grid>

    </Box>
  );
};

export default CampaignAnalytics;