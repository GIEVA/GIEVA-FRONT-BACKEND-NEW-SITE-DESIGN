import { useState } from "react";

import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Container,
  useMediaQuery,
} from "@mui/material";

import {
  Menu as MenuIcon,
} from "@mui/icons-material";

import { useTheme } from "@mui/material/styles";


import { useAuth } from "../../../context/AuthContext";

import Logo from "../Logo/Logo";

import NavMenu from "../NavMenu/NavMenu";

import AuthButtons from "../AuthButtons/AuthButtons";

import UserMenu from "../UserMenu/UserMenu";

import MobileDrawer from "../MobileDrawer/MobileDrawer";
import {
  publicNavigation,
  portalNavigation,
} from "../navigation.config";



export default function Navbar() {
  const { user } = useAuth();

  const theme = useTheme();

  const mobile = useMediaQuery(
    theme.breakpoints.down("lg")
  );

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        sx={{
          bgcolor: "#fff",

          borderBottom:
            "1px solid rgba(0,0,0,.06)",

          backdropFilter:
            "blur(16px)",

          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              height: 82,

              display: "flex",

              justifyContent:
                "space-between",
            }}
          >
            {/* ============================================
                LOGO
            ============================================ */}

            <Logo />

            {/* ============================================
                DESKTOP
            ============================================ */}

            {!mobile && (
              <>
                <NavMenu
                    navigation={
                        user
                        ? portalNavigation
                        : publicNavigation
                    }
                    />

                <Box
                  display="flex"
                  alignItems="center"
                >
                  {user ? (
                    <UserMenu />
                  ) : (
                    <AuthButtons />
                  )}
                </Box>
              </>
            )}

            {/* ============================================
                MOBILE
            ============================================ */}

            {mobile && (
              <IconButton
                onClick={() =>
                  setDrawerOpen(true)
                }
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <MobileDrawer
        open={drawerOpen}
        onClose={() =>
          setDrawerOpen(false)
        }
      />
    </>
  );
}