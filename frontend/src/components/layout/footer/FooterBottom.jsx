import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";

import {
    Box,
    Divider,
    Link,
    Stack,
    Typography,
} from "@mui/material";

export default function FooterBottom({
    copyright,
    legalLinks = [],
    version,
    poweredBy,
    leftSlot,
    rightSlot,
    sx = {},
}) {
    const currentYear = new Date().getFullYear();

    const copyrightText = copyright
        ? `© ${copyright.startYear ? `${copyright.startYear}–` : ""}${currentYear} ${copyright.owner}. All rights reserved.`
        : "";

    return (
        <>
            <Divider />

            <Stack
                direction={{
                    xs: "column",
                    md: "row",
                }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{
                    xs: "flex-start",
                    md: "center",
                }}
                sx={{
                    py: 3,
                    ...sx,
                }}
            >
                {/* Left */}
                <Stack spacing={1}>
                    {leftSlot}

                    {copyrightText && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {copyrightText}
                        </Typography>
                    )}

                    {poweredBy && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Powered by {poweredBy}
                        </Typography>
                    )}
                </Stack>

                {/* Right */}
                <Stack
                    direction="row"
                    spacing={3}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                >
                    {legalLinks.map((link) => (
                        <Link
                            key={link.label}
                            component={
                                link.external
                                    ? "a"
                                    : RouterLink
                            }
                            href={
                                link.external
                                    ? link.path
                                    : undefined
                            }
                            to={
                                !link.external
                                    ? link.path
                                    : undefined
                            }
                            target={
                                link.external
                                    ? "_blank"
                                    : undefined
                            }
                            rel={
                                link.external
                                    ? "noopener noreferrer"
                                    : undefined
                            }
                            underline="hover"
                            color="text.secondary"
                            variant="body2"
                        >
                            {link.label}
                        </Link>
                    ))}

                    {version && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {version}
                        </Typography>
                    )}

                    {rightSlot}
                </Stack>
            </Stack>
        </>
    );
}

FooterBottom.propTypes = {
    copyright: PropTypes.shape({
        owner: PropTypes.string.isRequired,
        startYear: PropTypes.number,
    }),

    legalLinks: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            path: PropTypes.string.isRequired,
            external: PropTypes.bool,
        })
    ),

    version: PropTypes.string,

    poweredBy: PropTypes.node,

    leftSlot: PropTypes.node,

    rightSlot: PropTypes.node,

    sx: PropTypes.object,
};