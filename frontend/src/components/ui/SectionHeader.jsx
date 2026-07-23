
import PropTypes from "prop-types";

import {
    Box,
    Typography,
    Stack,
    useTheme,
} from "@mui/material";

export default function SectionHeader({
    eyebrow,

    title,

    highlight,

    description,

    action,

    align = "center",

    maxWidth = 720,

    color = "text.primary",

    sx = {},
}) {
    const theme = useTheme();

    //-----------------------------------
    // Highlight word
    //-----------------------------------

    const renderTitle = () => {
        if (!highlight || !title) return title;

        const parts = title.split(highlight);

        return (
            <>
                {parts[0]}

                <Box
                    component="span"
                    sx={{
                        color:
                            theme.palette.secondary.main,
                    }}
                >
                    {highlight}
                </Box>

                {parts[1]}
            </>
        );
    };

    return (
        <Stack
            spacing={3}
            alignItems={
                align === "center"
                    ? "center"
                    : align === "right"
                    ? "flex-end"
                    : "flex-start"
            }
            textAlign={align}
            sx={{
                mb: {
                    xs: 6,
                    md: 8,
                },

                ...sx,
            }}
        >
            {eyebrow && (
                <Typography
                    variant="eyebrow"
                    color="secondary.main"
                >
                    {eyebrow}
                </Typography>
            )}

            {title && (
                <Typography
                    variant="sectionTitle"
                    color={color}
                    sx={{
                        maxWidth,
                    }}
                >
                    {renderTitle()}
                </Typography>
            )}

            {description && (
                <Typography
                    variant="sectionSubtitle"
                    color={
                        color === "common.white"
                            ? "rgba(255,255,255,.82)"
                            : "text.secondary"
                    }
                    sx={{
                        maxWidth,
                    }}
                >
                    {description}
                </Typography>
            )}

            {action && action}
        </Stack>
    );
}

SectionHeader.propTypes = {
    eyebrow: PropTypes.string,

    title: PropTypes.string,

    highlight: PropTypes.string,

    description: PropTypes.string,

    action: PropTypes.node,

    align: PropTypes.oneOf([
        "left",
        "center",
        "right",
    ]),

    color: PropTypes.string,

    maxWidth: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
    ]),

    sx: PropTypes.object,
};