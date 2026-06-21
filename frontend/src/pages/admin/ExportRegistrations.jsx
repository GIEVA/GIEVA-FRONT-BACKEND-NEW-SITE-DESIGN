import {
  useState,
} from "react";

import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  CircularProgress,
} from "@mui/material";

import {
  Download,
  TableChart,
} from "@mui/icons-material";

import {
  exportExamRegistrations,
} from "../../services/adminExamService";

export default function ExportRegistrations() {

  const [loading,
    setLoading] =
    useState(false);

  const [success,
    setSuccess] =
    useState("");

  const [error,
    setError] =
    useState("");

  const handleExport =
    async () => {

      try {

        setLoading(true);

        setError("");

        setSuccess("");

        await exportExamRegistrations();

        setSuccess(
          "Exam registrations exported successfully."
        );

      } catch (err) {

        console.error(err);

        setError(
          err?.response?.data
            ?.message ||
          "Export failed"
        );

      } finally {
        setLoading(false);
      }
    };

  return (
    <Box p={4}>

      <Typography
        variant="h4"
        fontWeight={700}
        mb={3}
      >
        Export Registrations
      </Typography>

      <Paper
        sx={{
          p: 4,
          maxWidth: 900,
        }}
      >

        <Stack spacing={3}>

          <Box>

            <Typography
              variant="h6"
              gutterBottom
            >
              Export Exam Registrations
            </Typography>

            <Typography
              color="text.secondary"
            >
              Download all exam
              registrations as an
              Excel spreadsheet.
              The export includes:
            </Typography>

          </Box>

          <Box
            component="ul"
            sx={{
              pl: 3,
              m: 0,
            }}
          >
            <li>
              Registration Code
            </li>

            <li>
              Applicant Name
            </li>

            <li>
              Email Address
            </li>

            <li>
              Exam Type
            </li>

            <li>
              Amount Paid
            </li>

            <li>
              Registration Status
            </li>

            <li>
              Payment Status
            </li>

            <li>
              Submission Date
            </li>
          </Box>

          {success && (
            <Alert severity="success">
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            startIcon={
              loading
                ? (
                  <CircularProgress
                    size={20}
                    color="inherit"
                  />
                )
                : (
                  <Download />
                )
            }
            disabled={loading}
            onClick={
              handleExport
            }
          >
            {loading
              ? "Exporting..."
              : "Export Excel"}
          </Button>

        </Stack>

      </Paper>

      <Paper
        sx={{
          mt: 4,
          p: 3,
        }}
      >

        <Box
          display="flex"
          alignItems="center"
          gap={2}
        >

          <TableChart
            color="primary"
          />

          <Box>

            <Typography
              fontWeight={600}
            >
              Export Format
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Microsoft Excel
              (.xlsx)
            </Typography>

          </Box>

        </Box>

      </Paper>

    </Box>
  );
}