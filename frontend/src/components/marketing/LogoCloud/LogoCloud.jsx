import PropTypes from "prop-types";

import {
    Grid,
    Box,
} from "@mui/material";

import LogoItem from "./LogoItem";

export default function LogoCloud({
    logos = [],
    columns = {
        xs: 2,
        sm: 3,
        md: 5,
    },
    spacing = 4,
    justifyContent = "center",
    alignItems = "center",
    variant = "default",
    sx = {},
}) {
    if (!logos.length) return null;

    return (
        <Box sx={sx}>
            <Grid
                container
                spacing={spacing}
                justifyContent={justifyContent}
                alignItems={alignItems}
            >
                {logos.map((logo, index) => (
                    <Grid
                        key={logo.id ?? index}
                        size={{
                            xs: 12 / columns.xs,
                            sm: 12 / columns.sm,
                            md: 12 / columns.md,
                        }}
                    >
                        <LogoItem
                            logo={logo}
                            variant={variant}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

LogoCloud.propTypes = {
    logos: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number,
            ]),
            name: PropTypes.string.isRequired,
            src: PropTypes.string,
            alt: PropTypes.string,
            href: PropTypes.string,
            external: PropTypes.bool,
        })
    ),

    columns: PropTypes.shape({
        xs: PropTypes.number,
        sm: PropTypes.number,
        md: PropTypes.number,
    }),

    spacing: PropTypes.number,

    justifyContent: PropTypes.string,

    alignItems: PropTypes.string,

    variant: PropTypes.oneOf([
        "default",
        "grayscale",
        "outlined",
    ]),

    sx: PropTypes.object,
};