import { useState } from "react";

import PropTypes from "prop-types";

import {
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {
  Link as RouterLink,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";

import Logo from "../Logo/Logo";
import {
  publicNavigation,
  portalNavigation,
  roleRoutes,
  guestActions,
  userMenu,
} from "../navigation.config";

export default function MobileDrawer({
  open,
  onClose,
}) {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const fullName =
  user?.fullName ||
  user?.user?.fullName ||
  "User";

const email =
  user?.email ||
  user?.user?.email;

const avatar =
  user?.avatar ||
  user?.user?.avatar;

  const role =
  user?.role ||
  user?.user?.role;

const navigation = user
  ? portalNavigation
  : publicNavigation;

const resolvedNavigation = navigation.map((section) => ({
  ...section,

  path:
    section.path ||
    roleRoutes[section.routeKey]?.[role],

  children:
    section.children
      ?.filter(
        (child) =>
          !child.roles ||
          child.roles.includes(role)
      )
      .map((child) => ({
        ...child,

        path:
          child.path ||
          roleRoutes[child.routeKey]?.[role],
      })) || [],
}));

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 320,
        },
      }}
    >
      <Stack
        sx={{
          height: "100%",
        }}
      >
        {/* ======================================
            HEADER
        ====================================== */}

        <Box
          p={3}
        >
          <Logo />

          {user && (
            <Stack
              direction="row"
              spacing={2}
              mt={3}
              alignItems="center"
            >
            <Avatar src={avatar}>
            {fullName.charAt(0)}
            </Avatar>

              <Box>
                <Typography fontWeight={700}>
                {fullName}
                </Typography>

                <Typography
                variant="body2"
                color="text.secondary"
                >
                {email}
                </Typography>
              </Box>
            </Stack>
          )}
        </Box>

        <Divider />

        {/* ======================================
            NAVIGATION
        ====================================== */}

        <Box
  flex={1}
  overflow="auto"
>
  {resolvedNavigation.map((section) =>
    section.children?.length ? (
      <Accordion
        key={section.label}
        disableGutters
        elevation={0}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
        >
          <Typography fontWeight={600}>
            {section.label}
          </Typography>
        </AccordionSummary>

        <AccordionDetails>
          <List disablePadding>
            {section.children.map((item) => (
              <ListItemButton
                key={item.label}
                onClick={() =>
                  handleNavigate(item.path)
                }
              >
                <ListItemText
                  primary={item.label}
                />
              </ListItemButton>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    ) : (
      <List
        key={section.label}
        disablePadding
      >
        <ListItemButton
          onClick={() =>
            handleNavigate(section.path)
          }
        >
          <ListItemText
            primary={section.label}
          />
        </ListItemButton>
      </List>
    )
  )}
</Box>

        <Divider />

        {/* ======================================
            FOOTER ACTIONS
        ====================================== */}

        <Box p={2}>
          {!user ? (
            <Stack spacing={2}>
              {guestActions.map(
                (action) => (
                  <Button
                    key={
                      action.label
                    }
                    variant={
                      action.variant
                    }
                    onClick={() =>
                      handleNavigate(
                        action.path
                      )
                    }
                  >
                    {action.label}
                  </Button>
                )
              )}
            </Stack>
          ) : (
            <Stack spacing={1}>
            <Button
                onClick={() =>
                handleNavigate(
                    roleRoutes.profile[role]
                )
                }
                sx={{
                justifyContent: "flex-start",
                }}
            >
                My Profile
            </Button>

            <Button
                color="error"
                onClick={() => {
                logout();
                navigate("/login");
                onClose();
                }}
                sx={{
                justifyContent: "flex-start",
                }}
            >
                Logout
            </Button>
            </Stack>
          )}
        </Box>
      </Stack>
    </Drawer>
  );
}

MobileDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};