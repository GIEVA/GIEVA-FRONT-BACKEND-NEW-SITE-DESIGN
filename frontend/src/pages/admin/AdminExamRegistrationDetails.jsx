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
  Divider,
  Button,
  Stack,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";

import {
  getExamRegistrationById,
  updateExamStatus,
  resendExamEmail,
  deleteExamRegistration,
} from "../../services/adminExamService";

import RegistrationStatusChip
  from "../../components/exams/RegistrationStatusChip";

import PaymentStatusChip
  from "../../components/exams/PaymentStatusChip";

export default function AdminExamRegistrationDetails() {

  const { id } = useParams();

  const navigate =
    useNavigate();

  const [
    registration,
    setRegistration,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    adminNotes,
    setAdminNotes,
  ] = useState("");

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const loadRegistration =
    async () => {
      try {
        setLoading(true);

        const data =
          await getExamRegistrationById(
            id
          );

        setRegistration(data);

        setStatus(
          data.status
        );

        setAdminNotes(
          data.adminNotes || ""
        );

        setRejectionReason(
          data.rejectionReason ||
            ""
        );

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadRegistration();
  }, [id]);

  const handleStatusUpdate =
    async () => {
      try {
        await updateExamStatus(
          id,
          {
            status,
            adminNotes,
            rejectionReason,
          }
        );

        alert(
          "Status updated successfully"
        );

        loadRegistration();

      } catch (error) {
        console.error(error);

        alert(
          error?.response?.data
            ?.message ||
            "Update failed"
        );
      }
    };

  const handleResend =
    async () => {
      try {
        await resendExamEmail(id);

        alert(
          "Email sent successfully"
        );
      } catch (error) {
        console.error(error);
      }
    };

  const handleDelete =
    async () => {
      const confirmDelete =
        window.confirm(
          "Delete registration?"
        );

      if (!confirmDelete)
        return;

      try {
        await deleteExamRegistration(
          id
        );

        navigate(
          "/admin/exams/registrations"
        );

      } catch (error) {
        console.error(error);
      }
    };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        mt={8}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!registration) {
    return (
      <Alert severity="error">
        Registration not found
      </Alert>
    );
  }

  const renderObject = (
    obj,
    level = 0
  ) => {

    return Object.entries(
      obj || {}
    ).map(
      ([key, value]) => {

        if (
          value &&
          typeof value ===
            "object" &&
          !Array.isArray(value)
        ) {
          return (
            <Box
              key={key}
              sx={{
                ml:
                  level * 2,
                mt: 2,
              }}
            >
              <Typography
                variant="h6"
              >
                {key}
              </Typography>

              {renderObject(
                value,
                level + 1
              )}
            </Box>
          );
        }

        if (
          Array.isArray(value)
        ) {
          return (
            <Box
              key={key}
              sx={{
                ml:
                  level * 2,
                mb: 2,
              }}
            >
              <Typography>
                <strong>
                  {key}:
                </strong>
              </Typography>

              {value.map(
                (
                  item,
                  index
                ) => (
                  <Typography
                    key={index}
                  >
                    • {item}
                  </Typography>
                )
              )}
            </Box>
          );
        }

        return (
          <Typography
            key={key}
            sx={{
              ml:
                level * 2,
              mb: 1,
            }}
          >
            <strong>
              {key}:
            </strong>{" "}
            {String(value)}
          </Typography>
        );
      }
    );
  };

  return (
    <Box p={4}>

      <Typography
        variant="h4"
        fontWeight={700}
        mb={3}
      >
        Registration Details
      </Typography>

      {/* BASIC INFO */}

      <Paper
        sx={{
          p: 3,
          mb: 3,
        }}
      >
        <Grid
          container
          spacing={3}
        >

          <Grid
            item
            xs={12}
            md={6}
          >
            <Typography>
              <strong>
                Registration Code:
              </strong>{" "}
              {
                registration.registrationCode
              }
            </Typography>

            <Typography>
              <strong>
                Exam Type:
              </strong>{" "}
              {
                registration.examType
              }
            </Typography>

            <Typography>
              <strong>
                Amount:
              </strong>{" "}
              ₦
              {Number(
                registration.amount
              ).toLocaleString()}
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
          >
            <RegistrationStatusChip
              status={
                registration.status
              }
            />

            <Box mt={1}>
              <PaymentStatusChip
                status={
                  registration.paymentStatus
                }
              />
            </Box>
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

        <Typography>
          Name:{" "}
          {
            registration
              ?.applicant
              ?.fullName
          }
        </Typography>

        <Typography>
          Email:{" "}
          {
            registration
              ?.applicant
              ?.email
          }
        </Typography>
      </Paper>

      {/* FORM DATA */}

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
          Registration Data
        </Typography>

        <Divider
          sx={{ mb: 2 }}
        />

        {renderObject(
          registration.data
        )}
      </Paper>

      {/* PAYMENTS */}

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
          Payments
        </Typography>

        {registration.payments?.map(
          (payment) => (
            <Box
              key={
                payment.id
              }
              mb={2}
            >
              <Typography>
                Ref:
                {" "}
                {
                  payment.transactionRef
                }
              </Typography>

              <Typography>
                Amount:
                ₦
                {Number(
                  payment.amount
                ).toLocaleString()}
              </Typography>

              <Typography>
                Status:
                {" "}
                {
                  payment.status
                }
              </Typography>
            </Box>
          )
        )}
      </Paper>

      {/* STATUS UPDATE */}

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
          Processing Actions
        </Typography>

        <Stack spacing={2}>

          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value
              )
            }
          >
            <MenuItem value="submitted">
              Submitted
            </MenuItem>

            <MenuItem value="under_review">
              Under Review
            </MenuItem>

            <MenuItem value="processing">
              Processing
            </MenuItem>

            <MenuItem value="completed">
              Completed
            </MenuItem>

            <MenuItem value="rejected">
              Rejected
            </MenuItem>
          </TextField>

          <TextField
            label="Admin Notes"
            multiline
            minRows={4}
            value={
              adminNotes
            }
            onChange={(e) =>
              setAdminNotes(
                e.target.value
              )
            }
          />

          {status ===
            "rejected" && (
            <TextField
              label="Rejection Reason"
              multiline
              minRows={3}
              value={
                rejectionReason
              }
              onChange={(e) =>
                setRejectionReason(
                  e.target.value
                )
              }
            />
          )}

          <Button
            variant="contained"
            onClick={
              handleStatusUpdate
            }
          >
            Update Status
          </Button>

        </Stack>
      </Paper>

      {/* ACTIONS */}

      <Stack
        direction="row"
        spacing={2}
      >
        <Button
          variant="outlined"
          onClick={
            handleResend
          }
        >
          Resend Email
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={
            handleDelete
          }
        >
          Delete Registration
        </Button>
      </Stack>

    </Box>
  );
}