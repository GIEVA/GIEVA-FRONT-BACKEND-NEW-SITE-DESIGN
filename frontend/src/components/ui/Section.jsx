import PropTypes from "prop-types";

import {
    Box,
    Container,
    useTheme,
} from "@mui/material";

export default function Section({
    children,

    id,

    component = "section",

    container = true,

    maxWidth = "xl",

    background = "default",

    backgroundImage,

    overlay = false,

    divider = false,

    spacing = "lg",

    sx = {},

    ...props
}) {
    const theme = useTheme();

    //-------------------------------------
    // Section spacing
    //-------------------------------------

    const sectionSpacing = {
        xs: theme.spacingTokens.section.xs,

        sm: theme.spacingTokens.section.sm,

        md: theme.spacingTokens.section.md,

        lg: theme.spacingTokens.section.lg,

        xl: theme.spacingTokens.section.xl,
    };

    //-------------------------------------
    // Backgrounds
    //-------------------------------------

    const backgrounds = {
        default: theme.palette.background.default,

        paper: theme.palette.background.paper,

        section: theme.palette.background.section,

        primary: theme.palette.primary.main,

        hero: theme.gradients.hero,

        accent: theme.gradients.accent,

        sky: theme.gradients.sky,
    };

    const content = container ? (
        <Container maxWidth={maxWidth}>
            {children}
        </Container>
    ) : (
        children
    );

    return (
        <Box
            id={id}
            component={component}
            sx={{
                position: "relative",

                overflow: "hidden",

                py: sectionSpacing[spacing],

                background:
                    backgrounds[background],

                ...(backgroundImage && {
                    backgroundImage: `url(${backgroundImage})`,

                    backgroundSize: "cover",

                    backgroundPosition: "center",
                }),

                ...(divider && {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }),

                ...sx,
            }}
            {...props}
        >
            {overlay && (
                <Box
                    sx={{
                        position: "absolute",

                        inset: 0,

                        background:
                            "rgba(11,31,58,.65)",

                        zIndex: 1,
                    }}
                />
            )}

            <Box
                sx={{
                    position: "relative",

                    zIndex: 2,
                }}
            >
                {content}
            </Box>
        </Box>
    );
}

Section.propTypes = {
    children: PropTypes.node,

    id: PropTypes.string,

    component: PropTypes.elementType,

    container: PropTypes.bool,

    maxWidth: PropTypes.oneOf([
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        false,
    ]),

    background: PropTypes.oneOf([
        "default",
        "paper",
        "section",
        "primary",
        "hero",
        "accent",
        "sky",
    ]),

    backgroundImage: PropTypes.string,

    overlay: PropTypes.bool,

    divider: PropTypes.bool,

    spacing: PropTypes.oneOf([
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
    ]),

    sx: PropTypes.object,
};