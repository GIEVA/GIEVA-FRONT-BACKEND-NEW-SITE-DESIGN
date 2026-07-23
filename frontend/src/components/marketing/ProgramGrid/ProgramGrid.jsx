import PropTypes from "prop-types";

import { Grid } from "@mui/material";

import { ProgramCard } from "../ProgramCard";

export default function ProgramGrid({
    programs = [],
    gridSize = {
        xs: 12,
        sm: 6,
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
            {programs.map((program) => (
                <Grid
                    key={program.id}
                    size={gridSize}
                >
                    <ProgramCard
                        program={program}
                    />
                </Grid>
            ))}
        </Grid>
    );
}

ProgramGrid.propTypes = {
    programs: PropTypes.arrayOf(
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