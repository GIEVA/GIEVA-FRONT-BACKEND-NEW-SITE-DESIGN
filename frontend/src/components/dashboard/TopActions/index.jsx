import PropTypes from "prop-types";

import {
  Box,
  Button,
  Tooltip,
  useMediaQuery,
} from "@mui/material";

import {
  useTheme,
} from "@mui/material/styles";

import {
  Link as RouterLink,
} from "react-router-dom";

import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import EditIcon from "@mui/icons-material/Edit";

const iconMap = {
  add: AddIcon,
  export: DownloadIcon,
  import: UploadIcon,
  edit: EditIcon,
};

export default function TopActions({
  actions = [],
}) {
  const theme = useTheme();

  const mobile = useMediaQuery(
    theme.breakpoints.down("md")
  );

  if (!actions.length) {
    return null;
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
    >
      {actions.map((action) => {
        const Icon =
          iconMap[action.icon];

        const button = (
          <Button
            key={action.label}
            component={
              action.path
                ? RouterLink
                : "button"
            }
            to={action.path}
            onClick={action.onClick}
            variant={
              action.variant ||
              "contained"
            }
            startIcon={
              Icon ? <Icon /> : null
            }
            disableElevation
            sx={{
              borderRadius: 2,
              textTransform:
                "none",
              whiteSpace:
                "nowrap",
            }}
          >
            {!mobile &&
              action.label}
          </Button>
        );

        return mobile ? (
          <Tooltip
            key={action.label}
            title={action.label}
          >
            {button}
          </Tooltip>
        ) : (
          button
        );
      })}
    </Box>
  );
}

TopActions.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label:
        PropTypes.string
          .isRequired,

      path:
        PropTypes.string,

      onClick:
        PropTypes.func,

      variant:
        PropTypes.string,

      icon:
        PropTypes.string,
    })
  ),
};