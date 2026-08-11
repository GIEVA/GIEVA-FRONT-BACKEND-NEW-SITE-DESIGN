import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";

import {
    Box,
    Paper,
} from "@mui/material";

export default function LogoItem({
    logo,
    variant = "default",
    height = 56,
    linkComponent: LinkComponent = RouterLink,
    sx = {},
}) {
    const {
        src,
        alt,
        name,
        href,
        external = false,
    } = logo;

    const content = (
        <Paper
            elevation={0}
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",

                p: 3,

                height: 100,

                borderRadius: 3,

                bgcolor: "background.paper",

                transition: "all .3s ease",

                border:
                    variant === "outlined"
                        ? "1px solid"
                        : "none",

                borderColor: "divider",

                "&:hover": {
                    transform: "translateY(-4px)",

                    boxShadow: 4,
                },

                ...sx,
            }}
        >
            <Box
                component="img"
                src={
                    src ||
                    "/placeholders/partner-logo.svg"
                }
                alt={
                    alt ||
                    name
                }
                sx={{
                    maxWidth: "100%",

                    height,

                    objectFit: "contain",

                    filter:
                        variant === "grayscale"
                            ? "grayscale(100%)"
                            : "none",

                    transition: "all .3s ease",

                    "&:hover": {
                        filter: "grayscale(0%)",
                        transform: "scale(1.05)",
                    },
                }}
            />
        </Paper>
    );

    if (!href) {
        return content;
    }

    if (external) {
        return (
            <Box
                component="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                    textDecoration: "none",
                }}
            >
                {content}
            </Box>
        );
    }

    return (
        <Box
            component={LinkComponent}
            to={href}
            sx={{
                textDecoration: "none",
            }}
        >
            {content}
        </Box>
    );
}

LogoItem.propTypes = {
    logo: PropTypes.shape({
        src: PropTypes.string,

        alt: PropTypes.string,

        name: PropTypes.string.isRequired,

        href: PropTypes.string,

        external: PropTypes.bool,
    }).isRequired,

    variant: PropTypes.oneOf([
        "default",
        "grayscale",
        "outlined",
    ]),

    height: PropTypes.number,

    linkComponent: PropTypes.elementType,

    sx: PropTypes.object,
};