import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Container,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";

import { Link, NavLink, useLocation } from "react-router-dom";

// Replace with your logo path
import logo from "../../assets/logo.png";

const navItems = [
  {
    label: "Home",
    path: "/",
  },
  {
    label: "About",
    path: "/about",
  },
  {
    label: "Services",
    path: "/services",
  },
  {
    label: "Partners",
    path: "/partners",
  },
  {
    label: "Team",
    path: "/team",
  },
];

export default function PublicNavbar() {
  const theme = useTheme();

  const mobile = useMediaQuery(theme.breakpoints.down("lg"));

  const location = useLocation();

  const [open, setOpen] = useState(false);

  return (
    <>
      <AppBar
        elevation={0}
        color="transparent"
        position="sticky"
        sx={{
          pt: 2,
          px: {
            xs: 1,
            md: 2,
          },
          background: "transparent",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: "24px",

              bgcolor: alpha("#FFFFFF", 0.85),

              backdropFilter: "blur(10px)",

              WebkitBackdropFilter: "blur(10px)",

              justifyContent: "space-between",

              border: "1px solid rgba(255,255,255,.25)",
            }}
          >
            {/* Logo */}

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              component={Link}
              to="/"
              sx={{
                textDecoration: "none",
              }}
            >
              <Box
                component="img"
                src={logo}
                alt="GIEVA"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                }}
              />

              <Typography
                fontWeight={800}
                fontSize={30}
                color="#292929"
              >
                GIEVA

                <Typography
                  component="span"
                  color="#1BAA5C"
                  fontWeight={400}
                >
                  .org
                </Typography>
              </Typography>
            </Stack>

            {/* Desktop Navigation */}

            {!mobile && (
              <Stack
                direction="row"
                spacing={4}
                alignItems="center"
              >
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    component={NavLink}
                    to={item.path}
                    disableRipple
                    sx={{
                      textTransform: "none",

                      fontWeight: 700,

                      fontSize: 17,

                      color:
                        location.pathname === item.path
                          ? "#E65320"
                          : "#292929",

                      "&:hover": {
                        color: "#E65320",
                        background: "transparent",
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            )}

            {/* Right Actions */}

            {!mobile ? (
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <IconButton>
                  <SearchIcon />
                </IconButton>

                <Button
                  variant="outlined"
                  component={Link}
                  to="/login"
                  sx={{
                    borderRadius: 3,

                    px: 3,

                    textTransform: "none",

                    fontWeight: 700,
                  }}
                >
                  Login
                </Button>

                <Button
                  variant="contained"
                  component={Link}
                  to="/book-consultancy"
                  sx={{
                    borderRadius: 3,

                    px: 3,

                    py: 1.25,

                    textTransform: "none",

                    fontWeight: 700,
                  }}
                >
                  Book Consultancy
                </Button>
              </Stack>
            ) : (
              <IconButton onClick={() => setOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
      >
        <Box
          sx={{
            width: 300,
          }}
        >
          <List>
            {navItems.map((item) => (
              <ListItem
                disablePadding
                key={item.path}
              >
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  onClick={() => setOpen(false)}
                >
                  <ListItemText
                    primary={item.label}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box
            p={2}
          >
            <Button
              fullWidth
              variant="outlined"
              component={Link}
              to="/login"
              sx={{
                mb: 2,
              }}
            >
              Login
            </Button>

            <Button
              fullWidth
              variant="contained"
              component={Link}
              to="/book-consultancy"
            >
              Book Consultancy
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}