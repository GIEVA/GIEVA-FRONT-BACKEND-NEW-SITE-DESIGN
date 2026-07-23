import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";

import {
    Box,
    Stack,
    Typography,
} from "@mui/material";

export default function NavbarBrand({
    logo,

    text = "GIEVA",

    to = "/",

    sx = {},
}) {
    return (
        <Stack
            component={RouterLink}
            to={to}
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
                textDecoration: "none",
                color: "inherit",
                flexShrink: 0,
                ...sx,
            }}
        >
            {typeof logo === "string" ? (
                <Box
                    component="img"
                    src={logo}
                    alt={text}
                    sx={{
                        width: 42,
                        height: 42,
                        objectFit: "contain",
                    }}
                />
            ) : (
                logo
            )}

            <Typography
                variant="cardTitle"
                color="primary"
            >
                {text}
            </Typography>
        </Stack>
    );
}

NavbarBrand.propTypes = {
    logo: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]),

    text: PropTypes.string,

    to: PropTypes.string,

    sx: PropTypes.object,
};