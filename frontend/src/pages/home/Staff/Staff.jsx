import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
    Box,
    Typography,
    IconButton,
    Stack,
    CircularProgress,
    Alert,
    Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import XIcon from "@mui/icons-material/X";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";

import Section from "../../../components/ui/Section";
import { getStaffList } from "../../../services/publicStaffService";

const socialIconMap = {
    facebook: <FacebookIcon sx={{ fontSize: 14 }} />,
    linkedin: <LinkedInIcon sx={{ fontSize: 14 }} />,
    x: <XIcon sx={{ fontSize: 14 }} />,
    instagram: <InstagramIcon sx={{ fontSize: 14 }} />,
    youtube: <YouTubeIcon sx={{ fontSize: 14 }} />,
};

const AUTO_SLIDE_INTERVAL = 3500; // ms between auto-advances
const SCROLL_AMOUNT = 320;

export default function Staff({ sx = {} }) {
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const autoSlideRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        getStaffList()
            .then((list) => {
                if (!isMounted) return;
                setData(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                if (isMounted) setError("Unable to load staff at the moment.");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    const scroll = (direction) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT, behavior: "smooth" });
        setTimeout(checkScroll, 350);
    };

    // ── Auto-slide ──────────────────────────────────────────
    useEffect(() => {
        if (loading || error || data.length === 0 || isPaused) return;

        autoSlideRef.current = setInterval(() => {
            const el = scrollRef.current;
            if (!el) return;

            const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 10;
            if (atEnd) {
                // loop back to start
                el.scrollTo({ left: 0, behavior: "smooth" });
            } else {
                el.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" });
            }
            setTimeout(checkScroll, 350);
        }, AUTO_SLIDE_INTERVAL);

        return () => clearInterval(autoSlideRef.current);
    }, [loading, error, data, isPaused]);

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

                <Box sx={{ pt: { md: 5 }, display: "flex", flexDirection: "column", gap: 2.5, alignItems: "flex-start" }}>
                    <Typography
                        sx={{
                            fontSize: 16,
                            lineHeight: 1.75,
                            color: "text.secondary",
                            maxWidth: 420,
                        }}
                    >
                        At GIEVA, we are led by visionary individuals who are passionate about
                        youth development and educational empowerment.
                    </Typography>

                    <Button
                        onClick={() => navigate("/our-team")}
                        endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: 14.5,
                            color: "#F97316",
                            px: 0,
                            "&:hover": { bgcolor: "transparent", color: "#ea580c" },
                        }}
                    >
                        See All Staff
                    </Button>
                </Box>
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ maxWidth: 480, mx: "auto" }}>
                    {error}
                </Alert>
            ) : (
                <Box
                    sx={{ position: "relative" }}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
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
                                onClick={() => navigate(`/team/${person.id}`)}
                                sx={{
                                    flex: "0 0 auto",
                                    width: { xs: 240, sm: 260, md: 280 },
                                    scrollSnapAlign: "start",
                                    cursor: "pointer",
                                }}
                            >
                                <Box
                                    sx={{
                                        borderRadius: 3,
                                        overflow: "hidden",
                                        height: 300,
                                        mb: 2,
                                        bgcolor: "#F1F5F9",
                                        boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                                        transition: "box-shadow 0.3s ease",
                                        "&:hover": {
                                            boxShadow: "0 12px 32px rgba(15,23,42,0.14)",
                                        },
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={person.imageUrl}
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

                                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A", mb: 0.3 }}>
                                    {person.name}
                                </Typography>
                                <Typography sx={{ fontSize: 13.5, color: "text.secondary", mb: 1.5 }}>
                                    {person.role}
                                </Typography>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    onClick={(e) => e.stopPropagation()} // keep social icons independently clickable
                                >
                                    {Object.entries(person.socials || {}).map(([key, url]) => (
                                        url ? (
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
                                        ) : null
                                    ))}
                                </Stack>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </Section>
    );
}

Staff.propTypes = {
    sx: PropTypes.object,
};