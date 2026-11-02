import { useEffect, useState } from "react";

import {
    Avatar,
    Box,
    Divider,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    Typography,
} from "@mui/material";

import {
    Dashboard,
    Person,
    CalendarMonth,
    School,
    WorkspacePremium,
    Settings,
    Logout,
} from "@mui/icons-material";

import { Link as RouterLink } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";

import { userMenu } from "../navigation.config";

// ⚠️ Adjust these two import paths/file names to where your profile services live.
import { getMyStudentProfile } from "../../../services/studentProfile";
import { getMyTutorProfile } from "../../../services/tutorProfileService";

const icons = {
    dashboard: <Dashboard fontSize="small" />,
    person: <Person fontSize="small" />,
    calendar: <CalendarMonth fontSize="small" />,
    school: <School fontSize="small" />,
    workspace_premium: <WorkspacePremium fontSize="small" />,
    settings: <Settings fontSize="small" />,
};

// Profile pages can announce a change with: window.dispatchEvent(new Event("gieva:profile-updated"))
export const PROFILE_UPDATED_EVENT = "gieva:profile-updated";

export default function UserMenu() {
    const { user, logout, updateUser } = useAuth();

    const [anchorEl, setAnchorEl] = useState(null);

    const open = Boolean(anchorEl);
    const role = user?.role || user?.user?.role;
    const menuItems = userMenu[role] || [];

    const displayName = user?.fullName || user?.name || user?.user?.fullName || "";
    const avatarUrl = user?.profilePicUrl || user?.avatar || null;

    // Students and tutors keep their picture on their profile, not on the user record,
    // so load it, and reload it whenever the profile is saved.
    useEffect(() => {
        if (!user || (role !== "student" && role !== "tutor")) return undefined;
        let cancelled = false;

        const load = async () => {
            try {
                const res = role === "tutor" ? await getMyTutorProfile() : await getMyStudentProfile();
                const profile = res?.profile || res; // tutor: { profile }, student: the profile itself
                const url = profile?.profilePicUrl || null;
                if (!cancelled && url !== (user.profilePicUrl || null)) updateUser?.({ profilePicUrl: url });
            } catch {
                // no profile yet (404) or offline: keep the default avatar
            }
        };

        load();
        window.addEventListener(PROFILE_UPDATED_EVENT, load);
        return () => {
            cancelled = true;
            window.removeEventListener(PROFILE_UPDATED_EVENT, load);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, role]);

    return (
        <>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                {/* No children on purpose: with no picture (or a broken one) MUI shows its default person silhouette */}
                <Avatar src={avatarUrl || undefined} alt={displayName} />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { width: 270, borderRadius: 3, mt: 1.5 } }}
            >
                <Box px={2} py={1.5}>
                    <Typography fontWeight={700}>{displayName}</Typography>

                    <Typography variant="body2" color="text.secondary">
                        {user?.email}
                    </Typography>
                </Box>

                <Divider />

                {menuItems.map((item) => (
                    <MenuItem
                        key={item.label}
                        component={RouterLink}
                        to={item.path}
                        onClick={() => setAnchorEl(null)}
                    >
                        <ListItemIcon>{icons[item.icon]}</ListItemIcon>

                        {item.label}
                    </MenuItem>
                ))}

                <Divider />

                <MenuItem
                    onClick={() => {
                        logout();
                        setAnchorEl(null);
                    }}
                >
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>

                    Logout
                </MenuItem>
            </Menu>
        </>
    );
}
