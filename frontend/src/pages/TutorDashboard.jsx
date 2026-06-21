import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Stack,
  Avatar,
  Button,
  Chip,
  Divider,
  Dialog,
DialogTitle,
DialogContent,
DialogActions,
} from "@mui/material";

import {
  School,
  Groups,
  VideoCall,
  AccessTime,
  Paid,
  TrendingUp,
  PlayCircle,
  Verified,
} from "@mui/icons-material";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getTutorDashboard,
} from "../services/tutorDashboardService";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";
const LIGHT = "#F8FAFC";

export default function TutorDashboard() {

  const navigate =
    useNavigate();

  const [loading,
    setLoading] =
    useState(true);

  const [dashboard,
    setDashboard] =
    useState(null);

    const [
  openProfileModal,
  setOpenProfileModal,
] = useState(false);




  useEffect(() => {
    fetchDashboard();
  }, []);




const fetchDashboard =
  async () => {

    try {

      setLoading(true);

      const res =
        await getTutorDashboard();

      console.log(
        "DASHBOARD RESPONSE:",
        res
      );

      setDashboard(res);



      // ======================================================
      // SHOW PROFILE MODAL
      // ======================================================

      if (
        res?.tutorProfile === null
      ) {

        setOpenProfileModal(true);

      } else {

        setOpenProfileModal(false);
      }

    } catch (err) {

      console.error(err);

      setDashboard({

        tutorProfile: null,

        stats: {

          assignedStudents: 0,

          activeCourses: 0,

          completedSessions: 0,

          totalLectureMinutes: 0,

          attendanceRate: 0,

          estimatedEarnings: 0,
          totalSessions: 0,
          liveSessions: 0,
          upcomingSessionsCount: 0,
        },

        upcomingSessions: [],

        recentStudents: [],

        recentSessions: [],
      });

    } finally {

      setLoading(false);
    }
  };




  if (loading) {

    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }




const {
  tutorProfile,
  stats,
  upcomingSessions,
  recentStudents,
  recentSessions,
} = dashboard || {};




  const StatCard = ({
    title,
    value,
    icon,
    color,
  }) => (

    <Paper
      elevation={0}
      sx={{
       p: 3,
      borderRadius: 5,
      background: "#fff",
      border: "1px solid #E5E7EB",
      height: "100%",
      minHeight: 180,
      transition: "all .25s ease",

      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
      },
      mb: 3
            }}
    >

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >

        <Box>

          <Typography
            variant="body2"
            color="text.secondary"
            mt={3}
          >
            {title}
          </Typography>

          <Typography
          
            variant="h4"
            fontWeight="bold"
            mt={8}
            marginLeft={5}
            textAlign="center"
            sx={{
              width: "100%",
            }}

          >
            {value}
          </Typography>

        </Box>

        <Avatar
          sx={{
            bgcolor: color,
            width: 50,
            height: 50,
            mt:-10
          }}
        >
          {icon}
        </Avatar>

      </Stack>

    </Paper>
  );


