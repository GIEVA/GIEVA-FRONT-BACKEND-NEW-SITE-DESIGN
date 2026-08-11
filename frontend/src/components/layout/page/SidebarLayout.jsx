import PropTypes from "prop-types";

import {
    Box,
    Divider,
    Stack,
} from "@mui/material";

export default function SidebarLayout({
    sidebar,
    children,
    position = "left",
    sidebarWidth = 300,
    sticky = false,
    divider = false,
    gap = 4,
    sx = {},
}) {
    const Sidebar = sidebar && (
        <Box
            sx={{
                width: {
                    xs: "100%",
                    md: sidebarWidth,
                },
                flexShrink: 0,
                ...(sticky && {
                    position: "sticky",
                    top: 24,
                    alignSelf: "flex-start",
                }),
            }}
        >
            {sidebar}
        </Box>
    );

    const MainContent = (
        <Box
            sx={{
                flex: 1,
                minWidth: 0,
            }}
        >
            {children}
        </Box>
    );

    return (
        <Stack
            direction={{
                xs: "column",
                md:
                    position === "right"
                        ? "row-reverse"
                        : "row",
            }}
            spacing={gap}
            sx={sx}
        >
            {Sidebar}

            {divider && sidebar && (
                <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                        display: {
                            xs: "none",
                            md: "block",
                        },
                    }}
                />
            )}

            {MainContent}
        </Stack>
    );
}

SidebarLayout.propTypes = {
    sidebar: PropTypes.node,

    children: PropTypes.node,

    position: PropTypes.oneOf([
        "left",
        "right",
    ]),

    sidebarWidth: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
    ]),

    sticky: PropTypes.bool,

    divider: PropTypes.bool,

    gap: PropTypes.number,

    sx: PropTypes.object,
};