import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PhoneIcon from "@mui/icons-material/Phone";

import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <Box
      sx={{
        py: {
          xs: 10,
          md: 14,
        },
        background:
          "linear-gradient(135deg,#0D47A1 0%,#1565C0 45%,#1976D2 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Circles */}

      <Box
        sx={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 320,
          height: 320,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,.06)",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 220,
          height: 220,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,.08)",
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 2,
        }}
      >
        <Stack
          spacing={4}
          alignItems="center"
          textAlign="center"
        >
          <Typography
            color="rgba(255,255,255,.9)"
            fontWeight={700}
            letterSpacing={2}
          >
            READY TO GET STARTED?
          </Typography>

          <Typography
            variant="h2"
            fontWeight={800}
            color="#fff"
            sx={{
              maxWidth: 900,
              fontSize: {
                xs: 36,
                md: 56,
              },
            }}
          >
            Let GIEVA Help You Build Your Global Future
          </Typography>

          <Typography
            color="rgba(255,255,255,.85)"
            sx={{
              maxWidth: 720,
              lineHeight: 1.9,
              fontSize: 18,
            }}
          >
            Whether you're planning to study abroad,
            secure scholarships, register for international
            examinations, or advance your professional career,
            our experienced consultants are ready to guide you
            every step of the way.
          </Typography>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={3}
          >
            <Button
              component={Link}
              to="/book-consultancy"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                px: 5,
                py: 1.8,
                borderRadius: 4,
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#fff",
                color: "primary.main",

                "&:hover": {
                  bgcolor: "#F5F5F5",
                },
              }}
            >
              Book Consultancy
            </Button>

            <Button
              component={Link}
              to="/contact"
              variant="outlined"
              size="large"
              startIcon={<PhoneIcon />}
              sx={{
                px: 5,
                py: 1.8,
                borderRadius: 4,
                textTransform: "none",
                fontWeight: 700,
                color: "#fff",
                borderColor: "#fff",

                "&:hover": {
                  borderColor: "#fff",
                  bgcolor: "rgba(255,255,255,.08)",
                },
              }}
            >
              Contact Us
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}