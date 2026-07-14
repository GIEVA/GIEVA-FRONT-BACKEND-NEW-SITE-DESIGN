import { useState } from "react";

import {
  Box,
  Button,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
} from "@mui/material";

import {
  Construction,
  School,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";

export default function HomePage() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(true);

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="md">

          <Stack
            spacing={3}
            alignItems="center"
          >
            <School
              sx={{
                fontSize: 80,
                color: GREEN,
              }}
            />

            <Typography
              variant="h2"
              fontWeight={800}
              color={NAVY}
              textAlign="center"
            >
              GIEVA
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              textAlign="center"
            >
              Empowering Learning Through Innovation
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/login")}
              sx={{
                bgcolor: GREEN,
                px: 5,
                py: 1.5,
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 700,
                "&:hover": {
                  bgcolor: "#17633f",
                },
              }}
            >
              Go to LMS
            </Button>
          </Stack>

        </Container>
      </Box>

      <Dialog
        open={open}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: NAVY,
            fontWeight: 800,
          }}
        >
          <Construction color="warning" />

          Website Under Development
        </DialogTitle>

        <DialogContent>

          <Typography
            sx={{
              mt: 1,
              lineHeight: 1.8,
            }}
          >
            Welcome to GIEVA.

            <br />
            <br />

            Our public website is currently being redesigned to provide a
            richer experience for students, tutors, organizations, and
            partners.

            <br />
            <br />

            The Learning Management System (LMS) remains fully operational.
            You may continue to access your dashboard by logging in below.

            <br />
            <br />

            We appreciate your patience as we prepare the new GIEVA website.
          </Typography>

        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
          }}
        >
          <Button
            onClick={() => setOpen(false)}
          >
            Close
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate("/login")}
            sx={{
              bgcolor: GREEN,
              textTransform: "none",
              "&:hover": {
                bgcolor: "#17633f",
              },
            }}
          >
            Login to LMS
          </Button>

        </DialogActions>
      </Dialog>
    </>
  );
}