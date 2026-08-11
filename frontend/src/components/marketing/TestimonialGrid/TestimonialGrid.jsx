import PropTypes from "prop-types";

import { Grid } from "@mui/material";

import { TestimonialCard } from "../TestimonialCard";

export default function TestimonialGrid({
    testimonials = [],
    gridSize = {
        xs: 12,
        md: 6,
        lg: 4,
    },
    spacing = 4,
    sx = {},
}) {
    return (
        <Grid
            container
            spacing={spacing}
            sx={sx}
        >
            {testimonials.map((testimonial) => (
                <Grid
                    key={testimonial.id}
                    size={gridSize}
                >
                    <TestimonialCard
                        testimonial={testimonial}
                    />
                </Grid>
            ))}
        </Grid>
    );
}

TestimonialGrid.propTypes = {
    testimonials: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number,
            ]).isRequired,
        })
    ),

    gridSize: PropTypes.shape({
        xs: PropTypes.number,
        sm: PropTypes.number,
        md: PropTypes.number,
        lg: PropTypes.number,
        xl: PropTypes.number,
    }),

    spacing: PropTypes.number,

    sx: PropTypes.object,
};