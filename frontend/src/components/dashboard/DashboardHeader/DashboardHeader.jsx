import {
  AppBar,
  Toolbar,
  Box,
  useMediaQuery,
  IconButton,
} from "@mui/material";

import {
  Menu as MenuIcon,
} from "@mui/icons-material";

import { useTheme } from "@mui/material/styles";

import QuickSearch from "../QuickSearch/QuickSearch";
import Notifications from "../Notifications/Notifications";
import TopActions from "../TopActions/TopActions";

import UserMenu from "../../navigation/UserMenu/UserMenu";

export default function DashboardHeader({
  onMenuClick,
}) {
  const theme = useTheme();

  const mobile = useMediaQuery(
    theme.breakpoints.down("lg")
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{
        bgcolor: "#fff",

        borderBottom:
          "1px solid rgba(0,0,0,.06)",

        zIndex: theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar
        sx={{
          justifyContent:
            "space-between",

          minHeight: 72,
        }}
      >
        {/* =======================================
            LEFT
        ======================================= */}

        <Box
          display="flex"
          alignItems="center"
          gap={2}
        >
          {mobile && (
            <IconButton
              onClick={onMenuClick}
            >
              <MenuIcon />
            </IconButton>
          )}

          <QuickSearch />
        </Box>

        {/* =======================================
            RIGHT
        ======================================= */}

        <Box
          display="flex"
          alignItems="center"
          gap={1}
        >
          <TopActions />

          <Notifications />

          <UserMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
}