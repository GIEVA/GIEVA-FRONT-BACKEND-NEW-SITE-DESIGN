import PropTypes from "prop-types";
import {
  Box,
  Container,
  Typography,
  Stack,
  Paper,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import { Link } from "react-router-dom";
import { Home, ChevronRight } from "@mui/icons-material";

import historyData from "./HistoryData";

const GREEN = "#16A34A";
const ORANGE = "#F97316";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BG = "#F8FAFC";
const CARD = "#FFFFFF";
const BORDER = "#E2E8F0";

export default function History({ data = historyData }) {
  const { hero, intro, sidebar, timeline } = data;

  return (
    <Box sx={{ bgcolor: BG, minHeight: "100vh", color: TEXT }}>
      {/* ── HERO ─────────────────────────────────────── */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 45%, #FED7AA 100%)",
          py: { xs: 8, md: 11 },
          borderRadius: { xs: 0, md: "0 0 28px 28px" },
          mb: { xs: 6, md: 10 },
        }}
      >
        <Container maxWidth="lg">
          <Typography
            sx={{
              fontSize: { xs: 36, md: 52 },
              fontWeight: 800,
              color: TEXT,
              mb: 1.5,
              lineHeight: 1.1,
            }}
          >
            {hero.title}
          </Typography>

          <Breadcrumbs
            separator={<ChevronRight sx={{ fontSize: 16, color: MUTED }} />}
          >
            <MuiLink
              component={Link}
              to="/"
              sx={{
                color: MUTED,
                fontSize: 14,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                "&:hover": { color: ORANGE },
              }}
            >
              <Home sx={{ fontSize: 15 }} /> Home
            </MuiLink>
            <MuiLink
              component={Link}
              to="/about"
              sx={{
                color: MUTED,
                fontSize: 14,
                textDecoration: "none",
                "&:hover": { color: ORANGE },
              }}
            >
              About
            </MuiLink>
            <Typography sx={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>
              {hero.breadcrumb}
            </Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 12 }}>
        {/* ── BRIEF HISTORY ──────────────────────────── */}
        <Box sx={{ maxWidth: 820, mb: { xs: 8, md: 12 } }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: GREEN,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              mb: 2,
            }}
          >
            {intro.eyebrow}
          </Typography>

          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 28, md: 40 },
              fontWeight: 800,
              lineHeight: 1.15,
              mb: 3.5,
            }}
          >
            {intro.title}
          </Typography>

          <Stack spacing={2.5}>
            {intro.paragraphs.map((p, i) => (
              <Typography
                key={i}
                sx={{ fontSize: 15.5, color: MUTED, lineHeight: 1.85 }}
              >
                {p}
              </Typography>
            ))}
          </Stack>
        </Box>

        {/* ── TIMELINE + SIDEBAR ─────────────────────── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "0.85fr 1.15fr" },
            gap: { xs: 5, lg: 8 },
            alignItems: "start",
          }}
        >
          {/* Sticky left column */}
          <Box
            sx={{
              position: { lg: "sticky" },
              top: { lg: 100 },
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: GREEN,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                mb: 2,
              }}
            >
              {sidebar.eyebrow}
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: 26, md: 34 },
                fontWeight: 800,
                lineHeight: 1.2,
                mb: 2,
              }}
            >
              {sidebar.title}
            </Typography>

            <Typography
              sx={{ fontSize: 15, color: MUTED, lineHeight: 1.75, mb: 3.5 }}
            >
              {sidebar.description}
            </Typography>

            <Box
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                border: `1px solid ${BORDER}`,
                boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 24px 48px rgba(15,23,42,0.12)",
                },
              }}
            >
              <Box
                component="img"
                src={sidebar.image.src}
                alt={sidebar.image.alt}
                sx={{
                  width: "100%",
                  height: { xs: 220, md: 260 },
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </Box>
          </Box>

          {/* Timeline */}
          <Stack spacing={0}>
            {timeline.map((item, index) => (
              <Box
                key={item.year}
                sx={{
                  display: "flex",
                  gap: 3,
                  position: "relative",
                  pb: index === timeline.length - 1 ? 0 : 3,
                }}
              >
                {/* Dot + line */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: 28,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: GREEN,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      boxShadow: "0 0 0 4px #ECFDF5",
                      "&:hover": {
                        transform: "scale(1.1)",
                        boxShadow: "0 0 0 6px #DCFCE7",
                      },
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Box>

                  {index < timeline.length - 1 && (
                    <Box
                      sx={{
                        width: 2,
                        flexGrow: 1,
                        bgcolor: BORDER,
                        mt: 0.5,
                        minHeight: 24,
                      }}
                    />
                  )}
                </Box>

                {/* Card */}
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: { xs: 2.5, md: 3.5 },
                    borderRadius: 3,
                    border: `1px solid ${BORDER}`,
                    bgcolor: CARD,
                    transition: "all 0.25s ease",
                    cursor: "default",
                    "&:hover": {
                      borderColor: ORANGE,
                      transform: "translateY(-3px)",
                      boxShadow: "0 14px 32px rgba(15,23,42,0.08)",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: ORANGE,
                      mb: 0.75,
                      letterSpacing: 0.5,
                    }}
                  >
                    {item.year}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: TEXT,
                      mb: 1.25,
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 14.5,
                      color: MUTED,
                      lineHeight: 1.75,
                    }}
                  >
                    {item.text}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

History.propTypes = {
  data: PropTypes.object,
};