import PropTypes from "prop-types";

import {
    Grid,
    Box,
} from "@mui/material";

export default function SplitSection({
    left,
    right,
    reverse = false,
    spacing = {
        xs: 6,
        md: 10,
    },
    alignItems = "center",
    sx = {},
}) {
    return (
        <Box sx={sx}>
            <Grid
                container
                spacing={spacing}
                alignItems={alignItems}
            >
                <Grid
                    size={{
                        xs: 12,
                        md: 6,
                    }}
                    order={{
                        xs: 1,
                        md: reverse ? 2 : 1,
                    }}
                >
                    {left}
                </Grid>

                <Grid
                    size={{
                        xs: 12,
                        md: 6,
                    }}
                    order={{
                        xs: 2,
                        md: reverse ? 1 : 2,
                    }}
                >
                    {right}
                </Grid>
            </Grid>
        </Box>
    );
}

SplitSection.propTypes = {
    left: PropTypes.node,

    right: PropTypes.node,

    reverse: PropTypes.bool,

    spacing: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.object,
    ]),

    alignItems: PropTypes.string,

    sx: PropTypes.object,
};