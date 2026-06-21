import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  createModule,
  getCourseModules,
  updateModule,
  deleteModule,
  toggleModulePublish,
} from "../services/moduleService";

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
  Switch,
  IconButton,
  Stack,
  Chip,
  Divider,
  Avatar,
  CircularProgress,
  Paper,
  Tooltip,
} from "@mui/material";

import {
  Add,
  Edit,
  Delete,
  MenuBook,
  Visibility,
  School,
  ArrowBack,
} from "@mui/icons-material";

const BRAND = "#1E7F4F";
const PURPLE = "#0B1F3A";

const initialState = {
  title: "",
  description: "",
  orderIndex: "",
  unlockDays: 0,
};

const AdminCourseModules = () => {

  const { courseId } =
    useParams();

  const navigate =
    useNavigate();

  const [modules,
    setModules] =
    useState([]);

  const [loading,
    setLoading] =
    useState(false);

  const [submitting,
    setSubmitting] =
    useState(false);

  const [form,
    setForm] =
    useState(initialState);

  const [open,
    setOpen] =
    useState(false);

  const [editingId,
    setEditingId] =
    useState(null);



  // ======================================================
  // FETCH MODULES
  // ======================================================

  const fetchModules =
    async () => {

      try {

        setLoading(true);

        const data =
          await getCourseModules(
            courseId
          );

        setModules(data);

      } catch (err) {

        console.error(err);

        alert(
          "Failed to fetch modules"
        );

      } finally {

        setLoading(false);
      }
    };



  useEffect(() => {
    fetchModules();
  }, []);




  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit =
    async () => {

      try {

        if (
          !form.title ||
          !form.description
        ) {

          return alert(
            "Please complete required fields"
          );
        }

        setSubmitting(true);

        const payload = {
          ...form,
          courseId,
        };

        if (editingId) {

          await updateModule(
            editingId,
            payload
          );

        } else {

          await createModule(
            payload
          );
        }

        setOpen(false);

        setForm(initialState);

        setEditingId(null);

        fetchModules();

      } catch (err) {

        console.error(err);

        alert(
          err.response?.data
            ?.message ||
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
    (module) => {

      setEditingId(module.id);

      setForm({
        title: module.title,

        description:
          module.description,

        orderIndex:
          module.orderIndex,

        unlockDays:
          module.unlockDays,
      });

      setOpen(true);
    };



  // ======================================================
  // DELETE
  // ======================================================

  const handleDelete =
    async (id) => {

      if (
        !window.confirm(
          "Delete module?"
        )
      ) return;

      try {

        await deleteModule(id);

        fetchModules();

      } catch (err) {

        console.error(err);

        alert(
          "Delete failed"
        );
      }
    };



  // ======================================================
  // PUBLISH
  // ======================================================

  const handlePublish =
    async (id) => {

      try {

        await toggleModulePublish(
          id
        );

        fetchModules();

      } catch (err) {

        console.error(err);

        alert(
          "Failed to update module"
        );
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

            <Button
              startIcon={
                <ArrowBack />
              }
              onClick={() =>
                navigate(
                  "/admin/courses"
                )
              }
              sx={{
                color: "#fff",
                mb: 2,
              }}
            >
              Back to Courses
            </Button>

            <Typography
              variant="h4"
              fontWeight="bold"
            >
              Course Modules
            </Typography>

            <Typography
              mt={1}
              sx={{
                opacity: 0.9,
              }}
            >
              Manage LMS modules and drip content delivery
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
                bgcolor:
                  "#5B21B6",
              },
            }}
          >
            Add Module
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
                    Total Modules
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight="bold"
                  >
                    {modules.length}
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
                      modules.filter(
                        (m) =>
                          m.isPublished
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
                    Total Lessons
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight="bold"
                  >
                    {modules.reduce(
                      (acc, module) =>
                        acc +
                        (module.lessonsCount || 0),
                      0
                    )}
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
      {/* LOADING */}
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

          {modules.map((module) => (

            <Grid
              item
              xs={12}
              md={6}
              lg={4}
              key={module.id}
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
                        {module.title}
                      </Typography>

                      <Chip
                        size="small"
                        label={`Module ${module.orderIndex}`}
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
                        module.isPublished
                      }
                      onChange={() =>
                        handlePublish(
                          module.id
                        )
                      }
                    />

                  </Stack>



                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      minHeight: 80,
                    }}
                  >
                    {
                      module.description
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
                        Unlock After:
                      </strong>{" "}
                      {
                        module.unlockDays
                      }{" "}
                      days
                    </Typography>

                    <Typography>
                      <strong>
                        Lessons:
                      </strong>{" "}
                      {
                        module.lessonsCount
                      }
                    </Typography>

                  </Stack>



                  {/* STATUS */}

                  <Chip
                    label={
                      module.isPublished
                        ? "Published"
                        : "Draft"
                    }
                    sx={{
                      mt: 2,

                      bgcolor:
                        module.isPublished
                          ? "#DCFCE7"
                          : "#FEF3C7",

                      color:
                        module.isPublished
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
                          `/admin/modules/${module.id}/lessons`
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
                      Manage Lessons
                    </Button>



                    <Tooltip title="Edit">

                      <IconButton
                        onClick={() =>
                          handleEdit(
                            module
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
                            module.id
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
            ? "Edit Module"
            : "Create Module"}
        </DialogTitle>



        <DialogContent dividers>

          <Grid
            container
            spacing={2}
          >

            <Grid item xs={12}>

              <TextField
                fullWidth
                label="Module Title"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title:
                      e.target.value,
                  })
                }
              />

            </Grid>



            <Grid item xs={12}>

              <TextField
                fullWidth
                multiline
                rows={5}
                label="Description"
                value={
                  form.description
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value,
                  })
                }
              />

            </Grid>



            <Grid item xs={12} md={6}>

              <TextField
                fullWidth
                type="number"
                label="Unlock Days"
                value={
                  form.unlockDays
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    unlockDays:
                      e.target.value,
                  })
                }
              />

            </Grid>



            <Grid item xs={12} md={6}>

              <TextField
                fullWidth
                type="number"
                label="Order Index"
                value={
                  form.orderIndex
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    orderIndex:
                      e.target.value,
                  })
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
              ? "Update Module"
              : "Create Module"}

          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
};

export default AdminCourseModules;