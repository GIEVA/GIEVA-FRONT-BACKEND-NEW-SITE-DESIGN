import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";

import VisibilityIcon
  from "@mui/icons-material/Visibility";

import {
  getExamPayments,
} from "../../services/adminExamService";

import PaymentStatusChip
  from "../../components/exams/PaymentStatusChip";

export default function ExamPayments() {

  const navigate =
    useNavigate();

  const [loading,
    setLoading] =
    useState(true);

  const [payments,
    setPayments] =
    useState([]);

  const [status,
    setStatus] =
    useState("");

  const [search,
    setSearch] =
    useState("");

  const [totalRevenue,
    setTotalRevenue] =
    useState(0);

  const loadPayments =
    async () => {
      try {

        setLoading(true);

        const response =
          await getExamPayments({
            status,
            search,
          });

        setPayments(
          response.payments || []
        );

        const revenue =
          (response.payments || [])
            .filter(
              (p) =>
                p.status ===
                "success"
            )
            .reduce(
              (
                total,
                payment
              ) =>
                total +
                Number(
                  payment.amount
                ),
              0
            );

        setTotalRevenue(
          revenue
        );

      } catch (error) {
        console.error(
          error
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadPayments();
  }, [status]);

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

  return (
    <Box p={4}>

      <Typography
        variant="h4"
        fontWeight={700}
        mb={3}
      >
        Exam Payments
      </Typography>

      {/* SUMMARY */}

      <Paper
        sx={{
          p: 3,
          mb: 3,
        }}
      >
        <Typography
          variant="h6"
        >
          Total Revenue
        </Typography>

        <Typography
          variant="h4"
          color="success.main"
        >
          ₦
          {totalRevenue.toLocaleString()}
        </Typography>
      </Paper>

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
            label="Search Reference"
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
              width: 220,
            }}
          >
            <MenuItem value="">
              All
            </MenuItem>

            <MenuItem value="success">
              Success
            </MenuItem>

            <MenuItem value="pending">
              Pending
            </MenuItem>

            <MenuItem value="failed">
              Failed
            </MenuItem>

            <MenuItem value="refunded">
              Refunded
            </MenuItem>
          </TextField>

          <Button
            variant="contained"
            onClick={
              loadPayments
            }
          >
            Search
          </Button>

        </Stack>
      </Paper>

      {/* TABLE */}

      <Paper>

        <Table>

          <TableHead>
            <TableRow>

              <TableCell>
                Reference
              </TableCell>

              <TableCell>
                Candidate
              </TableCell>

              <TableCell>
                Exam
              </TableCell>

              <TableCell>
                Amount
              </TableCell>

              <TableCell>
                Method
              </TableCell>

              <TableCell>
                Status
              </TableCell>

              <TableCell>
                Paid Date
              </TableCell>

              <TableCell>
                Actions
              </TableCell>

            </TableRow>
          </TableHead>

          <TableBody>

            {payments.map(
              (payment) => (
                <TableRow
                  key={
                    payment.id
                  }
                >
                  <TableCell>
                    {
                      payment.transactionRef
                    }
                  </TableCell>

                  <TableCell>
                    {
                      payment
                        ?.User
                        ?.fullName
                    }
                  </TableCell>

                  <TableCell>

                    <Chip
                      label={
                        payment
                          ?.ExamRegistration
                          ?.examType
                      }
                    />

                  </TableCell>

                  <TableCell>

                    ₦
                    {Number(
                      payment.amount
                    ).toLocaleString()}

                  </TableCell>

                  <TableCell>
                    {
                      payment.paymentMethod
                    }
                  </TableCell>

                  <TableCell>

                    <PaymentStatusChip
                      status={
                        payment.status
                      }
                    />

                  </TableCell>

                  <TableCell>

                    {payment.paidAt
                      ? new Date(
                          payment.paidAt
                        ).toLocaleString()
                      : "-"}

                  </TableCell>

                  <TableCell>

                    <Button
                      size="small"
                      startIcon={
                        <VisibilityIcon />
                      }
                      onClick={() =>
                        navigate(
                          `/admin/exams/payments/${payment.id}`
                        )
                      }
                    >
                      View
                    </Button>

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