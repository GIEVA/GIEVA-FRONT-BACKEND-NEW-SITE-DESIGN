import { useEffect, useState } from "react";

import {
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse,
  toggleCoursePublish,
} from "../services/adminCourseService";

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  Switch,
  Stack,
  Chip,
  Avatar,
  Divider,
  Tooltip,
  Paper,
} from "@mui/material";

import {
  Add,
  Delete,
  Edit,
  MenuBook,
  School,
  Visibility,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

const BRAND = "#1E7F4F";
const PURPLE = "#0B1F3A";

const initialState = {
  title: "",
  description: "",
  category: "SAT",
  monthlyPrice: "",
  tutorialMode: "onsite",
  maxDurationMonths: 12,
  level: "",
  thumbnail: "",
  isPublished: false,
};

const AdminCourses = () => {

  const [courses,
    setCourses] =
    useState([]);

  const [loading,
    setLoading] =
    useState(false);

  const [open,
    setOpen] =
    useState(false);

  const [editingId,
    setEditingId] =
    useState(null);

  const [submitting,
    setSubmitting] =
    useState(false);

  const [form,
    setForm] =
    useState(initialState);

  const navigate =
    useNavigate();



  // ======================================================
  // FETCH COURSES
  // ======================================================

  const fetchCourses =
    async () => {

      try {

        setLoading(true);

        const data =
          await getAllCourses();

        setCourses(data);

      } catch (err) {

        console.error(err);

        alert(
          "Failed to fetch courses"
        );

      } finally {

        setLoading(false);
      }
    };



  useEffect(() => {
    fetchCourses();
  }, []);



  // ======================================================
  // HANDLE INPUTS
  // ======================================================

  const handleChange =
    (e) => {

      const {
        name,
        value,
      } = e.target;

      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    };



  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit =
    async () => {

      try {

        if (
          !form.title ||
          !form.description ||
          !form.monthlyPrice
        ) {

          return alert(
            "Please complete required fields"
          );
        }

        setSubmitting(true);

        if (editingId) {

          await updateCourse(
            editingId,
            form
          );

          alert(
            "Course updated successfully"
          );

        } else {

          await createCourse(form);

          alert(
            "Course created successfully"
          );
        }

        setOpen(false);

        setForm(initialState);

        setEditingId(null);

        fetchCourses();

      } catch (err) {

        console.error(err);

        alert(
          err.response?.data?.message ||
          "Operation failed"
        );

      } finally {

        setSubmitting(false);
      }
    };



  // ======================================================
  // EDIT
  // ======================================================

  const handleEdit =
    (course) => {

      setEditingId(course.id);

      setForm({
        title: course.title,
        description:
          course.description,

        category:
          course.category,

        monthlyPrice:
          course.monthlyPrice,

        tutorialMode:
          course.tutorialMode,

        maxDurationMonths:
          course.maxDurationMonths,

        level:
          course.level,

        thumbnail:
          course.thumbnail,

        isPublished:
          course.isPublished,
      });

      setOpen(true);
    };



  // ======================================================
  // TOGGLE PUBLISH
  // ======================================================

  const handleTogglePublish =
    async (courseId) => {

      try {

        await toggleCoursePublish(
          courseId
        );

        fetchCourses();

      } catch (err) {

        alert(
          err?.response?.data
            ?.message ||
          "Failed to update course"
        );
      }
    };



  // ======================================================
  // DELETE
  // ======================================================

  const handleDelete =
    async (id) => {

      if (
        !window.confirm(
          "Delete this course?"
        )
      ) {
        return;
      }

      try {

        await deleteCourse(id);

        fetchCourses();

      } catch (err) {

        console.error(err);

        alert("Delete failed");
      }
    };



  return (

    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        p: {
          xs: 2,
          md: 4,
        },
      }}
    >

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 5,
          mb: 4,
          background:
            "linear-gradient(135deg, #1E7F4F 0%, #145A32 100%)",
          color: "#fff",
        }}
      >

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={3}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            md: "center",
          }}
        >

          <Box>

            <Typography
              variant="h4"
              fontWeight="bold"
            >
              Course Management
            </Typography>

            <Typography
              mt={1}
              sx={{
                opacity: 0.9,
              }}
            >
              Create, manage and publish LMS courses
            </Typography>

          </Box>



          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {

              setEditingId(null);

              setForm(initialState);

              setOpen(true);
            }}
            sx={{
              bgcolor: PURPLE,
              borderRadius: 3,
              px: 3,
              py: 1.4,
              fontWeight: 700,

              "&:hover": {
                bgcolor: "#5B21B6",
              },
            }}
          >
            Add Course
          </Button>

        </Stack>

      </Paper>



      {/* ====================================================== */}
      {/* STATS */}
      {/* ====================================================== */}

      <Grid
        container
        spacing={3}
        mb={4}
      >

        <Grid item xs={12} md={4}>

          <Card
            sx={{
              borderRadius: 4,
            }}
          >

            <CardContent>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >

                <Box>

                  <Typography
                    color="text.secondary"
                  >
                    Total Courses
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight="bold"
                  >
                    {courses.length}
                  </Typography>

                </Box>

                <Avatar
                  sx={{
                    bgcolor:
                      "#E8F5E9",
                  }}
                >
                  <School
                    sx={{
                      color:
                        BRAND,
                    }}
                  />
                </Avatar>

              </Stack>

            </CardContent>

          </Card>

        </Grid>



        <Grid item xs={12} md={4}>

          <Card
            sx={{
              borderRadius: 4,
            }}
          >

            <CardContent>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >

                <Box>

                  <Typography
                    color="text.secondary"
                  >
                    Published
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight="bold"
                  >
                    {
                      courses.filter(
                        (c) =>
                          c.isPublished
                      ).length
                    }
                  </Typography>

                </Box>

                <Avatar
                  sx={{
                    bgcolor:
                      "#EDE9FE",
                  }}
                >
                  <Visibility
                    sx={{
                      color:
                        PURPLE,
                    }}
                  />
                </Avatar>

              </Stack>

            </CardContent>

          </Card>

        </Grid>



        <Grid item xs={12} md={4}>

          <Card
            sx={{
              borderRadius: 4,
            }}
          >

            <CardContent>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >

                <Box>

                  <Typography
                    color="text.secondary"
                  >
                    Draft Courses
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight="bold"
                  >
                    {
                      courses.filter(
                        (c) =>
                          !c.isPublished
                      ).length
                    }
                  </Typography>

                </Box>

                <Avatar
                  sx={{
                    bgcolor:
                      "#FEF3C7",
                  }}
                >
                  <MenuBook
                    sx={{
                      color:
                        "#D97706",
                    }}
                  />
                </Avatar>

              </Stack>

            </CardContent>

          </Card>

        </Grid>

      </Grid>



      {/* ====================================================== */}
      {/* COURSES */}
      {/* ====================================================== */}

      {loading ? (

        <Box
          display="flex"
          justifyContent="center"
          mt={10}
        >
          <CircularProgress />
        </Box>

      ) : (

        <Grid
          container
          spacing={3}
        >

          {courses.map((course) => (

            <Grid
              item
              xs={12}
              md={6}
              lg={4}
              key={course.id}
            >

              <Card
                sx={{
                  borderRadius: 5,
                  height: "100%",
                  transition:
                    "0.3s ease",

                  "&:hover": {
                    transform:
                      "translateY(-5px)",

                    boxShadow:
                      "0 12px 30px rgba(0,0,0,0.08)",
                  },
                }}
              >

                <CardContent>

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
                        {course.title}
                      </Typography>

                      <Chip
                        label={
                          course.category
                        }
                        size="small"
                        sx={{
                          mt: 1,
                          bgcolor:
                            "#EDE9FE",

                          color:
                            PURPLE,

                          fontWeight: 700,
                        }}
                      />

                    </Box>



                    <Switch
                      checked={
                        course.isPublished
                      }
                      onChange={() =>
                        handleTogglePublish(
                          course.id
                        )
                      }
                    />

                  </Stack>



                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      minHeight: 70,
                    }}
                  >
                    {
                      course.description
                    }
                  </Typography>



                  <Divider
                    sx={{ my: 2 }}
                  />



                  {/* DETAILS */}

                  <Stack
                    spacing={1.2}
                  >

                    <Typography>
                      <strong>
                        Price:
                      </strong>{" "}
                      ₦
                      {Number(
                        course.monthlyPrice
                      ).toLocaleString()}
                      /month
                    </Typography>

                    <Typography>
                      <strong>
                        Mode:
                      </strong>{" "}
                      {
                        course.tutorialMode
                      }
                    </Typography>

                    <Typography>
                      <strong>
                        Duration:
                      </strong>{" "}
                      {
                        course.maxDurationMonths
                      }{" "}
                      months
                    </Typography>

                    <Typography>
                      <strong>
                        Level:
                      </strong>{" "}
                      {
                        course.level ||
                        "N/A"
                      }
                    </Typography>

                  </Stack>



                  {/* STATUS */}

                  <Chip
                    label={
                      course.isPublished
                        ? "Published"
                        : "Draft"
                    }
                    sx={{
                      mt: 2,

                      bgcolor:
                        course.isPublished
                          ? "#DCFCE7"
                          : "#FEF3C7",

                      color:
                        course.isPublished
                          ? "#166534"
                          : "#92400E",

                      fontWeight: 700,
                    }}
                  />



                  {/* ACTIONS */}

                  <Stack
                    direction="row"
                    spacing={1}
                    mt={3}
                    flexWrap="wrap"
                  >

                    <Button
                      variant="contained"
                      size="small"
                      onClick={() =>
                        navigate(
                          `/admin/courses/${course.id}/modules`
                        )
                      }
                      sx={{
                        bgcolor:
                          BRAND,

                        borderRadius: 3,

                        "&:hover": {
                          bgcolor:
                            "#145A32",
                        },
                      }}
                    >
                      Manage Modules
                    </Button>



                    <Tooltip title="Edit">

                      <IconButton
                        onClick={() =>
                          handleEdit(
                            course
                          )
                        }
                      >
                        <Edit />
                      </IconButton>

                    </Tooltip>



                    <Tooltip title="Delete">

                      <IconButton
                        onClick={() =>
                          handleDelete(
                            course.id
                          )
                        }
                      >
                        <Delete
                          sx={{
                            color:
                              "#DC2626",
                          }}
                        />
                      </IconButton>

                    </Tooltip>

                  </Stack>

                </CardContent>

              </Card>

            </Grid>
          ))}

        </Grid>
      )}



      {/* ====================================================== */}
      {/* DIALOG */}
      {/* ====================================================== */}

      <Dialog
        open={open}
        onClose={() =>
          setOpen(false)
        }
        fullWidth
        maxWidth="md"
      >

        <DialogTitle
          sx={{
            fontWeight: "bold",
            pb: 1,
          }}
        >
          {editingId
            ? "Edit Course"
            : "Create Course"}
        </DialogTitle>



        <DialogContent dividers>

          <Grid
            container
            spacing={2}
          >

            <Grid item xs={12}>

              <TextField
                fullWidth
                label="Course Title"
                name="title"
                value={form.title}
                onChange={
                  handleChange
                }
              />

            </Grid>



            <Grid item xs={12}>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
              />

            </Grid>



            <Grid item xs={12} md={6}>

              <TextField
                select
                fullWidth
                label="Category"
                name="category"
                value={
                  form.category
                }
                onChange={
                  handleChange
                }
              >

                <MenuItem value="SAT">
                  SAT
                </MenuItem>

                <MenuItem value="IELTS">
                  IELTS
                </MenuItem>

                <MenuItem value="GRE">
                  GRE
                </MenuItem>

                <MenuItem value="TOEFL">
                  TOEFL
                </MenuItem>

                <MenuItem value="CODING">
                  CODING
                </MenuItem>

              </TextField>

            </Grid>



            <Grid item xs={12} md={6}>

              <TextField
                fullWidth
                type="number"
                label="Monthly Price"
                name="monthlyPrice"
                value={
                  form.monthlyPrice
                }
                onChange={
                  handleChange
                }
              />

            </Grid>



            <Grid item xs={12} md={6}>

              <TextField
                fullWidth
                type="number"
                label="Max Duration (Months)"
                name="maxDurationMonths"
                value={
                  form.maxDurationMonths
                }
                onChange={
                  handleChange
                }
              />

            </Grid>



            <Grid item xs={12} md={6}>

              <TextField
                fullWidth
                label="Level"
                name="level"
                value={
                  form.level
                }
                onChange={
                  handleChange
                }
              />

            </Grid>



            <Grid item xs={12}>

              <TextField
                fullWidth
                label="Thumbnail URL"
                name="thumbnail"
                value={
                  form.thumbnail
                }
                onChange={
                  handleChange
                }
              />

            </Grid>

          </Grid>

        </DialogContent>



        <DialogActions
          sx={{
            p: 2,
          }}
        >

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
              handleSubmit
            }
            disabled={
              submitting
            }
            sx={{
              bgcolor: PURPLE,

              "&:hover": {
                bgcolor:
                  "#5B21B6",
              },
            }}
          >

            {submitting
              ? "Saving..."
              : editingId
              ? "Update Course"
              : "Create Course"}

          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
};

export default AdminCourses;