// pages/OurTeam.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Typography, CircularProgress, Alert, Breadcrumbs, Link as MuiLink } from "@mui/material";
import { Home, ChevronRight } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getStaffList } from "../services/publicStaffService";

const NAVY   = "#0F172A";
const GREEN  = "#16A34A";
const ORANGE = "#F97316";
const BG     = "#F8FAFC";
const CARD   = "#FFFFFF";
const BORDER = "#E2E8F0";
const MUTED  = "#64748B";

// A small, stable accent set so role tags read as "alive" without needing
// a category field on the model — same person always gets the same color.
const ACCENTS = [
  { bg: "#ECFDF5", color: GREEN },
  { bg: "#FFF7ED", color: ORANGE },
  { bg: "#EEF2FF", color: "#4338CA" },
  { bg: "#FDF2F8", color: "#BE185D" },
];

const accentFor = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
};

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function TeamCard({ person }) {
  const navigate = useNavigate();
  const accent = accentFor(person.role);

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -8 }} style={{ height: "100%" }}>
      <Box
        onClick={() => navigate(`/team/${person.id}`)}
        sx={{
          bgcolor: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 3,
          overflow: "hidden",
          cursor: "pointer",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "border-color 0.25s, box-shadow 0.25s",
          "&:hover": {
            borderColor: accent.color,
            boxShadow: "0 16px 32px rgba(15,23,42,0.1)",
          },
          "&:hover .team-photo": { transform: "scale(1.08)" },
        }}
      >
        <Box sx={{ height: 240, overflow: "hidden", bgcolor: "#EEF2F6" }}>
          {person.imageUrl ? (
            <Box
              className="team-photo"
              component="img"
              src={person.imageUrl}
              alt={person.name}
              sx={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
            />
          ) : (
            <Box sx={{
              width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 48, fontWeight: 800, color: NAVY, opacity: 0.15,
            }}>
              {person.name?.[0] || "?"}
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: 16.5, fontWeight: 800, color: NAVY, mb: 0.6 }}>
            {person.name}
          </Typography>
          <Box sx={{
            display: "inline-block", fontSize: 11.5, fontWeight: 700, px: 1.2, py: 0.4,
            borderRadius: 999, bgcolor: accent.bg, color: accent.color,
          }}>
            {person.role}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

export default function OurTeam() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    getStaffList()
      .then((data) => { if (isMounted) setStaff(Array.isArray(data) ? data : []); })
      .catch(() => { if (isMounted) setError("Unable to load our team right now. Please try again shortly."); })
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
              Meet the People Behind GIEVA
            </Typography>
            <Typography sx={{ fontSize: 16, color: MUTED, maxWidth: 620, lineHeight: 1.75, mb: 3 }}>
              Every program, every club, every student we've reached traces back to someone
              on this team who decided to show up for it.
            </Typography>
          </motion.div>

          <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 16, color: MUTED }} />}>
            <MuiLink component={Link} to="/" sx={{
              color: MUTED, fontSize: 14, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 0.5, "&:hover": { color: ORANGE },
            }}>
              <Home sx={{ fontSize: 15 }} /> Home
            </MuiLink>
            <Typography sx={{ color: NAVY, fontSize: 14, fontWeight: 600 }}>Our Team</Typography>
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
        ) : staff.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Typography sx={{ color: MUTED }}>No team members published yet. Check back soon.</Typography>
          </Box>
        ) : (
          <motion.div
            variants={gridVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
          >
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", lg: "1fr 1fr 1fr 1fr" },
              gap: 3,
            }}>
              {staff.map((person) => (
                <TeamCard key={person.id} person={person} />
              ))}
            </Box>
          </motion.div>
        )}
      </Container>
    </Box>
  );
}