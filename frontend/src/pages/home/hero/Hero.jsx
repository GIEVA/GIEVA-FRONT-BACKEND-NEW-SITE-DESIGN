import PropTypes from "prop-types";
import { Box, Container, Grid } from "@mui/material";
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
    minHeight = "90vh",
    background,
    contentWidth = 5,
    imageWidth = 7,
    sx = {},
}) {
    return (
        <Box
            component="section"
            sx={{
                background: background || "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
                display: "flex",
                alignItems: "center",
                minHeight: { xs: "85vh", lg: minHeight },
                py: { xs: 8, lg: 0 },
                overflow: "hidden",
                position: "relative",
                ...sx,
            }}
        >
            <Container maxWidth={maxWidth}>
                <Grid container spacing={{ xs: 6, lg: 6 }} alignItems="center">
                    {/* Text content — sits above the globe on mobile */}
                    <Grid
                        size={{ xs: 12, lg: contentWidth }}
                        sx={{ position: "relative", zIndex: 1 }}
                    >
                        <HeroContent
                            eyebrow={subtitle}
                            title={title}
                            description={description}
                            actions={actions}
                            stats={stats}
                            align={align}
                        />
                    </Grid>

                    {/* Globe — faded backdrop on mobile/tablet, normal column on desktop */}
                    <Grid
                        size={{ xs: 12, lg: imageWidth }}
                        sx={{
                            position: { xs: "absolute", lg: "static" },
                            top: { xs: "50%", lg: "auto" },
                            right: { xs: "-30%", lg: "auto" },
                            width: { xs: "100%", sm: "80%", lg: "auto" },
                            maxWidth: { xs: "100%", lg: "none" },
                            transform: { xs: "translateY(-50%)", lg: "none" },
                            opacity: { xs: 0.22, lg: 1 },
                            zIndex: 0,
                            pointerEvents: { xs: "none", lg: "auto" },
                        }}
                    >
                        <HeroImage image={image} />
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
    actions: PropTypes.object,
    stats: PropTypes.array,
    image: PropTypes.shape({
        src: PropTypes.string,
        alt: PropTypes.string,
    }),
    align: PropTypes.oneOf(["left", "center"]),
    maxWidth: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl", false]),
    minHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    background: PropTypes.string,
    contentWidth: PropTypes.number,
    imageWidth: PropTypes.number,
    sx: PropTypes.object,
};
