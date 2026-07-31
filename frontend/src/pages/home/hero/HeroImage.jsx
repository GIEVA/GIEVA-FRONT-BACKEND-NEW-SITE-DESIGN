import { useRef } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import worldImage from "../../../assets/world-removebg-preview.png";

const NAVY = "#0B1F3A";
const GREEN = "#22C55E";
const ORANGE = "#F97316";

const DEFAULT_TAGS = [
    { label: "HEALS", top: "10%", left: "-6%", color: GREEN, delay: 0 },
    { label: "CHOICES", top: "68%", left: "-10%", color: ORANGE, delay: 0.6 },
    { label: "LMS", top: "4%", left: "70%", color: NAVY, delay: 1.2 },
    { label: "CMS", top: "78%", left: "68%", color: GREEN, delay: 1.8 },
    { label: "EMS", top: "42%", left: "88%", color: ORANGE, delay: 2.4 },
];

export default function HeroImage({ image, ecosystemTags = DEFAULT_TAGS, sx = {} }) {
    const prefersReducedMotion = useReducedMotion();
    const containerRef = useRef(null);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springX = useSpring(mouseX, { stiffness: 120, damping: 18 });
    const springY = useSpring(mouseY, { stiffness: 120, damping: 18 });

    const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);
    const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);

    const handleMouseMove = (e) => {
        if (prefersReducedMotion || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <Box
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 380,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                ...sx,
            }}
        >
            {/* Soft Background Glow Layer */}
            <Box
                sx={{
                    position: "absolute",
                    inset: "-20%",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, rgba(249,115,22,0.15) 20%, rgba(11,31,58,0.08) 50%, transparent 80%)`,
                    filter: "blur(60px)",
                    zIndex: 1,
                }}
            />

            {/* Animated Rings — pause if reduced motion is requested */}
            <motion.div
                style={{
                    position: "absolute",
                    width: "108%",
                    height: "108%",
                    borderRadius: "50%",
                    background: `conic-gradient(${GREEN}, ${ORANGE}, ${NAVY}, ${GREEN})`,
                    opacity: 0.22,
                    filter: "blur(28px)",
                }}
                animate={prefersReducedMotion ? {} : { rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            />

            <motion.div
                style={{
                    position: "absolute",
                    width: "92%",
                    height: "92%",
                    borderRadius: "50%",
                    background: `conic-gradient(${ORANGE}, ${NAVY}, ${GREEN}, ${ORANGE})`,
                    opacity: 0.18,
                    filter: "blur(18px)",
                }}
                animate={prefersReducedMotion ? {} : { rotate: -360 }}
                transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
            />

            {/* Main World Image — tilts toward the cursor */}
            <motion.div
                style={{
                    position: "relative",
                    zIndex: 3,
                    width: "100%",
                    maxWidth: 580,
                    rotateX: prefersReducedMotion ? 0 : rotateX,
                    rotateY: prefersReducedMotion ? 0 : rotateY,
                    transformPerspective: 900,
                }}
            >
                <motion.img
                    src={worldImage}
                    alt={image?.alt || "Global illustration"}
                    style={{
                        width: "100%",
                        objectFit: "contain",
                        filter: "drop-shadow(0 25px 40px rgba(0,0,0,0.12))",
                        mixBlendMode: "multiply",
                    }}
                    initial={{ opacity: 0.85, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                />
            </motion.div>

            {/* Extra Soft Highlight Overlay */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.6) 0%, transparent 60%)",
                    zIndex: 4,
                    pointerEvents: "none",
                    mixBlendMode: "screen",
                }}
            />

            {/* Floating Accent Orb */}
            <motion.div
                style={{
                    position: "absolute",
                    top: "22%",
                    right: "18%",
                    width: 48,
                    height: 48,
                    background: `linear-gradient(135deg, ${ORANGE}, #FB923C)`,
                    borderRadius: "50%",
                    boxShadow: `0 0 40px ${ORANGE}`,
                    zIndex: 5,
                }}
                animate={prefersReducedMotion ? {} : { y: [-12, 12, -12], scale: [1, 1.08, 1] }}
                transition={{ duration: 5, repeat: Infinity }}
            />

            {/* GIEVA Ecosystem Tags — signals this is a platform, not one service */}
            {ecosystemTags.map((tag) => (
                <motion.div
                    key={tag.label}
                    style={{ position: "absolute", top: tag.top, left: tag.left, zIndex: 6 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={
                        prefersReducedMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 1, scale: 1, y: [0, -10, 0] }
                    }
                    transition={{
                        opacity: { duration: 0.5, delay: tag.delay },
                        scale: { duration: 0.5, delay: tag.delay },
                        y: prefersReducedMotion ? undefined : { duration: 4.5, repeat: Infinity, delay: tag.delay, ease: "easeInOut" },
                    }}
                >
                    <Box
                        sx={{
                            px: 1.6,
                            py: 0.6,
                            borderRadius: 999,
                            bgcolor: "rgba(255,255,255,0.9)",
                            border: `1px solid ${tag.color}33`,
                            boxShadow: "0 6px 18px rgba(15,23,42,0.1)",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        <Typography sx={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.5, color: tag.color }}>
                            {tag.label}
                        </Typography>
                    </Box>
                </motion.div>
            ))}
        </Box>
    );
}

