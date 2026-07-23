import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";

import {
    Box,
    Breadcrumbs as MuiBreadcrumbs,
    Link,
    Typography,
} from "@mui/material";

import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";

export default function Breadcrumbs({
    items = [],
    separator = <NavigateNextRoundedIcon fontSize="small" />,
    maxItems = 5,
    sx = {},
}) {
    return (
        <Box
            component="nav"
            aria-label="Breadcrumb"
            sx={sx}
        >
            <MuiBreadcrumbs
                separator={separator}
                maxItems={maxItems}
            >
                {items.map((item, index) => {
                    const isLast =
                        index === items.length - 1;

                    const content = (
                        <>
                            {item.icon}

                            {item.label}
                        </>
                    );

                    if (isLast || !item.href) {
                        return (
                            <Typography
                                key={item.id}
                                color="text.primary"
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    fontWeight: 600,
                                }}
                            >
                                {content}
                            </Typography>
                        );
                    }

                    if (item.external) {
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                                color="inherit"
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                }}
                            >
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.id}
                            component={RouterLink}
                            to={item.href}
                            underline="hover"
                            color="inherit"
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                            }}
                        >
                            {content}
                        </Link>
                    );
                })}
            </MuiBreadcrumbs>
        </Box>
    );
}

Breadcrumbs.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            href: PropTypes.string,
            external: PropTypes.bool,
            icon: PropTypes.node,
        })
    ),

    separator: PropTypes.node,

    maxItems: PropTypes.number,

    sx: PropTypes.object,
};