if (
  dashboard?.tutorProfile === null
) {

  return (

    <Dialog
      open={openProfileModal}
      maxWidth="sm"
      fullWidth
    >

      <DialogTitle
        sx={{
          fontWeight: "bold",
        }}
      >
        Welcome Tutor 🎉
      </DialogTitle>

      <DialogContent>

        <Typography>
          Welcome to the tutor platform.
          To enjoy full tutor privileges,
          please complete your tutor
          profile setup first.
        </Typography>

      </DialogContent>

      <DialogActions>

        <Button
          variant="contained"

          onClick={() =>
            navigate(
              "/tutor/profile"
            )
          }

          sx={{
            borderRadius: 3,
          }}
        >
          Complete Profile
        </Button>

      </DialogActions>

    </Dialog>
  );
}

  return (
    
    <Box
  sx={{
    minHeight: "100vh",
    background: LIGHT,
  }}
>
  <Box
    sx={{
      maxWidth: 1700,
      mx: "auto",
      px: { xs: 2, sm: 3, md: 5, lg: 6 },
      py: { xs: 3, md: 5 },
    }}
  >

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          overflow: "hidden",
          mb: 4,
        }}
      >

        <Box
          sx={{
            background:
              `linear-gradient(135deg, ${NAVY}, ${GREEN})`,
            color: "#fff",
            p: 4,
          }}
        >

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={3}
            alignItems="center"
            justifyContent="space-between"
          >

            <Stack
              direction="row"
              spacing={3}
              alignItems="center"
            >

              <Avatar
                src={
                  tutorProfile.profilePicUrl
                }
                sx={{
                  width: 100,
                  height: 100,
                  border:
                    "4px solid rgba(255,255,255,0.3)",
                }}
              />

              <Box>

                <Typography
                  variant="h4"
                  fontWeight="bold"
                >
                  Welcome,
                  {" "}
                  {
                    tutorProfile.fullName
                  }
                </Typography>

                <Typography
                  sx={{
                    opacity: 0.9,
                    mt: 1,
                  }}
                >
                  Manage your students,
                  classes and teaching
                  analytics.
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  mt={2}
                >

                  <Chip
                    icon={
                      <Verified />
                    }
                    label={
                      tutorProfile.verificationStatus
                    }
                    sx={{
                      bgcolor:
                        GOLD,
                      color:
                        NAVY,
                      fontWeight:
                        "bold",
                    }}
                  />

                  <Chip
                    label={
                      tutorProfile.availabilityStatus
                    }
                    sx={{
                      bgcolor:
                        "rgba(255,255,255,0.15)",
                      color:
                        "#fff",
                    }}
                  />

                </Stack>

              </Box>

            </Stack>



            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
            >

              <Button
                variant="contained"
                sx={{
                  bgcolor:
                    GOLD,
                  color:
                    NAVY,
                  fontWeight:
                    "bold",
                  borderRadius:
                    3,
                  px: 3,
                }}
                onClick={() =>
                  navigate(
                    "/tutor/live-classes"
                  )
                }
              >
                Live Classes
              </Button>

              <Button
                variant="outlined"
                sx={{
                  borderColor:
                    "#fff",
                  color:
                    "#fff",
                  borderRadius:
                    3,
                }}
                onClick={() =>
                  navigate(
                    "/tutor/profile"
                  )
                }
              >
                Edit Profile
              </Button>

            </Stack>

          </Stack>

        </Box>

      </Paper>



      {/* ====================================================== */}
      {/* STATS */}
      {/* ====================================================== */}

     <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,1fr)",
            xl: "repeat(7,1fr)",
          },
          gap: 3,
          mb: 5,
        }}
      >

       
          <StatCard
            title="Students"
            value={
              stats.assignedStudents
            }
            icon={<Groups />}
            color={GREEN}
          />
       

        
          <StatCard
            title="Courses"
            value={
              stats.activeCourses
            }
            icon={<School />}
            color={NAVY}
          />
        

        
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon={<VideoCall />}
            color={GOLD}
          />

          <StatCard
          title="Completed"
          value={stats.completedSessions}
          icon={<Verified />}
          color="#10B981"
        />
        
        <StatCard
        title="Live Now"
        value={stats.liveSessions}
        icon={<PlayCircle />}
        color="#EF4444"
      />

      <StatCard
        title="Upcoming"
        value={stats.upcomingSessionsCount}
        icon={<AccessTime />}
        color="#0284C7"
      />

        
          <StatCard
            title="Lecture Hours"
            value={
              Math.floor(
                stats.totalLectureMinutes / 60
              )
            }
            icon={<AccessTime />}
            color="#7C3AED"
          />
       
        </Box>
      



      {/* ====================================================== */}
      {/* ANALYTICS */}
      {/* ====================================================== */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3,1fr)",
          },
          gap: 3,
          mb: 5,
          mt:10,
        }}
      >

        <Grid item xs={12} md={4}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid #E5E7EB",
            height: "100%",

            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",

            textAlign: "center",

            transition: "all .25s ease",

            "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
            },
          }}
        >

           <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="center"
          mb={2}
        >

              <TrendingUp
                sx={{
                  color:
                    GREEN,
                }}
              />

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Attendance Rate
              </Typography>

            </Stack>

            <Typography
              variant="h2"
              fontWeight="bold"
              color={GREEN}
            >
              {Math.round(
                stats.attendanceRate || 0
              )}
              %
            </Typography>

          </Paper>

        </Grid>



        <Grid item xs={12} md={4}>

          <Paper
  elevation={0}
  sx={{
    p: 3,
    border: "1px solid #E5E7EB",
    height: "100%",

    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",

    textAlign: "center",

    transition: "all .25s ease",

    "&:hover": {
      transform: "translateY(-3px)",
      boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
    },
  }}
