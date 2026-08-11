import PropTypes from "prop-types";

import { Box } from "@mui/material";

export default function ImageCard({
    image,
    badge,
    aspectRatio = "4 / 3",
    rounded = true,
    children,
    sx = {},
}) {
    return (
        <Box
            sx={{
                position: "relative",
                overflow: "hidden",
                borderRadius: rounded ? 4 : 0,
                width: "100%",
                ...sx,
            }}
        >
            <Box
                component="img"
                src={
                    image?.src ||
                    "/placeholders/about-preview.png" // TODO: Replace with Figma asset
                }
                alt={
                    image?.alt ||
                    "Section illustration"
                }
                sx={{
                    width: "100%",
                    aspectRatio,
                    objectFit: "cover",
                    display: "block",
                    transition: "transform .4s ease",
                    "&:hover": {
                        transform: "scale(1.05)",
                    },
                }}
            />

            {badge && (
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 24,
                        right: 24,
                        zIndex: 2,
                    }}
                >
                    {badge}
                </Box>
            )}

            {children}
        </Box>
    );
}

ImageCard.propTypes = {
    image: PropTypes.shape({
        src: PropTypes.string,
        alt: PropTypes.string,
    }),

    badge: PropTypes.node,

    aspectRatio: PropTypes.string,

    rounded: PropTypes.bool,

    children: PropTypes.node,

    sx: PropTypes.object,
};