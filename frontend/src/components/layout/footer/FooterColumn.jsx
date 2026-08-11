import PropTypes from "prop-types";
import { Link as RouterLink, useLocation } from "react-router-dom";

import {
    alpha,
    Badge,
    Link,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    useTheme,
} from "@mui/material";

export default function FooterColumn({
    title,
    links = [],
    sx = {},
}) {
    const theme = useTheme();
    const location = useLocation();

    return (
        <List
            disablePadding
            sx={{
                ...sx,
            }}
        >
            <Typography
                variant="h6"
                gutterBottom
                sx={{
                    fontWeight: 700,
                    mb: 2,
                }}
            >
                {title}
            </Typography>

            {links.map((link) => {
                const active =
                    link.path &&
                    location.pathname === link.path;

                const content = (
                    <>
                        {link.icon && (
                            <ListItemIcon
                                sx={{
                                    minWidth: 32,
                                }}
                            >
                                {link.icon}
                            </ListItemIcon>
                        )}

                        <ListItemText
                            primary={
                                link.badge ? (
                                    <Badge
                                        badgeContent={link.badge}
                                        color="secondary"
                                    >
                                        {link.label}
                                    </Badge>
                                ) : (
                                    link.label
                                )
                            }
                        />
                    </>
                );

                return (
                    <ListItem
                        key={link.id}
                        disablePadding
                        sx={{ mb: 0.5 }}
                    >
                        <Link
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
                            underline="none"
                            color={
                                active
                                    ? "primary"
                                    : "text.secondary"
                            }
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                width: "100%",
                                py: 0.75,
                                transition:
                                    theme.transitions.create([
                                        "color",
                                        "transform",
                                    ]),
                                "&:hover": {
                                    color:
                                        "primary.main",
                                    transform:
                                        "translateX(4px)",
                                },
                                ...(active && {
                                    fontWeight: 600,
                                    color:
                                        theme.palette.primary.main,
                                }),
                            }}
                        >
                            {content}
                        </Link>
                    </ListItem>
                );
            })}
        </List>
    );
}

FooterColumn.propTypes = {
    title: PropTypes.string.isRequired,
    links: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            path: PropTypes.string.isRequired,
            icon: PropTypes.node,
            badge: PropTypes.node,
            external: PropTypes.bool,
        })
    ),
    sx: PropTypes.object,
};