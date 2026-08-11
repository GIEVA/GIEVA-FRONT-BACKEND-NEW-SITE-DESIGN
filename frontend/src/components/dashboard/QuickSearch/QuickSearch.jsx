import PropTypes from "prop-types";

import {
  Box,
  InputBase,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";

export default function QuickSearch({
  placeholder = "Search...",
  onClick,
  sx = {},
}) {
  const theme = useTheme();

  const mobile = useMediaQuery(
    theme.breakpoints.down("md")
  );

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",

        width: mobile ? 180 : 340,

        px: 2,

        py: 0.8,

        borderRadius: 3,

        border: "1px solid",

        borderColor: "divider",

        transition: ".25s",

        cursor: "text",

        "&:hover": {
          borderColor: "primary.main",
        },

        ...sx,
      }}
    >
      <SearchIcon
        sx={{
          color: "text.secondary",
          mr: 1.5,
        }}
      />

      <InputBase
        fullWidth
        placeholder={placeholder}
      />

      {!mobile && (
        <Box
          sx={{
            px: 1,

            py: .3,

            borderRadius: 1,

            bgcolor: "grey.100",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Ctrl K
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

QuickSearch.propTypes = {
  placeholder: PropTypes.string,
  onClick: PropTypes.func,
  sx: PropTypes.object,
};