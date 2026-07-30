// pages/About.jsx

import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Stack,
  Paper,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  Home,
  ChevronRight,
  ArrowForward,
  NorthEast,
} from "@mui/icons-material";

// ── Palette (same as rest of marketing site) ──────────────
const GREEN = "#16A34A";
const ORANGE = "#F97316";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BG = "#F8FAFC";
const CARD = "#FFFFFF";
const BORDER = "#E2E8F0";

const COMMITMENTS = [
  "Preparing and developing youth to appreciate honesty, creativity, innovation, hard work and shared common humanity through training, mentoring, volunteering and partnering programs.",
  "Establishing linkages for young leaders through technology to share experiences, resources and skills.",
  "Helping youth understand the educational, cultural and economic dynamics of the global world so they become engines of positive change.",
  "Building partnerships with international institutions, educational agencies and publishers for preparatory materials, admission support and motivational resources.",
  "Believing that a sustainable future with integrated development depends largely on total education of the youth.",
  "Harnessing a new generation of global youth—regardless of economic background, nationality, race, religion or gender—through equal access to information, training and career advising.",
];

const VALUES = [
  {
    title: "Vision",
    text: "Building an intergenerational system of ideas that provide global platforms for young leaders in an atmosphere of tolerance and peace—evolving into self-dependent citizens who use technology in the service of humanity through entrepreneurial ideas and processes.",
  },
  {
    title: "Mission",
    text: "To prepare and empower a new generation of youth anchored on Inclusion, Diversity, Equity, Access and Sustainability (IDEAS) for building a give-back mechanism through shared partnership, education, advocacy, cultural exchange and volunteerism.",
  },
  {
    title: "Core Values",
    text: "Creativity, accountability & trust, passion for excellence in service, integrity, teamwork and hard work.",
  },
];

const MILESTONES = [
  {
    year: "2006",
    title: "Official Registration",
    text: "GIEVA was registered with the Corporate Affairs Commission, formalizing a vision that began in 2005.",
  },
  {
    year: "2021",
    title: "100+ Worldwide Base",
    text: "Expanded reach and built a growing network of students, partners and volunteers across regions.",
  },
  {
    year: "2022",
    title: "Program Expansion",
    text: "Strengthened educational exchange, mentoring and placement pathways for young leaders.",
  },
  {
    year: "2023",
    title: "500+ Projects Done",
    text: "Delivered hundreds of impact projects focused on education, leadership and youth empowerment.",
  },
  {
    year: "2024",
    title: "1,000+ Awards & Recognition",
    text: "Continued growth in impact, partnerships and recognition for youth-centered initiatives.",
  },
];

