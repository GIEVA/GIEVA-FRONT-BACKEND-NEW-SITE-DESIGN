import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Drawer,
  Box,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";

import {
  Dashboard,
  School,
  Article,
  Campaign,
  ExpandLess,
  ExpandMore,
  VerifiedUser,
  AssignmentInd,
  Settings,
  Notifications,
  VideoCall,
  AppRegistration,
  Analytics,
  Payment,
  Logout,
  People,
  History,
  Quiz,
  Groups,
  Assessment,
  Download,
  AccessTime,
  Public,
  Category,
  ContactMail,
  WorkOutline,
  SupportAgent,
  HistoryEdu,
  HelpOutline,
  AccountTree,
  ChevronLeft,
  EmojiEvents,
} from "@mui/icons-material";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const NAVY  = "#0B1F3A";
const GREEN = "#1E7F4F";

export default function AdminSidebar({
  isMobile,
  mobileOpen,
  onMobileClose,
  collapsed,
  drawerWidth,
  expandedWidth,
  collapsedWidth,
}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [campaignOpen, setCampaignOpen] = useState(true);
  const [examOpen,     setExamOpen]     = useState(true);
  const [liveOpen,     setLiveOpen]     = useState(true);

  const isActive   = (path) => location.pathname === path;
  const startsWith = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const showLabels = !collapsed || isMobile;

  const itemSx = {
    mb: 0.75,
    borderRadius: 2.5,
    justifyContent: collapsed && !isMobile ? "center" : "flex-start",
    px: collapsed && !isMobile ? 1.5 : 2,
    "&.Mui-selected": {
      bgcolor: NAVY,
      color:   "#fff",
      "& .MuiListItemIcon-root": { color: "#fff" },
      "&:hover": { bgcolor: NAVY },
    },
  };

  const subItemSx = {
    ...itemSx,
    pl: collapsed && !isMobile ? 1.5 : 5,
  };

  const menu = [
    { label: "Dashboard",          icon: <Dashboard />,     path: "/admin/dashboard"          },
    { label: "Users",              icon: <People />,        path: "/admin/users"              },
    { label: "Manage Courses",     icon: <School />,        path: "/admin/add-courses"        },
    { label: "Quiz Events",        icon: <EmojiEvents />,   path: "/admin/quiz-events"        },
    { label: "Tutor KYC",          icon: <VerifiedUser />,  path: "/admin/tutor-kyc"          },
    { label: "Tutor Assignments",  icon: <AssignmentInd />, path: "/admin/tutor-assignments"  },
    { label: "HEALS Dashboard",    icon: <Dashboard />,     path: "/admin/heals/dashboard"    },
    { label: "HEALS Applications", icon: <School />,        path: "/admin/heals/applications" },
    { label: "CMS Articles",       icon: <Article />,       path: "/admin/cms/articles"       },
    { label: "Contact Messages",   icon: <ContactMail />,   path: "/admin/contact-message"    },
  ];

  const otherItems = [
    { label: "Services",      icon: <WorkOutline />,   path: "/admin/services"      },
    { label: "Programs",      icon: <School />,        path: "/admin/programs"      },
    { label: "Staff",         icon: <Groups />,        path: "/admin/staff"         },
    { label: "Consultancy",   icon: <SupportAgent />,  path: "/admin/consultations" },
    { label: "History",       icon: <HistoryEdu />,    path: "/admin/history"       },
    { label: "Partners",      icon: <Groups />,        path: "/admin/partners"      },
    { label: "NGO",           icon: <AccountTree />,   path: "/admin/projects"      },
    { label: "FAQs",          icon: <HelpOutline />,   path: "/admin/faqs/page"     },
    { label: "Notifications", icon: <Notifications />, path: "/admin/notifications" },
    { label: "Payments",      icon: <Payment />,       path: "/admin/payments"      },
    { label: "Activity Logs", icon: <History />,       path: "/admin/activity-logs" },
    { label: "Settings",      icon: <Settings />,      path: "/admin/settings"      },
  ];

  const NavLink = ({ item, sx, selected }) => {
    const button = (
      <ListItemButton
        component={Link}
        to={item.path}
        selected={selected}
        onClick={isMobile ? onMobileClose : undefined}
        sx={sx}
      >
        <ListItemIcon sx={{ minWidth: collapsed && !isMobile ? 0 : 40, justifyContent: "center" }}>
          {item.icon}
        </ListItemIcon>
        {showLabels && (
          <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
        )}
      </ListItemButton>
    );

    if (collapsed && !isMobile) {
      return (
        <Tooltip title={item.label} placement="right">
          {button}
        </Tooltip>
      );
    }
    return button;
  };

  const content = (
    <>
      {/* ── HEADER ─────────────────────────────────────── */}
      <Box sx={{ p: collapsed && !isMobile ? 2 : 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          {showLabels ? (
            <>
              <Typography variant="h5" fontWeight="bold" color="primary">
                GIEVA
              </Typography>
              <Typography color="text.secondary" mt={0.5} fontSize={13}>
                Admin Panel
              </Typography>
            </>
          ) : (
            <Typography variant="h6" fontWeight="bold" color="primary" sx={{ textAlign: "center" }}>
              G
            </Typography>
          )}
        </Box>
        {isMobile && (
          <IconButton onClick={onMobileClose} size="small">
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* ── USER ───────────────────────────────────────── */}
      <Box sx={{ p: collapsed && !isMobile ? 1.5 : 3 }}>
        <Box display="flex" alignItems="center" gap={showLabels ? 2 : 0} justifyContent={showLabels ? "flex-start" : "center"}>
          <Avatar sx={{ bgcolor: NAVY, fontWeight: 700, width: showLabels ? 40 : 36, height: showLabels ? 40 : 36 }}>
            {user?.fullName?.[0]}
          </Avatar>
          {showLabels && (
            <Box>
              <Typography fontWeight="bold" fontSize={14}>{user?.fullName}</Typography>
              <Chip
                size="small"
                label={user?.role}
                sx={{ mt: 0.75, fontSize: 11, height: 20, bgcolor: "#F1F5F9" }}
              />
            </Box>
          )}
        </Box>
      </Box>

      <Divider />

      {/* ── MAIN MENU ──────────────────────────────────── */}
      <List sx={{ px: collapsed && !isMobile ? 1 : 2, py: 2, flex: 1, overflowY: "auto" }}>
        {menu.map((item) => (
          <NavLink key={item.label} item={item} sx={itemSx} selected={isActive(item.path)} />
        ))}

        {/* ── CAMPAIGNS ──────────────────────────────── */}
        {showLabels ? (
          <>
            <ListItemButton onClick={() => setCampaignOpen(!campaignOpen)} sx={{ ...itemSx, mt: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}><Campaign /></ListItemIcon>
              <ListItemText primary="Campaigns" primaryTypographyProps={{ fontSize: 14 }} />
              {campaignOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={campaignOpen}>
              <List component="div" disablePadding>
                {[
                  { label: "All Campaigns",   path: "/admin/campaigns"        },
                  { label: "Create Campaign", path: "/admin/campaigns/create" },
                ].map((item) => (
                  <ListItemButton
                    key={item.label}
                    component={Link}
                    to={item.path}
                    selected={isActive(item.path)}
                    onClick={isMobile ? onMobileClose : undefined}
                    sx={subItemSx}
                  >
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13 }} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </>
        ) : (
          <Tooltip title="Campaigns" placement="right">
            <ListItemButton component={Link} to="/admin/campaigns" selected={startsWith("/admin/campaigns")} sx={itemSx}>
              <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}><Campaign /></ListItemIcon>
            </ListItemButton>
          </Tooltip>
        )}

        {/* ── LIVE CLASSES ───────────────────────────── */}
        {showLabels ? (
          <>
            <ListItemButton onClick={() => setLiveOpen(!liveOpen)} sx={{ ...itemSx, mt: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}><VideoCall /></ListItemIcon>
              <ListItemText primary="Live Classes" primaryTypographyProps={{ fontSize: 14 }} />
              {liveOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={liveOpen}>
              <List component="div" disablePadding>
                {[
                  { label: "Dashboard",        path: "/admin/live-sessions",                icon: <Dashboard />       },
                  { label: "Schedule Session", path: "/admin/live-sessions?schedule=true",  icon: <AppRegistration /> },
                  { label: "Analytics",        path: "/admin/live-sessions?tab=analytics",  icon: <Analytics />       },
                  { label: "Tutor Hours",      path: "/admin/live-sessions?tab=tutor-hours",icon: <AccessTime />      },
                  { label: "Public Sessions",  path: "/admin/public-sessions",              icon: <Public />          },
                ].map((item) => (
                  <ListItemButton
                    key={item.label}
                    component={Link}
                    to={item.path}
                    selected={startsWith("/admin/live-sessions")}
                    onClick={isMobile ? onMobileClose : undefined}
                    sx={subItemSx}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13 }} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </>
        ) : (
          <Tooltip title="Live Classes" placement="right">
            <ListItemButton component={Link} to="/admin/live-sessions" selected={startsWith("/admin/live-sessions")} sx={itemSx}>
              <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}><VideoCall /></ListItemIcon>
            </ListItemButton>
          </Tooltip>
        )}

        {/* ── EXAM MANAGEMENT ────────────────────────── */}
        {showLabels ? (
          <>
            <ListItemButton onClick={() => setExamOpen(!examOpen)} sx={{ ...itemSx, mt: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}><Quiz /></ListItemIcon>
              <ListItemText primary="Exam Management" primaryTypographyProps={{ fontSize: 14 }} />
              {examOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={examOpen}>
              <List component="div" disablePadding>
                {[
                  { label: "Exam Dashboard", path: "/admin/exams",               icon: <Dashboard />       },
                  { label: "Exam Types",     path: "/admin/exam-types",          icon: <Category />        },
                  { label: "Registrations",  path: "/admin/exams/registrations", icon: <AppRegistration /> },
                  { label: "Payments",       path: "/admin/exams/payments",      icon: <Payment />         },
                  { label: "Statistics",     path: "/admin/exams/stats",         icon: <Assessment />      },
                  { label: "Export Data",    path: "/admin/exams/export",        icon: <Download />        },
                ].map((item) => (
                  <ListItemButton
                    key={item.label}
                    component={Link}
                    to={item.path}
                    selected={isActive(item.path)}
                    onClick={isMobile ? onMobileClose : undefined}
                    sx={subItemSx}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13 }} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </>
        ) : (
          <Tooltip title="Exam Management" placement="right">
            <ListItemButton component={Link} to="/admin/exams" selected={startsWith("/admin/exams")} sx={itemSx}>
              <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}><Quiz /></ListItemIcon>
            </ListItemButton>
          </Tooltip>
        )}

        {/* ── OTHER ──────────────────────────────────── */}
        {otherItems.map((item) => (
          <NavLink key={item.label} item={item} sx={{ ...itemSx, mt: item.label === "Notifications" ? 0.5 : 0 }} selected={isActive(item.path)} />
        ))}
      </List>

      {/* ── FOOTER / LOGOUT ────────────────────────────── */}
      <Box sx={{ p: collapsed && !isMobile ? 1 : 2, borderTop: "1px solid #E6E9F0" }}>
        {collapsed && !isMobile ? (
          <Tooltip title="Logout" placement="right">
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2.5, justifyContent: "center", px: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}><Logout color="error" /></ListItemIcon>
            </ListItemButton>
          </Tooltip>
        ) : (
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2.5 }}>
            <ListItemIcon><Logout color="error" /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        )}
      </Box>
    </>
  );

  return isMobile ? (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiDrawer-paper": {
          width: expandedWidth,
          boxSizing: "border-box",
          bgcolor: "#fff",
        },
      }}
    >
      {content}
    </Drawer>
  ) : (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: "nowrap",
        transition: "width 0.25s ease",
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid #E6E9F0",
          bgcolor: "#fff",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
          transition: "width 0.25s ease",
        },
      }}
    >
      {content}
    </Drawer>
  );
}