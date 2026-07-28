import PropTypes from "prop-types";
import { Box, Typography, Grid, IconButton } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import NorthEastRoundedIcon from "@mui/icons-material/NorthEastRounded";

import Section from "../../../components/ui/Section";
import coreValuesData from "./CoreValuesData";

export default function CoreValues({ data = coreValuesData, sx = {} }) {
    const { eyebrow, title, description, cards } = data;

    return (
        <Section
            sx={{
                ...sx,
                py: { xs: 8, md: 12 },
                bgcolor: "#F8FAFC", // light background
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: { xs: 3, md: 8 },
                    alignItems: "flex-start",
                    mb: { xs: 6, md: 8 },
                }}
            >
                {/* Left */}
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
                            fontSize: { xs: "2.25rem", md: "3rem", lg: "3.4rem" },
                            fontWeight: 800,
                            lineHeight: 1.15,
                            color: "#0F172A",
                        }}
                    >
                        {title}
                    </Typography>
                </Box>

                {/* Right – Description */}
                <Typography
                    sx={{
                        fontSize: { xs: 16, md: 17 },
                        lineHeight: 1.75,
                        color: "text.secondary",
                        maxWidth: 480,
                        pt: { md: 5 },
                    }}
                >
                    {description}
                </Typography>
            </Box>

            {/* Cards */}
            <Grid container spacing={3}>
                {cards.map((card) => (
                    <Grid key={card.id} size={{ xs: 12, md: 4 }}>
                        <Box
                            sx={{
                                height: "100%",
                                bgcolor: "#FFFFFF",
                                borderRadius: 4,
                                border: "1px solid #E2E8F0",
                                p: { xs: 3.5, md: 4 },
                                display: "flex",
                                flexDirection: "column",
                                transition: "all 0.25s ease",
                                "&:hover": {
                                    borderColor: "#F97316",
                                    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
                                    transform: "translateY(-4px)",
                                },
                            }}
                        >
                            {/* Icon */}
                            <Box
                                sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 3,
                                    bgcolor: "#ECFDF5",
                                    color: "#16A34A",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 3,
                                }}
                            >
                                {card.icon}
                            </Box>

                            {/* Title */}
                            <Typography
                                sx={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: "#0F172A",
                                    mb: 1.5,
                                }}
                            >
                                {card.title}
                            </Typography>

                            {/* Description */}
                            <Typography
                                sx={{
                                    fontSize: 15,
                                    lineHeight: 1.7,
                                    color: "text.secondary",
                                    flexGrow: 1,
                                    mb: 3,
                                }}
                            >
                                {card.description}
                            </Typography>

                            {/* Arrow button → About page */}
                            <IconButton
                                component={RouterLink}
                                to={card.href}
                                sx={{
                                    alignSelf: "flex-start",
                                    width: 44,
                                    height: 44,
                                    border: "1.5px solid #E2E8F0",
                                    color: "#0F172A",
                                    "&:hover": {
                                        bgcolor: "#F97316",
                                        borderColor: "#F97316",
                                        color: "#fff",
                                    },
                                }}
                            >
                                <NorthEastRoundedIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Section>
    );
}

CoreValues.propTypes = {
    data: PropTypes.object,
    sx: PropTypes.object,
};