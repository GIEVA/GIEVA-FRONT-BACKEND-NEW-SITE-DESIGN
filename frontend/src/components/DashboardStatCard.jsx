// components/DashboardStatCard.jsx
//
// Fixed: no fixed height, no absolute-positioned icon,
// clean flex-column layout that never overlaps at any viewport.

import { Box, Paper, Typography } from "@mui/material";

const NAVY  = "#0B1F3A";
const GREEN = "#1E7F4F";

const DashboardStatCard = ({
  title,
  value,
  icon,
  color = NAVY,
}) => (
  <Paper
    elevation={0}
    sx={{
      border:      "1px solid #E6E9F0",
      borderRadius: 3,
      p:           { xs: 2.5, md: 3 },
      bgcolor:     "#FFFFFF",
      display:     "flex",
      flexDirection: "column",
      gap:         1.5,
      transition:  "box-shadow 0.2s, border-color 0.2s",
      "&:hover": {
        borderColor: color,
        boxShadow:   `0 4px 16px ${color}22`,
      },
    }}
  >
    {/* Icon badge */}
    <Box
      sx={{
        width:          44,
        height:         44,
        borderRadius:   2.5,
        bgcolor:        `${color}18`,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        color,
        flexShrink:     0,
        "& svg": { fontSize: 22 },
      }}
    >
      {icon}
    </Box>

    {/* Label */}
    <Typography
      sx={{
        fontSize:      12,
        fontWeight:    600,
        color:         "#64748B",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        lineHeight:    1.3,
      }}
    >
      {title}
    </Typography>

    {/* Value */}
    <Typography
      sx={{
        fontSize:   { xs: 24, md: 28 },
        fontWeight: 800,
        color:      "#0F172A",
        lineHeight: 1,
      }}
    >
      {value}
    </Typography>
  </Paper>
);

export default DashboardStatCard;
