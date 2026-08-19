import { useState } from "react";
import PropTypes from "prop-types";
import {
    Box,
    Typography,
    Button,
    IconButton,
    Stack,
    Rating,
    Avatar,
    AvatarGroup,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";

import Section from "../../../components/ui/Section";
import testimonialData from "./TestimonialData";

export default function Testimonials({ data = testimonialData, sx = {} }) {
    const [current, setCurrent] = useState(0);

    const handlePrev = () => {
        setCurrent((prev) => (prev === 0 ? data.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrent((prev) => (prev === data.length - 1 ? 0 : prev + 1));
    };

    const active = data[current];

    return (
        <Section
            sx={{
                ...sx,
                py: { xs: 8, md: 12 },
                bgcolor: "#F8FAFC",
            }}
        >
            {/* ── Header ─────────────────────────────── */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
                    gap: { xs: 4, md: 8 },
                    mb: { xs: 6, md: 8 },
                    alignItems: "flex-start",
                }}
            >
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
                        Testimonials
                    </Typography>

                    <Typography
                        component="h2"
                        sx={{
                            fontSize: { xs: "2rem", md: "2.8rem", lg: "3.2rem" },
                            fontWeight: 800,
                            lineHeight: 1.15,
                            color: "#0F172A",
                        }}
                    >
                        Testimonials On The Impact Of The STEM Club
                    </Typography>
                </Box>

                <Stack spacing={3} sx={{ pt: { md: 5 } }}>
                    <Typography
                        sx={{
                            fontSize: 16,
                            lineHeight: 1.75,
                            color: "text.secondary",
                        }}
                    >
                        At GIEVA, we’re committed to continuous growth and improvement.
                        Whether you’ve participated in one of our programs, partnered with us,
                        or simply explored our work—we want to hear from you!
                        <br /><br />
                        Your insights help us shape better experiences, expand our impact,
                        and serve young people more effectively.
                    </Typography>

                    <Button
                        component={RouterLink}
                        to="/contact"
                        variant="contained"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                            alignSelf: "flex-start",
                            bgcolor: "#F97316",
                            textTransform: "none",
                            fontWeight: 600,
                            px: 3.5,
                            py: 1.3,
                            borderRadius: 3,
                            "&:hover": { bgcolor: "#ea580c" },
                        }}
                    >
                        Share Your Feedback
                    </Button>
                </Stack>
            </Box>

            {/* ── Main Content ───────────────────────── */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" },
                    gap: 4,
                    alignItems: "stretch",
                }}
            >
                {/* Green Stats Card */}
                <Box
                    sx={{
                        bgcolor: "#16A34A",
                        borderRadius: 4,
                        p: 4,
                        color: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: 280,
                    }}
                >
                    <Box>
                        <AvatarGroup
                            max={3}
                            sx={{
                                mb: 2,
                                "& .MuiAvatar-root": {
                                    width: 36,
                                    height: 36,
                                    border: "2px solid #16A34A",
                                },
                            }}
                        >
                            <Avatar src="/images/avatar1.jpg" />
                            <Avatar src="/images/avatar2.jpg" />
                            <Avatar src="/images/avatar3.jpg" />
                        </AvatarGroup>

                        <Typography sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>
                            1,000+
                        </Typography>
                        <Typography sx={{ fontSize: 14, opacity: 0.9, mb: 3 }}>
                            Student Reviews
                        </Typography>
                    </Box>

                    <Box>
                        <Typography sx={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}>
                            200
                        </Typography>
                        <Typography sx={{ fontSize: 14, opacity: 0.9, mt: 0.5 }}>
                            Students are grateful for the CHOICES STEM Club
                        </Typography>
                    </Box>
                </Box>

                {/* Testimonial Slider Card */}
                <Box
                    sx={{
                        position: "relative",
                        bgcolor: "#FFFFFF",
                        borderRadius: 4,
                        border: "1px solid #E2E8F0",
                        p: { xs: 3.5, md: 5 },
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 280,
                    }}
                >
                    {/* Big Quote Icon */}
                    <FormatQuoteRoundedIcon
                        sx={{
                            position: "absolute",
                            top: 24,
                            right: 28,
                            fontSize: 80,
                            color: "#F1F5F9",
                            transform: "rotate(180deg)",
                        }}
                    />

                    {/* Stars */}
                    <Rating
                        value={active.rating}
                        readOnly
                        size="small"
                        sx={{ mb: 2.5, color: "#F97316" }}
                    />

                    {/* Quote */}
                    <Typography
                        sx={{
                            fontSize: { xs: 15, md: 16.5 },
                            lineHeight: 1.75,
                            color: "#334155",
                            flexGrow: 1,
                            mb: 3,
                            position: "relative",
                            zIndex: 1,
                        }}
                    >
                        {active.quote}
                    </Typography>

                    {/* Author + Navigation */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography
                                sx={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: "#16A34A",
                                }}
                            >
                                {active.name}
                            </Typography>
                            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                                {active.role} · {active.organization}
                            </Typography>
                        </Box>

                        {/* Slider Controls */}
                        <Stack direction="row" spacing={1}>
                            <IconButton
                                onClick={handlePrev}
                                sx={{
                                    width: 42,
                                    height: 42,
                                    border: "1.5px solid #E2E8F0",
                                    color: "#0F172A",
                                    "&:hover": {
                                        bgcolor: "#F97316",
                                        borderColor: "#F97316",
                                        color: "#fff",
                                    },
                                }}
                            >
                                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>

                            <IconButton
                                onClick={handleNext}
                                sx={{
                                    width: 42,
                                    height: 42,
                                    bgcolor: "#F97316",
                                    color: "#fff",
                                    "&:hover": { bgcolor: "#ea580c" },
                                }}
                            >
                                <ArrowForwardIosRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </Section>
    );
}

Testimonials.propTypes = {
    data: PropTypes.array,
    sx: PropTypes.object,
};