import CountUp from "react-countup";

import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Stack,
} from "@mui/material";

import SchoolIcon from "@mui/icons-material/School";
import PublicIcon from "@mui/icons-material/Public";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import GroupsIcon from "@mui/icons-material/Groups";

const stats = [
  {
    icon: <GroupsIcon fontSize="large" />,
    number: 12000,
    suffix: "+",
    title: "Students Guided",
  },
  {
    icon: <WorkspacePremiumIcon fontSize="large" />,
    number: 1800,
    suffix: "+",
    title: "Scholarships Secured",
  },
  {
    icon: <PublicIcon fontSize="large" />,
    number: 45,
    suffix: "+",
    title: "Countries Reached",
  },
  {
    icon: <SchoolIcon fontSize="large" />,
    number: 150,
    suffix: "+",
    title: "Partner Institutions",
  },
];

export default function StatsSection() {
  return (
    <Box
      sx={{
        py: {
          xs: 8,
          md: 12,
        },
        bgcolor: "primary.main",
      }}
    >
      <Container maxWidth="xl">
        <Typography
          variant="h3"
          align="center"
          fontWeight={800}
          color="white"
          mb={2}
        >
          Our Impact in Numbers
        </Typography>

        <Typography
          align="center"
          color="rgba(255,255,255,.8)"
          mb={7}
        >
          Empowering students and professionals around the world through
          education, innovation and opportunity.
        </Typography>

        <Grid container spacing={4}>
          {stats.map((item) => (
            <Grid
              item
              xs={12}
              sm={6}
              lg={3}
              key={item.title}
            >
              <Paper
                elevation={0}
                sx={{
                  height: "100%",
                  p: 4,
                  textAlign: "center",
                  borderRadius: 4,
                  bgcolor: "rgba(255,255,255,.08)",
                  backdropFilter: "blur(6px)",
                  color: "#fff",
                  transition: ".3s",

                  "&:hover": {
                    transform: "translateY(-8px)",
                    bgcolor: "rgba(255,255,255,.14)",
                  },
                }}
              >
                <Stack
                  spacing={2}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      bgcolor: "rgba(255,255,255,.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </Box>

                  <Typography
                    variant="h3"
                    fontWeight={800}
                  >
                    <CountUp
                      end={item.number}
                      duration={2.5}
                      separator=","
                    />
                    {item.suffix}
                  </Typography>

                  <Typography
                    sx={{
                      color: "rgba(255,255,255,.85)",
                    }}
                  >
                    {item.title}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}