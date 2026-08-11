import PropTypes from "prop-types";

import { Grid } from "@mui/material";

import StatCard from "../../ui/StatCard";

export default function MetricGrid({
    metrics = [],
    columns = {
        xs: 1,
        sm: 2,
        lg: 4,
    },
    spacing = 4,
    variant = "glass",
    sx = {},
}) {
    return (
        <Grid
            container
            spacing={spacing}
            sx={sx}
        >
            {metrics.map((metric) => (
                <Grid
                    key={metric.id}
                    size={{
                        xs: 12 / columns.xs,
                        sm: 12 / columns.sm,
                        lg: 12 / columns.lg,
                    }}
                >
                    <StatCard
                        value={metric.value}
                        label={metric.label}
                        description={metric.description}
                        icon={metric.icon}
                        color={metric.color}
                        variant={variant}
                    />
                </Grid>
            ))}
        </Grid>
    );
}

MetricGrid.propTypes = {
    metrics: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number,
            ]).isRequired,

            value: PropTypes.string.isRequired,

            label: PropTypes.string.isRequired,

            description: PropTypes.string,

            icon: PropTypes.node,

            color: PropTypes.string,
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