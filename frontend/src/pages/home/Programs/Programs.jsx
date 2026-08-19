import { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Alert, Chip } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";

import Section from "../../../components/ui/Section";
import SectionHeader from "../../../components/ui/SectionHeader";
import { ActionGroup } from "../../../components/marketing";
import { getPrograms } from "../../../services/publicProgramService";

const NAVY  = "#0B1F3A";
const GREEN = "#16A34A";

export default function Programs({ sx = {} }) {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        getPrograms()
            .then((data) => {
                if (!isMounted) return;
                const list = Array.isArray(data) ? data : [];
                setPrograms(list.slice(0, 6));
            })
            .catch(() => {
                if (isMounted) setError("Unable to load programs at the moment.");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    return (
        <Section sx={sx}>
            <SectionHeader
                eyebrow="Featured Programs"
                title="Discover Programs Designed for Your Success"
                description="Explore some of our most impactful educational and professional development programs that empower students and professionals to achieve their global ambitions."
                align="center"
                maxWidth="md"
            />

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress sx={{ color: GREEN }} />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ maxWidth: 480, mx: "auto" }}>
                    {error}
                </Alert>
            ) : programs.length === 0 ? (
                <Typography sx={{ textAlign: "center", color: "text.secondary", py: 6 }}>
                    No programs published yet — check back soon.
                </Typography>
            ) : (
                <>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
                            gap: 3,
                            mt: 5,
                        }}
                    >
                        {programs.map((p) => (
                            <ProgramCard key={p.id} program={p} />
                        ))}
                    </Box>

                    <ActionGroup
                        actions={[
                            {
                                id: 1,
                                label: "View All Programs",
                                href: "/our-programs",
                                variant: "contained",
                            },
                        ]}
                    />
                </>
            )}
        </Section>
    );
}

function ProgramCard({ program }) {
    const [hover, setHover] = useState(false);

    return (
        <Box
            component={RouterLink}
            to={`/our-programs/${program.slug}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            sx={{
                textDecoration: "none",
                color: "inherit",
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid #E2E8F0",
                bgcolor: "#fff",
                transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
                transform: hover ? "translateY(-6px)" : "translateY(0)",
                boxShadow: hover
                    ? "0 16px 32px rgba(11,31,58,0.12)"
                    : "0 1px 2px rgba(15,23,42,0.03)",
                borderColor: hover ? GREEN : "#E2E8F0",
            }}
        >
            {/* Image */}
            <Box sx={{ position: "relative", height: 180, overflow: "hidden", bgcolor: "#EEF2F6" }}>
                {program.heroImageUrl ? (
                    <Box
                        component="img"
                        src={program.heroImageUrl}
                        alt={program.title}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transform: hover ? "scale(1.08)" : "scale(1)",
                            transition: "transform 0.5s ease",
                        }}
                    />
                ) : (
                    <Box sx={{
                        width: "100%", height: "100%", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: NAVY, fontWeight: 800, fontSize: 32, opacity: 0.15,
                    }}>
                        {program.title?.[0] || "P"}
                    </Box>
                )}

                {program.category && (
                    <Chip
                        label={program.category}
                        size="small"
                        sx={{
                            position: "absolute", top: 12, left: 12,
                            bgcolor: "rgba(255,255,255,0.92)", color: NAVY,
                            fontWeight: 700, fontSize: 11, height: 22,
                        }}
                    />
                )}
            </Box>

            {/* Text */}
            <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 17, color: NAVY }}>
                        {program.title}
                    </Typography>
                    <Box
                        sx={{
                            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: `1px solid ${hover ? GREEN : "#E2E8F0"}`,
                            color: hover ? GREEN : "#94A3B8",
                            transform: hover ? "translate(2px, -2px)" : "translate(0,0)",
                            transition: "all 0.25s ease",
                        }}
                    >
                        <ArrowOutwardRoundedIcon sx={{ fontSize: 15 }} />
                    </Box>
                </Box>

                {program.tagline && (
                    <Typography
                        sx={{
                            fontSize: 13, color: "text.secondary", mt: 1,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {program.tagline}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}