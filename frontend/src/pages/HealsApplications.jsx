import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Tooltip,
  Avatar,
} from "@mui/material";

import {
  Launch,
  Edit,
  Delete,
  Add,
  School,
  AccessTime,
} from "@mui/icons-material";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getMyHealsApplications,
  deleteHealsApplication,
} from "../services/healsApplicationService";

import ApplicationStatusChip
from "../components/ApplicationStatusChip";

const BRAND = "#0B1F3A";
const BRAND_GREEN = "#1E7F4F";

export default function HealsApplications() {

  const navigate =
    useNavigate();

  const [applications,
    setApplications] =
    useState([]);

  const [loading,
    setLoading] =
    useState(true);

  const [deletingId,
    setDeletingId] =
    useState(null);



  // ======================================================
  // FETCH APPLICATIONS
  // ======================================================

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications =
    async () => {

      try {

        const res =
          await getMyHealsApplications();

        setApplications(
          res.applications || []
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);
      }
    };



  // ======================================================
  // DELETE DRAFT
  // ======================================================

  const handleDeleteDraft =
    async (id) => {

      const confirmDelete =
        window.confirm(
          "Delete this draft application?"
        );

      if (!confirmDelete)
        return;

      try {

        setDeletingId(id);

        await deleteHealsApplication(
          id
        );

        setApplications(
          (prev) =>
            prev.filter(
              (app) =>
                app.id !== id
            )
        );

      } catch (err) {

        console.error(err);

        alert(
          err.response?.data
            ?.message ||
          "Failed to delete draft"
        );

      } finally {

        setDeletingId(null);
      }
    };



  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {

    return (

      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }



  return (

    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        px: {
          xs: 2,
          md: 4,
        },
        py: 4,
      }}
    >

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <Box
        sx={{
          mb: 5,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          justifyContent:
            "space-between",
        }}
      >

        <Box>

          <Typography
            variant="h4"
            fontWeight="bold"
          >
            My HEALS Applications
          </Typography>

          <Typography
            color="text.secondary"
            mt={1}
          >
            Track and manage your
            international admission
            applications
          </Typography>

        </Box>



        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() =>
            navigate("/heals/apply")
          }
          sx={{
            bgcolor: BRAND,
            borderRadius: 3,
            px: 3,
            py: 1.3,
            fontWeight: 700,

            "&:hover": {
              bgcolor: "#5B21B6",
            },
          }}
        >
          New Application
        </Button>

      </Box>



      {/* ====================================================== */}
      {/* EMPTY STATE */}
      {/* ====================================================== */}

      {!applications.length && (

        <Card
          sx={{
            borderRadius: 5,
            p: 6,
            textAlign: "center",
          }}
        >

          <Avatar
            sx={{
              bgcolor: "#ede9fe",
              width: 80,
              height: 80,
              mx: "auto",
              mb: 3,
            }}
          >
            <School
              sx={{
                color: BRAND,
                fontSize: 40,
              }}
            />
          </Avatar>

          <Typography
            variant="h5"
            fontWeight="bold"
            mb={1}
          >
            No Applications Yet
          </Typography>

          <Typography
            color="text.secondary"
            mb={4}
          >
            Start your HEALS
            international admission
            journey today
          </Typography>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() =>
              navigate("/heals/apply")
            }
            sx={{
              bgcolor: BRAND,
              borderRadius: 3,
              px: 4,
            }}
          >
            Start Application
          </Button>

        </Card>
      )}



      {/* ====================================================== */}
      {/* APPLICATIONS */}
      {/* ====================================================== */}

      <Grid container spacing={3}>

        {applications.map((app) => {

          const isDraft =
            app.status === "draft";

          return (

            <Grid
              item
              xs={12}
              md={6}
              lg={4}
              key={app.id}
            >

              <Card
                sx={{
                  borderRadius: 5,
                  height: "100%",
                  transition:
                    "0.25s ease",

                  border:
                    "1px solid #eee",

                  "&:hover": {
                    transform:
                      "translateY(-4px)",

                    boxShadow:
                      "0 12px 30px rgba(0,0,0,0.08)",
                  },
                }}
              >

                <CardContent
                  sx={{
                    p: 3,
                  }}
                >

                  {/* TOP */}

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={2}
                  >

                    <Box>

                      <Typography
                        variant="h6"
                        fontWeight="bold"
                      >
                        {
                          app.fullName ||
                          "Unnamed Applicant"
                        }
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                      >
                        Application #
                        {app.applicationCode ||
                          app.id}
                      </Typography>

                    </Box>



                    <ApplicationStatusChip
                      status={app.status}
                    />

                  </Stack>



                  <Divider
                    sx={{ mb: 2 }}
                  />



                  {/* DETAILS */}

                  <Stack
                    spacing={2}
                    mb={3}
                  >

                    <Box>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Desired Country
                      </Typography>

                      <Typography
                        fontWeight={600}
                      >
                        {
                          app.desiredCountry ||
                          "Not specified"
                        }
                      </Typography>

                    </Box>



                    <Box>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Field of Study
                      </Typography>

                      <Typography
                        fontWeight={600}
                      >
                        {
                          app.fieldOfStudy ||
                          "Not specified"
                        }
                      </Typography>

                    </Box>



                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >

                      <AccessTime
                        sx={{
                          fontSize: 18,
                          color:
                            "text.secondary",
                        }}
                      />

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Created{" "}
                        {new Date(
                          app.createdAt
                        ).toLocaleDateString()}
                      </Typography>

                    </Stack>

                  </Stack>



                  {/* DRAFT NOTICE */}

                  {isDraft && (

                    <Chip
                      label="Draft Application"
                      sx={{
                        bgcolor:
                          "#FEF3C7",
                        color:
                          "#92400E",
                        fontWeight: 700,
                        mb: 3,
                      }}
                    />
                  )}



                  {/* ACTIONS */}

                  <Stack
                    direction="row"
                    spacing={1}
                  >

                    {/* CONTINUE */}

                   <Stack
                      direction="column"
                      spacing={1.5}
                      width="100%"
                    >

                      {/* VIEW */}

                      <Button
                        fullWidth
                        variant="outlined"
                        endIcon={<Launch />}
                        onClick={() =>
                          navigate(
                            `/heals/application/${app.id}`
                          )
                        }
                        sx={{
                          borderRadius: 3,
                          borderColor: BRAND,
                          color: BRAND,
                        }}
                      >
                        View Application
                      </Button>



                      {/* DRAFT ACTIONS */}

                      {isDraft && (

                        <Stack
                          direction="row"
                          spacing={1}
                        >

                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={() =>
                              navigate(
                                `/heals/apply?id=${app.id}`
                              )
                            }
                            sx={{
                              bgcolor: BRAND,
                              borderRadius: 3,

                              "&:hover": {
                                bgcolor:
                                  "#5B21B6",
                              },
                            }}
                          >
                            Continue
                          </Button>



                          <Tooltip title="Delete Draft">

                            <IconButton
                              onClick={() =>
                                handleDeleteDraft(
                                  app.id
                                )
                              }
                              disabled={
                                deletingId ===
                                app.id
                              }
                              sx={{
                                bgcolor: "#FEE2E2",

                                "&:hover": {
                                  bgcolor:
                                    "#FECACA",
                                },
                              }}
                            >

                              {deletingId ===
                              app.id ? (

                                <CircularProgress
                                  size={20}
                                />

                              ) : (

                                <Delete
                                  sx={{
                                    color:
                                      "#DC2626",
                                  }}
                                />
                              )}

                            </IconButton>

                          </Tooltip>

                        </Stack>
                      )}

                    </Stack>


                   

                  </Stack>

                </CardContent>

              </Card>

            </Grid>
          );
        })}

      </Grid>

    </Box>
  );
}