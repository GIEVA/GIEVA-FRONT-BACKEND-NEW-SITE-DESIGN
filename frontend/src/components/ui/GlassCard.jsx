import PropTypes from "prop-types";

import { Card, useTheme } from "@mui/material";

export default function GlassCard({
    children,

    hover = true,

    clickable = false,

    border = true,

    gradient = false,

    blur = true,

    padding = "md",

    elevation = "card",

    sx = {},

    ...props
}) {
    const theme = useTheme();

    const paddings = {
        xs: theme.spacingTokens.card.xs,

        sm: theme.spacingTokens.card.sm,

        md: theme.spacingTokens.card.md,

        lg: theme.spacingTokens.card.lg,
    };

    return (
        <Card
            elevation={0}
            sx={{
                position: "relative",

                overflow: "hidden",

                borderRadius:
                    theme.spacingTokens.radius.lg,

                p: paddings[padding],

                background: gradient
                    ? theme.gradients.card
                    : "rgba(255,255,255,.72)",

                backdropFilter: blur
                    ? "blur(18px)"
                    : "none",

                WebkitBackdropFilter: blur
                    ? "blur(18px)"
                    : "none",

                border: border
                    ? "1px solid rgba(255,255,255,.25)"
                    : "none",

                boxShadow:
                    theme.customShadows[elevation],

                cursor: clickable
                    ? "pointer"
                    : "default",

                transition:
                    "all .35s ease",

                "&:hover":
                    hover && {
                        transform:
                            "translateY(-8px)",

                        boxShadow:
                            theme.customShadows.cardHover,
                    },

                ...sx,
            }}
            {...props}
        >
            {children}
        </Card>
    );
}

GlassCard.propTypes = {
    children: PropTypes.node,

    hover: PropTypes.bool,

    clickable: PropTypes.bool,

    border: PropTypes.bool,

    gradient: PropTypes.bool,

    blur: PropTypes.bool,

    padding: PropTypes.oneOf([
        "xs",
        "sm",
        "md",
        "lg",
    ]),

    elevation: PropTypes.oneOf([
        "none",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "hero",
        "card",
        "cardHover",
        "navbar",
        "dropdown",
        "button",
        "buttonHover",
        "modal",
        "glass",
    ]),

    sx: PropTypes.object,
};