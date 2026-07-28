import PropTypes from "prop-types";

import { Box } from "@mui/material";

import { useAuth } from "../../../context/AuthContext";

import {
  roleRoutes,
} from "../navigation.config";

import NavDropdown from "../NavDropdown/NavDropdown";

export default function NavMenu({
  navigation=[],
  sx = {},
}) {
  const { user } = useAuth();

  const role =
    user?.role ||
    user?.user?.role;

  const resolveNavigation = (items = []) =>
    items.map((item) => ({
      ...item,

      children:
        item.children?.filter(
          (child) =>
            !child.roles ||
            child.roles.includes(role)
        ).map((child) => ({
          ...child,
          path:
            child.path ||
            roleRoutes[
              child.routeKey
            ]?.[role],
        })) || [],
    }));

  return (
    <Box
      component="nav"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        ...sx,
      }}
    >
      {resolveNavigation(navigation).map(
        (item) => (
          <NavDropdown
            key={item.label}
            label={item.label}
            items={item.children}
            path={
              item.path ||
              roleRoutes[
                item.routeKey
              ]?.[role]
            }
          />
        )
      )}
    </Box>
  );
}

NavMenu.propTypes = {
  navigation: PropTypes.array.isRequired,
  sx: PropTypes.object,
};