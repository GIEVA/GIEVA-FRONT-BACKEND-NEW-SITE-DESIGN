import PropTypes from "prop-types";

import {
    Box,
    Container,
    useTheme,
} from "@mui/material";

const LAYOUTS = {
    narrow: "md",
    default: "lg",
    wide: "xl",
    dashboard: "xl",
    fluid: false,
};

export default function PageContainer({
    children,

    layout = "default",

    background = "default",

    disablePadding = false,

    center = false,

    component = "main",

    sx = {},

}) {

    const theme = useTheme();

    const maxWidth =
        LAYOUTS[layout] ?? "lg";

    const content = (
        <Box
            component={component}
            sx={{
                width: "100%",

                py: disablePadding
                    ? 0
                    : {
                          xs: 6,
                          md: 8,
                          lg: 10,
                      },

                display: center
                    ? "flex"
                    : "block",

                justifyContent: center
                    ? "center"
                    : undefined,

                alignItems: center
                    ? "center"
                    : undefined,

                bgcolor:
                    theme.palette.background[
                        background
                    ] ||
                    background,
            }}
        >
            {children}
        </Box>
    );

    if (layout === "fluid") {
        return (
            <Box
                sx={{
                    px: disablePadding
                        ? 0
                        : {
                              xs: 2,
                              sm: 3,
                              md: 4,
                          },

                    ...sx,
                }}
            >
                {content}
            </Box>
        );
    }

    return (
        <Container
            maxWidth={maxWidth}
            disableGutters={
                disablePadding
            }
            sx={{
                px: disablePadding
                    ? 0
                    : {
                          xs: 2,
                          sm: 3,
                          md: 4,
                      },

                ...sx,
            }}
        >
            {content}
        </Container>
    );
}

PageContainer.propTypes = {
    children: PropTypes.node,

    layout: PropTypes.oneOf([
        "narrow",
        "default",
        "wide",
        "dashboard",
        "fluid",
    ]),

    background: PropTypes.string,

    disablePadding: PropTypes.bool,

    center: PropTypes.bool,

    component: PropTypes.elementType,

    sx: PropTypes.object,
};