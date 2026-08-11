import PropTypes from "prop-types";

import {
    Box,
} from "@mui/material";

export default function PageShell({
    navbar,
    header,
    breadcrumbs,
    footer,
    children,
    background = "background.default",
    sx = {},
}) {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                bgcolor: background,
                ...sx,
            }}
        >
            {/* Navbar */}

            {navbar}

            {/* Optional Page Header */}

            {header}

            {/* Optional Breadcrumbs */}

            {breadcrumbs}

            {/* Main Content */}

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                }}
            >
                {children}
            </Box>

            {/* Footer */}

            {footer}
        </Box>
    );
}

PageShell.propTypes = {

    navbar: PropTypes.node,

    header: PropTypes.node,

    breadcrumbs: PropTypes.node,

    footer: PropTypes.node,

    children: PropTypes.node,

    background: PropTypes.string,

    sx: PropTypes.object,

};