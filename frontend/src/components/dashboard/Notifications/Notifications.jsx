import { useState } from "react";

import {
  Badge,
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  Typography,
  Button,
} from "@mui/material";

import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

const mockNotifications = [
  {
    id: 1,
    title: "New course registration",
    description: "John Doe enrolled in AI Fundamentals.",
    time: "5 min ago",
    read: false,
  },
  {
    id: 2,
    title: "Campaign updated",
    description: "The STEM Scholarship campaign was updated.",
    time: "30 min ago",
    read: false,
  },
  {
    id: 3,
    title: "New article published",
    description: "Introduction to Studying Abroad.",
    time: "Yesterday",
    read: true,
  },
];

export default function Notifications() {
  const [anchorEl, setAnchorEl] = useState(null);

  const [notifications, setNotifications] =
    useState(mockNotifications);

  const open = Boolean(anchorEl);

  const unreadCount = notifications.filter(
    (n) => !n.read
  ).length;

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
      }))
    );
  };

  return (
    <>
      <IconButton
        onClick={(e) =>
          setAnchorEl(e.currentTarget)
        }
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
        >
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            borderRadius: 3,
            mt: 1.5,
          },
        }}
      >
        {/* Header */}

        <Box
          px={2}
          py={1.5}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            fontWeight={700}
          >
            Notifications
          </Typography>

          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Box>

        <Divider />

        {/* Empty State */}

        {notifications.length === 0 ? (
          <Box
            py={5}
            textAlign="center"
          >
            <Typography
              color="text.secondary"
            >
              No notifications
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((item) => (
              <ListItemButton
                key={item.id}
                sx={{
                  alignItems: "flex-start",
                  bgcolor: item.read
                    ? "transparent"
                    : "rgba(25,118,210,.05)",
                }}
              >
                <ListItemText
                  primary={
                    <Typography
                      fontWeight={
                        item.read
                          ? 500
                          : 700
                      }
                    >
                      {item.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {item.description}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.disabled"
                      >
                        {item.time}
                      </Typography>
                    </>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}

        <Divider />

        <Button
          fullWidth
          sx={{
            py: 1.5,
            borderRadius: 0,
          }}
        >
          View All Notifications
        </Button>
      </Menu>
    </>
  );
}