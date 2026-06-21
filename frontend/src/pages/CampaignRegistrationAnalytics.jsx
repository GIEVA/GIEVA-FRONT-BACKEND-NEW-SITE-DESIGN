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

  Group,
  TrendingUp,
  AccessTime,

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

  getRegistrationAnalytics,

} from "../services/adminCampaignRegistrationService";



const COLORS = [

  "#1976d2",
  "#2e7d32",
  "#ed6c02",
  "#9c27b0",
  "#d32f2f",
];



const CampaignRegistrationAnalytics =
() => {

  const { id } =
    useParams();



  const [analytics,
    setAnalytics] =
      useState(null);

  const [loading,
    setLoading] =
      useState(true);



  // ======================================================
  // FETCH
  // ======================================================

  const fetchAnalytics =
    async () => {

      try {

        const data =
          await getRegistrationAnalytics({

            campaignId: id,
          });



        setAnalytics(data);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    };



  useEffect(() => {

    fetchAnalytics();

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
  // PIE DATA
  // ======================================================

  const pieData = [

    {
      name: "Under 18",
      value:
        analytics.demographics
          .under18,
    },

    {
      name: "18 - 24",
      value:
        analytics.demographics
          .between18And24,
    },

    {
      name: "25 - 34",
      value:
        analytics.demographics
          .between25And34,
    },

    {
      name: "35 - 44",
      value:
        analytics.demographics
          .between35And44,
    },

    {
      name: "45+",
      value:
        analytics.demographics
          .above45,
    },
  ];



  return (

    <Box p={3}>

      {/* HEADER */}

      <Box mb={4}>

        <Typography
          variant="h4"
          fontWeight="bold"
        >

          Registration Analytics

        </Typography>



        <Typography
          color="text.secondary"
        >

          Advanced registration
          intelligence dashboard

        </Typography>

      </Box>



      {/* KPI */}

      <Grid
        container
        spacing={3}
        mb={4}
      >

        <Grid
          item
          xs={12}
          md={4}
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

                <Group />

              </Avatar>



              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >

                  {

                    analytics.totalRegistrations
                  }

                </Typography>



                <Typography>

                  Total Registrations

                </Typography>

              </Box>

            </Stack>

          </Paper>

        </Grid>

      </Grid>



      {/* CHARTS */}

      <Grid
        container
        spacing={3}
      >

        {/* DAILY */}

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

              Daily Registration Trend

            </Typography>



            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={
                  analytics.dailyTrend
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="date"
                />

                <YAxis />

                <Tooltip />



                <Line

                  type="monotone"

                  dataKey="total"

                  stroke="#1976d2"

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

              Age Demographics

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



        {/* HOURLY */}

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

              Hourly Registrations

            </Typography>



            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  analytics.hourlyTrend
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="hour"
                />

                <YAxis />

                <Tooltip />



                <Bar

                  dataKey="total"

                  fill="#2e7d32"
                />

              </BarChart>

            </ResponsiveContainer>

          </Paper>

        </Grid>

      </Grid>

    </Box>
  );
};

export default
CampaignRegistrationAnalytics;