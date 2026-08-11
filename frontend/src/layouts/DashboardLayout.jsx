import { Outlet } from "react-router-dom";

import {
    Box,
} from "@mui/material";

import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout() {
    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
            }}
        >
            <Sidebar />

            <Box
                sx={{
                    flex: 1,

                    display: "flex",

                    flexDirection: "column",
                }}
            >
                <DashboardHeader />

                <Box
                    component="main"
                    sx={{
                        flex: 1,

                        p: 4,

                        bgcolor: "#F7F9FC",
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}