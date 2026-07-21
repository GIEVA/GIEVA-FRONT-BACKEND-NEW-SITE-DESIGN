import {
  Box,
  Container,
  Grid,
  Typography,
  Stack,
  Button,
  Paper,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { Link } from "react-router-dom";

// Replace with your image
import aboutImage from "../../assets/images/about/about-home.jpg";

const features = [
  "Global Study Opportunities",
  "International Scholarship Guidance",
  "Career Development & Mentorship",
  "Professional Test Registration",
  "Admission Processing",
  "Visa & Travel Support",
];

export default function AboutSection() {
  return (
    <Box
      sx={{
        py: {
          xs: 8,
          md: 12,
        },
        bgcolor: "#F8FAFC",
      }}
    >
      <Container maxWidth="xl">
        <Grid
          container
          spacing={8}
          alignItems="center"
        >
          {/* Image */}

          <Grid
            item
            xs={12}
            lg={6}
          >
            <Box
              sx={{
                position: "relative",
              }}
            >
              <Box
                component="img"
                src={aboutImage}
                alt="About GIEVA"
                sx={{
                  width: "100%",
                  borderRadius: 4,
                  display: "block",
                }}
              />

              {/* Floating Card */}

              <Paper
                elevation={8}
                sx={{
                  position: "absolute",
                  bottom: 30,
                  right: 30,
                  p: 3,
                  borderRadius: 3,
                  minWidth: 220,
                }}
              >
                <Typography
                  variant="h3"
                  fontWeight={800}
                  color="primary"
                >
                  10+
                </Typography>

                <Typography color="text.secondary">
                  Years of Educational Excellence
                </Typography>
              </Paper>
            </Box>
          </Grid>

          {/* Content */}

          <Grid
            item
            xs={12}
            lg={6}
          >
            <Typography
              color="primary"
              fontWeight={700}
              sx={{
                mb: 2,
                letterSpacing: 2,
              }}
            >
              WHO WE ARE
            </Typography>

            <Typography
              variant="h3"
              fontWeight={800}
              sx={{
                mb: 3,
              }}
            >
              Transforming Lives Through Education
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                lineHeight: 1.9,
                mb: 4,
              }}
            >
              GIEVA is committed to empowering students,
              professionals, institutions and communities through
              access to quality education, international
              opportunities, scholarships, career guidance and
              innovative learning solutions that create lasting
              impact.
            </Typography>

            <Grid
              container
              spacing={2}
              sx={{
                mb: 5,
              }}
            >
              {features.map((feature) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  key={feature}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                  >
                    <CheckCircleIcon
                      color="primary"
                    />

                    <Typography>
                      {feature}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>

            <Button
              component={Link}
              to="/about"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Learn More
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}