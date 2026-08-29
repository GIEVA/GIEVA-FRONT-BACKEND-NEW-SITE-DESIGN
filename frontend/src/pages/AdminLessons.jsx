import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  createLesson,
  getModuleLessons,
  updateLesson,
  deleteLesson,
  toggleLessonPublish
} from "../services/lessonService";

import {
  createQuiz,
  addQuestion,
} from "../services/courseQuizService";

import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon
from "@mui/icons-material/ExpandMore";

import VisibilityIcon
from "@mui/icons-material/Visibility";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";


const lessonTypes = [
  "video",
  "pdf",
  "image",
  "link",
  "text",
  "quiz",
];

const initialLessonState = {
  title: "",
  type: "video",
  contentText: "",
  youtubeUrl: "",
  orderIndex: "",
  durationSeconds: "",
  isPreview: false,
  quizId: "",
};

const initialQuizState = {
  title: "",
  description: "",
  durationMinutes: 30,
  totalMarks: 100,
};

const initialQuestionState = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "",
  marks: 1,
};

const AdminLessons = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [open, setOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [lessonForm, setLessonForm] =
    useState(initialLessonState);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [quizForm, setQuizForm] =
    useState(initialQuizState);

  const [createdQuizId, setCreatedQuizId] =
    useState(null);

  const [questionForm, setQuestionForm] =
    useState(initialQuestionState);

    const [
  previewLesson,
  setPreviewLesson,
] = useState(null);

const handlePreviewLesson =
  (lesson) => {
    setPreviewLesson(lesson);
  };

  // ============================================
  // FETCH LESSONS
  // ============================================

  const fetchLessons = async () => {
    try {
      setLoading(true);

      const data =
        await getModuleLessons(
          moduleId
        );

      setLessons(data);

    } catch (err) {
      console.error(err);
      alert("Failed to fetch lessons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  // ============================================
  // CREATE / UPDATE LESSON
  // ============================================

  const handleSubmitLesson =
    async () => {
      try {
        if (
          !lessonForm.title ||
          !lessonForm.type
        ) {
          return alert(
            "Title and type are required"
          );
        }

        const formData =
          new FormData();

        formData.append(
          "title",
          lessonForm.title
        );

        formData.append(
          "moduleId",
          moduleId
        );

        formData.append(
          "type",
          lessonForm.type
        );

        formData.append(
          "contentText",
          lessonForm.contentText
        );

        formData.append(
          "youtubeUrl",
          lessonForm.youtubeUrl
        );

        formData.append(
          "orderIndex",
          lessonForm.orderIndex
        );

        formData.append(
          "durationSeconds",
          lessonForm.durationSeconds
        );

        formData.append(
          "isPreview",
          lessonForm.isPreview
        );

        if (lessonForm.quizId) {
          formData.append(
            "quizId",
            lessonForm.quizId
          );
        }

        if (selectedFile) {
          formData.append(
            "file",
            selectedFile
          );
        }

        if (editingId) {
          await updateLesson(
            editingId,
            formData
          );

          alert(
            "Lesson updated successfully"
          );

        } else {
          await createLesson(
            formData
          );

          alert(
            "Lesson created successfully"
          );
        }

        setOpen(false);

        setEditingId(null);

        setLessonForm(
          initialLessonState
        );

        setSelectedFile(null);

        fetchLessons();

      } catch (err) {
        console.error(err);

        alert(
          err.response?.data
            ?.message ||
            "Lesson operation failed"
        );
      }
    };

  // ============================================
  // EDIT LESSON
  // ============================================

  const handleEdit = (
    lesson
  ) => {
    setEditingId(lesson.id);

    setLessonForm({
      title: lesson.title,
      type: lesson.type,
      contentText:
        lesson.contentText || "",
      youtubeUrl:
        lesson.contentUrl || "",
      orderIndex:
        lesson.orderIndex || "",
      durationSeconds:
        lesson.durationSeconds ||
        "",

      isPreview:
        lesson.isPreview || false,

      quizId:
        lesson.quizId || "",
    });

    setOpen(true);
  };

  // ============================================
  // DELETE LESSON
  // ============================================

  const handleDelete =
    async (id) => {
      if (
        !window.confirm(
          "Delete this lesson?"
        )
      )
        return;

      try {
        await deleteLesson(id);

        fetchLessons();

      } catch (err) {
        console.error(err);

        alert("Delete failed");
      }
    };

    const handlePublish =
  async (id) => {
    try {

      await toggleLessonPublish(id);

      fetchLessons();

    } catch (err) {
      console.error(err);

      alert(
        "Failed to update publish status"
      );
    }
  };

  // ============================================
  // CREATE QUIZ
  // ============================================

  const handleCreateQuiz =
    async () => {
      try {
        const payload = {
          ...quizForm,
          courseId: 1,
        };

        const res =
          await createQuiz(
            payload
          );

        setCreatedQuizId(
          res.quiz.id
        );

        setLessonForm(
          (prev) => ({
            ...prev,
            quizId:
              res.quiz.id,
          })
        );

        alert(
          "Quiz created successfully"
        );

      } catch (err) {
        console.error(err);

        alert(
          err.response?.data
            ?.message ||
            "Quiz creation failed"
        );
      }
    };

  // ============================================
  // ADD QUESTION
  // ============================================

  const handleAddQuestion =
    async () => {
      try {
        if (!createdQuizId) {
          return alert(
            "Create quiz first"
          );
        }

        await addQuestion(
          createdQuizId,
          questionForm
        );

        alert(
          "Question added"
        );

        setQuestionForm(
          initialQuestionState
        );

      } catch (err) {
        console.error(err);

        alert(
          err.response?.data
            ?.message ||
            "Question add failed"
        );
      }
    };

  return (
    <Box p={4}>
      {/* HEADER */}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
        >
          Module Lessons
        </Typography>

        <Button
          variant="contained"
          onClick={() => {
            setEditingId(null);

            setLessonForm(
              initialLessonState
            );

            setOpen(true);
          }}

          sx={{
            bgcolor: "#0B1F3A",

            "&:hover": {
              bgcolor: "#6A1B9A",
            },

            borderRadius: "12px",

            px: 3,

            fontWeight: 700,

            textTransform: "none",
          }}
        >
          Add Lesson
        </Button>
      </Box>

      {/* LESSONS */}

      <Grid container spacing={3}>

        {lessons.map((lesson) => (

          <Grid
            item
            xs={12}
            md={6}
            lg={4}
            key={lesson.id}
          >

            <Card
              sx={{
                borderRadius: 4,
                transition: "0.25s ease",

                border:
                  "1px solid #f1f5f9",

                "&:hover": {
                  transform:
                    "translateY(-5px)",

                  boxShadow:
                    "0 12px 25px rgba(0,0,0,0.08)",
                },
              }}
            >

              <CardContent>

                {/* TOP */}

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >

                  <Box>

                    <Typography
                      variant="h6"
                      fontWeight="bold"
                    >
                      {lesson.title}
                    </Typography>

                    <Chip
                      label={lesson.type}
                      size="small"
                      sx={{
                        mt: 1,

                        bgcolor:
                          "#0B1F3A",

                        color: "#fff",

                        fontWeight: 700,
                      }}
                    />

                  </Box>



                  <Switch
                    checked={lesson.isPublished}

                    onChange={(e) => {

                      e.stopPropagation();

                      handlePublish(
                        lesson.id
                      );
                    }}
                  />

                </Box>



                {/* DESCRIPTION */}

                <Box mt={3}>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mb={1}
                  >
                    Order Index:
                    {" "}
                    {lesson.orderIndex}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mb={1}
                  >
                    Duration:
                    {" "}
                    {
                      lesson.durationSeconds
                    }{" "}
                    sec
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Preview:
                    {" "}
                    {lesson.isPreview
                      ? "Yes"
                      : "No"}
                  </Typography>

                </Box>



                {/* STATUS */}

                <Box mt={2}>

                  <Chip
                    label={
                      lesson.isPublished
                        ? "Published"
                        : "Draft"
                    }

                    sx={{
                      bgcolor:
                        lesson.isPublished
                          ? "#DCFCE7"
                          : "#FEF3C7",

                      color:
                        lesson.isPublished
                          ? "#166534"
                          : "#92400E",

                      fontWeight: 700,
                    }}
                  />

                </Box>



                <Divider sx={{ my: 3 }} />



                {/* ACTIONS */}

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >

                  <Button
                    variant="contained"

                    startIcon={
                      <VisibilityIcon />
                    }

                    onClick={() =>
                      handlePreviewLesson(
                        lesson
                      )
                    }

                    sx={{
                      bgcolor:
                        "#1E7F4F",

                      borderRadius: 3,

                      textTransform:
                        "none",

                      fontWeight: 700,

                      "&:hover": {
                        bgcolor:
                          "#145A32",
                      },
                    }}
                  >
                    View Content
                  </Button>



                  <Box>

                    <IconButton
                      onClick={() =>
                        handleEdit(
                          lesson
                        )
                      }
                    >
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      onClick={() =>
                        handleDelete(
                          lesson.id
                        )
                      }
                    >
                      <DeleteIcon
                        color="error"
                      />
                    </IconButton>

                  </Box>

                </Box>

              </CardContent>

            </Card>

          </Grid>
        ))}

      </Grid>

      {/* DIALOG */}

      <Dialog
        open={open}
        onClose={() =>
          setOpen(false)
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingId
            ? "Edit Lesson"
            : "Create Lesson"}
        </DialogTitle>

        <DialogContent>
          {/* TITLE */}

          <TextField
            fullWidth
            label="Lesson Title"
            margin="normal"
            value={
              lessonForm.title
            }
            onChange={(e) =>
              setLessonForm({
                ...lessonForm,
                title:
                  e.target.value,
              })
            }
          />

          {/* TYPE */}

          <TextField
            select
            fullWidth
            label="Lesson Type"
            margin="normal"
            value={
              lessonForm.type
            }
            onChange={(e) =>
              setLessonForm({
                ...lessonForm,
                type:
                  e.target.value,
              })
            }
          >
            {lessonTypes.map(
              (type) => (
                <MenuItem
                  key={type}
                  value={type}
                >
                  {type}
                </MenuItem>
              )
            )}
          </TextField>

          {/* TEXT */}

          {(lessonForm.type ===
            "text" ||
            lessonForm.type ===
              "link") && (
            <TextField
              fullWidth
              multiline
              rows={5}
              label={
                lessonForm.type ===
                "link"
                  ? "Paste Link"
                  : "Lesson Text"
              }
              margin="normal"
              value={
                lessonForm.contentText
              }
              onChange={(e) =>
                setLessonForm({
                  ...lessonForm,
                  contentText:
                    e.target
                      .value,
                })
              }
            />
          )}

          {/* VIDEO */}

          {lessonForm.type ===
            "video" && (
            <TextField
              fullWidth
              label="YouTube URL"
              margin="normal"
              value={
                lessonForm.youtubeUrl
              }
              onChange={(e) =>
                setLessonForm({
                  ...lessonForm,
                  youtubeUrl:
                    e.target
                      .value,
                })
              }
            />
          )}

          {/* PDF / IMAGE */}

          {(lessonForm.type ===
            "pdf" ||
            lessonForm.type ===
              "image") && (
            <Box mt={3}>
              <input
                type="file"
                onChange={(e) =>
                  setSelectedFile(
                    e.target
                      .files[0]
                  )
                }
              />
            </Box>
          )}

          {/* QUIZ */}

          {lessonForm.type ===
            "quiz" && (
            <Box mt={4}>
              <Divider />

              <Typography
                variant="h6"
                mt={3}
              >
                Quiz Builder
              </Typography>

              {/* QUIZ FORM */}

              <TextField
                fullWidth
                label="Quiz Title"
                margin="normal"
                value={
                  quizForm.title
                }
                onChange={(e) =>
                  setQuizForm({
                    ...quizForm,
                    title:
                      e.target
                        .value,
                  })
                }
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Quiz Description"
                margin="normal"
                value={
                  quizForm.description
                }
                onChange={(e) =>
                  setQuizForm({
                    ...quizForm,
                    description:
                      e.target
                        .value,
                  })
                }
              />

              <TextField
                fullWidth
                type="number"
                label="Duration Minutes"
                margin="normal"
                value={
                  quizForm.durationMinutes
                }
                onChange={(e) =>
                  setQuizForm({
                    ...quizForm,
                    durationMinutes:
                      e.target
                        .value,
                  })
                }
              />

              <TextField
                fullWidth
                type="number"
                label="Total Marks"
                margin="normal"
                value={
                  quizForm.totalMarks
                }
                onChange={(e) =>
                  setQuizForm({
                    ...quizForm,
                    totalMarks:
                      e.target
                        .value,
                  })
                }
              />

              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={
                  handleCreateQuiz
                }
              >
                Create Quiz
              </Button>

              {/* QUESTIONS */}

              {createdQuizId && (
                <>
                  <Divider
                    sx={{
                      my: 4,
                    }}
                  />

                  <Typography variant="h6">
                    Add Questions
                  </Typography>

                  <TextField
                    fullWidth
                    label="Question"
                    margin="normal"
                    value={
                      questionForm.questionText
                    }
                    onChange={(
                      e
                    ) =>
                      setQuestionForm(
                        {
                          ...questionForm,
                          questionText:
                            e
                              .target
                              .value,
                        }
                      )
                    }
                  />

                  <TextField
                    fullWidth
                    label="Option A"
                    margin="normal"
                    value={
                      questionForm.optionA
                    }
                    onChange={(
                      e
                    ) =>
                      setQuestionForm(
                        {
                          ...questionForm,
                          optionA:
                            e
                              .target
                              .value,
                        }
                      )
                    }
                  />

                  <TextField
                    fullWidth
                    label="Option B"
                    margin="normal"
                    value={
                      questionForm.optionB
                    }
                    onChange={(
                      e
                    ) =>
                      setQuestionForm(
                        {
                          ...questionForm,
                          optionB:
                            e
                              .target
                              .value,
                        }
                      )
                    }
                  />

                  <TextField
                    fullWidth
                    label="Option C"
                    margin="normal"
                    value={
                      questionForm.optionC
                    }
                    onChange={(
                      e
                    ) =>
                      setQuestionForm(
                        {
                          ...questionForm,
                          optionC:
                            e
                              .target
                              .value,
                        }
                      )
                    }
                  />

                  <TextField
                    fullWidth
                    label="Option D"
                    margin="normal"
                    value={
                      questionForm.optionD
                    }
                    onChange={(
                      e
                    ) =>
                      setQuestionForm(
                        {
                          ...questionForm,
                          optionD:
                            e
                              .target
                              .value,
                        }
                      )
                    }
                  />

                  <TextField
                    fullWidth
                    label="Correct Answer"
                    margin="normal"
                    value={
                      questionForm.correctAnswer
                    }
                    onChange={(
                      e
                    ) =>
                      setQuestionForm(
                        {
                          ...questionForm,
                          correctAnswer:
                            e
                              .target
                              .value,
                        }
                      )
                    }
                  />

                  <TextField
                    fullWidth
                    type="number"
                    label="Marks"
                    margin="normal"
                    value={
                      questionForm.marks
                    }
                    onChange={(
                      e
                    ) =>
                      setQuestionForm(
                        {
                          ...questionForm,
                          marks:
                            e
                              .target
                              .value,
                        }
                      )
                    }
                  />

                  <Button
                    variant="outlined"
                    sx={{
                      mt: 2,
                    }}
                    onClick={
                      handleAddQuestion
                    }
                  >
                    Add Question
                  </Button>
                </>
              )}
            </Box>
          )}

          {/* SETTINGS */}

          <Divider sx={{ my: 4 }} />

          <TextField
            fullWidth
            type="number"
            label="Order Index"
            margin="normal"
            value={
              lessonForm.orderIndex
            }
            onChange={(e) =>
              setLessonForm({
                ...lessonForm,
                orderIndex:
                  e.target.value,
              })
            }
          />

          <TextField
            fullWidth
            type="number"
            label="Duration Seconds"
            margin="normal"
            value={
              lessonForm.durationSeconds
            }
            onChange={(e) =>
              setLessonForm({
                ...lessonForm,
                durationSeconds:
                  e.target.value,
              })
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={
                  lessonForm.isPreview
                }
                onChange={(e) =>
                  setLessonForm({
                    ...lessonForm,
                    isPreview:
                      e.target
                        .checked,
                  })
                }
              />
            }
            label="Preview Lesson"
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setOpen(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={
              handleSubmitLesson
            }
          >
            {editingId
              ? "Update Lesson"
              : "Create Lesson"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* LESSON PREVIEW */}

      <Dialog
        open={!!previewLesson}
        onClose={() =>
          setPreviewLesson(null)
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {previewLesson?.title}
        </DialogTitle>

        <DialogContent>

          {/* TYPE */}
          <Typography
            mb={2}
            color="text.secondary"
          >
            Type:
            {" "}
            {previewLesson?.type}
          </Typography>

          {/* TEXT */}
          {previewLesson?.type ===
            "text" && (
            <Typography>
              {
                previewLesson?.contentText
              }
            </Typography>
          )}

          {/* LINK */}
          {previewLesson?.type ===
            "link" && (
            <a
              href={
                previewLesson?.contentText
              }
              target="_blank"
              rel="noreferrer"
            >
              Open Link
            </a>
          )}

          {/* VIDEO */}
          {previewLesson?.type ===
            "video" &&
            previewLesson?.contentUrl && (
              <iframe
                width="100%"
                height="400"
                src={
                  previewLesson.contentUrl.replace(
                    "watch?v=",
                    "embed/"
                  )
                }
                title="Lesson Video"
                allowFullScreen
                style={{
                  border: "none",
                  borderRadius: 12,
                }}
              />
            )}

          {/* IMAGE */}
          {previewLesson?.type ===
            "image" && (
            <img
              src={
                previewLesson?.contentUrl
              }
              alt="lesson"
              style={{
                width: "100%",
                borderRadius: 12,
              }}
            />
          )}

          {/* PDF */}
          {previewLesson?.type ===
            "pdf" && (
            <iframe
              src={
                previewLesson?.contentUrl
              }
              width="100%"
              height="600"
              title="PDF"
              style={{
                border: "none",
              }}
            />
          )}

          {/* QUIZ */}
          {previewLesson?.type ===
            "quiz" && (
            <Typography>
              Quiz Lesson
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setPreviewLesson(null)
            }
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};



export default AdminLessons;