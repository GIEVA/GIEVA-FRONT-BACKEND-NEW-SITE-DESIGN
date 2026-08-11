import { useState } from "react";
import { Box, AppBar, Toolbar, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import AdminSidebar from "../components/AdminSidebar";

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 76;

export default function AdminLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);   // temporary drawer (mobile)
  const [collapsed, setCollapsed] = useState(false);     // mini rail (desktop)

  const drawerWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f9fc" }}>
      <AdminSidebar
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        drawerWidth={drawerWidth}
        expandedWidth={EXPANDED_WIDTH}
        collapsedWidth={COLLAPSED_WIDTH}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f7f9fc",
          minHeight: "100vh",
          width: "100%",
          overflowX: "hidden",
          transition: "margin-left 0.25s ease",
        }}
      >
        {/* Top bar — hamburger on mobile, collapse toggle on desktop */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "#fff",
            color: "#0B1F3A",
            borderBottom: "1px solid #E6E9F0",
          }}
        >
          <Toolbar sx={{ minHeight: "56px !important", px: { xs: 1.5, md: 2 } }}>
            <IconButton
              onClick={() => (isMobile ? setMobileOpen(true) : setCollapsed((c) => !c))}
              sx={{ mr: 1.5 }}
            >
              {isMobile ? <MenuIcon /> : collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
              {isMobile ? "GIEVA Admin" : ""}
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 0, md: 0 } }}>{children}</Box>
      </Box>
    </Box>
  );
}