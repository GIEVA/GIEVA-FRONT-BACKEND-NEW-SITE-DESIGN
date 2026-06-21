import {
  Box,
} from "@mui/material";

import AdminSidebar
from "../components/AdminSidebar";

export default function
AdminLayout({
  children,
}) {

  return (

    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#f7f9fc",
      }}
    >

      <AdminSidebar />

      <Box

        component="main"

        sx={{

          flexGrow: 1,

          bgcolor:
            "#f7f9fc",

          minHeight:
            "100vh",

          width: "100%",

          overflowX: "hidden",
        }}
      >

        {children}

      </Box>

    </Box>
  );
}