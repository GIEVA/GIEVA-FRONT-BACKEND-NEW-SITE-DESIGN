import PropTypes from "prop-types";

import {
  Box,
  Button,
} from "@mui/material";

import {
  Link as RouterLink,
} from "react-router-dom";

import {
  guestActions,
} from "../navigation.config";

export default function AuthButtons({
  actions = guestActions,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      {actions.map((action) => (
        <Button
          key={action.label}
          component={RouterLink}
          to={action.path}
          variant={
            action.variant === "contained"
              ? "contained"
              : "text"
          }
          disableElevation
          sx={{
            px: 3,
            py: 1,

            borderRadius: 50,

            textTransform: "none",

            fontWeight: 700,

            ...(action.variant ===
              "contained"
              ? {
                  background:
                    "linear-gradient(90deg,#1E7F4F,#2AAE66)",

                  color: "#fff",

                  "&:hover": {
                    background:
                      "linear-gradient(90deg,#16643F,#239458)",
                  },
                }
              : {
                  color: "#17153B",

                  "&:hover": {
                    bgcolor:
                      "transparent",

                    color: "#FF6B35",
                  },
                }),
          }}
        >
          {action.label}
        </Button>
      ))}
    </Box>
  );
}

AuthButtons.propTypes = {
  actions: PropTypes.array,
};