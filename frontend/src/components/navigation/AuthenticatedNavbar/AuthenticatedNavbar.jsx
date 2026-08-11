import {
  AppBar,
  Toolbar,
  Box,
  Avatar,
  IconButton,
  useMediaQuery,
} from "@mui/material";

import { useTheme } from "@mui/material/styles";

import MenuIcon from "@mui/icons-material/Menu";

import { useState } from "react";

import { useAuth } from "../../../context/AuthContext";

import { Logo } from "../Logo";
import { NavMenu } from "../NavMenu";
import { UserMenu } from "../UserMenu";
import { MobileDrawer } from "../MobileDrawer";

import { authenticatedNavigation } from "./authenticatedNavigation.config";

export default function AuthenticatedNavbar() {

  const { user } = useAuth();

  const role =
    user?.role ||
    user?.user?.role;

  const menu =
    authenticatedNavigation[role] || [];

  const theme = useTheme();

  const mobile =
    useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] =
    useState(false);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={1}
    >
      <Toolbar>

        <Logo />

        <Box sx={{ flexGrow: 1 }} />

        {mobile ? (

          <IconButton
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </IconButton>

        ) : (

          <>
            <NavMenu items={menu} />

            <UserMenu />
          </>

        )}

        <MobileDrawer
          open={open}
          onClose={() => setOpen(false)}
          items={menu}
        />

      </Toolbar>
    </AppBar>
  );
}