import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import HomePage from "../pages/HomePage";
import { dashboardForRole } from "../utils/authRedirect";

const LANDED_KEY = "gieva_landed";

export default function RootRedirect() {
  const { user, loading } = useAuth();

  // Read once on mount: is this the first time this tab has opened the site?
  const [alreadyLanded] = useState(() => sessionStorage.getItem(LANDED_KEY) === "1");

  useEffect(() => {
    if (!loading) sessionStorage.setItem(LANDED_KEY, "1");
  }, [loading]);

  // Wait for the session check so a logged-in user never sees a flash of the homepage
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (user && !alreadyLanded) {
    return <Navigate to={dashboardForRole(user.role)} replace />;
  }

  return <HomePage />;
}