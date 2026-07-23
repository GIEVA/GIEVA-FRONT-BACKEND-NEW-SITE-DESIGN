import PropTypes from "prop-types";

import {
    Box,
    Chip,
    Stack,
    Typography,
} from "@mui/material";

export default function PageHeader({
    title,
    subtitle,
    description,
    badge,
    actions,
    leading,
    trailing,
    align = "left",
    variant = "default",
    sx = {},
}) {
    const centered = align === "center";

    return (
        <Box
            sx={{
                py: {
                    xs: 5,
                    md: 7,
                },

                textAlign: align,

                ...(variant === "subtle" && {
                    bgcolor: "background.paper",
                }),

                ...(variant === "filled" && {
                    bgcolor: "grey.100",
                }),

                ...sx,
            }}
        >
            <Stack
                spacing={3}
                alignItems={
                    centered
                        ? "center"
                        : "flex-start"
                }
            >
                {leading}

                {badge && (
                    <Chip
                        label={badge}
                        color="primary"
                    />
                )}

                <Box>
                    <Typography
                        variant="h2"
                        gutterBottom
                    >
                        {title}
                    </Typography>

                    {subtitle && (
                        <Typography
                            variant="h5"
                            color="text.secondary"
                            gutterBottom
                        >
                            {subtitle}
                        </Typography>
                    )}

                    {description && (
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{
                                mt: 2,
                                maxWidth: 720,
                            }}
                        >
                            {description}
                        </Typography>
                    )}
                </Box>

                {actions}

                {trailing}
            </Stack>
        </Box>
    );
}

PageHeader.propTypes = {
    title: PropTypes.string.isRequired,

    subtitle: PropTypes.string,

    description: PropTypes.string,

    badge: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]),

    actions: PropTypes.node,

    leading: PropTypes.node,

    trailing: PropTypes.node,

    align: PropTypes.oneOf([
        "left",
        "center",
    ]),

    variant: PropTypes.oneOf([
        "default",
        "subtle",
        "filled",
    ]),

    sx: PropTypes.object,
};