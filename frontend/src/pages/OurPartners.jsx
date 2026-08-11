import { useEffect, useState } from "react";
import { Box, Container, Typography, CircularProgress, Alert, Breadcrumbs, Link as MuiLink } from "@mui/material";
import { Link } from "react-router-dom";
import { Home, ChevronRight, NorthEastRounded } from "@mui/icons-material";
import { motion } from "framer-motion";
import { getPartners } from "../services/publicPartnerService";

const NAVY   = "#0F172A";
const GREEN  = "#16A34A";
const ORANGE = "#F97316";
const BG     = "#F8FAFC";
const CARD   = "#FFFFFF";
const BORDER = "#E2E8F0";
const MUTED  = "#64748B";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function PartnerCard({ partner }) {
  const content = (
    <Box
      sx={{
        bgcolor: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 3,
        height: 180,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        px: 3,
        cursor: partner.href && partner.href !== "#" ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease",
        "&:hover": {
          borderColor: ORANGE,
          boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
          transform: "translateY(-4px)",
        },
        "&:hover .partner-logo": { transform: "scale(1.06)" },
        "&:hover .partner-arrow": { opacity: 1, transform: "translate(0,0)" },
      }}
    >
      <Box
        className="partner-logo"
        component="img"
        src={partner.logoUrl}
        alt={partner.name}
        sx={{
          maxWidth: "80%",
          maxHeight: 60,
          objectFit: "contain",
          transition: "transform 0.4s ease",
        }}
      />
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: MUTED, textAlign: "center" }}>
        {partner.name}
      </Typography>

      {partner.href && partner.href !== "#" && (
        <Box
          className="partner-arrow"
          sx={{
            position: "absolute", top: 12, right: 12,
            width: 26, height: 26, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: `${ORANGE}12`, color: ORANGE,
            opacity: 0, transform: "translate(-4px, 4px)",
            transition: "all 0.25s ease",
          }}
        >
          <NorthEastRounded sx={{ fontSize: 14 }} />
        </Box>
      )}
    </Box>
  );

  if (!partner.href || partner.href === "#") return content;

  return (
    <Box
      component="a"
      href={partner.href}
      target={partner.external ? "_blank" : undefined}
      rel={partner.external ? "noopener noreferrer" : undefined}
      sx={{ textDecoration: "none", display: "block" }}
    >
      {content}
    </Box>
  );
}

export default function OurPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    getPartners()
      .then((data) => { if (isMounted) setPartners(Array.isArray(data) ? data : []); })
      .catch(() => { if (isMounted) setError("Unable to load our partners right now. Please try again shortly."); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  return (
    <Box sx={{ bgcolor: BG, minHeight: "100vh" }}>
      {/* HERO */}
      <Box sx={{
        background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)",
        py: { xs: 7, md: 10 }, px: { xs: 3, md: 8 },
        mb: { xs: 6, md: 9 }, borderRadius: { xs: 0, md: "0 0 24px 24px" },
      }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Typography sx={{ fontSize: { xs: 32, md: 48 }, fontWeight: 800, color: NAVY, mb: 2, lineHeight: 1.15 }}>
              Organizations That Stand With Us
            </Typography>
            <Typography sx={{ fontSize: 16, color: MUTED, maxWidth: 620, lineHeight: 1.75, mb: 3 }}>
              From universities to testing bodies to technology partners — these are the
              institutions we work alongside to open doors for students and professionals.
            </Typography>
            {!loading && !error && partners.length > 0 && (
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: GREEN, letterSpacing: 0.5 }}>
                {partners.length} PARTNER{partners.length === 1 ? "" : "S"} AND COUNTING
              </Typography>
            )}
          </motion.div>

          <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 16, color: MUTED }} />} sx={{ mt: 3 }}>
            <MuiLink component={Link} to="/" sx={{
              color: MUTED, fontSize: 14, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 0.5, "&:hover": { color: ORANGE },
            }}>
              <Home sx={{ fontSize: 15 }} /> Home
            </MuiLink>
            <Typography sx={{ color: NAVY, fontSize: 14, fontWeight: 600 }}>Our Partners</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 12 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress sx={{ color: ORANGE }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ maxWidth: 480, mx: "auto" }}>{error}</Alert>
        ) : partners.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Typography sx={{ color: MUTED }}>No partners published yet. Check back soon.</Typography>
          </Box>
        ) : (
          <motion.div variants={gridVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
              gap: 3,
            }}>
              {partners.map((p) => (
                <motion.div key={p.id} variants={cardVariants}>
                  <PartnerCard partner={p} />
                </motion.div>
              ))}
            </Box>
          </motion.div>
        )}
      </Container>
    </Box>
  );
}