>

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="center"
              mb={2}
            >

              <Paid
                sx={{
                  color:
                    GOLD,
                }}
              />

              <Typography
                variant="h6"
                fontWeight="bold"
                 textAlign="center"
              >
                Estimated Earnings
              </Typography>

            </Stack>

            <Typography
              variant="h3"
              fontWeight="bold"
            >
              ₦
              {Number(
                stats.estimatedEarnings || 0
              ).toLocaleString()}
            </Typography>

          </Paper>

        </Grid>



        

      </Box>



      {/* ====================================================== */}
      {/* CONTENT */}
      {/* ====================================================== */}

   <Box
        sx={{
          
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3,1fr)",
          },
          gap: 3,
          mb: 5,
          mt:10,
        }}
      >

        {/* UPCOMING SESSIONS */}

        <Grid item xs={12} lg={6} mb={3}>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border:
                "1px solid #E5E7EB",
            }}
          >

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={3}
            >
              Upcoming Sessions
            </Typography>

            <Stack spacing={2}>

              {upcomingSessions?.length > 0 ? (

                upcomingSessions.map(
                  (session) => (

                    <Paper
                      key={session.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 3,
                      }}
                    >

                      <Typography
                        fontWeight="bold"
                      >
                        {session.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {
                          session.Course
                            ?.title
                        }
                      </Typography>

                      <Typography
                        variant="body2"
                        mt={1}
                      >
                        {new Date(
                          session.scheduledAt
                        ).toLocaleString()}
                      </Typography>

                      <Button
                        variant="contained"
                        startIcon={
                          <PlayCircle />
                        }
                        sx={{
                          mt: 2,
                          bgcolor:
                            GREEN,
                        }}
                        onClick={() =>
                          navigate(
                            `/live/${session.roomName}/${session.id}`,
                            {
                              state: {
                                role:
                                  "tutor",
                              },
                            }
                          )
                        }
                      >
                        Start Session
                      </Button>

                    </Paper>
                  )
                )

              ) : (

                <Typography
                  color="text.secondary"
                >
                  No upcoming sessions
                </Typography>
              )}

            </Stack>

          </Paper>

        </Grid>



        {/* RECENT STUDENTS */}

        <Grid item xs={12} lg={6}>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border:
                "1px solid #E5E7EB",
            }}
          >

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={3}
            >
              Recent Students
            </Typography>

            <Stack spacing={2}>

              {recentStudents?.length > 0 ? (

                recentStudents.map(
                  (student) => (

                    <Box
                      key={student.id}
                    >

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >

                        <Box>

                          <Typography
                            fontWeight="bold"
                          >
                            {
                              student.student
                                ?.fullName
                            }
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {
                              student.student
                                ?.email
                            }
                          </Typography>

                        </Box>

                        <Chip
                          label={
                            student.Course
                              ?.title
                          }
                          sx={{
                            bgcolor:
                              NAVY,
                            color:
                              "#fff",
                          }}
                        />

                      </Stack>

                      <Divider
                        sx={{
                          mt: 2,
                        }}
                      />

                    </Box>
                  )
                )

              ) : (

                <Typography
                  color="text.secondary"
                >
                  No assigned students
                </Typography>
              )}

            </Stack>

          </Paper>

        </Grid>

      </Box>
       </Box>
    </Box>
  );
}