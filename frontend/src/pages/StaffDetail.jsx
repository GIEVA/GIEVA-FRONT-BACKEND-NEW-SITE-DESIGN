// pages/StaffDetail.jsx
import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box, Container, Typography, CircularProgress, Alert,
  Breadcrumbs, Link as MuiLink, Stack, IconButton,
} from "@mui/material";
import {
  Home, ChevronRight, Facebook, LinkedIn, Instagram, YouTube,
} from "@mui/icons-material";
import XIcon from "@mui/icons-material/X";
import { motion, useScroll, useTransform } from "framer-motion";
import { getStaffMember } from "../services/publicStaffService";

const NAVY   = "#0F172A";
const GREEN  = "#16A34A";
const ORANGE = "#F97316";
const BG     = "#F8FAFC";
const MUTED  = "#64748B";
const BORDER = "#E2E8F0";

const socialIconMap = {
  facebook: <Facebook sx={{ fontSize: 18 }} />,
  linkedin: <LinkedIn sx={{ fontSize: 18 }} />,
  x: <XIcon sx={{ fontSize: 18 }} />,
  instagram: <Instagram sx={{ fontSize: 18 }} />,
  youtube: <YouTube sx={{ fontSize: 18 }} />,
};

export default function StaffDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getStaffMember(id)
      .then((data) => { if (isMounted) setPerson(data); })
      .catch(() => { if (isMounted) setError("This team member could not be found."); })
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 14 }}><CircularProgress sx={{ color: ORANGE }} /></Box>;
  }

  if (error || !person) {
    return <Container maxWidth="sm" sx={{ py: 14 }}><Alert severity="error">{error}</Alert></Container>;
  }

  const socials = Object.entries(person.socials || {}).filter(([, url]) => url);

  return (
    <Box sx={{ bgcolor: BG, minHeight: "100vh" }}>
      <Container maxWidth="md" sx={{ pt: { xs: 4, md: 6 }, pb: 2 }}>
        <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 16, color: MUTED }} />}>
          <MuiLink component={Link} to="/" sx={{
            color: MUTED, fontSize: 14, textDecoration: "none",
            display: "flex", alignItems: "center", gap: 0.5, "&:hover": { color: ORANGE },
          }}>
            <Home sx={{ fontSize: 15 }} /> Home
          </MuiLink>
          <MuiLink component={Link} to="/our-team" sx={{
            color: MUTED, fontSize: 14, textDecoration: "none", "&:hover": { color: ORANGE },
          }}>
            Our Team
          </MuiLink>
          <Typography sx={{ color: NAVY, fontSize: 14, fontWeight: 600 }}>{person.name}</Typography>
        </Breadcrumbs>
      </Container>

      <Container maxWidth="md" sx={{ pb: 12 }}>
        <Box
          ref={heroRef}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "260px 1fr" },
            gap: { xs: 4, sm: 5 },
            alignItems: "flex-start",
            mt: { xs: 3, md: 5 },
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ overflow: "hidden", borderRadius: 20 }}
          >
            <Box sx={{ height: { xs: 300, sm: 320 }, overflow: "hidden", borderRadius: 5, bgcolor: "#EEF2F6" }}>
              {person.imageUrl ? (
                <motion.img
                  src={person.imageUrl}
                  alt={person.name}
                  style={{ width: "100%", height: "120%", objectFit: "cover", y: imageY }}
                />
              ) : (
                <Box sx={{
                  width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 64, fontWeight: 800, color: NAVY, opacity: 0.15,
                }}>
                  {person.name?.[0] || "?"}
                </Box>
              )}
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Typography sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 800, color: NAVY, mb: 1, lineHeight: 1.2 }}>
              {person.name}
            </Typography>

            <Box sx={{
              display: "inline-block", fontSize: 13, fontWeight: 700, px: 1.5, py: 0.5,
              borderRadius: 999, bgcolor: "#ECFDF5", color: GREEN, mb: 3,
            }}>
              {person.role}
            </Box>

            {person.bio ? (
              <Typography sx={{ fontSize: 15.5, color: MUTED, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
                {person.bio}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: 15, color: MUTED, fontStyle: "italic" }}>
                No bio available yet.
              </Typography>
            )}

            {socials.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ mt: 3.5 }}>
                {socials.map(([key, url]) => (
                  <IconButton
                    key={key}
                    component="a"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: 40, height: 40,
                      border: `1px solid ${BORDER}`,
                      color: MUTED,
                      transition: "all 0.2s ease",
                      "&:hover": { bgcolor: ORANGE, borderColor: ORANGE, color: "#fff" },
                    }}
                  >
                    {socialIconMap[key]}
                  </IconButton>
                ))}
              </Stack>
            )}
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}