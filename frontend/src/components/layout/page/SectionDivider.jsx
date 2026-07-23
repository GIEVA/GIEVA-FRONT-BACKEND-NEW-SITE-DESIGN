import PropTypes from "prop-types";

import {
    Box,
    Divider,
    Stack,
    Typography,
} from "@mui/material";

export default function SectionDivider({
    title,
    caption,
    icon,
    orientation = "horizontal",
    align = "center",
    variant = "default",
    spacing = 6,
    sx = {},
}) {
    if (orientation === "vertical") {
        return (
            <Divider
                orientation="vertical"
                flexItem
                sx={sx}
            />
        );
    }

    const dividerStyle = {
        flex: 1,
        ...(variant === "dashed" && {
            borderStyle: "dashed",
        }),
        ...(variant === "gradient" && {
            border: 0,
            height: 1,
            background:
                "linear-gradient(to right, transparent, currentColor, transparent)",
            opacity: 0.3,
        }),
    };

    return (
        <Box
            sx={{
                py: spacing,
                ...sx,
            }}
        >
            {(title || icon) ? (
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                >
                    {align !== "left" && (
                        <Divider sx={dividerStyle} />
                    )}

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >
                        {icon}

                        {title && (
                            <Typography
                                variant="h6"
                                fontWeight={600}
                            >
                                {title}
                            </Typography>
                        )}
                    </Stack>

                    {align !== "right" && (
                        <Divider sx={dividerStyle} />
                    )}
                </Stack>
            ) : (
                <Divider sx={dividerStyle} />
            )}

            {caption && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    align={align}
                    sx={{
                        mt: 2,
                    }}
                >
                    {caption}
                </Typography>
            )}
        </Box>
    );
}

SectionDivider.propTypes = {
    title: PropTypes.string,

    caption: PropTypes.string,

    icon: PropTypes.node,

    orientation: PropTypes.oneOf([
        "horizontal",
        "vertical",
    ]),

    align: PropTypes.oneOf([
        "left",
        "center",
        "right",
    ]),

    variant: PropTypes.oneOf([
        "default",
        "dashed",
        "gradient",
    ]),

    spacing: PropTypes.number,

    sx: PropTypes.object,
};