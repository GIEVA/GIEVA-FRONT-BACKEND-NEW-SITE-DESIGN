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
                minHeight: { xs: "auto", lg: minHeight },
                py: { xs: 10, lg: 0 },
                overflow: "hidden",
                position: "relative",
                ...sx,
            }}
        >
            <Container maxWidth={maxWidth}>
                <Grid container spacing={{ xs: 6, lg: 6 }} alignItems="center">
                    <Grid size={{ xs: 12, lg: contentWidth }}>
                        <HeroContent
                            eyebrow={subtitle}
                            title={title}
                            description={description}
                            actions={actions}
                            stats={stats}
                            align={align}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, lg: imageWidth }}>
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

// import PropTypes from "prop-types";
// import { Box, Container, Grid } from "@mui/material";
// import HeroContent from "./HeroContent";
// import HeroImage from "./HeroImage";

// export default function Hero({
//     title,
//     subtitle,
//     description,
//     actions,
//     stats,
//     image,
//     align = "left",
//     maxWidth = "xl",
//     minHeight = "90vh",
//     background = "background.default",
//     contentWidth = 5,   // NEW
//     imageWidth = 7,     // NEW
//     sx = {},
// }) {
//     return (
//         <Box
//             component="section"
//             sx={{
//                 bgcolor: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
//                 display: "flex",
//                 alignItems: "center",
//                 minHeight,
//                 overflow: "hidden",
//                 position: "relative",
//                 ...sx,
//             }}
//         >
//             <Container maxWidth={maxWidth}>
//                 <Grid
//                     container
//                     spacing={{ xs: 4, lg: 6 }} // Tighter spacing
//                     alignItems="center"
//                 >
//                     {/* Left Content - Slightly wider */}
//                     <Grid size={{ xs: 12, lg: contentWidth }}>
//                         <HeroContent
//                             eyebrow={subtitle} // Using subtitle prop as eyebrow for GIEVA feel
//                             title={title}
//                             description={description}
//                             actions={actions}
//                             stats={stats}
//                             align={align}
//                         />
//                     </Grid>

//                     {/* Right Illustration - Larger & More Impactful */}
//                     <Grid size={{ xs: 12, lg: imageWidth }}>
//                         <HeroImage image={image} />
//                     </Grid>
//                 </Grid>
//             </Container>
//         </Box>
//     );
// }

