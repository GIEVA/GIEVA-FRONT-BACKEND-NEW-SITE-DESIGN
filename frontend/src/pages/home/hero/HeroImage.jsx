import PropTypes from "prop-types";

import {
    Box,
} from "@mui/material";

export default function HeroImage({
    image,
    badge,
    children,
    aspectRatio = "4 / 3",
    rounded = true,
    sx = {},
}) {
    return (
        <Box
            sx={{
                position: "relative",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                ...sx,
            }}
        >
            {/* Decorative Background Glow */}

            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(circle, rgba(25,118,210,.12), transparent 70%)",
                    transform: "scale(1.15)",
                    zIndex: 0,
                }}
            />

            {/* Main Hero Image */}

            <Box
                component="img"
                src={
                    image?.src ||
                    "/placeholders/hero-illustration.png"
                }
                alt={
                    image?.alt ||
                    "Hero illustration"
                }
                sx={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                    maxWidth: 600,
                    aspectRatio,
                    objectFit: "contain",
                    borderRadius: rounded ? 6 : 0,
                    display: "block",
                }}
            />

            {/* Floating Badge */}

            {badge && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 30,
                        right: -20,
                        zIndex: 3,
                    }}
                >
                    {badge}
                </Box>
            )}

            {/* Extra Decorations */}

            {children}
        </Box>
    );
}

HeroImage.propTypes = {
    image: PropTypes.shape({
        src: PropTypes.string,
        alt: PropTypes.string,
    }),

    badge: PropTypes.node,

    children: PropTypes.node,

    aspectRatio: PropTypes.string,

    rounded: PropTypes.bool,

    sx: PropTypes.object,
};