import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import worldImage from "../../../assets/world-removebg-preview.png";

export default function HeroImage({ image, sx = {} }) {
    return (
        <Box
            sx={{
                position: "relative",
                width: "100%",
                height: "100%",
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
                    background: "radial-gradient(circle, rgba(249,115,22,0.15) 20%, rgba(59,130,246,0.08) 50%, transparent 80%)",
                    filter: "blur(60px)",
                    zIndex: 1,
                }}
            />

            {/* Animated Colorful Rings (Main Visual) */}
            <motion.div
                style={{
                    position: "absolute",
                    width: "108%",
                    height: "108%",
                    borderRadius: "50%",
                    background: "conic-gradient(#22C55E, #F97316, #3B82F6, #22C55E)",
                    opacity: 0.22,
                    filter: "blur(28px)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            />

            <motion.div
                style={{
                    position: "absolute",
                    width: "92%",
                    height: "92%",
                    borderRadius: "50%",
                    background: "conic-gradient(#F97316, #3B82F6, #22C55E, #F97316)",
                    opacity: 0.18,
                    filter: "blur(18px)",
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
            />

            {/* Main World Image - Blended */}
            <motion.img
                src={worldImage}
                alt={image?.alt || "Global illustration"}
                style={{
                    position: "relative",
                    zIndex: 3,
                    width: "100%",
                    maxWidth: 580,
                    objectFit: "contain",
                    filter: "drop-shadow(0 25px 40px rgba(0,0,0,0.12))",
                    mixBlendMode: "multiply", // Key for blending
                }}
                initial={{ opacity: 0.85, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.4, ease: "easeOut" }}
            />

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
                    background: "linear-gradient(135deg, #F97316, #FB923C)",
                    borderRadius: "50%",
                    boxShadow: "0 0 40px #F97316",
                    zIndex: 5,
                }}
                animate={{
                    y: [-12, 12, -12],
                    scale: [1, 1.08, 1],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                }}
            />
        </Box>
    );
}