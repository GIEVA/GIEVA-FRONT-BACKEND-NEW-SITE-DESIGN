import PropTypes from "prop-types";

import {
    Box,
    IconButton,
    Stack,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";

export default function FooterSocial({
    items = [],
    direction = "row",
    showLabel = false,
    spacing = 1.5,
    size = "medium",
    sx = {},
}) {
    const theme = useTheme();

    return (
        <Stack
            direction={direction}
            spacing={spacing}
            sx={sx}
        >
            {items.map((item) => (
                <Stack
                    key={item.id}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                >
                    <Tooltip
                        title={item.label}
                        arrow
                    >
                        <IconButton
                            component="a"
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            size={size}
                            aria-label={item.label}
                            sx={{
                                color:
                                    "text.secondary",

                                transition:
                                    theme.transitions.create(
                                        [
                                            "color",
                                            "background-color",
                                            "transform",
                                        ]
                                    ),

                                "&:hover": {
                                    color:
                                        "primary.main",

                                    bgcolor:
                                        "action.hover",

                                    transform:
                                        "translateY(-3px)",
                                },
                            }}
                        >
                            {item.icon}
                        </IconButton>
                    </Tooltip>

                    {showLabel && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {item.label}
                        </Typography>
                    )}
                </Stack>
            ))}
        </Stack>
    );
}

FooterSocial.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string
                .isRequired,
            label:
                PropTypes.string
                    .isRequired,
            href: PropTypes.string
                .isRequired,
            icon: PropTypes.node
                .isRequired,
        })
    ),

    direction: PropTypes.oneOf([
        "row",
        "column",
    ]),

    showLabel: PropTypes.bool,

    spacing: PropTypes.number,

    size: PropTypes.oneOf([
        "small",
        "medium",
        "large",
    ]),

    sx: PropTypes.object,
};