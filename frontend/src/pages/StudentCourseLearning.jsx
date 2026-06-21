// src/pages/StudentCourseLearning.jsx

import React, {
  useEffect,
  useState,
} from "react";

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  LinearProgress,
  Chip,
  Divider,
  Paper,
  Stack,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockIcon from "@mui/icons-material/Lock";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import QuizIcon from "@mui/icons-material/Quiz";
import ImageIcon from "@mui/icons-material/Image";
import LinkIcon from "@mui/icons-material/Link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { useParams } from "react-router-dom";

import {
  getCourseModules,
  getCourseProgress,
  getEnrollmentStatus,
  getContinueLearning,
  getCompletionStatus,
  getSecureLesson,
  completeLesson,
  updateLessonAccess,
} from "../services/studentLessonService";

const BRAND = "#1E7F4F";
const PURPLE = "#0B1F3A";

const StudentCourseLearning = () => {
  const { courseId } = useParams();

  const [loading, setLoading] =
    useState(true);

  const [modules, setModules] =
    useState([]);

  const [selectedLesson,
    setSelectedLesson] =
    useState(null);

  const [lessonContent,
    setLessonContent] =
    useState(null);

  const [progress,
    setProgress] =
    useState(null);

  const [enrollment,
    setEnrollment] =
    useState(null);

  const [completion,
    setCompletion] =
    useState(null);

  const [continueLesson,
    setContinueLesson] =
    useState(null);

  // ==========================================
  // FETCH DATA
  // ==========================================

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {

      setLoading(true);

      const [
        modulesRes,
        progressRes,
        enrollmentRes,
        continueRes,
        completionRes,
      ] = await Promise.all([
        getCourseModules(courseId),
        getCourseProgress(courseId),
        getEnrollmentStatus(courseId),
        getContinueLearning(courseId),
        getCompletionStatus(courseId),
      ]);

      setModules(
        modulesRes.modules || []
      );

      setProgress(progressRes);

      setEnrollment(
        enrollmentRes
      );

      setContinueLesson(
        continueRes
      );

      setCompletion(
        completionRes
      );

      // AUTO RESUME
      if (
        continueRes?.lesson
      ) {
        await handleOpenLesson(
          continueRes.lesson
        );
      }

    } catch (err) {

      console.error(err);

      alert(
        "Failed to load course"
      );

    } finally {

      setLoading(false);
    }
  };

  // ==========================================
  // OPEN LESSON
  // ==========================================

  const handleOpenLesson =
    async (lesson) => {

      try {

        if (
          lesson.isLocked
        ) {
          return alert(
            "This lesson is locked"
          );
        }

        setSelectedLesson(
          lesson
        );

        const res =
          await getSecureLesson(
            lesson.id
          );

        setLessonContent(
          res
        );

        await updateLessonAccess(
          lesson.id
        );

      } catch (err) {

        console.error(err);

        alert(
          err.response?.data
            ?.message ||
            "Failed to load lesson"
        );
      }
    };

  // ==========================================
  // COMPLETE
  // ==========================================

  const handleCompleteLesson =
    async () => {

      try {

        await completeLesson(
          selectedLesson.id,
          0
        );

        alert(
          "Lesson completed"
        );

        fetchData();

      } catch (err) {

        console.error(err);

        alert(
          err.response?.data
            ?.message ||
            "Completion failed"
        );
      }
    };

  // ==========================================
  // NEXT LESSON
  // ==========================================

  const handleNextLesson =
    async () => {

      try {

        await completeLesson(
          selectedLesson.id,
          0
        );

        const nextLesson =
          getNextLesson();

        if (!nextLesson) {

          alert(
            "Course completed 🎉"
          );

          fetchData();

          return;
        }

        await handleOpenLesson(
          nextLesson
        );

        fetchData();

      } catch (err) {

        console.error(err);

        alert(
          "Failed to move to next lesson"
        );
      }
    };

  // ==========================================
  // GET NEXT LESSON
  // ==========================================

  const getNextLesson =
    () => {

      if (!selectedLesson)
        return null;

      const allLessons = [];

      modules.forEach(
        (module) => {

          module.lessons.forEach(
            (lesson) => {

              if (
                !lesson.isLocked
              ) {
                allLessons.push(
                  lesson
                );
              }
            }
          );
        }
      );

      const currentIndex =
        allLessons.findIndex(
          (lesson) =>
            lesson.id ===
            selectedLesson.id
        );

      return (
        allLessons[
          currentIndex + 1
        ] || null
      );
    };

  // ==========================================
  // ICONS
  // ==========================================

  const getLessonIcon =
    (type) => {

      switch (type) {

        case "video":
          return (
            <PlayCircleIcon />
          );

        case "pdf":
          return (
            <DescriptionIcon />
          );

        case "quiz":
          return (
            <QuizIcon />
          );

        case "image":
          return (
            <ImageIcon />
          );

        case "link":
          return (
            <LinkIcon />
          );

        default:
          return (
            <MenuBookIcon />
          );
      }
    };

  // ==========================================
  // CONTENT
  // ==========================================

  const renderLessonContent =
    () => {

      if (!lessonContent)
        return null;

      switch (
        lessonContent.type
      ) {

        case "video":

          return (
            <Box>

              {lessonContent.embedUrl ? (

                <iframe
                  width="100%"
                  height="550"
                  src={
                    lessonContent.embedUrl
                  }
                  title="Video"
                  allowFullScreen
                  style={{
                    border: "none",
                    borderRadius: 16,
                  }}
                />

              ) : (

                <video
                  controls
                  width="100%"
                  style={{
                    borderRadius: 16,
                  }}
                  src={
                    lessonContent.contentUrl
                  }
                />
              )}

            </Box>
          );

        case "pdf":

          return (
            <iframe
              src={
                lessonContent.contentUrl
              }
              width="100%"
              height="800"
              title="PDF"
              style={{
                border: "none",
                borderRadius: 16,
              }}
            />
          );

        case "image":

          return (
            <img
              src={
                lessonContent.contentUrl
              }
              alt="lesson"
              style={{
                width: "100%",
                borderRadius: 16,
              }}
            />
          );

        case "text":

          return (
            <Typography
              sx={{
                lineHeight: 2,
                fontSize: "1.05rem",
              }}
            >
              {
                lessonContent.contentText
              }
            </Typography>
          );

        case "link":

          return (
            <Button
              variant="contained"
              href={
                lessonContent.contentUrl
              }
              target="_blank"
              sx={{
                bgcolor: PURPLE,
              }}
            >
              Open External Resource
            </Button>
          );

        case "quiz":

          return (
            <Typography>
              Quiz lesson attached
            </Typography>
          );

        default:

          return (
            <Typography>
              Unsupported lesson
            </Typography>
          );
      }
    };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="70vh"
      >
        <CircularProgress
          size={60}
        />
      </Box>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <Box
      sx={{
        bgcolor: "#f8fafc",
        minHeight: "100vh",
        p: {
          xs: 2,
          md: 4,
        },
      }}
    >

      {/* HEADER */}

      <Paper
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 5,

          background:
            "linear-gradient(135deg, #1E7F4F 0%, #145A32 100%)",

          color: "#fff",
        }}
      >

        <Typography
          variant="h3"
          fontWeight="bold"
        >
          Course Learning
        </Typography>

        <Typography
          sx={{
            opacity: 0.9,
            mt: 1,
          }}
        >
          Continue your learning journey
        </Typography>

      </Paper>

      {/* STATS */}

      <Grid
        container
        spacing={3}
        mb={4}
      >

        <Grid item xs={12} md={4}>

          <Paper
            sx={{
              p: 3,
              borderRadius: 5,
            }}
          >

            <Typography
              fontWeight="bold"
              mb={2}
            >
              Progress
            </Typography>

            <LinearProgress
              variant="determinate"
              value={
                progress?.progress || 0
              }
              sx={{
                height: 12,
                borderRadius: 20,
              }}
            />

            <Typography
              mt={2}
              fontWeight="bold"
            >
              {
                progress?.progress || 0
              }%
            </Typography>

          </Paper>

        </Grid>

        <Grid item xs={12} md={4}>

          <Paper
            sx={{
              p: 3,
              borderRadius: 5,
            }}
          >

            <Typography
              fontWeight="bold"
              mb={2}
            >
              Enrollment
            </Typography>

            <Chip
              label={
                enrollment?.status ||
                "Not Enrolled"
              }

              sx={{
                bgcolor: "#DCFCE7",
                color: "#166534",
                fontWeight: "bold",
              }}
            />

          </Paper>

        </Grid>

        <Grid item xs={12} md={4}>

          <Paper
            sx={{
              p: 3,
              borderRadius: 5,
            }}
          >

            <Typography
              fontWeight="bold"
              mb={2}
            >
              Completion
            </Typography>

            <Typography
              variant="h5"
              fontWeight="bold"
            >
              {
                completion?.percentage || 0
              }%
            </Typography>

          </Paper>

        </Grid>

      </Grid>

      {/* MAIN */}

      <Grid
        container
        spacing={4}
      >

        {/* SIDEBAR */}

        <Grid
          item
          xs={12}
          md={4}
        >

          <Paper
            sx={{
              borderRadius: 5,
              overflow: "hidden",
              position: "sticky",
              top: 20,
            }}
          >

            <Box
              p={3}
              sx={{
                bgcolor: PURPLE,
                color: "#fff",
              }}
            >

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Course Content
              </Typography>

            </Box>

            <Box
              sx={{
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >

              {modules.map(
                (
                  module,
                  moduleIndex
                ) => (

                  <Accordion
                    key={module.id}
                    defaultExpanded
                    disableGutters
                    sx={{
                      boxShadow: "none",
                    }}
                  >

                    <AccordionSummary
                      expandIcon={
                        <ExpandMoreIcon />
                      }
                    >

                      <Box>

                        <Typography
                          fontWeight="bold"
                        >
                          Module
                          {" "}
                          {moduleIndex + 1}
                        </Typography>

                        <Typography
                          variant="body2"
                        >
                          {module.title}
                        </Typography>

                      </Box>

                    </AccordionSummary>

                    <AccordionDetails>

                      {module.lessons.map(
                        (
                          lesson,
                          lessonIndex
                        ) => {

                          const isActive =
                            selectedLesson?.id ===
                            lesson.id;

                          return (

                            <Card
                              key={lesson.id}

                              onClick={() =>
                                handleOpenLesson(
                                  lesson
                                )
                              }

                              sx={{
                                mb: 2,

                                cursor:
                                  lesson.isLocked
                                    ? "not-allowed"
                                    : "pointer",

                                opacity:
                                  lesson.isLocked
                                    ? 0.5
                                    : 1,

                                borderRadius: 4,

                                border:
                                  isActive
                                    ? `2px solid ${PURPLE}`
                                    : "1px solid #e2e8f0",

                                backgroundColor:
                                  isActive
                                    ? "#f5f3ff"
                                    : "#fff",

                                transition:
                                  "0.2s ease",

                                "&:hover": {
                                  transform:
                                    lesson.isLocked
                                      ? "none"
                                      : "translateY(-2px)",

                                  boxShadow:
                                    lesson.isLocked
                                      ? "none"
                                      : 3,
                                },
                              }}
                            >

                              <CardContent>

                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                  alignItems="center"
                                >

                                  <Stack
                                    direction="row"
                                    spacing={1.5}
                                    alignItems="center"
                                  >

                                    {getLessonIcon(
                                      lesson.type
                                    )}

                                    <Box>

                                      <Typography
                                        fontWeight={600}
                                      >
                                        {lessonIndex + 1}.
                                        {" "}
                                        {lesson.title}
                                      </Typography>

                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {lesson.type}
                                      </Typography>

                                    </Box>

                                  </Stack>

                                  {lesson.isLocked ? (

                                    <LockIcon
                                      color="disabled"
                                    />

                                  ) : (

                                    <PlayCircleIcon
                                      sx={{
                                        color:
                                          PURPLE,
                                      }}
                                    />

                                  )}

                                </Box>

                              </CardContent>

                            </Card>
                          );
                        }
                      )}

                    </AccordionDetails>

                  </Accordion>
                )
              )}

            </Box>

          </Paper>

        </Grid>

        {/* CONTENT */}

        <Grid
          item
          xs={12}
          md={8}
        >

          <Paper
            sx={{
              borderRadius: 5,
              overflow: "hidden",
            }}
          >

            {!lessonContent ? (

              <Box
                p={8}
                textAlign="center"
              >

                <MenuBookIcon
                  sx={{
                    fontSize: 70,
                    color: PURPLE,
                    mb: 2,
                  }}
                />

                <Typography
                  variant="h5"
                  fontWeight="bold"
                  mb={2}
                >
                  Select a Lesson
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  Choose a lesson from the course
                  content sidebar to begin learning.
                </Typography>

              </Box>

            ) : (

              <>

                {/* HEADER */}

                <Box
                  p={4}
                  sx={{
                    background:
                      "linear-gradient(135deg, #1E7F4F 0%, #145A32 100%)",

                    color: "#fff",
                  }}
                >

                  <Chip
                    label={
                      lessonContent.type
                    }

                    sx={{
                      bgcolor:
                        "rgba(255,255,255,0.2)",

                      color: "#fff",

                      mb: 2,
                    }}
                  />

                  <Typography
                    variant="h4"
                    fontWeight="bold"
                  >
                    {
                      lessonContent.title
                    }
                  </Typography>

                </Box>

                {/* CONTENT */}

                <Box p={4}>

                  {renderLessonContent()}

                </Box>

                <Divider />

                {/* ACTIONS */}

                <Box
                  p={3}
                  display="flex"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  gap={2}
                >

                  <Button
                    variant="outlined"
                    startIcon={
                      <CheckCircleIcon />
                    }

                    onClick={
                      handleCompleteLesson
                    }

                    sx={{
                      borderRadius: 3,
                    }}
                  >
                    Mark Complete
                  </Button>

                  <Button
                    variant="contained"
                    endIcon={
                      <ArrowForwardIcon />
                    }

                    onClick={
                      handleNextLesson
                    }

                    sx={{
                      bgcolor: PURPLE,

                      borderRadius: 3,

                      fontWeight: "bold",

                      "&:hover": {
                        bgcolor:
                          "#5B21B6",
                      },
                    }}
                  >
                    Next Lesson
                  </Button>

                </Box>

              </>
            )}

          </Paper>

        </Grid>

      </Grid>

    </Box>
  );
};

export default StudentCourseLearning;