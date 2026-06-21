import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Avatar,
  Chip,
  useMediaQuery,
} from "@mui/material";

import {
  Menu,
  Dashboard,
  School,
  Article,
  Logout,
  Login,
  AppRegistration,
  VideoCall,
  Person,
  VerifiedUser,
} from "@mui/icons-material";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useState,
} from "react";

import {
  useTheme,
} from "@mui/material/styles";



// ======================================================
// COLORS
// ======================================================

const NAV_GREEN = "#1E7F4F";

const NAVY = "#0B1F3A";

const NAVY_LIGHT = "#162d52";



export default function Navbar() {

  const {
    user,
    logout,
  } = useAuth();



  const navigate =
    useNavigate();



  const theme =
    useTheme();



  const isMobile =
    useMediaQuery(
      theme.breakpoints.down("md")
    );



  const [mobileOpen,
    setMobileOpen] =
      useState(false);



  // ======================================================
  // USER
  // ======================================================

  const role =
    user?.role ||
    user?.user?.role;



  const fullName =
    user?.fullName ||
    user?.user?.fullName ||
    "User";



  const isAdmin =

    role === "admin" ||

    role === "superadmin";



  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout =
    () => {

      logout();

      navigate("/login");
    };



  // ======================================================
  // NAVIGATION
  // ======================================================

  const getRoleLinks =
    () => {

      switch (role) {

        // ======================================================
        // STUDENT
        // ======================================================

        case "student":

          return [

            {
              label:
                "Dashboard",

              path:
                "/student/dashboard",
            },

            {
              label:
                "Courses",

              path:
                "/courses",
            },

            {
              label:
                "Live Classes",

              path:
                "/student/live-classes",
            },

            {
              label:
                "Articles",

              path:
                "/articles",
            },
          ];



        // ======================================================
        // TUTOR
        // ======================================================

        case "tutor":

          return [

            {
              label:
                "Dashboard",

              path:
                "/tutor/dashboard",
            },

            {
              label:
                "Tutor Profile",

              path:
                "/tutor/profile",
            },

            {
              label:
                "Live Classes",

              path:
                "/tutor/live-classes",
            },

            {
              label:
                "Courses",

              path:
                "/courses",
            },
          ];



        // ======================================================
        // ADMIN
        // ======================================================

        case "admin":
        case "superadmin":

          return [];



        // ======================================================
        // PUBLIC
        // ======================================================

        default:

          return [

            {
              label:
                "Courses",

              path:
                "/courses",
            },

            {
              label:
                "Articles",

              path:
                "/articles",
            },

            {
              label:
                "Campaigns",

              path:
                "/campaigns",
            },
          ];
      }
    };



  const navLinks =
    getRoleLinks();



  // ======================================================
  // MOBILE DRAWER
  // ======================================================

  const drawer = (

    <Box
      sx={{
        width: 290,
      }}
    >

      {/* HEADER */}

      <Box
        sx={{
          p: 3,
          bgcolor: NAV_GREEN,
          color: "#fff",
        }}
      >

        <Typography
          variant="h5"
          fontWeight="bold"
        >

          GIEVA

        </Typography>



        {user && (

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            mt={3}
          >

            <Avatar
              sx={{
                bgcolor: NAVY,
              }}
            >

              {fullName[0]}

            </Avatar>



            <Box>

              <Typography
                fontWeight="bold"
              >

                {fullName}

              </Typography>



              <Chip

                size="small"

                label={role}

                sx={{
                  mt: 1,
                  textTransform:
                    "capitalize",
                }}
              />

            </Box>

          </Stack>
        )}

      </Box>



      {/* LINKS */}

      {!isAdmin && (

        <List>

          {navLinks.map(
            (item) => (

              <ListItemButton

                key={item.label}

                component={Link}

                to={item.path}

                onClick={() =>
                  setMobileOpen(false)
                }
              >

                <ListItemText
                  primary={
                    item.label
                  }
                />

              </ListItemButton>
            )
          )}

        </List>
      )}



      <Divider />



      {/* AUTH */}

      <List>

        {user ? (

          <ListItemButton
            onClick={
              handleLogout
            }
          >

            <Logout
              sx={{
                mr: 2,
              }}
            />

            <ListItemText
              primary="Logout"
            />

          </ListItemButton>

        ) : (

          <>

            <ListItemButton
              component={Link}
              to="/login"
            >

              <Login
                sx={{
                  mr: 2,
                }}
              />

              <ListItemText
                primary="Login"
              />

            </ListItemButton>



            <ListItemButton
              component={Link}
              to="/register"
            >

              <AppRegistration
                sx={{
                  mr: 2,
                }}
              />

              <ListItemText
                primary="Register"
              />

            </ListItemButton>

          </>
        )}

      </List>

    </Box>
  );



  return (

    <>

      <AppBar
        position="sticky"
        sx={{
          bgcolor: NAV_GREEN,
        }}
      >

        <Toolbar
          sx={{
            justifyContent:
              "space-between",
          }}
        >

          {/* LOGO */}

          <Typography

            variant="h5"

            component={Link}

            to="/"

            sx={{

              color: "#fff",

              textDecoration:
                "none",

              fontWeight: "bold",
            }}
          >

            GIEVA

          </Typography>



          {/* MOBILE */}

          {isMobile ? (

            <IconButton

              color="inherit"

              onClick={() =>
                setMobileOpen(true)
              }
            >

              <Menu />

            </IconButton>

          ) : (

            // ======================================================
            // DESKTOP
            // ======================================================

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >

              {/* NON ADMIN */}

              {!isAdmin &&

                navLinks.map(
                  (item) => (

                    <Button

                      key={item.label}

                      component={Link}

                      to={item.path}

                      sx={{

                        color: "#fff",

                        textTransform:
                          "none",

                        fontWeight: 500,
                      }}
                    >

                      {item.label}

                    </Button>
                  )
                )
              }



              {/* ADMIN */}

              {user && isAdmin && (

                <Avatar
                  sx={{
                    bgcolor: NAVY,
                    width: 38,
                    height: 38,
                  }}
                >

                  {fullName?.[0]}

                </Avatar>
              )}



              {/* AUTH */}

              {user ? (

                <IconButton

                  onClick={
                    handleLogout
                  }

                  sx={{
                    color: "#fff",
                  }}
                >

                  <Logout />

                </IconButton>

              ) : (

                <>

                  <Button
                    component={Link}
                    to="/login"
                    sx={{
                      color: "#fff",
                    }}
                  >

                    Login

                  </Button>



                  <Button

                    component={Link}

                    to="/register"

                    variant="contained"

                    sx={{

                      bgcolor: NAVY,

                      textTransform:
                        "none",

                      "&:hover": {

                        bgcolor:
                          NAVY_LIGHT,
                      },
                    }}
                  >

                    Register

                  </Button>

                </>
              )}

            </Stack>
          )}

        </Toolbar>

      </AppBar>



      {/* MOBILE DRAWER */}

      <Drawer

        anchor="right"

        open={mobileOpen}

        onClose={() =>
          setMobileOpen(false)
        }
      >

        {drawer}

      </Drawer>

    </>
  );
}