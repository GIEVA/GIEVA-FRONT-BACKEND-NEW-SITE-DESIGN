import PropTypes from "prop-types";
import { Box, Typography, Grid, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import Section from "../../../components/ui/Section";
import consultancyData from "./ConsultancyData";

export default function ConsultancyServices({ data = consultancyData, sx = {} }) {
    const { eyebrow, title, description, cards } = data;

    return (
        <Section sx={{ ...sx, py: { xs: 8, md: 12 } }}>
            {/* Header */}
            <Box sx={{ maxWidth: 720, mb: { xs: 6, md: 8 } }}>
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
                        fontSize: { xs: "2rem", md: "2.75rem", lg: "3.1rem" },
                        fontWeight: 800,
                        lineHeight: 1.2,
                        color: "#0F172A",
                        mb: 2.5,
                    }}
                >
                    {title}
                </Typography>

                <Typography
                    sx={{
                        fontSize: { xs: 16, md: 17 },
                        lineHeight: 1.7,
                        color: "text.secondary",
                        maxWidth: 560,
                    }}
                >
                    {description}
                </Typography>
            </Box>

            {/* Cards Grid */}
            <Grid container spacing={3}>
                {cards.map((card) => (
                    <Grid
                        key={card.id}
                        size={{ xs: 12, sm: 6, lg: 3 }}
                    >
                        <Box
                            sx={{
                                height: "100%",
                                bgcolor: "#1E1B4B", // deep purple
                                borderRadius: 3,
                                p: { xs: 3, md: 3.5 },
                                display: "flex",
                                flexDirection: "column",
                                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                                "&:hover": {
                                    transform: "translateY(-6px)",
                                    boxShadow: "0 20px 40px rgba(30, 27, 75, 0.35)",
                                },
                            }}
                        >
                            {/* Number Circle */}
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "50%",
                                    bgcolor: "#F97316",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 800,
                                    fontSize: 16,
                                    mb: 4,
                                }}
                            >
                                {card.number}
                            </Box>

                            {/* Title */}
                            <Typography
                                sx={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    letterSpacing: 0.8,
                                    textTransform: "uppercase",
                                    color: "#fff",
                                    mb: 1.5,
                                }}
                            >
                                {card.title}
                            </Typography>

                            {/* Divider line */}
                            <Box
                                sx={{
                                    width: 40,
                                    height: 2,
                                    bgcolor: "rgba(255,255,255,0.15)",
                                    mb: 2,
                                }}
                            />

                            {/* Description */}
                            <Typography
                                sx={{
                                    fontSize: 14,
                                    lineHeight: 1.65,
                                    color: "rgba(255,255,255,0.7)",
                                    flexGrow: 1,
                                    mb: 3,
                                }}
                            >
                                {card.description}
                            </Typography>

                            {/* Learn more link */}
                            <MuiLink
                                component={RouterLink}
                                to={card.href}
                                underline="none"
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    color: "#F97316",
                                    fontWeight: 600,
                                    fontSize: 14,
                                    "&:hover": {
                                        color: "#FB923C",
                                    },
                                }}
                            >
                                Learn more
                                <ArrowForwardIcon sx={{ fontSize: 16 }} />
                            </MuiLink>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Section>
    );
}

ConsultancyServices.propTypes = {
    data: PropTypes.object,
    sx: PropTypes.object,
};