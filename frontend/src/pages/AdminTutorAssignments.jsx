import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  MenuItem,
  Avatar,
  Divider,
  CircularProgress,
  Chip,
  Paper,
  InputAdornment,
} from "@mui/material";

import {
  School,
  Person,
  MenuBook,
  Search,
  AssignmentInd,
} from "@mui/icons-material";

import {
  useEffect,
  useState,
} from "react";

import {
  getAvailableTutors,
  getAssignableStudents,
  getAssignableCourses,
  assignStudentToTutor,
  getTutorStudents,
} from "../services/tutorAssignmentService";



const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";
const BORDER = "#E5E7EB";
const BG = "#F8FAFC";



export default function AdminTutorAssignments() {

  const [loading,
    setLoading] =
    useState(false);

  const [pageLoading,
    setPageLoading] =
    useState(true);

  const [tutors,
    setTutors] =
    useState([]);

  const [students,
    setStudents] =
    useState([]);

  const [courses,
    setCourses] =
    useState([]);

  const [roster,
    setRoster] =
    useState([]);

  const [selectedTutor,
    setSelectedTutor] =
    useState("");

  const [form,
    setForm] =
    useState({
      studentId: "",
      tutorProfileId: "",
      courseId: "",
    });




  // ====================================================
  // INITIAL FETCH
  // ====================================================

  useEffect(() => {

    initialize();

  }, []);




  const initialize =
    async () => {

      try {

        setPageLoading(true);

        await Promise.all([
          fetchTutors(),
          fetchStudents(),
          fetchCourses(),
        ]);

      } catch (err) {

        console.error(err);

      } finally {

        setPageLoading(false);
      }
    };




  // ====================================================
  // FETCH TUTORS
  // ====================================================

  const fetchTutors =
    async () => {

      try {

        const res =
          await getAvailableTutors();

        setTutors(
          res.tutors || []
        );

      } catch (err) {

        console.error(err);
      }
    };




  // ====================================================
  // FETCH STUDENTS
  // ====================================================

  const fetchStudents =
    async () => {

      try {

        const res =
          await getAssignableStudents();

        setStudents(
          res.students || []
        );

      } catch (err) {

        console.error(err);
      }
    };




  // ====================================================
  // FETCH COURSES
  // ====================================================

  const fetchCourses =
    async () => {

      try {

        const res =
          await getAssignableCourses();

        setCourses(
          res.courses || []
        );

      } catch (err) {

        console.error(err);
      }
    };




  // ====================================================
  // FETCH TUTOR ROSTER
  // ====================================================

  const fetchTutorRoster =
    async (id) => {

      try {

        const res =
          await getTutorStudents(id);

        setRoster(
          res.students || []
        );

      } catch (err) {

        console.error(err);
      }
    };




  // ====================================================
  // ASSIGN
  // ====================================================

  const handleAssign =
    async () => {

      try {

        if (
          !form.studentId ||
          !form.courseId ||
          !form.tutorProfileId
        ) {

          return alert(
            "Please complete all selections"
          );
        }

        setLoading(true);

        await assignStudentToTutor(
          form
        );

        alert(
          "Student assigned successfully"
        );

        fetchTutorRoster(
          form.tutorProfileId
        );

        setForm({
          studentId: "",
          tutorProfileId:
            form.tutorProfileId,
          courseId: "",
        });

      } catch (err) {

        alert(
          err.response?.data?.message ||
          "Assignment failed"
        );

      } finally {

        setLoading(false);
      }
    };




  // ====================================================
  // LOADING
  // ====================================================

  if (pageLoading) {

    return (

      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="70vh"
      >
        <CircularProgress
          sx={{
            color: NAVY,
          }}
        />
      </Box>
    );
  }




  return (

    <Box
      sx={{
        p: {
          xs: 2,
          md: 4,
        },

        background: BG,

        minHeight: "100vh",
      }}
    >

      {/* ================================================= */}
      {/* HERO */}
      {/* ================================================= */}

      <Paper
        elevation={0}
        sx={{
          mb: 4,

          borderRadius: 5,

          p: 4,

          background:
            "linear-gradient(135deg, #0B1F3A, #1E7F4F)",

          color: "#fff",
        }}
      >

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}

          justifyContent="space-between"

          spacing={3}
        >

          <Box>

            <Typography
              variant="h4"
              fontWeight={800}
              mb={1}
            >
              Tutor Assignments
            </Typography>

            <Typography
              sx={{
                opacity: 0.9,
              }}
            >
              Assign enrolled students to approved tutors
            </Typography>

          </Box>



          <Avatar
            sx={{
              width: 72,
              height: 72,

              bgcolor:
                "rgba(255,255,255,0.15)",
            }}
          >
            <AssignmentInd
              sx={{
                fontSize: 40,
              }}
            />
          </Avatar>

        </Stack>

      </Paper>




      <Grid
        container
        spacing={4}
      >

        {/* ================================================= */}
        {/* ASSIGNMENT FORM */}
        {/* ================================================= */}

        <Grid
          item
          xs={12}
          lg={4}
        >

          <Card
            elevation={0}
            sx={{
              borderRadius: 5,

              border:
                `1px solid ${BORDER}`,
            }}
          >

            <CardContent
              sx={{
                p: 4,
              }}
            >

              <Typography
                variant="h6"
                fontWeight={800}
                mb={3}
              >
                Assign Tutor
              </Typography>



              <Stack spacing={3}>

                {/* STUDENT */}

                <TextField
                  select
                  fullWidth
                  label="Select Student"
                  value={
                    form.studentId
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      studentId:
                        e.target.value,
                    })
                  }
                >

                  {students.map(
                    (student) => (

                      <MenuItem
                        key={student.id}
                        value={student.id}
                      >

                        <Box>

                          <Typography
                            fontWeight={700}
                          >
                            {
                              student.fullName
                            }
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {
                              student.email
                            }
                          </Typography>

                        </Box>

                      </MenuItem>
                    )
                  )}

                </TextField>



                {/* COURSE */}

                <TextField
                  select
                  fullWidth
                  label="Select Course"
                  value={
                    form.courseId
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      courseId:
                        e.target.value,
                    })
                  }
                >

                  {courses.map(
                    (course) => (

                      <MenuItem
                        key={course.id}
                        value={course.id}
                      >

                        <Box>

                          <Typography
                            fontWeight={700}
                          >
                            {
                              course.title
                            }
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {
                              course.category
                            }
                          </Typography>

                        </Box>

                      </MenuItem>
                    )
                  )}

                </TextField>



                {/* TUTOR */}

                <TextField
                  select
                  fullWidth
                  label="Select Tutor"
                  value={
                    form.tutorProfileId
                  }
                  onChange={(e) => {

                    setForm({
                      ...form,
                      tutorProfileId:
                        e.target.value,
                    });

                    setSelectedTutor(
                      e.target.value
                    );

                    fetchTutorRoster(
                      e.target.value
                    );
                  }}
                >

                  {tutors.map(
                    (tutor) => (

                      <MenuItem
                        key={tutor.id}
                        value={tutor.id}
                      >

                        <Box>

                          <Typography
                            fontWeight={700}
                          >
                            {
                              tutor.fullName
                            }
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {
                              tutor.email
                            }
                          </Typography>

                        </Box>

                      </MenuItem>
                    )
                  )}

                </TextField>



                <Button
                  fullWidth
                  variant="contained"
                  onClick={
                    handleAssign
                  }
                  disabled={
                    loading
                  }
                  sx={{
                    py: 1.5,

                    bgcolor: NAVY,

                    borderRadius: 3,

                    fontWeight: 700,

                    textTransform:
                      "none",

                    "&:hover": {
                      bgcolor:
                        "#08172D",
                    },
                  }}
                >

                  {loading
                    ? (
                      <CircularProgress
                        size={24}
                        sx={{
                          color:
                            "#fff",
                        }}
                      />
                    )
                    : "Assign Student"}

                </Button>

              </Stack>

            </CardContent>

          </Card>

        </Grid>




        {/* ================================================= */}
        {/* ROSTER */}
        {/* ================================================= */}

        <Grid
          item
          xs={12}
          lg={8}
        >

          <Card
            elevation={0}
            sx={{
              borderRadius: 5,

              border:
                `1px solid ${BORDER}`,
            }}
          >

            <CardContent
              sx={{
                p: 4,
              }}
            >

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >

                <Typography
                  variant="h6"
                  fontWeight={800}
                >
                  Tutor Roster
                </Typography>

                <Chip
                  label={`${roster.length} Students`}
                  sx={{
                    bgcolor:
                      "#FEF3C7",

                    color:
                      "#92400E",

                    fontWeight: 700,
                  }}
                />

              </Stack>

              <Divider sx={{ mb: 4 }} />



              {roster.length === 0 ? (

                <Box
                  py={8}
                  textAlign="center"
                >

                  <Typography
                    variant="h6"
                    color="text.secondary"
                    mb={1}
                  >
                    No assigned students
                  </Typography>

                  <Typography
                    color="text.secondary"
                  >
                    Select a tutor to view assigned students
                  </Typography>

                </Box>

              ) : (

                <Grid
                  container
                  spacing={3}
                >

                  {roster.map(
                    (item) => (

                      <Grid
                        item
                        xs={12}
                        md={6}
                        key={item.id}
                      >

                        <Card
                          elevation={0}
                          sx={{
                            borderRadius: 4,

                            border:
                              `1px solid ${BORDER}`,

                            transition:
                              "0.2s",

                            "&:hover": {
                              transform:
                                "translateY(-4px)",

                              boxShadow:
                                "0 8px 24px rgba(0,0,0,0.08)",
                            },
                          }}
                        >

                          <CardContent>

                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >

                              <Avatar
                                sx={{
                                  width: 56,
                                  height: 56,

                                  bgcolor:
                                    NAVY,
                                }}
                              >
                                <Person />
                              </Avatar>



                              <Box>

                                <Typography
                                  fontWeight={800}
                                >
                                  {
                                    item.student
                                      ?.fullName
                                  }
                                </Typography>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {
                                    item.student
                                      ?.email
                                  }
                                </Typography>

                              </Box>

                            </Stack>



                            <Stack
                              direction="row"
                              spacing={1}
                              mt={3}
                              flexWrap="wrap"
                            >

                              <Chip
                                icon={
                                  <MenuBook />
                                }
                                label={
                                  item.Course
                                    ?.title
                                }

                                sx={{
                                  bgcolor:
                                    "#EEF2FF",

                                  color:
                                    NAVY,
                                }}
                              />



                              <Chip
                                icon={
                                  <School />
                                }

                                label="Assigned"

                                sx={{
                                  bgcolor:
                                    "#DCFCE7",

                                  color:
                                    GREEN,
                                }}
                              />

                            </Stack>

                          </CardContent>

                        </Card>

                      </Grid>
                    )
                  )}

                </Grid>
              )}

            </CardContent>

          </Card>

        </Grid>

      </Grid>

    </Box>
  );
}