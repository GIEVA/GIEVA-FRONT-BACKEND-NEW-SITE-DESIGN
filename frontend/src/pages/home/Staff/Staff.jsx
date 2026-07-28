import { useState, useRef } from "react";
import PropTypes from "prop-types";
import {
    Box,
    Typography,
    IconButton,
    Stack,
    Avatar,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import XIcon from "@mui/icons-material/X";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";

import Section from "../../../components/ui/Section";
import staffData from "./StaffData";

const socialIconMap = {
    facebook: <FacebookIcon sx={{ fontSize: 14 }} />,
    linkedin: <LinkedInIcon sx={{ fontSize: 14 }} />,
    x: <XIcon sx={{ fontSize: 14 }} />,
    instagram: <InstagramIcon sx={{ fontSize: 14 }} />,
    youtube: <YouTubeIcon sx={{ fontSize: 14 }} />,
};

export default function Staff({ data = staffData, sx = {} }) {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    const scroll = (direction) => {
        const el = scrollRef.current;
        if (!el) return;
        const amount = 320;
        el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
        setTimeout(checkScroll, 350);
    };

    return (
        <Section sx={{ ...sx, py: { xs: 8, md: 12 } }}>
            {/* Header */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
                    gap: { xs: 3, md: 8 },
                    mb: { xs: 5, md: 7 },
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
                        OUR STAFF
                    </Typography>

                    <Typography
                        component="h2"
                        sx={{
                            fontSize: { xs: "2.1rem", md: "2.8rem", lg: "3.2rem" },
                            fontWeight: 800,
                            lineHeight: 1.15,
                            color: "#0F172A",
                        }}
                    >
                        Meet GIEVA's Family
                    </Typography>
                </Box>

                <Typography
                    sx={{
                        fontSize: 16,
                        lineHeight: 1.75,
                        color: "text.secondary",
                        pt: { md: 5 },
                        maxWidth: 420,
                    }}
                >
                    At GIEVA, we are led by visionary individuals who are passionate about
                    youth development and educational empowerment.
                </Typography>
            </Box>

            {/* Slider */}
            <Box sx={{ position: "relative" }}>
                {/* Left Arrow */}
                {canScrollLeft && (
                    <IconButton
                        onClick={() => scroll("left")}
                        sx={{
                            position: "absolute",
                            left: { xs: -8, md: -20 },
                            top: "38%",
                            zIndex: 10,
                            width: 44,
                            height: 44,
                            bgcolor: "#F97316",
                            color: "#fff",
                            boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
                            "&:hover": { bgcolor: "#ea580c" },
                        }}
                    >
                        <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                )}

                {/* Right Arrow */}
                {canScrollRight && (
                    <IconButton
                        onClick={() => scroll("right")}
                        sx={{
                            position: "absolute",
                            right: { xs: -8, md: -20 },
                            top: "38%",
                            zIndex: 10,
                            width: 44,
                            height: 44,
                            bgcolor: "#F97316",
                            color: "#fff",
                            boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
                            "&:hover": { bgcolor: "#ea580c" },
                        }}
                    >
                        <ArrowForwardIosRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                )}

                {/* Cards Container */}
                <Box
                    ref={scrollRef}
                    onScroll={checkScroll}
                    sx={{
                        display: "flex",
                        gap: 3,
                        overflowX: "auto",
                        scrollSnapType: "x mandatory",
                        pb: 2,
                        "&::-webkit-scrollbar": { display: "none" },
                        msOverflowStyle: "none",
                        scrollbarWidth: "none",
                    }}
                >
                    {data.map((person) => (
                        <Box
                            key={person.id}
                            sx={{
                                flex: "0 0 auto",
                                width: { xs: 240, sm: 260, md: 280 },
                                scrollSnapAlign: "start",
                            }}
                        >
                            {/* Photo */}
                            <Box
                                sx={{
                                    borderRadius: 3,
                                    overflow: "hidden",
                                    height: 300,
                                    mb: 2,
                                    bgcolor: "#F1F5F9",
                                    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                                }}
                            >
                                <Box
                                    component="img"
                                    src={person.image}
                                    alt={person.name}
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        objectPosition: "top",
                                        transition: "transform 0.4s ease",
                                        "&:hover": { transform: "scale(1.04)" },
                                    }}
                                />
                            </Box>

                            {/* Name & Role */}
                            <Typography
                                sx={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: "#0F172A",
                                    mb: 0.3,
                                }}
                            >
                                {person.name}
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: 13.5,
                                    color: "text.secondary",
                                    mb: 1.5,
                                }}
                            >
                                {person.role}
                            </Typography>

                            {/* Social Icons */}
                            <Stack direction="row" spacing={1}>
                                {Object.entries(person.socials || {}).map(([key, url]) => (
                                    <IconButton
                                        key={key}
                                        component="a"
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="small"
                                        sx={{
                                            width: 30,
                                            height: 30,
                                            border: "1px solid #E2E8F0",
                                            color: "#64748B",
                                            "&:hover": {
                                                bgcolor: "#F97316",
                                                borderColor: "#F97316",
                                                color: "#fff",
                                            },
                                        }}
                                    >
                                        {socialIconMap[key]}
                                    </IconButton>
                                ))}
                            </Stack>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Section>
    );
}

Staff.propTypes = {
    data: PropTypes.array,
    sx: PropTypes.object,
};