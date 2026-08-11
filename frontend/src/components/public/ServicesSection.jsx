import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import {
  School,
  WorkspacePremium,
  FlightTakeoff,
  Assignment,
  Psychology,
  MenuBook,
  ArrowForward,
} from "@mui/icons-material";

import { Link } from "react-router-dom";

const services = [
  {
    title: "Study Abroad",
    description:
      "Receive end-to-end admission support for universities across the globe.",
    icon: <School fontSize="large" />,
  },
  {
    title: "Scholarship Support",
    description:
      "Discover fully funded and partial scholarships with expert application guidance.",
    icon: <WorkspacePremium fontSize="large" />,
  },
  {
    title: "Visa Assistance",
    description:
      "Professional visa guidance and documentation support for international travel.",
    icon: <FlightTakeoff fontSize="large" />,
  },
  {
    title: "Test Registration",
    description:
      "Register for IELTS, TOEFL, SAT, GRE, GMAT, Duolingo, PTE and more.",
    icon: <Assignment fontSize="large" />,
  },
  {
    title: "Career Development",
    description:
      "Career counselling, CV review, mentorship and professional development.",
    icon: <Psychology fontSize="large" />,
  },
  {
    title: "HEALS Programme",
    description:
      "Educational outreach, leadership development and community empowerment initiatives.",
    icon: <MenuBook fontSize="large" />,
  },
];

export default function ServicesSection() {
  return (
    <Box
      sx={{
        py: {
          xs: 8,
          md: 12,
        },
        bgcolor: "#fff",
      }}
    >
      <Container maxWidth="xl">
        {/* Heading */}

        <Stack
          spacing={2}
          alignItems="center"
          mb={7}
        >
          <Typography
            color="primary"
            fontWeight={700}
            letterSpacing={2}
          >
            OUR SERVICES
          </Typography>

          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
          >
            Helping You Reach Your Academic &
            Professional Goals
          </Typography>

          <Typography
            color="text.secondary"
            maxWidth={700}
            textAlign="center"
          >
            We provide comprehensive educational consulting,
            scholarship assistance, international admissions,
            career development and professional testing services
            tailored to your aspirations.
          </Typography>
        </Stack>

        {/* Cards */}

        <Grid container spacing={4}>
          {services.map((service) => (
            <Grid
              item
              xs={12}
              md={6}
              lg={4}
              key={service.title}
            >
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  p: 2,
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: "grey.200",
                  transition: ".3s",

                  "&:hover": {
                    transform: "translateY(-10px)",
                    boxShadow: 8,
                    borderColor: "primary.main",
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: 3,
                      bgcolor: "primary.main",
                      color: "#fff",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    {service.icon}
                  </Box>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                    gutterBottom
                  >
                    {service.title}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.8,
                      mb: 4,
                    }}
                  >
                    {service.description}
                  </Typography>

                  <Button
                    component={Link}
                    to="/services"
                    endIcon={<ArrowForward />}
                    sx={{
                      textTransform: "none",
                      p: 0,

                      "&:hover": {
                        bgcolor: "transparent",
                      },
                    }}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Bottom CTA */}

        <Stack
          alignItems="center"
          mt={8}
        >
          <Button
            component={Link}
            to="/services"
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            sx={{
              px: 5,
              py: 1.5,
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            View All Services
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}