import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";

import {
  CheckCircle,
  Cancel,
  Visibility,
  Delete,
} from "@mui/icons-material";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getAllTutorProfiles,
  approveTutorProfile,
  rejectTutorProfile,
  deleteTutorProfileAdmin,
} from "../services/adminTutorKycService";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";

export default function AdminTutorKyc() {

  const navigate =
    useNavigate();

  const [loading,
    setLoading] =
    useState(true);

  const [tutors,
    setTutors] =
    useState([]);

  const [search,
    setSearch] =
    useState("");

  const [verificationStatus,
    setVerificationStatus] =
    useState("");

  const [availabilityStatus,
    setAvailabilityStatus] =
    useState("");



  useEffect(() => {
    fetchTutors();
  }, [
    search,
    verificationStatus,
    availabilityStatus,
  ]);



  const fetchTutors =
    async () => {

      try {

        setLoading(true);

        const res =
          await getAllTutorProfiles({
            search,
            verificationStatus,
            availabilityStatus,
          });

        setTutors(
          res.tutors || []
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);
      }
    };



  const handleApprove =
    async (id) => {

      try {

        await approveTutorProfile(
          id
        );

        fetchTutors();

      } catch (err) {

        console.error(err);

        alert(
          err.response?.data?.message ||
          "Approval failed"
        );
      }
    };



  const handleReject =
    async (id) => {

      const reason =
        prompt(
          "Enter rejection reason"
        );

      if (!reason) return;

      try {

        await rejectTutorProfile(
          id,
          {
            verificationNotes:
              reason,
          }
        );

        fetchTutors();

      } catch (err) {

        console.error(err);
      }
    };



  const handleDelete =
    async (id) => {

      const confirmDelete =
        window.confirm(
          "Delete tutor profile?"
        );

      if (!confirmDelete) return;

      try {

        await deleteTutorProfileAdmin(
          id
        );

        fetchTutors();

      } catch (err) {

        console.error(err);
      }
    };



  return (
    <Box p={3}>

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          md: "center",
        }}
        spacing={2}
        mb={4}
      >

        <Box>

          <Typography
            variant="h4"
            fontWeight="bold"
            color={NAVY}
          >
            Tutor KYC Management
          </Typography>

          <Typography
            color="text.secondary"
          >
            Manage tutor verification
            and approvals
          </Typography>

        </Box>

      </Stack>



      {/* ====================================================== */}
      {/* FILTERS */}
      {/* ====================================================== */}

      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          mb: 4,
        }}
      >

        <Grid
          container
          spacing={2}
        >

          <Grid item xs={12} md={4}>

            <TextField
              fullWidth
              label="Search Tutor"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </Grid>

          <Grid item xs={12} md={4}>

            <TextField
              fullWidth
              select
              label="Verification Status"
              value={
                verificationStatus
              }
              onChange={(e) =>
                setVerificationStatus(
                  e.target.value
                )
              }
            >

              <MenuItem value="">
                All
              </MenuItem>

              <MenuItem value="pending">
                Pending
              </MenuItem>

              <MenuItem value="verified">
                Verified
              </MenuItem>

              <MenuItem value="rejected">
                Rejected
              </MenuItem>

            </TextField>

          </Grid>

          <Grid item xs={12} md={4}>

            <TextField
              fullWidth
              select
              label="Availability"
              value={
                availabilityStatus
              }
              onChange={(e) =>
                setAvailabilityStatus(
                  e.target.value
                )
              }
            >

              <MenuItem value="">
                All
              </MenuItem>

              <MenuItem value="available">
                Available
              </MenuItem>

              <MenuItem value="busy">
                Busy
              </MenuItem>

              <MenuItem value="offline">
                Offline
              </MenuItem>

            </TextField>

          </Grid>

        </Grid>

      </Paper>



      {/* ====================================================== */}
      {/* LOADING */}
      {/* ====================================================== */}

      {loading ? (

        <Box
          display="flex"
          justifyContent="center"
          py={8}
        >
          <CircularProgress />
        </Box>

      ) : (

        <Grid
          container
          spacing={3}
        >

          {tutors.map(
            (tutor) => (

              <Grid
                item
                xs={12}
                md={6}
                lg={4}
                key={tutor.id}
              >

                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 5,
                    height: "100%",
                    border:
                      "1px solid #E5E7EB",
                  }}
                >

                  <Stack
                    spacing={2}
                  >

                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                    >

                      <Avatar
                        src={
                          tutor.profilePicUrl
                        }
                        sx={{
                          width: 70,
                          height: 70,
                        }}
                      />

                      <Box>

                        <Typography
                          fontWeight="bold"
                          variant="h6"
                        >
                          {
                            tutor.fullName
                          }
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {
                            tutor.email
                          }
                        </Typography>

                      </Box>

                    </Stack>



                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                    >

                      <Chip
                        label={
                          tutor.verificationStatus
                        }
                        sx={{
                          bgcolor:
                            tutor.verificationStatus ===
                            "verified"
                              ? GREEN
                              : tutor.verificationStatus ===
                                "rejected"
                              ? "#DC2626"
                              : GOLD,

                          color:
                            "#fff",

                          fontWeight:
                            "bold",
                        }}
                      />

                      <Chip
                        label={
                          tutor.availabilityStatus
                        }
                      />

                    </Stack>



                    <Typography
                      variant="body2"
                    >
                      Students:
                      {" "}
                      {
                        tutor.TutorStudents
                          ?.length
                      }
                    </Typography>

                    <Typography
                      variant="body2"
                    >
                      Sessions:
                      {" "}
                      {
                        tutor.ClassSessions
                          ?.length
                      }
                    </Typography>



                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                    >

                      <Tooltip title="View">

                        <IconButton
                          sx={{
                            bgcolor:
                              NAVY,
                            color:
                              "#fff",
                          }}
                          onClick={() =>
                            navigate(
                              `/admin/tutor-kyc/${tutor.id}`
                            )
                          }
                        >
                          <Visibility />
                        </IconButton>

                      </Tooltip>



                      <Tooltip title="Approve">

                        <IconButton
                          sx={{
                            bgcolor:
                              GREEN,
                            color:
                              "#fff",
                          }}
                          onClick={() =>
                            handleApprove(
                              tutor.id
                            )
                          }
                        >
                          <CheckCircle />
                        </IconButton>

                      </Tooltip>



                      <Tooltip title="Reject">

                        <IconButton
                          sx={{
                            bgcolor:
                              GOLD,
                            color:
                              "#fff",
                          }}
                          onClick={() =>
                            handleReject(
                              tutor.id
                            )
                          }
                        >
                          <Cancel />
                        </IconButton>

                      </Tooltip>



                      <Tooltip title="Delete">

                        <IconButton
                          sx={{
                            bgcolor:
                              "#DC2626",
                            color:
                              "#fff",
                          }}
                          onClick={() =>
                            handleDelete(
                              tutor.id
                            )
                          }
                        >
                          <Delete />
                        </IconButton>

                      </Tooltip>

                    </Stack>

                  </Stack>

                </Paper>

              </Grid>
            )
          )}

        </Grid>
      )}

    </Box>
  );
}