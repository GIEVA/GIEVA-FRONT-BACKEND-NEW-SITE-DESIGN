import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import {
  getMyRegistrations,
} from "../../services/examService";
import RegistrationStatusChip
from "../../components/exams/RegistrationStatusChip";

import PaymentStatusChip
from "../../components/exams/PaymentStatusChip";


export default function MyExamRegistrations() {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [registrations, setRegistrations] =
    useState([]);

  const getPaymentColor = (
    status
  ) => {
    switch (status) {
      case "success":
        return "success";

      case "failed":
        return "error";

      case "pending":
        return "warning";

      default:
        return "default";
    }
  };

  const loadRegistrations =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getMyRegistrations();

        setRegistrations(
          response?.registrations ||
            []
        );
      } catch (err) {
        console.error(err);

        setError(
          err?.response?.data
            ?.message ||
            "Failed to load registrations"
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        maxWidth={800}
        mx="auto"
        mt={5}
      >
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (
    !registrations ||
    registrations.length === 0
  ) {
    return (
      <Box
        textAlign="center"
        mt={10}
      >
        <Typography
          variant="h5"
          gutterBottom
        >
          No Registrations Yet
        </Typography>

        <Button
          variant="contained"
          onClick={() =>
            navigate(
              "/exam-catalog"
            )
          }
        >
          Browse Exams
        </Button>
      </Box>
    );
  }

  return (
    <Box
      maxWidth="lg"
      mx="auto"
      py={4}
      px={2}
    >
      <Typography
        variant="h4"
        fontWeight={700}
        mb={4}
      >
        My Exam Registrations
      </Typography>

      <Grid
        container
        spacing={3}
      >
        {registrations.map(
          (registration) => (
            <Grid
              item
              xs={12}
              md={6}
              key={
                registration.id
              }
            >
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  height: "100%",
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={700}
                >
                  {
                    registration.examType
                  }
                </Typography>

                <Typography
                  color="text.secondary"
                  mt={1}
                >
                  {
                    registration.registrationCode
                  }
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  mt={2}
                  flexWrap="wrap"
                >
                 <Stack
                    direction="row"
                    spacing={1}
                    mt={2}
                    >
                    <RegistrationStatusChip
                        status={registration.status}
                    />

                    <PaymentStatusChip
                        status={
                        registration.paymentStatus
                        }
                    />
                    </Stack>
                </Stack>

                <Typography
                  variant="h6"
                  mt={3}
                >
                  $
                  {Number(
                    registration.amount ||
                      0
                  ).toLocaleString()}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  mt={1}
                >
                  Created:{" "}
                  {registration.createdAt
                    ? new Date(
                        registration.createdAt
                      ).toLocaleDateString()
                    : "N/A"}
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                  onClick={() =>
                    navigate(
                      `/exam-registrations/${registration.id}`
                    )
                  }
                >
                  View Details
                </Button>
              </Paper>
            </Grid>
          )
        )}
      </Grid>
    </Box>
  );
}