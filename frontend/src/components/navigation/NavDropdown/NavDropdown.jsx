import { useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography, Paper, Fade } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Link as RouterLink } from "react-router-dom";

const rowSx = {
  display: "block",
  p: 2.5,
  textDecoration: "none",
  transition: ".25s",
  borderBottom: "1px solid rgba(0,0,0,.05)",
  "&:last-child": { borderBottom: 0 },
  "&:hover": { bgcolor: "rgba(30,127,79,.05)" },
};

const ItemText = ({ item }) => (
  <>
    <Typography fontWeight={700} color="#17153B" mb={item.description ? 0.6 : 0}>
      {item.label}
    </Typography>
    {item.description && (
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
        {item.description}
      </Typography>
    )}
  </>
);

// One row of the menu. A row with its own `children` opens a side menu (hover on desktop, click/tap on touch).
function MenuRow({ item, onNavigate }) {
  const [sub, setSub] = useState(false);
  const subItems = Array.isArray(item.children) ? item.children : [];

  if (!subItems.length) {
    return (
      <Box component={RouterLink} to={item.path} onClick={onNavigate} sx={rowSx}>
        <ItemText item={item} />
      </Box>
    );
  }

  return (
    <Box
      sx={{ position: "relative", borderBottom: "1px solid rgba(0,0,0,.05)", "&:last-child": { borderBottom: 0 } }}
      onMouseEnter={() => setSub(true)}
      onMouseLeave={() => setSub(false)}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={sub}
        onClick={() => setSub((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSub((v) => !v); } }}
        sx={{ ...rowSx, borderBottom: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1,
              bgcolor: sub ? "rgba(30,127,79,.05)" : "transparent" }}
      >
        <Box><ItemText item={item} /></Box>
        <ChevronRightIcon sx={{ color: "#17153B", opacity: 0.6, flexShrink: 0 }} />
      </Box>

      {sub && (
        <Paper
          elevation={12}
          sx={{
            position: "absolute", top: 0, left: "100%", ml: 0.5, width: 300, borderRadius: 4, overflow: "hidden",
            zIndex: 1000, border: "1px solid rgba(0,0,0,.06)", boxShadow: "0 24px 60px rgba(0,0,0,.12)", bgcolor: "#fff",
          }}
        >
          {subItems.map((child) => (
            <Box key={child.label} component={RouterLink} to={child.path} onClick={onNavigate} sx={rowSx}>
              <ItemText item={child} />
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}

export default function NavDropdown({ label, items = [], path }) {
  const [open, setOpen] = useState(false);
  const hasChildren = Array.isArray(items) && items.length > 0;

  // SIMPLE LINK (Home, or any item with only a path)
  if (!hasChildren && path) {
    return (
      <Box
        component={RouterLink}
        to={path}
        sx={{
          display: "flex", alignItems: "center", py: 2, px: 1, textDecoration: "none", color: "#17153B", fontWeight: 600,
          transition: ".25s", "&:hover": { color: "#FF6B35" },
        }}
      >
        <Typography fontWeight={600} fontSize={15}>{label}</Typography>
      </Box>
    );
  }

  // DROPDOWN
  return (
    <Box sx={{ position: "relative" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Box
        sx={{
          display: "flex", alignItems: "center", gap: 0.4, cursor: "pointer", py: 2, px: 1, color: "#17153B", fontWeight: 600,
          transition: ".25s", "&:hover": { color: "#FF6B35" },
        }}
      >
        <Typography fontWeight={600} fontSize={15}>{label}</Typography>
        <KeyboardArrowDownIcon sx={{ fontSize: 18, transition: ".25s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </Box>

      <Fade in={open} timeout={200}>
        <Paper
          elevation={12}
          sx={{
            position: "absolute", top: "100%", left: 0, width: 340, borderRadius: 4,
            // must NOT clip, or the side menu would be cut off
            overflow: "visible",
            mt: 1, zIndex: 999, border: "1px solid rgba(0,0,0,.06)", boxShadow: "0 24px 60px rgba(0,0,0,.12)", bgcolor: "#fff",
            visibility: open ? "visible" : "hidden",
          }}
        >
          {items.map((item) => (
            <MenuRow key={item.label} item={item} onNavigate={() => setOpen(false)} />
          ))}
        </Paper>
      </Fade>
    </Box>
  );
}

const itemShape = {
  label: PropTypes.string.isRequired,
  path: PropTypes.string,
  description: PropTypes.string,
};
NavDropdown.propTypes = {
  label: PropTypes.string.isRequired,
  path: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({ ...itemShape, children: PropTypes.arrayOf(PropTypes.shape(itemShape)) })),
};
