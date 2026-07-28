import PropTypes from "prop-types";
import { Box, Chip, Stack, Typography } from "@mui/material";

import HeroActions from "./HeroActions";

export default function HeroContent({
    eyebrow,
    subtitle,
    title,
    description,
    actions,
    stats,
    align = "left",
    sx = {},
}) {
    const centered = align === "center";

    return (
        <Stack
            spacing={4}
            alignItems={centered ? "center" : "flex-start"}
            textAlign={align}
            sx={sx}
        >
            {/* Eyebrow Badge */}
            {eyebrow && (
                <Chip label={eyebrow} color="primary" variant="filled" />
            )}

            {/* Main Heading - Big & Bold */}
            <Typography
                variant="display1"
                component="h1"
                sx={{
                    maxWidth: 700,
                    fontSize: { xs: "2.8rem", md: "3.8rem", lg: "4.2rem" },
                    fontWeight: 800,
                    lineHeight: 1.1,
                }}
            >
                {title}
            </Typography>

            {/* Description */}
            {description && (
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                        maxWidth: 600,
                        lineHeight: 1.8,
                        fontSize: { xs: "1.1rem", lg: "1.2rem" },
                    }}
                >
                    {description}
                </Typography>
            )}

            {/* Actions */}
            {actions && <HeroActions {...actions} />}
        </Stack>
    );
}

HeroContent.propTypes = {
    eyebrow: PropTypes.string,
    subtitle: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    actions: PropTypes.object,
    stats: PropTypes.array,
    align: PropTypes.oneOf(["left", "center"]),
    sx: PropTypes.object,
};