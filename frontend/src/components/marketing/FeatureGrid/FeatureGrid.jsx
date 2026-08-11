import PropTypes from "prop-types";

import {
    Box,
    Grid,
} from "@mui/material";

import FeatureItem from "./FeatureItem";

export default function FeatureGrid({
    items = [],

    columns = {
        xs: 1,
        sm: 2,
        lg: 3,
    },

    spacing = 4,

    variant = "default",

    sx = {},
}) {
    if (!items.length) {
        return null;
    }

    return (
        <Box sx={sx}>
            <Grid
                container
                spacing={spacing}
            >
                {items.map((item, index) => (
                    <Grid
                        key={item.id ?? index}
                        size={{
                            xs: 12 / columns.xs,
                            sm: 12 / columns.sm,
                            lg: 12 / columns.lg,
                        }}
                    >
                        <FeatureItem
                            item={item}
                            variant={variant}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

FeatureGrid.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number,
            ]),
        })
    ),

    columns: PropTypes.shape({
        xs: PropTypes.number,
        sm: PropTypes.number,
        lg: PropTypes.number,
    }),

    spacing: PropTypes.number,

    variant: PropTypes.oneOf([
        "default",
        "glass",
        "outlined",
        "filled",
    ]),

    sx: PropTypes.object,
};