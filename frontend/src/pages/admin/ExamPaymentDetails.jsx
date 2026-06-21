import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Chip,
  Stack,
} from "@mui/material";

import DownloadIcon
  from "@mui/icons-material/Download";

import ArrowBackIcon
  from "@mui/icons-material/ArrowBack";

import {
  getExamPaymentById,
  downloadExamReceipt,
} from "../../services/adminExamService";

import PaymentStatusChip
  from "../../components/exams/PaymentStatusChip";

export default function ExamPaymentDetails() {

  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [loading,
    setLoading] =
    useState(true);

  const [payment,
    setPayment] =
    useState(null);

  const loadPayment =
    async () => {

      try {

        setLoading(true);

        const data =
          await getExamPaymentById(
            id
          );

        setPayment(data);

      } catch (error) {
        console.error(
          error
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadPayment();
  }, [id]);

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

  if (!payment) {
    return (
      <Typography>
        Payment not found
      </Typography>
    );
  }

  const registration =
    payment.ExamRegistration;

  const applicant =
    payment.User;

  return (
    <Box p={4}>

      <Stack
        direction="row"
        spacing={2}
        mb={3}
      >

        <Button
          startIcon={
            <ArrowBackIcon />
          }
          onClick={() =>
            navigate(-1)
          }
        >
          Back
        </Button>

        <Button
          variant="contained"
          startIcon={
            <DownloadIcon />
          }
          onClick={() =>
            downloadExamReceipt(
              payment.id
            )
          }
        >
          Download Receipt
        </Button>

      </Stack>

      <Typography
        variant="h4"
        fontWeight={700}
        mb={3}
      >
        Payment Details
      </Typography>

      {/* PAYMENT INFO */}

      <Paper
        sx={{
          p: 3,
          mb: 3,
        }}
      >

        <Typography
          variant="h6"
          gutterBottom
        >
          Payment Information
        </Typography>

        <Divider
          sx={{ mb: 2 }}
        />

        <Grid
          container
          spacing={2}
        >

          <Grid
            item
            xs={12}
            md={6}
          >

            <Typography>
              <strong>
                Reference:
              </strong>
              {" "}
              {
                payment.transactionRef
              }
            </Typography>

            <Typography>
              <strong>
                Amount:
              </strong>
              {" "}
              ₦
              {Number(
                payment.amount
              ).toLocaleString()}
            </Typography>

            <Typography>
              <strong>
                Currency:
              </strong>
              {" "}
              {
                payment.currency
              }
            </Typography>

            <Typography>
              <strong>
                Method:
              </strong>
              {" "}
              {
                payment.paymentMethod
              }
            </Typography>

          </Grid>

          <Grid
            item
            xs={12}
            md={6}
          >

            <PaymentStatusChip
              status={
                payment.status
              }
            />

            <Typography
              mt={2}
            >
              <strong>
                Paid At:
              </strong>
              {" "}
              {payment.paidAt
                ? new Date(
                    payment.paidAt
                  ).toLocaleString()
                : "-"}
            </Typography>

          </Grid>

        </Grid>

      </Paper>

      {/* APPLICANT */}

      <Paper
        sx={{
          p: 3,
          mb: 3,
        }}
      >

        <Typography
          variant="h6"
          gutterBottom
        >
          Applicant
        </Typography>

        <Divider
          sx={{ mb: 2 }}
        />

        <Typography>
          <strong>
            Full Name:
          </strong>
          {" "}
          {
            applicant?.fullName
          }
        </Typography>

        <Typography>
          <strong>
            Email:
          </strong>
          {" "}
          {
            applicant?.email
          }
        </Typography>

        <Typography>
          <strong>
            User ID:
          </strong>
          {" "}
          {
            applicant?.id
          }
        </Typography>

      </Paper>

      {/* REGISTRATION */}

      <Paper
        sx={{
          p: 3,
          mb: 3,
        }}
      >

        <Typography
          variant="h6"
          gutterBottom
        >
          Registration
        </Typography>

        <Divider
          sx={{ mb: 2 }}
        />

        <Typography>
          <strong>
            Registration Code:
          </strong>
          {" "}
          {
            registration?.registrationCode
          }
        </Typography>

        <Typography>
          <strong>
            Exam Type:
          </strong>
          {" "}
          <Chip
            label={
              registration?.examType
            }
          />
        </Typography>

        <Typography>
          <strong>
            Status:
          </strong>
          {" "}
          {
            registration?.status
          }
        </Typography>

        <Typography>
          <strong>
            Payment Status:
          </strong>
          {" "}
          {
            registration?.paymentStatus
          }
        </Typography>

      </Paper>

      {/* PAYSTACK RESPONSE */}

      <Paper
        sx={{
          p: 3,
        }}
      >

        <Typography
          variant="h6"
          gutterBottom
        >
          Gateway Response
        </Typography>

        <Divider
          sx={{ mb: 2 }}
        />

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor:
              "#f5f5f5",
            overflow: "auto",
          }}
        >

          <pre>
            {JSON.stringify(
              payment.gatewayResponse,
              null,
              2
            )}
          </pre>

        </Box>

      </Paper>

    </Box>
  );
}