export default function About() {
  return (
    <Box sx={{ bgcolor: BG, minHeight: "100vh", color: TEXT }}>
      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
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
            About Us
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
            <Typography sx={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>
              About Us
            </Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 12 }}>
        {/* ════════════════════════════════════════════════
            INTRO
        ════════════════════════════════════════════════ */}
        <Box sx={{ mb: { xs: 8, md: 12 }, maxWidth: 860 }}>
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
            About GIEVA
          </Typography>

          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 28, md: 42 },
              fontWeight: 800,
              lineHeight: 1.15,
              mb: 3,
            }}
          >
            Global Integrated Education
            <br />
            Volunteers Association (GIEVA)
          </Typography>

          <Typography
            sx={{ fontSize: 16.5, color: MUTED, lineHeight: 1.8, mb: 2 }}
          >
            GIEVA is a Youth-Centered Empowerment Non-Governmental Organization.
            Our central commitment is to empower youth for constructive engagement
            and a sustainable future through educational and cultural exchange, and
            collaborative partnership for the development of young people.
          </Typography>
        </Box>

        {/* ════════════════════════════════════════════════
            COMMITMENTS (bullet-style cards)
        ════════════════════════════════════════════════ */}
        <Box sx={{ mb: { xs: 8, md: 12 } }}>
          <Typography
            sx={{
              fontSize: { xs: 22, md: 28 },
              fontWeight: 800,
              mb: 4,
            }}
          >
            What We Stand For
          </Typography>

          <Grid container spacing={2.5}>
            {COMMITMENTS.map((item, i) => (
              <Grid item xs={12} md={6} key={i}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: "100%",
                    borderRadius: 3,
                    border: `1px solid ${BORDER}`,
                    bgcolor: CARD,
                    display: "flex",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#ECFDF5",
                      color: GREEN,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </Box>
                  <Typography sx={{ fontSize: 14.5, color: MUTED, lineHeight: 1.7 }}>
                    {item}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ════════════════════════════════════════════════
            STORY + FOUNDER
        ════════════════════════════════════════════════ */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" },
            gap: { xs: 4, md: 8 },
            alignItems: "center",
            mb: { xs: 8, md: 12 },
          }}
        >
          <Box>
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
              Our Story
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: 26, md: 34 },
                fontWeight: 800,
                lineHeight: 1.2,
                mb: 2.5,
              }}
            >
              Born from a need to empower the next generation
            </Typography>

            <Typography sx={{ fontSize: 15.5, color: MUTED, lineHeight: 1.8, mb: 2 }}>
              The concept for Global Integrated Education Volunteers Association
              emerged in 2005 and was officially registered in August 2006 with the
              Corporate Affairs Commission. The birth of the organization was a response
              to the critical need to empower the present and future generation of youth
              in Nigeria for a sustainable future and development.
            </Typography>

            <Typography sx={{ fontSize: 15.5, color: MUTED, lineHeight: 1.8, mb: 3.5 }}>
              The Principal Founder of GIEVA, Dr. Daniel Obaka, was motivated by his
              experience and a deep commitment to creating lasting pathways for young
              people through education, leadership and global engagement.
            </Typography>

            <Button
              component={Link}
              to="/history"
              variant="contained"
              endIcon={<ArrowForward />}
              sx={{
                bgcolor: GREEN,
                color: "#fff",
                textTransform: "none",
                fontWeight: 700,
                px: 3.5,
                py: 1.3,
                borderRadius: 3,
                "&:hover": { bgcolor: "#15803d" },
              }}
            >
              See Our History
            </Button>
          </Box>

          {/* Founder image placeholder — replace src */}
          <Box
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              bgcolor: CARD,
              border: `1px solid ${BORDER}`,
              boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
              maxWidth: 380,
              mx: { xs: "auto", md: 0 },
            }}
          >
            <Box
              component="img"
              src="/images/staff/daniel.jpg" // ← your founder image
              alt="Dr. Daniel Newton Obaka"
              sx={{
                width: "100%",
                height: 360,
                objectFit: "cover",
                objectPosition: "top",
                display: "block",
              }}
            />
            <Box sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                Dr. Daniel Newton Obaka
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: MUTED }}>
                Principal Founder & President
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ════════════════════════════════════════════════
            VISION / MISSION / VALUES
        ════════════════════════════════════════════════ */}
        <Box
          sx={{
            bgcolor: CARD,
            borderRadius: 4,
            border: `1px solid ${BORDER}`,
            p: { xs: 3, md: 5 },
            mb: { xs: 8, md: 12 },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
            mb={5}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: GREEN,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  mb: 1.5,
                }}
              >
                Why Choose Us
              </Typography>
              <Typography
                sx={{ fontSize: { xs: 26, md: 34 }, fontWeight: 800, lineHeight: 1.2 }}
              >
                Our Core Values at GIEVA
              </Typography>
            </Box>

            <Button
              component={Link}
              to="/history"
              variant="contained"
              endIcon={<ArrowForward />}
              sx={{
                bgcolor: GREEN,
                color: "#fff",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 3,
                px: 3,
                py: 1.2,
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: "#15803d" },
              }}
            >
              View Full History
            </Button>
          </Stack>

          <Grid container spacing={3}>
            {VALUES.map((item) => (
              <Grid item xs={12} md={4} key={item.title}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3.5,
                    height: "100%",
                    borderRadius: 3,
                    bgcolor: BG,
                    border: `1px solid ${BORDER}`,
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      borderColor: ORANGE,
                      transform: "translateY(-3px)",
                      boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: TEXT,
                      mb: 1.5,
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 14.5,
                      color: MUTED,
                      lineHeight: 1.75,
                      flexGrow: 1,
                      mb: 2.5,
                    }}
                  >
                    {item.text}
                  </Typography>

                  <Button
                    component={Link}
                    to="/history"
                    size="small"
                    endIcon={<NorthEast sx={{ fontSize: 16 }} />}
                    sx={{
                      alignSelf: "flex-start",
                      textTransform: "none",
                      fontWeight: 600,
                      color: ORANGE,
                      px: 0,
                      "&:hover": { bgcolor: "transparent", color: "#ea580c" },
                    }}
                  >
                    Read more
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ════════════════════════════════════════════════
            TIMELINE / MILESTONES
        ════════════════════════════════════════════════ */}
        <Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" },
              gap: { xs: 4, md: 8 },
              alignItems: "start",
            }}
          >
            <Box sx={{ position: { md: "sticky" }, top: { md: 100 } }}>
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
                Who is GIEVA?
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: 26, md: 34 },
                  fontWeight: 800,
                  lineHeight: 1.2,
                  mb: 2,
                }}
              >
                The Global Integrated Education Volunteers Association, Inc. (GIEVA)
              </Typography>

              <Typography sx={{ fontSize: 15.5, color: MUTED, lineHeight: 1.75, mb: 3.5 }}>
                Is a Youth-Centered Educational Empowerment not-for-profit organization
                dedicated to preparing young people for global leadership and sustainable
                impact.
              </Typography>

              <Button
                component={Link}
                to="/history"
                variant="contained"
                endIcon={<ArrowForward />}
                sx={{
                  bgcolor: GREEN,
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 3,
                  px: 3.5,
                  py: 1.3,
                  "&:hover": { bgcolor: "#15803d" },
                }}
              >
                See Our History
              </Button>
            </Box>

            {/* Timeline */}
            <Stack spacing={0}>
              {MILESTONES.map((item, index) => (
                <Box
                  key={item.year}
                  sx={{
                    display: "flex",
                    gap: 3,
                    position: "relative",
                    pb: index === MILESTONES.length - 1 ? 0 : 4,
                  }}
                >
                  {/* Line + dot */}
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
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </Box>
                    {index < MILESTONES.length - 1 && (
                      <Box
                        sx={{
                          width: 2,
                          flexGrow: 1,
                          bgcolor: BORDER,
                          mt: 0.5,
                        }}
                      />
                    )}
                  </Box>

                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 3,
                      borderRadius: 3,
                      border: `1px solid ${BORDER}`,
                      bgcolor: CARD,
                      mb: index === MILESTONES.length - 1 ? 0 : 0,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: ORANGE,
                        mb: 0.5,
                      }}
                    >
                      {item.year}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 17, fontWeight: 800, color: TEXT, mb: 1 }}
                    >
                      {item.title}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>
                      {item.text}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}