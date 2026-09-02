import React, {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";

import {
  verifyExamPayment,
} from "../../services/examService";

export default function ExamPaymentCallback() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState(null);

  useEffect(() => {
    const verify =
      async () => {
        try {
          const params =
            new URLSearchParams(
              location.search
            );

          const reference =
            params.get(
              "reference"
            );

          if (!reference) {
            setError(
              "Payment reference not found"
            );

            setLoading(false);

            return;
          }

          const response =
            await verifyExamPayment(
              reference
            );

          setResult(
            response
          );

        } catch (err) {
          console.error(err);

          setError(
            err?.response?.data
              ?.message ||
              "Payment verification failed"
          );
        } finally {
          setLoading(false);
        }
      };

    verify();
  }, [location.search]);

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

  if (error) {
    return (
      <Box
        maxWidth={700}
        mx="auto"
        mt={5}
      >
        <Alert severity="error">
          {error}
        </Alert>

        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={() =>
            navigate(
              "/exam-catalog"
            )
          }
        >
          Back To Exams
        </Button>
      </Box>
    );
  }

const registration = result?.payment?.registration;

  return (
    <Box
      maxWidth={800}
      mx="auto"
      py={5}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
          color="success.main"
          gutterBottom
        >
          ✓ Registration Submitted
        </Typography>

        <Typography
          color="text.secondary"
          mb={4}
        >
          Your payment was
          verified successfully.
          GIEVA will begin
          processing your
          registration.
        </Typography>

        <Stack spacing={2}>
          <Box>
            <Typography
              variant="caption"
            >
              Exam Type
            </Typography>

            <Typography
              variant="h6"
            >
              {
                registration?.examType
              }
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
            >
              Amount
            </Typography>

            <Typography variant="h6">
              ₦{Number(result?.payment?.amount).toLocaleString()}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
            >
              Registration
              Code
            </Typography>

            <Typography
              variant="h6"
            >
              {
                registration?.registrationCode
              }
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={2}
          mt={5}
        >
          <Button
            variant="contained"
            onClick={() =>
              navigate(
                `/exam-registrations/${registration?.id}`
              )
            }
          >
            View Registration
          </Button>

          <Button
            variant="outlined"
            onClick={() =>
              navigate(
                `/exam-payments/receipt/${result?.paymentId}`
              )
            }
          >
            Download Receipt
          </Button>

          <Button
            variant="outlined"
            onClick={() =>
              navigate(
                "/my-exam-registrations"
              )
            }
          >
            My Registrations
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}