import { useEffect, useMemo, useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import { getPublicCampaigns } from "../../services/publicCampaignService";
import CampaignModal from "../../components/marketing/CampaignModal/CampaignModal";

const NAVY   = "#0B1F3A";
const GREEN  = "#1E7F4F";
const ORANGE = "#F97316";

const ROTATE_MS = 4800;
const DISMISS_KEY = "gieva-campaign-banner-dismissed";

const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    const days = Math.ceil(diff / 86400000);
    return days;
};

export default function CampaignBanner() {
    const prefersReducedMotion = useReducedMotion();

    const [campaigns, setCampaigns] = useState([]);
    const [index, setIndex] = useState(0);
    const [dismissed, setDismissed] = useState(
        () => sessionStorage.getItem(DISMISS_KEY) === "true"
    );
    const [selectedId, setSelectedId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        getPublicCampaigns()
            .then((data) => {
                if (!isMounted) return;
                const list = Array.isArray(data) ? data : [];
                // Prioritize featured campaigns; fall back to all active ones.
                const featured = list.filter((c) => c.featured);
                const pool = featured.length > 0 ? featured : list;
                // Soonest deadline first — most urgent gets shown sooner.
                const sorted = [...pool].sort((a, b) => {
                    const da = a.endDate ? new Date(a.endDate) : Infinity;
                    const db = b.endDate ? new Date(b.endDate) : Infinity;
                    return da - db;
                });
                setCampaigns(sorted.slice(0, 5));
            })
            .catch(() => setCampaigns([]));
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (campaigns.length <= 1 || prefersReducedMotion) return;
        const timer = setInterval(() => {
            setIndex((i) => (i + 1) % campaigns.length);
        }, ROTATE_MS);
        return () => clearInterval(timer);
    }, [campaigns.length, prefersReducedMotion]);

    const current = campaigns[index];

    const handleDismiss = () => {
        sessionStorage.setItem(DISMISS_KEY, "true");
        setDismissed(true);
    };

    const handleOpen = () => {
        if (!current) return;
        setSelectedId(current.id);
        setModalOpen(true);
    };

    if (dismissed || campaigns.length === 0 || !current) return null;

    const days = daysUntil(current.endDate);
    const urgencyText =
        days === null ? null : days <= 0 ? "Closing today" : `${days} day${days === 1 ? "" : "s"} left`;

    return (
        <>
            <Box
                sx={{
                    bgcolor: NAVY,
                    color: "#fff",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <Box
                    onClick={handleOpen}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: { xs: 1.5, sm: 2.5 },
                        px: { xs: 2, sm: 4 },
                        py: { xs: 1.1, sm: 1.3 },
                        maxWidth: 1400,
                        mx: "auto",
                        cursor: "pointer",
                    }}
                >
                    {/* Steady brand mark — always in the same spot */}
                    <Box
                        sx={{
                            width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                            background: `linear-gradient(135deg, ${ORANGE}, ${GREEN})`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <Typography sx={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>G</Typography>
                    </Box>

                    {/* Rotating message — one thing moves at a time */}
                    <Box sx={{ flex: 1, minWidth: 0, position: "relative", height: 20 }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current.id}
                                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    position: "absolute", inset: 0,
                                    display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", overflow: "hidden",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: { xs: 12.5, sm: 13.5 },
                                        fontWeight: 700,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {current.title}
                                </Typography>
                                {urgencyText && (
                                    <Box
                                        sx={{
                                            display: { xs: "none", sm: "inline-flex" },
                                            fontSize: 11, fontWeight: 700, px: 1, py: 0.2, borderRadius: 999,
                                            bgcolor: "rgba(255,255,255,0.12)", color: ORANGE, flexShrink: 0,
                                        }}
                                    >
                                        {urgencyText}
                                    </Box>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </Box>

                    {/* CTA — lights up last */}
                    <motion.div
                        key={`cta-${current.id}`}
                        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
                    >
                        <Box
                            sx={{
                                display: "flex", alignItems: "center", gap: 0.5,
                                fontSize: { xs: 12, sm: 13 }, fontWeight: 800,
                                color: ORANGE, flexShrink: 0, whiteSpace: "nowrap",
                                "&:hover": { color: "#FDBA74" },
                                transition: "color 0.2s ease",
                            }}
                        >
                            {current.requiresRegistration ? "Register" : "Learn More"}
                            <ArrowForwardRoundedIcon sx={{ fontSize: 15 }} />
                        </Box>
                    </motion.div>

                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                        sx={{ color: "rgba(255,255,255,0.6)", p: 0.5, flexShrink: 0, "&:hover": { color: "#fff" } }}
                    >
                        <CloseRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Box>

                {/* Ambient pulse dot — the only continuously-running motion, kept tiny and low-key */}
                {!prefersReducedMotion && (
                    <motion.div
                        style={{
                            position: "absolute", left: -20, top: "50%", width: 8, height: 8,
                            borderRadius: "50%", background: GREEN, pointerEvents: "none",
                        }}
                        animate={{ opacity: [0.4, 0.9, 0.4] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                )}
            </Box>

            <CampaignModal
                open={modalOpen}
                campaignId={selectedId}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}