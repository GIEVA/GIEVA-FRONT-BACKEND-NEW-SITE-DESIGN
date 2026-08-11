import { Outlet } from "react-router-dom";

import { Navbar } from "../components/navigation/Navbar";

import { Footer } from "../components/navigation/Footer";

export default function PublicLayout() {
    return (
        <>
            <Navbar />

             <main>
                <Outlet />
            </main>

            <Footer />
        </>
    );
}

// import { Box } from "@mui/material";
// import { Outlet } from "react-router-dom";

// import PublicNavbar from "../components/public/PublicNavbar";
// import PublicFooter from "../components/public/Footer";

// export default function PublicLayout({
//   children,
//   maxWidth = false,
//   background = "#FFFFFF",
// }) {
//   return (
//     <Box
//       sx={{
//         minHeight: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         bgcolor: background,
//       }}
//     >
//       {/* Skip Link */}
//       <Box
//         component="a"
//         href="#main-content"
//         sx={{
//           position: "absolute",
//           top: -100,
//           left: 20,
//           zIndex: 9999,
//           bgcolor: "primary.main",
//           color: "#fff",
//           px: 3,
//           py: 1,
//           borderRadius: 2,
//           textDecoration: "none",
//           transition: ".2s",
//           "&:focus": {
//             top: 20,
//           },
//         }}
//       >
//         Skip to main content
//       </Box>

//       {/* Header */}
//       <PublicNavbar />

//       {/* Main */}
//       <Box
//         component="main"
//         id="main-content"
//         sx={{
//           flex: 1,
//           width: "100%",
//           overflowX: "hidden",
//         }}
//       >
//         {children || <Outlet />}
//       </Box>

//       {/* Footer */}
//       <PublicFooter />
//     </Box>
//   );
// }