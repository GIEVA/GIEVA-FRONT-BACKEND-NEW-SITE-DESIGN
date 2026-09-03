import {
  useEffect,
  useState,
} from "react";

import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  MenuItem,
  TextField,
  Chip,
  CircularProgress,
} from "@mui/material";

import {
  Visibility,
  Delete,
  Refresh,
  Download,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

import {
  getExamRegistrations,
  deleteExamRegistration,
  resendExamEmail,
  exportExamRegistrations
} from "../../services/adminExamService";

import RegistrationStatusChip
  from "../../components/exams/RegistrationStatusChip";

import PaymentStatusChip
  from "../../components/exams/PaymentStatusChip";


  const formatUsd = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
    .format(amount);

const formatNgn = (amount) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 })
    .format(amount);

export default function ExamRegistrations() {

  const navigate =
    useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [registrations,
    setRegistrations] =
    useState([]);

  const [status, setStatus] =
    useState("");

  const [examType,
    setExamType] =
    useState("");

  const [search,
    setSearch] =
    useState("");

  const loadData =
    async () => {
      try {
        setLoading(true);

        const data =
          await getExamRegistrations({
            status,
            examType,
            search,
          });

        setRegistrations(
          data.registrations || []
        );

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadData();
  }, [
    status,
    examType,
  ]);

  const handleDelete =
    async (id) => {
      if (
        !window.confirm(
          "Delete registration?"
        )
      )
        return;

      try {
        await deleteExamRegistration(
          id
        );

        loadData();
      } catch (error) {
        console.error(error);
      }
    };

  const handleResend =
    async (id) => {
      try {
        await resendExamEmail(id);

        alert(
          "Email sent successfully"
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
        mt={10}
      >
        <CircularProgress />
      </Box>
    );
  }


  const handleExport = async () => {
  try {
    const response =
      await exportExamRegistrations();

    const url =
      window.URL.createObjectURL(
        new Blob([response.data])
      );

    const link =
      document.createElement("a");

    link.href = url;

    link.setAttribute(
      "download",
      `exam-registrations-${Date.now()}.xlsx`
    );

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);

    alert(
      "Failed to export registrations"
    );
  }
};


  return (
    <Box p={4}>

      <Typography
        variant="h4"
        fontWeight={700}
        mb={3}
      >
        Exam Registrations
      </Typography>

      {/* FILTERS */}

      <Paper
        sx={{
          p: 3,
          mb: 3,
        }}
      >
        <Stack
          direction="row"
          spacing={2}
        >
          <TextField
            label="Search"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value
              )
            }
            sx={{
              width: 200,
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="payment_pending">Payment Pending</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="under_review">Under Review</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>

          <TextField
            select
            label="Exam"
            value={examType}
            onChange={(e) =>
              setExamType(
                e.target.value
              )
            }
            sx={{
              width: 200,
            }}
          >
            <MenuItem value="">
              All
            </MenuItem>

            <MenuItem value="SAT">
              SAT
            </MenuItem>

            <MenuItem value="GRE">
              GRE
            </MenuItem>

            <MenuItem value="IELTS">
              IELTS
            </MenuItem>

            <MenuItem value="TOEFL">
              TOEFL
            </MenuItem>

            <MenuItem value="ACT">
              ACT
            </MenuItem>

            <MenuItem value="SEVIS">
              SEVIS
            </MenuItem>
          </TextField>

          <Button
            variant="contained"
            onClick={loadData}
          >
            Search
          </Button>

          <Button
            variant="outlined"
            color="success"
            startIcon={<Download />}
            onClick={handleExport}
            >
            Export Excel
            </Button>
        </Stack>
      </Paper>

      {/* TABLE */}

      <Paper>
        <Table>

          <TableHead>
            <TableRow>

              <TableCell>
                Registration
              </TableCell>

              <TableCell>
                Applicant
              </TableCell>

              <TableCell>
                Exam
              </TableCell>

              <TableCell>
                Amount
              </TableCell>

              <TableCell>
                Status
              </TableCell>

              <TableCell>
                Payment
              </TableCell>

              <TableCell>
                Date
              </TableCell>

              <TableCell>
                Actions
              </TableCell>

            </TableRow>
          </TableHead>

          <TableBody>

            {registrations.map(
              (registration) => (
                <TableRow
                  key={
                    registration.id
                  }
                >
                  <TableCell>

                    <Typography
                      fontWeight={700}
                    >
                      {
                        registration.registrationCode
                      }
                    </Typography>

                  </TableCell>

                  <TableCell>

                    {
                      registration
                        ?.applicant
                        ?.fullName
                    }

                  </TableCell>

                  <TableCell>

                    <Chip
                      label={
                        registration.examType
                      }
                    />

                  </TableCell>

                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                      {formatUsd(registration.amount)}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      {registration.amountNgn
                        ? `${formatNgn(registration.amountNgn)} @ ₦${Number(registration.usdToNgnRateUsed).toLocaleString()}`
                        : "Not yet quoted"}
                    </Typography>
                  </TableCell>

                  <TableCell>

                    <RegistrationStatusChip
                      status={
                        registration.status
                      }
                    />

                  </TableCell>

                  <TableCell>

                    <PaymentStatusChip
                      status={
                        registration.paymentStatus
                      }
                    />

                  </TableCell>

                  <TableCell>

                    {new Date(
                      registration.createdAt
                    ).toLocaleDateString()}

                  </TableCell>

                  <TableCell>

                    <Stack
                      direction="row"
                      spacing={1}
                    >

                      <Button
                        size="small"
                        startIcon={
                          <Visibility />
                        }
                        onClick={() =>
                          navigate(
                            `/admin/exams/registrations/${registration.id}`
                          )
                        }
                      >
                        View
                      </Button>

                      <Button
                        size="small"
                        startIcon={
                          <Refresh />
                        }
                        onClick={() =>
                          handleResend(
                            registration.id
                          )
                        }
                      >
                        Email
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        startIcon={
                          <Delete />
                        }
                        onClick={() =>
                          handleDelete(
                            registration.id
                          )
                        }
                      >
                        Delete
                      </Button>

                    </Stack>

                  </TableCell>

                </TableRow>
              )
            )}

          </TableBody>

        </Table>
      </Paper>

    </Box>
  );
}