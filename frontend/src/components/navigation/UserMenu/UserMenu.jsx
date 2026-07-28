import { useState } from "react";

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

const icons = {
    dashboard: <Dashboard fontSize="small" />,
    person: <Person fontSize="small" />,
    calendar: <CalendarMonth fontSize="small" />,
    school: <School fontSize="small" />,
    workspace_premium: <WorkspacePremium fontSize="small" />,
    settings: <Settings fontSize="small" />,
};

export default function UserMenu() {
    const { user, logout } = useAuth();

    const [anchorEl, setAnchorEl] = useState(null);

    const open = Boolean(anchorEl);
    const role =
    user?.role ||
    user?.user?.role;

const menuItems =
    userMenu[role] || [];

    return (
        <>
            <IconButton
                onClick={(e) =>
                    setAnchorEl(e.currentTarget)
                }
            >
                <Avatar
                    src={user?.avatar}
                    alt={user?.name}
                >
                    {user?.name?.charAt(0)}
                </Avatar>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() =>
                    setAnchorEl(null)
                }
                PaperProps={{
                    sx: {
                        width: 270,
                        borderRadius: 3,
                        mt: 1.5,
                    },
                }}
            >
                <Box
                    px={2}
                    py={1.5}
                >
                    <Typography
                        fontWeight={700}
                    >
                        {user?.name}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {user?.email}
                    </Typography>
                </Box>

                <Divider />

                {menuItems.map((item) => (
                    <MenuItem
                        key={item.label}
                        component={RouterLink}
                        to={item.path}
                        onClick={() =>
                            setAnchorEl(null)
                        }
                    >
                        <ListItemIcon>
                            {icons[item.icon]}
                        </ListItemIcon>

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
                        <Logout
                            fontSize="small"
                        />
                    </ListItemIcon>

                    Logout
                </MenuItem>
            </Menu>
        </>
    );
}