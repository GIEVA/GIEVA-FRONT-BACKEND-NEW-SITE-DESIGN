import PropTypes from "prop-types";
import { Link as RouterLink, useLocation } from "react-router-dom";

import {
    alpha,
    Badge,
    Box,
    Button,
    useTheme,
} from "@mui/material";

export default function NavbarItem({
    item,

    endIcon,

    onClick,

    sx = {},
}) {
    const theme = useTheme();
    const location = useLocation();

    const active =
        item.path &&
        location.pathname === item.path;

    const button = (
        <Button
            startIcon={item.icon}
            endIcon={endIcon}
            onClick={onClick}
            disabled={item.disabled}
            color="inherit"
            sx={{
                px: 2,
                py: 1,

                borderRadius:
                    theme.spacingTokens.radius.md,

                fontWeight: 600,

                color: active
                    ? theme.palette.primary.main
                    : theme.palette.text.primary,

                bgcolor: active
                    ? alpha(
                          theme.palette.primary.main,
                          0.08
                      )
                    : "transparent",

                "&:hover": {
                    bgcolor: alpha(
                        theme.palette.primary.main,
                        0.08
                    ),

                    color:
                        theme.palette.primary.main,
                },

                ...sx,
            }}
        >
            {item.label}
        </Button>
    );

    const wrappedButton = item.badge ? (
        <Badge
            badgeContent={item.badge}
            color="secondary"
        >
            {button}
        </Badge>
    ) : (
        button
    );

    if (item.external) {
        return (
            <Box
                component="a"
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                    textDecoration: "none",
                }}
            >
                {wrappedButton}
            </Box>
        );
    }

    if (item.path) {
        return (
            <Box
                component={RouterLink}
                to={item.path}
                sx={{
                    textDecoration: "none",
                }}
            >
                {wrappedButton}
            </Box>
        );
    }

    return wrappedButton;
}

NavbarItem.propTypes = {
    item: PropTypes.shape({
        label: PropTypes.string.isRequired,
        path: PropTypes.string,
        icon: PropTypes.node,
        badge: PropTypes.node,
        external: PropTypes.bool,
        disabled: PropTypes.bool,
    }).isRequired,

    endIcon: PropTypes.node,

    onClick: PropTypes.func,

    sx: PropTypes.object,
};