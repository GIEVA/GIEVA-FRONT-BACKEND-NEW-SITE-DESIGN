import { useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography, Paper, Fade } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Link as RouterLink } from "react-router-dom";

export default function NavDropdown({
  label,
  items = [],
  path,
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = Array.isArray(items) && items.length > 0;

  // ─────────────────────────────────────────────
  // SIMPLE LINK (Home, or any item with only path)
  // ─────────────────────────────────────────────
  if (!hasChildren && path) {
    return (
      <Box
        component={RouterLink}
        to={path}
        sx={{
          display: "flex",
          alignItems: "center",
          py: 2,
          px: 1,
          textDecoration: "none",
          color: "#17153B",
          fontWeight: 600,
          transition: ".25s",
          "&:hover": {
            color: "#FF6B35",
          },
        }}
      >
        <Typography fontWeight={600} fontSize={15}>
          {label}
        </Typography>
      </Box>
    );
  }

  // ─────────────────────────────────────────────
  // DROPDOWN
  // ─────────────────────────────────────────────
  return (
    <Box
      sx={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Trigger */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.4,
          cursor: "pointer",
          py: 2,
          px: 1,
          color: "#17153B",
          fontWeight: 600,
          transition: ".25s",
          "&:hover": {
            color: "#FF6B35",
          },
        }}
      >
        <Typography fontWeight={600} fontSize={15}>
          {label}
        </Typography>

        <KeyboardArrowDownIcon
          sx={{
            fontSize: 18,
            transition: ".25s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </Box>

      {/* Menu */}
      <Fade in={open} timeout={200}>
        <Paper
          elevation={12}
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: 340,
            borderRadius: 4,
            overflow: "hidden",
            mt: 1,
            zIndex: 999,
            border: "1px solid rgba(0,0,0,.06)",
            boxShadow: "0 24px 60px rgba(0,0,0,.12)",
            bgcolor: "#fff",
          }}
        >
          {items.map((item) => (
            <Box
              key={item.label}
              component={RouterLink}
              to={item.path}
              sx={{
                display: "block",
                p: 2.5,
                textDecoration: "none",
                transition: ".25s",
                borderBottom: "1px solid rgba(0,0,0,.05)",
                "&:last-child": { borderBottom: 0 },
                "&:hover": {
                  bgcolor: "rgba(30,127,79,.05)",
                },
              }}
            >
              <Typography
                fontWeight={700}
                color="#17153B"
                mb={item.description ? 0.6 : 0}
              >
                {item.label}
              </Typography>

              {item.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {item.description}
                </Typography>
              )}
            </Box>
          ))}
        </Paper>
      </Fade>
    </Box>
  );
}

NavDropdown.propTypes = {
  label: PropTypes.string.isRequired,
  path: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      description: PropTypes.string,
    })
  ),
};