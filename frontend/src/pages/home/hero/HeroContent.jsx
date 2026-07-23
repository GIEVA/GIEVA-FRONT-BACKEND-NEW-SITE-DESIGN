import PropTypes from "prop-types";

import {
    Box,
    Chip,
    Stack,
    Typography,
} from "@mui/material";

import HeroActions from "./HeroActions";
import HeroStats from "./HeroStats";

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
            alignItems={
                centered
                    ? "center"
                    : "flex-start"
            }
            textAlign={align}
            sx={sx}
        >
            {/* Eyebrow Badge */}

            {eyebrow && (
                <Chip
                    label={eyebrow}
                    color="primary"
                    variant="filled"
                />
            )}

            {/* Subtitle */}

            {subtitle && (
                <Typography
                    variant="overline"
                    color="primary"
                    fontWeight={700}
                    letterSpacing={2}
                >
                    {subtitle}
                </Typography>
            )}

            {/* Main Heading */}

            <Typography
                variant="display1"
                component="h1"
                sx={{
                    maxWidth: 700,
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
                    }}
                >
                    {description}
                </Typography>
            )}

            {/* Actions */}

            {actions && (
                <HeroActions
                    {...actions}
                />
            )}

            {/* Statistics */}

            {stats?.length > 0 && (
                <Box
                    sx={{
                        pt: 2,
                        width: "100%",
                    }}
                >
                    <HeroStats
                        stats={stats}
                    />
                </Box>
            )}
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

    align: PropTypes.oneOf([
        "left",
        "center",
    ]),

    sx: PropTypes.object,
};