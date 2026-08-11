import PropTypes from "prop-types";
import { Box, Typography, Grid, Button, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import Section from "../../../components/ui/Section";
import whyChooseUsData from "./WhyChooseUsData";

export default function WhyChooseUs({ data = whyChooseUsData, sx = {} }) {
    const { eyebrow, title, description, image, features, actions } = data;

    return (
        <Section sx={{ ...sx, py: { xs: 8, md: 12 } }}>
            <Grid container spacing={{ xs: 6, lg: 10 }} alignItems="center">
                {/* LEFT – Image */}
                <Grid size={{ xs: 12, lg: 5 }}>
                    <Box
                        sx={{
                            borderRadius: 4,
                            overflow: "hidden",
                            height: { xs: 320, md: 480 },
                            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
                        }}
                    >
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
                    </Box>
                </Grid>

                {/* RIGHT – Content */}
                <Grid size={{ xs: 12, lg: 7 }}>
                    {/* Header */}
                    <Box sx={{ mb: 5 }}>
                        <Typography
                            sx={{
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: 1.5,
                                textTransform: "uppercase",
                                color: "#F97316",
                                mb: 2,
                            }}
                        >
                            {eyebrow}
                        </Typography>

                        <Typography
                            component="h2"
                            sx={{
                                fontSize: { xs: "1.9rem", md: "2.4rem", lg: "2.75rem" },
                                fontWeight: 800,
                                lineHeight: 1.2,
                                color: "#0F172A",
                                mb: 2.5,
                                maxWidth: 520,
                            }}
                        >
                            {title}
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: 16,
                                lineHeight: 1.75,
                                color: "text.secondary",
                                maxWidth: 540,
                            }}
                        >
                            {description}
                        </Typography>
                    </Box>

                    {/* Features Grid */}
                    <Grid container spacing={3} sx={{ mb: 5 }}>
                        {features.map((feature) => (
                            <Grid key={feature.id} size={{ xs: 12, sm: 6 }}>
                                <Box
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3,
                                        bgcolor: "#F8FAFC",
                                        height: "100%",
                                        border: "1px solid #E2E8F0",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: 2,
                                            bgcolor: "#FFF7ED",
                                            color: "#F97316",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mb: 2,
                                        }}
                                    >
                                        {feature.icon}
                                    </Box>

                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: "#0F172A",
                                            mb: 1,
                                        }}
                                    >
                                        {feature.title}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            lineHeight: 1.65,
                                            color: "text.secondary",
                                        }}
                                    >
                                        {feature.description}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Actions */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        {actions?.primary && (
                            <Button
                                component={RouterLink}
                                to={actions.primary.href}
                                variant="contained"
                                size="large"
                                sx={{
                                    bgcolor: "#F97316",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    px: 3.5,
                                    borderRadius: 2,
                                    "&:hover": { bgcolor: "#ea580c" },
                                }}
                            >
                                {actions.primary.label}
                            </Button>
                        )}

                        {actions?.secondary && (
                            <Button
                                component={RouterLink}
                                to={actions.secondary.href}
                                variant="outlined"
                                size="large"
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 600,
                                    px: 3.5,
                                    borderRadius: 2,
                                    borderColor: "#CBD5E1",
                                    color: "#0F172A",
                                    "&:hover": {
                                        borderColor: "#F97316",
                                        color: "#F97316",
                                        bgcolor: "#FFF7ED",
                                    },
                                }}
                            >
                                {actions.secondary.label}
                            </Button>
                        )}
                    </Stack>
                </Grid>
            </Grid>
        </Section>
    );
}

WhyChooseUs.propTypes = {
    data: PropTypes.object,
    sx: PropTypes.object,
};