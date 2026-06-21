import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Stack,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";

import {
  Visibility,
} from "@mui/icons-material";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getAllHealsApplications,
} from "../services/healsAdminService";

const NAVY = "#0B1F3A";

export default function
AdminHealsApplications() {

  const navigate =
    useNavigate();

  const [loading,
    setLoading] =
      useState(true);

  const [applications,
    setApplications] =
      useState([]);

  const [status,
    setStatus] =
      useState("");

  const [search,
    setSearch] =
      useState("");



  const fetchApplications =
    async () => {

      try {

        const res =
          await getAllHealsApplications({
            status,
            search,
          });

        setApplications(
          res.applications || []
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);
      }
    };



  useEffect(() => {

    fetchApplications();

  }, [status, search]);



  return (

    <Box p={4}>

      <Stack
        direction="row"
        justifyContent="space-between"
        mb={4}
      >

        <Typography
          variant="h4"
          fontWeight={800}
        >
          HEALS Applications
        </Typography>

      </Stack>



      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        spacing={2}
        mb={3}
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
          sx={{ minWidth: 220 }}
        >

          <MenuItem value="">
            All
          </MenuItem>

          <MenuItem value="submitted">
            Submitted
          </MenuItem>

          <MenuItem value="under_review">
            Under Review
          </MenuItem>

          <MenuItem value="approved_for_payment">
            Approved For Payment
          </MenuItem>

          <MenuItem value="paid">
            Paid
          </MenuItem>

          <MenuItem value="processing">
            Processing
          </MenuItem>

          <MenuItem value="completed">
            Completed
          </MenuItem>

        </TextField>

      </Stack>



      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: "hidden",
        }}
      >

        {loading ? (

          <Box
            display="flex"
            justifyContent="center"
            py={10}
          >
            <CircularProgress />
          </Box>

        ) : (

          <TableContainer>

            <Table>

              <TableHead>

                <TableRow>

                  <TableCell>
                    Applicant
                  </TableCell>

                  <TableCell>
                    Country
                  </TableCell>

                  <TableCell>
                    Field
                  </TableCell>

                  <TableCell>
                    Status
                  </TableCell>

                  <TableCell>
                    Actions
                  </TableCell>

                </TableRow>

              </TableHead>



              <TableBody>

                {applications.map(
                  (app) => (

                    <TableRow
                      key={app.id}
                    >

                      <TableCell>

                        <Stack>

                          <Typography
                            fontWeight={700}
                          >
                            {app.fullName}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {app.email}
                          </Typography>

                        </Stack>

                      </TableCell>



                      <TableCell>
                        {
                          app.desiredCountry
                        }
                      </TableCell>



                      <TableCell>
                        {
                          app.fieldOfStudy
                        }
                      </TableCell>



                      <TableCell>

                        <Chip
                          label={app.status}
                          color="primary"
                        />

                      </TableCell>



                      <TableCell>

                        <Button
                          startIcon={
                            <Visibility />
                          }
                          onClick={() =>
                            navigate(

                              `/admin/heals/applications/${app.id}`
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

          </TableContainer>
        )}

      </Paper>

    </Box>
  );
}