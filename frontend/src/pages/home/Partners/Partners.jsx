import { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Alert, useMediaQuery } from "@mui/material";

import Section from "../../../components/ui/Section";
import SectionHeader from "../../../components/ui/SectionHeader";
import { getPartners } from "../../../services/publicPartnerService";

export default function Partners({
    eyebrow = "OUR PARTNERS",
    title = "Trusted by Leading Institutions Worldwide",
    description = "We collaborate with universities, organizations, and strategic partners to create opportunities that transform lives through education, innovation, and global engagement.",
    sx = {},
}) {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

    useEffect(() => {
        let isMounted = true;
        getPartners()
            .then((data) => { if (isMounted) setPartners(Array.isArray(data) ? data : []); })
            .catch(() => { if (isMounted) setError("Unable to load partners at the moment."); })
            .finally(() => { if (isMounted) setLoading(false); });
        return () => { isMounted = false; };
    }, []);

    return (
        <Section sx={sx}>
            <SectionHeader
                eyebrow={eyebrow}
                title={title}
                description={description}
                align="center"
                maxWidth="md"
            />

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress size={28} />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ maxWidth: 480, mx: "auto" }}>{error}</Alert>
            ) : partners.length === 0 ? (
                <Typography sx={{ textAlign: "center", color: "text.secondary", py: 4 }}>
                    No partners published yet.
                </Typography>
            ) : prefersReducedMotion ? (
                <StaticGrid partners={partners} />
            ) : (
                <Marquee partners={partners} />
            )}
        </Section>
    );
}

// ─────────────────────────────────────────────────────────────
// STATIC GRID — fallback for prefers-reduced-motion
// ─────────────────────────────────────────────────────────────
function StaticGrid({ partners }) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" },
                gap: 4,
                alignItems: "center",
                justifyItems: "center",
                mt: 5,
            }}
        >
            {partners.map((p) => (
                <PartnerLogo key={p.id} partner={p} />
            ))}
        </Box>
    );
}

// ─────────────────────────────────────────────────────────────
// MARQUEE — continuous scroll, pauses on hover
// ─────────────────────────────────────────────────────────────
function Marquee({ partners }) {
    // Duplicate the list so the loop is seamless — the track scrolls
    // exactly -50% (one full copy's width) then resets invisibly.
    const track = [...partners, ...partners];

    return (
        <Box
            sx={{
                mt: 5,
                position: "relative",
                overflow: "hidden",
                width: "100%",
                maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    width: "max-content",
                    willChange: "transform",
                    animation: "gieva-partner-marquee 32s linear infinite",
                    "&:hover": { animationPlayState: "paused" },
                    "@keyframes gieva-partner-marquee": {
                        "0%": { transform: "translate3d(0, 0, 0)" },
                        "100%": { transform: "translate3d(-50%, 0, 0)" },
                    },
                }}
            >
                {track.map((p, i) => (
                    <PartnerLogo key={`${p.id}-${i}`} partner={p} />
                ))}
            </Box>
        </Box>
    );
}

// ─────────────────────────────────────────────────────────────
// SINGLE LOGO — grayscale by default, color pops in on hover
// ─────────────────────────────────────────────────────────────
function PartnerLogo({ partner }) {
    const content = (
        <Box
            component="img"
            src={partner.logoUrl}
            alt={partner.name}
            sx={{
                height: { xs: 32, md: 40 },
                maxWidth: 140,
                objectFit: "contain",
                opacity: 0.9,
                transition: "opacity 0.3s ease, transform 0.3s ease",
                flexShrink: 0,
                "&:hover": {
                    opacity: 1,
                    transform: "scale(1.06)",
                },
            }}
        />
    );

    if (!partner.href || partner.href === "#") return content;

    return (
        <Box
            component="a"
            href={partner.href}
            target={partner.external ? "_blank" : undefined}
            rel={partner.external ? "noopener noreferrer" : undefined}
            sx={{ display: "inline-flex", flexShrink: 0 }}
        >
            {content}
        </Box>
    );
}
Partners.propTypes = {};

// import PropTypes from "prop-types";

// import Section from "../../../components/ui/Section";
// import SectionHeader from "../../../components/ui/SectionHeader";
// import { LogoCloud } from "../../../components/marketing";

// import partnerData from "./PartnerData";

// export default function Partners({
//     eyebrow = "OUR PARTNERS",
//     title = "Trusted by Leading Institutions Worldwide",
//     description = "We collaborate with universities, organizations, and strategic partners to create opportunities that transform lives through education, innovation, and global engagement.",

//     logos = partnerData,

//     variant = "default",        // ← Changed from "grayscale" to "default"
//     columns = {
//         xs: 2,
//         sm: 3,
//         md: 6,
//     },

//     sx = {},
// }) {
//     return (
//         <Section sx={sx}>
//             <SectionHeader
//                 eyebrow={eyebrow}
//                 title={title}
//                 description={description}
//                 align="center"
//                 maxWidth="md"
//             />

//             <LogoCloud
//                 logos={logos}
//                 columns={columns}
//                 variant={variant}
//             />
//         </Section>
//     );
// }