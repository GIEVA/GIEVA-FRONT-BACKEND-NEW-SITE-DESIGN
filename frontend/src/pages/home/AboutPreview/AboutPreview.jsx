import PropTypes from "prop-types";
import { Box, Typography, Stack, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import Section from "../../../components/ui/Section";
import aboutData from "./AboutData";

export default function AboutPreview({ data = aboutData, sx = {} }) {
    const { eyebrow, title, description, image, stats, actions } = data;

    return (
        <Section sx={{ ...sx, py: { xs: 8, md: 12 } }}>
            {/* ──────────────────────────────────────────
                TOP PART – Text + Button
            ────────────────────────────────────────── */}
       
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" },
                    gap: { xs: 4, md: 8 },
                    alignItems: "flex-start",          // ← important change
                    mb: { xs: 6, md: 10 },
                }}
            >
                {/* Left – Title */}
                <Box>
                    <Typography
                        sx={{
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                            color: "#16A34A",
                            mb: 2,
                        }}
                    >
                        {eyebrow}
                    </Typography>

                    <Typography
                        component="h2"
                        sx={{
                            fontSize: { xs: "2rem", md: "2.75rem", lg: "3.25rem" },
                            fontWeight: 800,
                            lineHeight: 1.15,
                            color: "#0F172A",
                        }}
                    >
                        {title}
                    </Typography>
                </Box>

                {/* Right – Description + Button */}
                <Stack spacing={3} sx={{ pt: { md: 5.5 } }}>   {/* small top padding to align with title */}
                    <Typography
                        sx={{
                            fontSize: { xs: 16, md: 17 },
                            lineHeight: 1.75,
                            color: "text.secondary",
                            maxWidth: 520,
                        }}
                    >
                        {description}
                    </Typography>

                    {actions?.primary && (
                        <Button
                            component={RouterLink}
                            to={actions.primary.href}
                            variant={actions.primary.variant || "outlined"}
                            color={actions.primary.color || "warning"}
                            size="large"
                            sx={{
                                borderRadius: 2,
                                px: 3.5,
                                py: 1.25,
                                textTransform: "none",
                                fontWeight: 600,
                                borderColor: "#FDBA74",
                                color: "#C2410C",
                                bgcolor: "#FFF7ED",
                                alignSelf: "flex-start",
                                "&:hover": {
                                    bgcolor: "#FFEDD5",
                                    borderColor: "#FB923C",
                                },
                            }}
                        >
                            {actions.primary.label}
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* ──────────────────────────────────────────
                BOTTOM PART – Image + Stats Overlay
            ────────────────────────────────────────── */}
            <Box
                sx={{
                    position: "relative",
                    borderRadius: 4,
                    overflow: "hidden",
                    height: { xs: 360, md: 480, lg: 540 },
                }}
            >
                {/* Background Image */}
                <Box
                    component="img"
                    src={image.src}
                    alt={image.alt}
                    sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />

                {/* Dark gradient + blur at the bottom */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 35%, transparent 70%)",
                    }}
                />

                {/* Stats Row */}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        px: { xs: 2, md: 6 },
                        py: { xs: 3, md: 4 },
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr 1fr",
                            sm: "repeat(4, 1fr)",
                        },
                        gap: { xs: 2, md: 0 },
                        textAlign: "center",
                    }}
                >
                    {stats.map((stat, index) => (
                        <Box
                            key={stat.label}
                            sx={{
                                borderRight: {
                                    xs: "none",
                                    sm:
                                        index < stats.length - 1
                                            ? "1px solid rgba(255,255,255,0.25)"
                                            : "none",
                                },
                                px: { sm: 2 },
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: { xs: "1.75rem", md: "2.25rem", lg: "2.5rem" },
                                    fontWeight: 800,
                                    color: "#fff",
                                    lineHeight: 1.1,
                                    mb: 0.5,
                                }}
                            >
                                {stat.value}
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: { xs: 13, md: 14 },
                                    color: "rgba(255,255,255,0.8)",
                                    fontWeight: 500,
                                }}
                            >
                                {stat.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Section>
    );
}

AboutPreview.propTypes = {
    data: PropTypes.object,
    sx: PropTypes.object,
};