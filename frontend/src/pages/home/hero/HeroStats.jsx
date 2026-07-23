import PropTypes from "prop-types";

import {
    Grid,
} from "@mui/material";


import StatCard from "../../../components/ui/StatCard";

export default function HeroStats({
    stats = [],
    columns = {
        xs: 1,
        sm: 2,
        md: 3,
    },
    spacing = 3,
    variant = "glass",
    sx = {},
}) {
    if (!stats.length) return null;

    return (
        <Grid
            container
            spacing={spacing}
            sx={sx}
        >
            {stats.map((stat, index) => (
                <Grid
                    key={stat.id ?? index}
                    size={{
                        xs: 12,
                        sm: 6,
                        md: 12 / columns.md,
                    }}
                >
                    <StatCard
                        value={stat.value}
                        label={stat.label}
                        description={stat.description}
                        icon={stat.icon}
                        variant={variant}
                    />
                </Grid>
            ))}
        </Grid>
    );
}

HeroStats.propTypes = {
    stats: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number,
            ]),

            value: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number,
            ]).isRequired,

            label: PropTypes.string.isRequired,

            description: PropTypes.string,

            icon: PropTypes.node,
        })
    ),

    columns: PropTypes.shape({
        xs: PropTypes.number,
        sm: PropTypes.number,
        md: PropTypes.number,
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