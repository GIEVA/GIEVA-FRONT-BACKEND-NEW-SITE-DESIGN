import PropTypes from "prop-types";

import {
    Box,
    Container,
    Grid,
} from "@mui/material";

import HeroContent from "./HeroContent";
import HeroImage from "./HeroImage";

export default function Hero({
    title,
    subtitle,
    description,

    actions,

    stats,

    image,

    align = "left",

    maxWidth = "xl",

    minHeight = "85vh",

    background = "background.default",

    sx = {},
}) {
    return (
        <Box
            component="section"
            sx={{
                bgcolor: background,

                display: "flex",

                alignItems: "center",

                minHeight,

                overflow: "hidden",

                position: "relative",

                ...sx,
            }}
        >
            <Container
                maxWidth={maxWidth}
            >
                <Grid
                    container
                    spacing={{
                        xs: 6,
                        lg: 10,
                    }}
                    alignItems="center"
                >
                    {/* Left Content */}

                    <Grid
                        size={{
                            xs: 12,
                            lg: 6,
                        }}
                    >
                        <HeroContent
                            title={title}
                            subtitle={subtitle}
                            description={description}
                            actions={actions}
                            stats={stats}
                            align={align}
                        />
                    </Grid>

                    {/* Right Illustration */}

                    <Grid
                        size={{
                            xs: 12,
                            lg: 6,
                        }}
                    >
                        <HeroImage
                            image={image}
                        />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

Hero.propTypes = {
    title: PropTypes.string.isRequired,

    subtitle: PropTypes.string,

    description: PropTypes.string,

    actions: PropTypes.shape({
        primary: PropTypes.object,

        secondary: PropTypes.object,
    }),

    stats: PropTypes.array,

    image: PropTypes.shape({
        src: PropTypes.string,

        alt: PropTypes.string,
    }),

    align: PropTypes.oneOf([
        "left",
        "center",
    ]),

    maxWidth: PropTypes.oneOf([
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        false,
    ]),

    minHeight: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),

    background: PropTypes.string,

    sx: PropTypes.object,
};