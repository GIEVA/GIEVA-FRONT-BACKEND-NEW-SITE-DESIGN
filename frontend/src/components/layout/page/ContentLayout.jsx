import PropTypes from "prop-types";

import {
    Box,
    Divider,
    Stack,
} from "@mui/material";

export default function ContentLayout({
    header,
    toolbar,
    footer,
    children,
    stickyToolbar = false,
    spacing = 4,
    maxWidth = false,
    sx = {},
}) {
    return (
        <Box
            sx={{
                width: "100%",
                maxWidth,
                mx: maxWidth ? "auto" : undefined,
                ...sx,
            }}
        >
            <Stack spacing={spacing}>
                {header && (
                    <Box>
                        {header}
                    </Box>
                )}

                {toolbar && (
                    <>
                        <Box
                            sx={{
                                ...(stickyToolbar && {
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 10,
                                    bgcolor:
                                        "background.default",
                                    py: 1,
                                }),
                            }}
                        >
                            {toolbar}
                        </Box>

                        <Divider />
                    </>
                )}

                <Box
                    sx={{
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    {children}
                </Box>

                {footer && (
                    <>
                        <Divider />

                        <Box>
                            {footer}
                        </Box>
                    </>
                )}
            </Stack>
        </Box>
    );
}

ContentLayout.propTypes = {
    header: PropTypes.node,

    toolbar: PropTypes.node,

    footer: PropTypes.node,

    children: PropTypes.node,

    stickyToolbar: PropTypes.bool,

    spacing: PropTypes.number,

    maxWidth: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.number,
        PropTypes.string,
    ]),

    sx: PropTypes.object,
};