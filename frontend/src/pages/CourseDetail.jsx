import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Avatar,
  Divider,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";

import {
  ArrowBack,
  School,
  AccessTime,
  VideoLibrary,
  CalendarMonth,
  Payments,
} from "@mui/icons-material";

import {
  getCourseById,
  initializeCoursePayment,
} from "../services/Courseservice";

const BRAND = "#14532d";
const BRAND_LIGHT = "#dcfce7";
const BORDER = "#e5e7eb";
const TEXT_SECONDARY = "#6b7280";

const formatCurrency = (amount) =>
  `₦${Number(amount || 0).toLocaleString(
    "en-NG"
  )}`;

const CourseDetail = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [course, setCourse] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [paying, setPaying] =
    useState(false);

  const [durationMonths, setDurationMonths] =
    useState(1);

  const [tutorialMode, setTutorialMode] =
    useState("onsite");

  const fetchCourse = useCallback(
    async () => {
      try {
        setLoading(true);

        const data =
          await getCourseById(id);

        setCourse(data);

        setTutorialMode(
          data?.tutorialMode || "onsite"
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Failed to load course"
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const monthlyPrice = Number(
    course?.monthlyPrice || 0
  );

  const totalAmount = useMemo(() => {
    let total =
      monthlyPrice * durationMonths;

    if (tutorialMode === "virtual") {
      total += total * 0.5;
    }

    return total;
  }, [
    monthlyPrice,
    durationMonths,
    tutorialMode,
  ]);

  const handlePayment = async () => {
    try {
      setPaying(true);

      const res =
        await initializeCoursePayment({
          courseId: course.id,
          durationMonths,
          tutorialMode,
        });

      window.location.href =
        res.authorization_url;
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Payment initialization failed"
      );
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <CircularProgress
          sx={{ color: BRAND }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (!course) return null;

  const tutorName =
    course.tutor?.fullName ||
    "Instructor";

  return (
    <Box
      bgcolor="#f9fafb"
      minHeight="100vh"
    >

      {/* HEADER */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          bgcolor: "white",
          borderBottom: `1px solid ${BORDER}`,
          px: 3,
          py: 2,
          zIndex: 100,
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Box>

      {/* HERO */}
      <Box
        sx={{
          background:
            "linear-gradient(130deg, #14532d 0%, #166534 100%)",
          px: 4,
          py: 6,
          color: "white",
        }}
      >
        <Typography
          sx={{
            fontSize: {
              xs: 28,
              md: 40,
            },
            fontWeight: 900,
            mb: 2,
          }}
        >
          {course.title}
        </Typography>

        <Typography
          sx={{
            maxWidth: 750,
            opacity: 0.88,
            lineHeight: 1.8,
          }}
        >
          {course.description}
        </Typography>

        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          mt={3}
        >
          <Avatar>
            {tutorName[0]}
          </Avatar>

          <Typography>
            {tutorName}
          </Typography>
        </Box>
      </Box>

      {/* MAIN */}
      <Box px={4} py={4}>
        <Grid container spacing={4}>

          {/* LEFT */}
          <Grid item xs={12} lg={8}>

            {/* ABOUT */}
            <Paper
              sx={{
                p: 3,
                borderRadius: "20px",
                mb: 3,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  fontSize: 20,
                }}
              >
                About this course
              </Typography>

              <Typography
                sx={{
                  color: TEXT_SECONDARY,
                  lineHeight: 1.9,
                }}
              >
                {course.description}
              </Typography>
            </Paper>

            {/* CURRICULUM */}
            <Paper
              sx={{
                p: 3,
                borderRadius: "20px",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  fontSize: 20,
                }}
              >
                Course Curriculum
              </Typography>

              {course.modules?.length >
              0 ? (
                course.modules.map(
                  (module, index) => (
                    <Box
                      key={module.id}
                      sx={{
                        border: `1px solid ${BORDER}`,
                        borderRadius: "14px",
                        p: 2,
                        mb: 2,
                      }}
                    >
                      <Typography
  sx={{
    fontWeight: 700,
    mb: 1,
  }}
>
  Module {index + 1}: {module.title}
</Typography>

{module.description && (
  <Typography
    sx={{
      fontSize: 14,
      color: TEXT_SECONDARY,
      mb: 2,
    }}
  >
    {module.description}
  </Typography>
)}

<Box
  display="flex"
  flexDirection="column"
  gap={1}
>
  {module.Lessons?.length > 0 ? (
    module.Lessons.map(
      (lesson) => (
        <Box
          key={lesson.id}
          sx={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            p: 1.2,
            borderRadius: "10px",
            bgcolor: "#f9fafb",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {lesson.title}
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color:
                  TEXT_SECONDARY,
              }}
            >
              {lesson.type}
            </Typography>
          </Box>

          {lesson.isPreview ? (
            <Chip
              label="Preview"
              size="small"
              color="success"
            />
          ) : (
            <Chip
              label="Locked"
              size="small"
            />
          )}
        </Box>
      )
    )
  ) : (
    <Typography
      sx={{
        fontSize: 13,
        color: TEXT_SECONDARY,
      }}
    >
      No lessons yet
    </Typography>
  )}
</Box>
                    </Box>
                  )
                )
              ) : (
                <Alert severity="info">
                  No modules yet
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* RIGHT */}
          <Grid item xs={12} lg={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: "24px",
                position: "sticky",
                top: 90,
              }}
            >

              {/* PRICE */}
              <Typography
                sx={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: BRAND,
                }}
              >
                {formatCurrency(
                  monthlyPrice
                )}
              </Typography>

              <Typography
                sx={{
                  color: TEXT_SECONDARY,
                  mb: 2,
                }}
              >
                Per Month
              </Typography>

              {/* CHIPS */}
              <Box
                display="flex"
                gap={1}
                flexWrap="wrap"
                mb={3}
              >
                <Chip
                  label={
                    course.category
                  }
                />

                <Chip
                  label={
                    course.level
                  }
                />

                <Chip
                  label={`${course.maxDurationMonths} Months Max`}
                />
              </Box>

              {/* ACTIVE SUB */}
              {course.expiresAt && (
                <Alert
                  severity="success"
                  sx={{ mb: 3 }}
                >
                  Active until{" "}
                  {new Date(
                    course.expiresAt
                  ).toLocaleDateString()}
                </Alert>
              )}

              {/* DURATION */}
              {!course.enrolled && (
                <>
                  <FormControl
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    <InputLabel>
                      Duration
                    </InputLabel>

                    <Select
                      value={
                        durationMonths
                      }
                      label="Duration"
                      onChange={(e) =>
                        setDurationMonths(
                          Number(
                            e.target
                              .value
                          )
                        )
                      }
                    >
                      {Array.from({
                        length:
                          course.maxDurationMonths ||
                          12,
                      }).map(
                        (_, index) => (
                          <MenuItem
                            key={
                              index + 1
                            }
                            value={
                              index + 1
                            }
                          >
                            {index + 1}{" "}
                            Month
                            {index + 1 >
                            1
                              ? "s"
                              : ""}
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </FormControl>

                  {/* MODE */}
                  <FormControl
                    fullWidth
                    sx={{ mb: 3 }}
                  >
                    <InputLabel>
                      Tutorial Mode
                    </InputLabel>

                    <Select
                      value={
                        tutorialMode
                      }
                      label="Tutorial Mode"
                      onChange={(e) =>
                        setTutorialMode(
                          e.target
                            .value
                        )
                      }
                    >
                      <MenuItem value="onsite">
                        Onsite
                      </MenuItem>

                      <MenuItem value="virtual">
                        Virtual
                        (+50%)
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {/* SUMMARY */}
                  <Box
                    sx={{
                      bgcolor:
                        BRAND_LIGHT,
                      borderRadius:
                        "16px",
                      p: 2,
                      mb: 3,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        color:
                          "#166534",
                        mb: 1,
                      }}
                    >
                      Subscription
                      Summary
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 30,
                        fontWeight: 900,
                        color: BRAND,
                      }}
                    >
                      {formatCurrency(
                        totalAmount
                      )}
                    </Typography>

                    <Typography
                      sx={{
                        color:
                          TEXT_SECONDARY,
                        mt: 1,
                      }}
                    >
                      {
                        durationMonths
                      }{" "}
                      month
                      {durationMonths >
                      1
                        ? "s"
                        : ""}{" "}
                      •{" "}
                      {
                        tutorialMode
                      }
                    </Typography>

                    {tutorialMode ===
                      "virtual" && (
                      <Typography
                        sx={{
                          mt: 1,
                          fontSize: 13,
                          color:
                            "#166534",
                        }}
                      >
                        Includes
                        50%
                        virtual
                        learning
                        surcharge
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              {/* BUTTON */}
              {course.enrolled ? (
               <Button
                fullWidth
                variant="contained"
                startIcon={<VideoLibrary />}
                onClick={() =>
                  navigate(`/learn/${course.id}`)
                }
                sx={{
                  bgcolor: BRAND,
                  py: 1.6,
                  borderRadius: "14px",
                  fontWeight: 700,

                  "&:hover": {
                    bgcolor: "#166534",
                  },
                }}
              >
                Continue Learning
              </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={
                    <Payments />
                  }
                  disabled={paying}
                  onClick={
                    handlePayment
                  }
                  sx={{
                    bgcolor: BRAND,
                    py: 1.6,
                    borderRadius:
                      "14px",
                    fontWeight: 700,
                  }}
                >
                  {paying
                    ? "Redirecting..."
                    : "Proceed to Payment"}
                </Button>
              )}

              <Divider sx={{ my: 3 }} />

              {/* FEATURES */}
              <Box
                display="flex"
                flexDirection="column"
                gap={2}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <AccessTime />

                  <Typography>
                    Up to{" "}
                    {
                      course.maxDurationMonths
                    }{" "}
                    months access
                  </Typography>
                </Box>

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <VideoLibrary />

                  <Typography>
                    {course
                      .modules
                      ?.length ||
                      0}{" "}
                    modules
                  </Typography>
                </Box>

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <CalendarMonth />

                  <Typography>
                    Flexible
                    subscription
                  </Typography>
                </Box>

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <School />

                  <Typography>
                    Certificate of
                    completion
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default CourseDetail;