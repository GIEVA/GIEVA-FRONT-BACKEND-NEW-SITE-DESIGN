import PropTypes from "prop-types";

import {
    alpha,
    Box,
    useTheme,
} from "@mui/material";

const SIZE_MAP = {
    xs: 36,
    sm: 48,
    md: 60,
    lg: 72,
    xl: 96,
};

const ICON_SIZE_MAP = {
    xs: 18,
    sm: 22,
    md: 28,
    lg: 34,
    xl: 42,
};

export default function IconCircle({
    children,

    size = "md",

    color = "primary",

    variant = "soft",

    shape = "circle",

    hover = false,

    clickable = false,

    sx = {},
}) {
    const theme = useTheme();

    const palette =
        theme.palette[color] ??
        theme.palette.primary;

    const styles = {
        filled: {
            bgcolor: palette.main,
            color: palette.contrastText,
            border: "none",
        },

        soft: {
            bgcolor: alpha(
                palette.main,
                .12
            ),

            color: palette.main,

            border: "none",
        },

        outlined: {
            bgcolor: "transparent",

            color: palette.main,

            border: `2px solid ${palette.main}`,
        },

        glass: {
            bgcolor:
                "rgba(255,255,255,.15)",

            color: "#fff",

            border:
                "1px solid rgba(255,255,255,.3)",

            backdropFilter:
                "blur(12px)",
        },
    };

    const selected =
        styles[variant];

    const radius = {
        circle: "50%",

        rounded:
            theme.spacingTokens.radius.md,

        square:
            theme.spacingTokens.radius.sm,
    };

    return (
        <Box
            sx={{
                width: SIZE_MAP[size],

                height: SIZE_MAP[size],

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                borderRadius:
                    radius[shape],

                transition:
                    "all .3s ease",

                cursor: clickable
                    ? "pointer"
                    : "default",

                "& svg": {
                    fontSize:
                        ICON_SIZE_MAP[
                            size
                        ],
                },

                ...(selected || {}),

                ...(hover && {
                    "&:hover": {
                        transform:
                            "translateY(-4px) scale(1.05)",

                        boxShadow:
                            theme.customShadows.cardHover,
                    },
                }),

                ...sx,
            }}
        >
            {children}
        </Box>
    );
}

IconCircle.propTypes = {
    children: PropTypes.node.isRequired,

    size: PropTypes.oneOf([
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
    ]),

    color: PropTypes.oneOf([
        "primary",
        "secondary",
        "success",
        "warning",
        "error",
        "info",
    ]),

    variant: PropTypes.oneOf([
        "filled",
        "soft",
        "outlined",
        "glass",
    ]),

    shape: PropTypes.oneOf([
        "circle",
        "rounded",
        "square",
    ]),

    hover: PropTypes.bool,

    clickable: PropTypes.bool,

    sx: PropTypes.object,
};