HeroImage.propTypes = {
    image: PropTypes.shape({ src: PropTypes.string, alt: PropTypes.string }),
    ecosystemTags: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string,
            top: PropTypes.string,
            left: PropTypes.string,
            color: PropTypes.string,
            delay: PropTypes.number,
        })
    ),
    sx: PropTypes.object,
};


// import PropTypes from "prop-types";
// import { Box } from "@mui/material";
// import { motion } from "framer-motion";
// import worldImage from "../../../assets/world-removebg-preview.png";

// export default function HeroImage({ image, sx = {} }) {
//     return (
//         <Box
//             sx={{
//                 position: "relative",
//                 width: "100%",
//                 height: "100%",
//                 display: "flex",
//                 justifyContent: "center",
//                 alignItems: "center",
//                 ...sx,
//             }}
//         >
//             {/* Soft Background Glow Layer */}
//             <Box
//                 sx={{
//                     position: "absolute",
//                     inset: "-20%",
//                     borderRadius: "50%",
//                     background: "radial-gradient(circle, rgba(249,115,22,0.15) 20%, rgba(59,130,246,0.08) 50%, transparent 80%)",
//                     filter: "blur(60px)",
//                     zIndex: 1,
//                 }}
//             />

//             {/* Animated Colorful Rings (Main Visual) */}
//             <motion.div
//                 style={{
//                     position: "absolute",
//                     width: "108%",
//                     height: "108%",
//                     borderRadius: "50%",
//                     background: "conic-gradient(#22C55E, #F97316, #3B82F6, #22C55E)",
//                     opacity: 0.22,
//                     filter: "blur(28px)",
//                 }}
//                 animate={{ rotate: 360 }}
//                 transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
//             />

//             <motion.div
//                 style={{
//                     position: "absolute",
//                     width: "92%",
//                     height: "92%",
//                     borderRadius: "50%",
//                     background: "conic-gradient(#F97316, #3B82F6, #22C55E, #F97316)",
//                     opacity: 0.18,
//                     filter: "blur(18px)",
//                 }}
//                 animate={{ rotate: -360 }}
//                 transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
//             />

//             {/* Main World Image - Blended */}
//             <motion.img
//                 src={worldImage}
//                 alt={image?.alt || "Global illustration"}
//                 style={{
//                     position: "relative",
//                     zIndex: 3,
//                     width: "100%",
//                     maxWidth: 580,
//                     objectFit: "contain",
//                     filter: "drop-shadow(0 25px 40px rgba(0,0,0,0.12))",
//                     mixBlendMode: "multiply", // Key for blending
//                 }}
//                 initial={{ opacity: 0.85, scale: 0.88 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{ duration: 1.4, ease: "easeOut" }}
//             />

//             {/* Extra Soft Highlight Overlay */}
//             <Box
//                 sx={{
//                     position: "absolute",
//                     inset: 0,
//                     borderRadius: "50%",
//                     background: "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.6) 0%, transparent 60%)",
//                     zIndex: 4,
//                     pointerEvents: "none",
//                     mixBlendMode: "screen",
//                 }}
//             />

//             {/* Floating Accent Orb */}
//             <motion.div
//                 style={{
//                     position: "absolute",
//                     top: "22%",
//                     right: "18%",
//                     width: 48,
//                     height: 48,
//                     background: "linear-gradient(135deg, #F97316, #FB923C)",
//                     borderRadius: "50%",
//                     boxShadow: "0 0 40px #F97316",
//                     zIndex: 5,
//                 }}
//                 animate={{
//                     y: [-12, 12, -12],
//                     scale: [1, 1.08, 1],
//                 }}
//                 transition={{
//                     duration: 5,
//                     repeat: Infinity,
//                 }}
//             />
//         </Box>
//     );
// }