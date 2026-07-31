import PropTypes from "prop-types";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

import HeroActions from "./HeroActions";
import HeroStats from "./HeroStats";

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.16, delayChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const titleContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
};

const wordVariant = {
    hidden: { y: "110%" },
    show: { y: "0%", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const wordVariantReduced = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.4 } },
};

export default function HeroContent({
    eyebrow,
    title,
    description,
    actions,
    stats,
    align = "left",
    sx = {},
}) {
    const centered = align === "center";
    const prefersReducedMotion = useReducedMotion();

    const isPlainString = typeof title === "string";
    const words = isPlainString ? title.split(" ") : [];

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            <Stack
                spacing={4}
                alignItems={centered ? "center" : "flex-start"}
                textAlign={align}
                sx={sx}
            >
                {eyebrow && (
                    <motion.div variants={item}>
                        <Chip label={eyebrow} color="primary" variant="filled" />
                    </motion.div>
                )}

                <motion.div variants={prefersReducedMotion || !isPlainString ? item : titleContainer}>
                    <Typography
                        variant="display1"
                        component="h1"
                        sx={{
                            maxWidth: 700,
                            fontSize: { xs: "2.8rem", md: "3.8rem", lg: "4.2rem" },
                            fontWeight: 800,
                            lineHeight: 1.1,
                        }}
                    >
                        {isPlainString ? (
                            words.map((word, i) => (
                                <Box
                                    key={i}
                                    component="span"
                                    sx={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", mr: "0.28em" }}
                                >
                                    <motion.span
                                        style={{ display: "inline-block" }}
                                        variants={prefersReducedMotion ? wordVariantReduced : wordVariant}
                                    >
                                        {word}
                                    </motion.span>
                                </Box>
                            ))
                        ) : (
                            // title is JSX, a number, or not yet loaded — render as-is, no word animation
                            title
                        )}
                    </Typography>
                </motion.div>

                {description && (
                    <motion.div variants={item}>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{
                                maxWidth: 600,
                                lineHeight: 1.8,
                                fontSize: { xs: "1.1rem", lg: "1.2rem" },
                            }}
                        >
                            {description}
                        </Typography>
                    </motion.div>
                )}

                {actions && (
                    <motion.div variants={item} style={{ width: centered ? "auto" : "100%" }}>
                        <HeroActions {...actions} />
                    </motion.div>
                )}

                {stats && stats.length > 0 && (
                    <motion.div variants={item} style={{ width: "100%" }}>
                        <HeroStats stats={stats} />
                    </motion.div>
                )}
            </Stack>
        </motion.div>
    );
}

HeroContent.propTypes = {
    eyebrow: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    actions: PropTypes.object,
    stats: PropTypes.array,
    align: PropTypes.oneOf(["left", "center"]),
    sx: PropTypes.object,
};
// import PropTypes from "prop-types";
// import { Box, Chip, Stack, Typography } from "@mui/material";

// import HeroActions from "./HeroActions";

// export default function HeroContent({
//     eyebrow,
//     subtitle,
//     title,
//     description,
//     actions,
//     stats,
//     align = "left",
//     sx = {},
// }) {
//     const centered = align === "center";

//     return (
//         <Stack
//             spacing={4}
//             alignItems={centered ? "center" : "flex-start"}
//             textAlign={align}
//             sx={sx}
//         >
//             {/* Eyebrow Badge */}
//             {eyebrow && (
//                 <Chip label={eyebrow} color="primary" variant="filled" />
//             )}

//             {/* Main Heading - Big & Bold */}
//             <Typography
//                 variant="display1"
//                 component="h1"
//                 sx={{
//                     maxWidth: 700,
//                     fontSize: { xs: "2.8rem", md: "3.8rem", lg: "4.2rem" },
//                     fontWeight: 800,
//                     lineHeight: 1.1,
//                 }}
//             >
//                 {title}
//             </Typography>

//             {/* Description */}
//             {description && (
//                 <Typography
//                     variant="body1"
//                     color="text.secondary"
//                     sx={{
//                         maxWidth: 600,
//                         lineHeight: 1.8,
//                         fontSize: { xs: "1.1rem", lg: "1.2rem" },
//                     }}
//                 >
//                     {description}
//                 </Typography>
//             )}

//             {/* Actions */}
//             {actions && <HeroActions {...actions} />}
//         </Stack>
//     );
// }

// HeroContent.propTypes = {
//     eyebrow: PropTypes.string,
//     subtitle: PropTypes.string,
//     title: PropTypes.string.isRequired,
//     description: PropTypes.string,
//     actions: PropTypes.object,
//     stats: PropTypes.array,
//     align: PropTypes.oneOf(["left", "center"]),
//     sx: PropTypes.object,
// };