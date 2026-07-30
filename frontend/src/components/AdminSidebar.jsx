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
} from "@mui/icons-material";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const DRAWER_WIDTH = 260;

const NAVY  = "#0B1F3A";
const GREEN = "#1E7F4F";

export default function AdminSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
 

  const [campaignOpen, setCampaignOpen] = useState(true);
  const [examOpen,     setExamOpen]     = useState(true);
  const [liveOpen,     setLiveOpen]     = useState(true);

  const isActive     = (path) => location.pathname === path;
  const startsWith   = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ── shared styles ────────────────────────────────────────
  const itemSx = {
    mb:           0.75,
    borderRadius: 2.5,
    "&.Mui-selected": {
      bgcolor: NAVY,
      color:   "#fff",
      "& .MuiListItemIcon-root": { color: "#fff" },
      "&:hover": { bgcolor: NAVY },
    },
  };

  const subItemSx = {
    ...itemSx,
    pl: 5,
  };

  // ── top-level flat menu ──────────────────────────────────
  const menu = [
    { label: "Dashboard",         icon: <Dashboard />,    path: "/admin/dashboard"         },
    { label: "Users",             icon: <People />,       path: "/admin/users"             },
    { label: "Manage Courses",    icon: <School />,       path: "/admin/add-courses"       },
    { label: "Tutor KYC",         icon: <VerifiedUser />, path: "/admin/tutor-kyc"         },
    { label: "Tutor Assignments", icon: <AssignmentInd />,path: "/admin/tutor-assignments" },
    { label: "HEALS Dashboard",   icon: <Dashboard />,    path: "/admin/heals/dashboard"   },
    { label: "HEALS Applications",icon: <School />,       path: "/admin/heals/applications"},
    { label: "CMS Articles",      icon: <Article />,      path: "/admin/cms/articles"      },
    {
    label: "Contact Messages",
    icon: <ContactMail />,
    path: "/admin/contact-message",
  },

  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width:      DRAWER_WIDTH,
          boxSizing:  "border-box",
          borderRight:"1px solid #E6E9F0",
          bgcolor:    "#fff",
          display:    "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* ── HEADER ─────────────────────────────────────── */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          GIEVA
        </Typography>
        <Typography color="text.secondary" mt={0.5} fontSize={13}>
          Admin Panel
        </Typography>
      </Box>

      <Divider />

      {/* ── USER ───────────────────────────────────────── */}
      <Box sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: NAVY, fontWeight: 700 }}>
            {user?.fullName?.[0]}
          </Avatar>
          <Box>
            <Typography fontWeight="bold" fontSize={14}>{user?.fullName}</Typography>
            <Chip
              size="small"
              label={user?.role}
              sx={{ mt: 0.75, fontSize: 11, height: 20, bgcolor: "#F1F5F9" }}
            />
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* ── MAIN MENU ──────────────────────────────────── */}
      <List sx={{ px: 2, py: 2, flex: 1, overflowY: "auto" }}>

        {/* Flat items */}
        {menu.map((item) => (
          <ListItemButton
            key={item.label}
            component={Link}
            to={item.path}
            selected={isActive(item.path)}
            sx={itemSx}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        ))}

        {/* ── CAMPAIGNS ──────────────────────────────── */}
        <ListItemButton onClick={() => setCampaignOpen(!campaignOpen)} sx={{ ...itemSx, mt: 0.5 }}>
          <ListItemIcon><Campaign /></ListItemIcon>
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
                sx={subItemSx}
              >
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13 }} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>

        {/* ── LIVE CLASSES ───────────────────────────── */}
        <ListItemButton onClick={() => setLiveOpen(!liveOpen)} sx={{ ...itemSx, mt: 0.5 }}>
          <ListItemIcon><VideoCall /></ListItemIcon>
          <ListItemText primary="Live Classes" primaryTypographyProps={{ fontSize: 14 }} />
          {liveOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={liveOpen}>
          <List component="div" disablePadding>
            {[
              { label: "Dashboard",       path: "/admin/live-sessions",               icon: <Dashboard />      },
              { label: "Schedule Session",path: "/admin/live-sessions?schedule=true", icon: <AppRegistration />},
              { label: "Analytics",       path: "/admin/live-sessions?tab=analytics", icon: <Analytics />      },
              { label: "Tutor Hours",     path: "/admin/live-sessions?tab=tutor-hours",icon: <AccessTime />    },
              { label: "Public Sessions", path: "/admin/public-sessions",             icon: <Public />         },
            ].map((item) => (
              <ListItemButton
                key={item.label}
                component={Link}
                to={item.path}
                selected={startsWith("/admin/live-sessions")}
                sx={subItemSx}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13 }} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>

        {/* ── EXAM MANAGEMENT ────────────────────────── */}
        <ListItemButton onClick={() => setExamOpen(!examOpen)} sx={{ ...itemSx, mt: 0.5 }}>
          <ListItemIcon><Quiz /></ListItemIcon>
          <ListItemText primary="Exam Management" primaryTypographyProps={{ fontSize: 14 }} />
          {examOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={examOpen}>
          <List component="div" disablePadding>
            {[
              { label: "Exam Dashboard", path: "/admin/exams",                  icon: <Dashboard />      },
              { label: "Exam Types",     path: "/admin/exam-types",             icon: <Category />       }, 
              { label: "Registrations",  path: "/admin/exams/registrations",    icon: <AppRegistration />},
              { label: "Payments",       path: "/admin/exams/payments",         icon: <Payment />        },
              { label: "Statistics",     path: "/admin/exams/stats",            icon: <Assessment />     },
              { label: "Export Data",    path: "/admin/exams/export",           icon: <Download />       },
            ].map((item) => (
              <ListItemButton
                key={item.label}
                component={Link}
                to={item.path}
                selected={isActive(item.path)}
                sx={subItemSx}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13 }} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>

        {/* ── OTHER ──────────────────────────────────── */}
        {[
          { label: "Services", icon: <WorkOutline />, path: "/admin/services"  },
          { label: "Programs", icon: <School />, path: "/admin/programs"  },
          { label: "Staff", icon: <Groups />, path: "/admin/staff"  },
          { label: "Consultancy", icon: <SupportAgent />, path: "/admin/consultations"  },
          { label: "Notifications", icon: <Notifications WorkOutline/>, path: "/admin/notifications"  },
          { label: "Payments",      icon: <Payment />,       path: "/admin/payments"        },
          { label: "Activity Logs", icon: <History />,       path: "/admin/activity-logs"   },
          { label: "Settings",      icon: <Settings />,      path: "/admin/settings"        },
        ].map((item) => (
          <ListItemButton
            key={item.label}
            component={Link}
            to={item.path}
            selected={isActive(item.path)}
            sx={{ ...itemSx, mt: item.label === "Notifications" ? 0.5 : 0 }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        ))}
      </List>

      {/* ── FOOTER / LOGOUT ────────────────────────────── */}
        <Box sx={{ p: 2, borderTop: "1px solid #E6E9F0" }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2.5 }}>
          <ListItemIcon><Logout color="error" /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}


// import {
//   Link,
//   useLocation,
// } from "react-router-dom";

// import {

//   Drawer,
//   Box,
//   Typography,
//   Divider,
//   List,
//   ListItemButton,
//   ListItemIcon,
//   ListItemText,
//   Collapse,
//   Avatar,
//   Chip,

// } from "@mui/material";

// import {
//   Dashboard,
//   School,
//   Article,
//   Campaign,
//   ExpandLess,
//   ExpandMore,
//   Groups,
//   VerifiedUser,
//   AssignmentInd,
//   Settings,
//   Notifications,
//   VideoCall,
//   AppRegistration,
//   Analytics,
//   Email,
//   Payment,
//   Logout,
//   People,
//   History,
//   Quiz,
//   Assessment,
//   Download,
//   AccessTime,
//   Public,
// } from "@mui/icons-material";

// import NotificationsIcon
// from "@mui/icons-material/Notifications";

// import {
//   useState,
// } from "react";

// import {
//   useAuth,
// } from "../context/AuthContext";



// const DRAWER_WIDTH = 260;



// export default function
// AdminSidebar() {

//   const location =
//     useLocation();

//   const {
//     user,
//     logout,
//   } = useAuth();



//   const [campaignOpen,
//     setCampaignOpen] =
//       useState(true);

//   const [examOpen,
//     setExamOpen] =
//     useState(true);

//     const [liveOpen, setLiveOpen] = useState(true);


//       const itemSx = {
//     mb:           0.75,
//     borderRadius: 2.5,
//     "&.Mui-selected": {
//       bgcolor: NAVY,
//       color:   "#fff",
//       "& .MuiListItemIcon-root": { color: "#fff" },
//       "&:hover": { bgcolor: NAVY },
//     },
//   };

//   const subItemSx = {
//     ...itemSx,
//     pl: 5,
//   };


//   const isActive =
//     (path) => {

//       return location.pathname
//         === path;
//     };



//   const menu = [

//     {
//       label:
//         "Dashboard",

//       icon:
//         <Dashboard />,

//       path:
//         "/admin/dashboard",
//     },

//     {
//       label:
//         "Users",

//       icon:
//         <People />,

//       path:
//         "/admin/users",
//     },



//     // ======================================================
//     // COURSES
//     // ======================================================

//     {
//       label:
//         "Manage Courses",

//       icon:
//         <School />,

//       path:
//         "/admin/add-courses",
//     },



//     // ======================================================
//     // TUTORS
//     // ======================================================

//     {
//       label:
//         "Tutor KYC",

//       icon:
//         <VerifiedUser />,

//       path:
//         "/admin/tutor-kyc",
//     },

//     {
//       label:
//         "Tutor Assignments",

//       icon:
//         <AssignmentInd />,

//       path:
//         "/admin/tutor-assignments",
//     },






//     // ======================================================
//     // HEALS
//     // ======================================================

//     {
//       label: "HEALS Dashboard",
//       icon: <Dashboard />,
//       path: "/admin/heals/dashboard",
//     },

//     {
//       label: "HEALS Applications",
//       icon: <School />,
//       path: "/admin/heals/applications",
//     },


//     // ======================================================
//     // CMS
//     // ======================================================

//     {
//       label:
//         "CMS Articles",

//       icon:
//         <Article />,

//       path:
//         "/admin/cms/articles",
//     },
//   ];



//   return (

//     <Drawer

//       variant="permanent"

//       sx={{

//         width:
//           DRAWER_WIDTH,

//         flexShrink: 0,

//         "& .MuiDrawer-paper": {

//           width:
//             DRAWER_WIDTH,

//           boxSizing:
//             "border-box",

//           borderRight:
//             "1px solid #eee",

//           bgcolor:
//             "#fff",
//         },
//       }}
//     >

//       {/* HEADER */}

//       <Box
//         sx={{
//           p: 3,
//         }}
//       >

//         <Typography

//           variant="h5"

//           fontWeight="bold"

//           color="primary"
//         >

//           GIEVA

//         </Typography>



//         <Typography
//           color="text.secondary"
//           mt={0.5}
//         >

//           Admin Panel

//         </Typography>

//       </Box>



//       <Divider />



//       {/* USER */}

//       <Box
//         sx={{
//           p: 3,
//         }}
//       >

//         <Box
//           display="flex"
//           alignItems="center"
//           gap={2}
//         >

//           <Avatar>

//             {
//               user?.fullName?.[0]
//             }

//           </Avatar>



//           <Box>

//             <Typography
//               fontWeight="bold"
//             >

//               {
//                 user?.fullName
//               }

//             </Typography>



//             <Chip

//               size="small"

//               label={
//                 user?.role
//               }

//               sx={{
//                 mt: 1,
//               }}
//             />

//           </Box>

//         </Box>

//       </Box>



//       <Divider />



//       {/* MAIN MENU */}

//       <List
//         sx={{
//           px: 2,
//           py: 2,
//         }}
//       >

//         {menu.map(
//           (item) => (

//             <ListItemButton

//               key={item.label}

//               component={Link}

//               to={item.path}

//               selected={
//                 isActive(
//                   item.path
//                 )
//               }

//               sx={{

//                 mb: 1,

//                 borderRadius: 3,

//                 "&.Mui-selected": {

//                   bgcolor:
//                     "primary.main",

//                   color:
//                     "#fff",

//                   "& .MuiListItemIcon-root":
//                   {
//                     color:
//                       "#fff",
//                   },
//                 },
//               }}
//             >

//               <ListItemIcon>

//                 {item.icon}

//               </ListItemIcon>



//               <ListItemText
//                 primary={
//                   item.label
//                 }
//               />

//             </ListItemButton>
//           )
//         )}



//         {/* ======================================================
//             CAMPAIGNS SECTION
//         ====================================================== */}

//         <ListItemButton

//           onClick={() =>
//             setCampaignOpen(
//               !campaignOpen
//             )
//           }

//           sx={{
//             borderRadius: 3,
//           }}
//         >

//           <ListItemIcon>

//             <Campaign />

//           </ListItemIcon>



//           <ListItemText
//             primary="Campaigns"
//           />



//           {campaignOpen
//             ? <ExpandLess />
//             : <ExpandMore />
//           }

//         </ListItemButton>



//         <Collapse
//           in={campaignOpen}
//         >

//           <List
//             component="div"
//             disablePadding
//           >

//             {[

//               {

//                 label:
//                   "All Campaigns",

//                 path:
//                   "/admin/campaigns",
//               },

//               {

//                 label:
//                   "Create Campaign",

//                 path:
//                   "/admin/campaigns/create",
//               },

          

//             ].map((item) => (

//               <ListItemButton

//                 key={item.label}

//                 component={Link}

//                 to={item.path}

//                 selected={
//                   isActive(
//                     item.path
//                   )
//                 }

//                 sx={{

//                   pl: 5,

//                   borderRadius: 3,

//                   mb: 1,
//                 }}
//               >

//                 <ListItemText
//                   primary={
//                     item.label
//                   }
//                 />

//               </ListItemButton>
//             ))}

//           </List>

//         </Collapse>

//         {/* ======================================================
//     LIVE CLASS MANAGEMENT
// ====================================================== */}

// <ListItemButton
//   onClick={() => setLiveOpen(!liveOpen)}
//   sx={{
//     borderRadius: 3,
//     mt: 1,
//   }}
// >
//   <ListItemIcon>
//     <VideoCall />
//   </ListItemIcon>

//   <ListItemText
//     primary="Live Classes"
//   />

//   {liveOpen ? (
//     <ExpandLess />
//   ) : (
//     <ExpandMore />
//   )}
// </ListItemButton>

// <Collapse in={liveOpen}>
//   <List
//     component="div"
//     disablePadding
//   >

//     {[
//       {
//         label: "Dashboard",
//         path: "/admin/live-sessions",
//         icon: <Dashboard />,
//       },
//       {
//         label: "Schedule Session",
//         path: "/admin/live-sessions?schedule=true",
//         icon: <AppRegistration />,
//       },
//       {
//         label: "Analytics",
//         path: "/admin/live-sessions?tab=analytics",
//         icon: <Analytics />,
//       },
//       {
//         label: "Tutor Hours",
//         path: "/admin/live-sessions?tab=tutor-hours",
//         icon: <AccessTime />,
//       },
//       {
//         label: "Public Sessions",
//         path: "/admin/public-sessions",
//         icon: <Public />,
//       }
//     ].map((item) => (

//       <ListItemButton
//         key={item.label}
//         component={Link}
//         to={item.path}
//         selected={
//           location.pathname.startsWith(
//             "/admin/live-sessions"
//           )
//         }
//         sx={{
//           pl: 5,
//           borderRadius: 3,
//           mb: 1,

//           "&.Mui-selected": {
//             bgcolor: "primary.main",
//             color: "#fff",

//             "& .MuiListItemIcon-root": {
//               color: "#fff",
//             },
//           },
//         }}
//       >
//         <ListItemIcon>
//           {item.icon}
//         </ListItemIcon>

//         <ListItemText
//           primary={item.label}
//         />

//       </ListItemButton>

//     ))}

//   </List>
// </Collapse>

// {/* ======================================================
//       EXAM MANAGEMENT
// ====================================================== */}

//         {/* ======================================================
//               EXAM MANAGEMENT
//           ====================================================== */}

//             {/* ── EXAM MANAGEMENT ────────────────────────── */}
//                 <ListItemButton onClick={() => setExamOpen(!examOpen)} sx={{ ...itemSx, mt: 0.5 }}>
//                   <ListItemIcon><Quiz /></ListItemIcon>
//                   <ListItemText primary="Exam Management" primaryTypographyProps={{ fontSize: 14 }} />
//                   {examOpen ? <ExpandLess /> : <ExpandMore />}
//                 </ListItemButton>
        
//                 <Collapse in={examOpen}>
//                   <List component="div" disablePadding>
//                     {[
//                       { label: "Exam Dashboard", path: "/admin/exams",                  icon: <Dashboard />      },
//                       { label: "Exam Types",     path: "/admin/exam-types",             icon: <Category />       },  
//                       { label: "Registrations",  path: "/admin/exams/registrations",    icon: <AppRegistration />},
//                       { label: "Payments",       path: "/admin/exams/payments",         icon: <Payment />        },
//                       { label: "Statistics",     path: "/admin/exams/stats",            icon: <Assessment />     },
//                       { label: "Export Data",    path: "/admin/exams/export",           icon: <Download />       },
//                     ].map((item) => (
//                       <ListItemButton
//                         key={item.label}
//                         component={Link}
//                         to={item.path}
//                         selected={isActive(item.path)}
//                         sx={subItemSx}
//                       >
//                         <ListItemIcon>{item.icon}</ListItemIcon>
//                         <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13 }} />
//                       </ListItemButton>
//                     ))}
//                   </List>
//                 </Collapse>

//         {/* ======================================================
//             OTHER
//         ====================================================== */}

//         <ListItemButton

//           component={Link}

//           to="/admin/notifications"

//           sx={{
//             borderRadius: 3,
//             mb: 1,
//           }}
//         >

//           <ListItemIcon>

//             <Notifications />

//           </ListItemIcon>



//           <ListItemText
//             primary="Notifications"
//           />

//         </ListItemButton>



//         <ListItemButton

//           component={Link}

//           to="/admin/payments"

//           sx={{
//             borderRadius: 3,
//             mb: 1,
//           }}
//         >

//           <ListItemIcon>

//             <Payment />

//           </ListItemIcon>



//           <ListItemText
//             primary="Payments"
//           />

//         </ListItemButton>

//           <ListItemButton

//             component={Link}

//             to="/admin/activity-logs"

//             sx={{
//               borderRadius: 3,
//               mb: 1,
//             }}
//           >

//         <ListItemIcon>

//           <History />

//         </ListItemIcon>



//           <ListItemText
//             primary="Activity Logs"
//           />

//         </ListItemButton>



//         <ListItemButton

//           component={Link}

//           to="/admin/settings"

//           sx={{
//             borderRadius: 3,
//             mb: 1,
//           }}
//         >

//           <ListItemIcon>

//             <Settings />

//           </ListItemIcon>

          


//           <ListItemText
//             primary="Settings"
//           />

//         </ListItemButton>

//       </List>



//       {/* FOOTER */}

//       <Box
//         sx={{
//           mt: "auto",
//           p: 2,
//         }}
//       >

//         <ListItemButton

//           onClick={logout}

//           sx={{
//             borderRadius: 3,
//           }}
//         >

//           <ListItemIcon>

//             <Logout color="error" />

//           </ListItemIcon>



//           <ListItemText
//             primary="Logout"
//           />

//         </ListItemButton>

//       </Box>

//     </Drawer>
//   );
// }