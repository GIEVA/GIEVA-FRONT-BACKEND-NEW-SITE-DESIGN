// pages/WhatWeDo.jsx
//
// Layout:
//  1. Hero banner
//  2. Static HEALS write-up (from screenshots)
//  3. "Why Do We Do It?" section
//  4. "How Do We Do It?" section
//  5. Dynamic services grid — fetched from GET /api/service
//  6. Service detail modal — opens on card click

import { useEffect, useState } from "react";
import {
  Box, Container, Typography, Grid, Paper, Chip,
  Dialog, DialogContent, DialogTitle, IconButton,
  CircularProgress, Alert, Divider, Button, Stack,
  Breadcrumbs, Link as MuiLink,
} from "@mui/material";
import {
  Close, ArrowForward, CheckCircle, Star,
  OpenInNew, Home, ChevronRight,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { getServices, getService } from "../services/publicServiceService";

// ─────────────────────────────────────────────────────────────
// COLOURS  (match your existing site palette from screenshots)
// ─────────────────────────────────────────────────────────────
const NAVY   = "#0B1F3A";
const GREEN  = "#1E7F4F";
const GOLD   = "#D4A017";
const BG     = "#0a0a0a";   // dark background like screenshots
const CARD   = "#111827";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT   = "#f1f5f9";
const MUTED  = "#94a3b8";
const ACCENT = "#D4A017";   // gold for headings like screenshots

// ─────────────────────────────────────────────────────────────
// STATIC CONTENT (from screenshots)
// ─────────────────────────────────────────────────────────────
const WHY_OBJECTIVES = [
  "To avoid and minimize academic credential scams.",
  "To facilitate recruitment/placement tours by bringing admission officers in touch with academically outstanding students in high schools in Nigeria.",
  "To establish and facilitate benchmark standards for students' interns, summer camp participants, and volunteer services.",
  "To establish international-based standard for best practices of recruitments/placements of international students at affordable cost.",
  "To identify students from poor families with outstanding, academic, leadership, sport, artistic, and music potentials for placements in universities globally.",
  "To initiate future Young African Leadership movement with global relevance through educational exchanges.",
  "To initiate the preparation of Nigerian High School graduate students to engage in Advanced Placement Program while waiting for college/university admissions.",
  "To strengthen platforms for the placement of first degree graduate students in universities globally.",
];

const HOW_PLATFORM = [
  "The organization of annual recruitment/placement tour program",
  "The establishment of Partner-Schools Representative Forum to share ideas and resources;",
  "The Representation of Academic Credential Evaluation Organizations as dispatcher.",
  "Build and strengthen Partnerships with relevant organizations globally.",
];

const HOW_INCOUNTRY = [
  "Identify students with outstanding academic, leadership, sport, music, and artistic potentials.",
  "Prepare students through educational advising and mentoring.",
  "Collaborate with Education advising bodies to connect students to accredited 2-years, and 4-years colleges and universities.",
  "Provide in-country admission membership programs.",
  "Facilitate and encourage the establishment of Advance Placement programs in Secondary Schools.",
  "Facilitate/organize annual recruitment tours of International High Schools.",
  "Provide visa/pre-departure orientations, and SEVIS Fee processing payment.",
];

// ─────────────────────────────────────────────────────────────
// SERVICE CARD
// ─────────────────────────────────────────────────────────────
const ServiceCard = ({ service, onClick }) => (
  <Paper
    onClick={() => onClick(service)}
    elevation={0}
    sx={{
      bgcolor:       CARD,
      border:        `1px solid ${BORDER}`,
      borderRadius:  3,
      overflow:      "hidden",
      cursor:        "pointer",
      height:        "100%",
      display:       "flex",
      flexDirection: "column",
      transition:    "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
      "&:hover": {
        borderColor: GOLD,
        transform:   "translateY(-3px)",
        boxShadow:   `0 12px 32px rgba(0,0,0,0.4)`,
      },
    }}
  >
    {/* Image */}
    {service.imageUrl && (
      <Box
        component="img"
        src={service.imageUrl}
        alt={service.title}
        sx={{ width: "100%", height: 180, objectFit: "cover", flexShrink: 0 }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    )}

    <Box sx={{ p: 3, display: "flex", flexDirection: "column", flexGrow: 1 }}>
      {/* Category chip */}
      {service.category && (
        <Chip
          label={service.category}
          size="small"
          sx={{
            alignSelf:  "flex-start",
            mb:         1.5,
            bgcolor:    `${GOLD}22`,
            color:      GOLD,
            fontWeight: 700,
            fontSize:   11,
          }}
        />
      )}

      {/* Featured star */}
      {service.featured && (
        <Star sx={{ fontSize: 16, color: GOLD, mb: 0.5 }} />
      )}

      <Typography
        sx={{
          fontSize:   17,
          fontWeight: 800,
          color:      TEXT,
          lineHeight: 1.3,
          mb:         1,
        }}
      >
        {service.title}
      </Typography>

      {service.description && (
        <Typography
          sx={{
            fontSize:          13.5,
            color:             MUTED,
            lineHeight:        1.65,
            mb:                2,
            flexGrow:          1,
            display:           "-webkit-box",
            WebkitLineClamp:   3,
            WebkitBoxOrient:   "vertical",
            overflow:          "hidden",
          }}
        >
          {service.description}
        </Typography>
      )}

      <Box
        sx={{
          display:    "flex",
          alignItems: "center",
          gap:        0.5,
          color:      GOLD,
          fontWeight: 700,
          fontSize:   13,
          mt:         "auto",
        }}
      >
        Learn more <ArrowForward sx={{ fontSize: 14 }} />
      </Box>
    </Box>
  </Paper>
);

// ─────────────────────────────────────────────────────────────
// SERVICE DETAIL MODAL
// ─────────────────────────────────────────────────────────────
const ServiceModal = ({ service, open, onClose }) => {
  if (!service) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          bgcolor:      CARD,
          border:       `1px solid ${BORDER}`,
          borderRadius: 4,
          color:        TEXT,
        },
      }}
    >
      {/* Image header */}
      {service.imageUrl && (
        <Box sx={{ position: "relative", height: 220, flexShrink: 0 }}>
          <Box
            component="img"
            src={service.imageUrl}
            alt={service.title}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {/* Gradient overlay */}
          <Box
            sx={{
              position:   "absolute",
              inset:      0,
              background: "linear-gradient(to top, rgba(17,24,39,0.95) 0%, transparent 60%)",
            }}
          />
        </Box>
      )}

      <DialogTitle
        sx={{
          px:           3,
          pt:           service.imageUrl ? 2 : 3,
          pb:           1.5,
          display:      "flex",
          justifyContent: "space-between",
          alignItems:   "flex-start",
          gap:          2,
        }}
      >
        <Box>
          {service.category && (
            <Chip
              label={service.category}
              size="small"
              sx={{ mb: 1, bgcolor: `${GOLD}22`, color: GOLD, fontWeight: 700, fontSize: 11 }}
            />
          )}
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: TEXT, lineHeight: 1.25 }}>
            {service.title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: MUTED, flexShrink: 0 }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: BORDER }} />

      <DialogContent sx={{ px: 3, py: 3 }}>
        <Typography
          sx={{
            fontSize:   14.5,
            color:      MUTED,
            lineHeight: 1.75,
            whiteSpace: "pre-wrap",
          }}
        >
          {service.description || "No additional details available for this service."}
        </Typography>

        {service.href && (
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
              component={service.href.startsWith("http") ? "a" : Link}
              href={service.href.startsWith("http") ? service.href : undefined}
              to={!service.href.startsWith("http") ? service.href : undefined}
              target={service.href.startsWith("http") ? "_blank" : undefined}
              rel={service.href.startsWith("http") ? "noreferrer" : undefined}
              onClick={onClose}
              sx={{
                bgcolor:         GOLD,
                color:           NAVY,
                textTransform:   "none",
                fontWeight:      800,
                borderRadius:    3,
                px:              3,
                py:              1.25,
                "&:hover":       { bgcolor: "#C8970F" },
              }}
            >
              Get Started
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────
// NUMBERED LIST ITEM
// ─────────────────────────────────────────────────────────────
const NumberedItem = ({ index, text }) => (
  <Box sx={{ display: "flex", gap: 2, mb: 1.5 }}>
    <Box
      sx={{
        width:          26,
        height:         26,
        borderRadius:   "50%",
        bgcolor:        `${GOLD}22`,
        color:          GOLD,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       12,
        fontWeight:     800,
        flexShrink:     0,
        mt:             0.25,
      }}
    >
      {index}
    </Box>
    <Typography sx={{ fontSize: 14.5, color: MUTED, lineHeight: 1.65 }}>
      {text}
    </Typography>
  </Box>
);

// ─────────────────────────────────────────────────────────────
// SECTION HEADING  (gold, like screenshots)
// ─────────────────────────────────────────────────────────────
const SectionHeading = ({ children, sx = {} }) => (
  <Typography
    sx={{
      fontSize:   { xs: 28, md: 36 },
      fontWeight: 800,
      color:      ACCENT,
      mb:         2.5,
      lineHeight: 1.2,
      ...sx,
    }}
  >
    {children}
  </Typography>
);

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function WhatWeDo() {
  const [services,       setServices]       = useState([]);
  const [loadingServices,setLoadingServices]= useState(true);
  const [fetchError,     setFetchError]     = useState("");
  const [selectedService,setSelectedService]= useState(null);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [modalLoading,   setModalLoading]   = useState(false);

  // Fetch published services
  useEffect(() => {
    getServices()
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setFetchError("Failed to load services. Please try again."))
      .finally(() => setLoadingServices(false));
  }, []);

  // Open modal — optionally re-fetch full detail by ID
  const handleOpenService = async (service) => {
    setSelectedService(service); // show immediately with cached data
    setModalOpen(true);

    // Optionally fetch full detail (in case list omits some fields)
    try {
      setModalLoading(true);
      const full = await getService(service.id);
      setSelectedService(full);
    } catch {
      // fall back to the list data already shown
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    // don't clear selectedService immediately so the modal exit animation
    // doesn't flash empty content
    setTimeout(() => setSelectedService(null), 300);
  };

  return (
    <Box sx={{ bgcolor: BG, minHeight: "100vh", color: TEXT }}>

      {/* ══════════════════════════════════════════════════════
          HERO BANNER  (matches screenshot 1)
      ══════════════════════════════════════════════════════ */}
      <Box
        sx={{
          background:   "linear-gradient(135deg, #7c2d12 0%, #92400e 60%, #78350f 100%)",
          py:           { xs: 8, md: 12 },
          px:           { xs: 3, md: 8 },
          mb:           8,
          borderRadius: { xs: 0, md: "0 0 24px 24px" },
        }}
      >
        <Container maxWidth="lg">
          <Typography
            sx={{
              fontSize:   { xs: 36, md: 54 },
              fontWeight: 800,
              color:      "#fff",
              mb:         2,
              lineHeight: 1.1,
            }}
          >
            What We DO
          </Typography>

          {/* Breadcrumb */}
          <Breadcrumbs
            separator={<ChevronRight sx={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }} />}
            sx={{ "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" } }}
          >
            <MuiLink
              component={Link} to="/"
              sx={{ color: "rgba(255,255,255,0.7)", fontSize: 14, textDecoration: "none",
                    display: "flex", alignItems: "center", gap: 0.5,
                    "&:hover": { color: "#fff" } }}
            >
              <Home sx={{ fontSize: 15 }} /> Home
            </MuiLink>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
              What We DO
            </Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 12 }}>

        {/* ══════════════════════════════════════════════════════
            SECTION 1 — HEALS DESCRIPTION  (screenshots 1 & 2)
        ══════════════════════════════════════════════════════ */}
        <Box sx={{ mb: 10 }}>
          {/* Tag label */}
          <Typography
            sx={{
              fontSize:      13,
              fontWeight:    700,
              color:         GREEN,
              letterSpacing: 2,
              textTransform: "uppercase",
              mb:            2.5,
            }}
          >
            [ WHAT WE DO ]
          </Typography>

          <Typography
            sx={{
              fontSize:   { xs: 28, md: 42 },
              fontWeight: 800,
              color:      TEXT,
              lineHeight: 1.15,
              mb:         4,
              maxWidth:   800,
            }}
          >
            Holistic Education Advising And Learning Services (HEALS)
          </Typography>

          <Box
            sx={{
              borderLeft: `3px solid ${GREEN}`,
              pl:         3,
              mb:         3,
            }}
          >
            <Typography sx={{ fontSize: 15, color: MUTED, lineHeight: 1.8, mb: 2 }}>
              GIEVA Organization provides international-based standard-best-practices in seeking
              qualified students with outstanding potentials; guides through admission processes;
              and advocate for academic financial aid.
            </Typography>
            <Typography sx={{ fontSize: 15, color: MUTED, lineHeight: 1.8, mb: 2 }}>
              As youth-educational-based organization, we provide exchange of international students
              to share cultural experiences, stimulate spirit of service through volunteering, and
              inspire sustainable self-dependent mind set among youth through leadership training.
            </Typography>
            <Typography sx={{ fontSize: 15, color: MUTED, lineHeight: 1.8 }}>
              We provide visa/pre-departure orientations; supervises student Internships, summer
              camp programs, and evaluate/monitor progress of students; and facilitates the
              establishment/strengthens leadership of HEALS Alumni program globally.
            </Typography>
          </Box>

          <Typography sx={{ fontSize: 15, color: MUTED, lineHeight: 1.8 }}>
            The HEALS is a collaborative effort anchored on partnership to create mutual values for
            university communities, students, parents, and other strategic partners. It is to create
            a sense of working together and build platforms for a culture of inclusion and sustainable
            development within the evolving global context.
          </Typography>
        </Box>

        {/* ══════════════════════════════════════════════════════
            SECTION 2 — WHY DO WE DO IT?  (screenshot 3)
        ══════════════════════════════════════════════════════ */}
        <Box sx={{ mb: 10 }}>
          <SectionHeading>Why Do We Do It?</SectionHeading>

          <Typography sx={{ fontSize: 15, color: MUTED, mb: 3, lineHeight: 1.7 }}>
            As a collaborative platform, HEALS addresses SEVEN basic objectives:
          </Typography>

          <Box>
            {WHY_OBJECTIVES.map((item, i) => (
              <NumberedItem key={i} index={i + 1} text={item} />
            ))}
          </Box>
        </Box>

        {/* ══════════════════════════════════════════════════════
            SECTION 3 — HOW DO WE DO IT?  (screenshot 3 & 4)
        ══════════════════════════════════════════════════════ */}
        <Box sx={{ mb: 10 }}>
          <SectionHeading>How Do We Do It?</SectionHeading>

          <Typography sx={{ fontSize: 15, color: MUTED, mb: 3, lineHeight: 1.7 }}>
            To attract students with high academic, leadership, sports, and artistic potentials
            with minimum cost. Also, to provide access to, and opportunities for global education
            with twenty-first century relevance. The HEALS platform involves:
          </Typography>

          <Box sx={{ mb: 4 }}>
            {HOW_PLATFORM.map((item, i) => (
              <NumberedItem key={i} index={i + 1} text={item} />
            ))}
          </Box>

          <Typography sx={{ fontSize: 15, color: MUTED, mb: 3, lineHeight: 1.7 }}>
            Under the HEALS platform, an in-country recruitment/placement team is charged with
            the responsibility TO:
          </Typography>

          <Box>
            {HOW_INCOUNTRY.map((item, i) => (
              <NumberedItem key={i} index={i + 1} text={item} />
            ))}
          </Box>
        </Box>

        <Divider sx={{ borderColor: BORDER, mb: 10 }} />

        {/* ══════════════════════════════════════════════════════
            SECTION 4 — DYNAMIC SERVICES GRID
        ══════════════════════════════════════════════════════ */}
        <Box>
          {/* Section header */}
          <Box sx={{ mb: 6 }}>
            <Typography
              sx={{
                fontSize:      13,
                fontWeight:    700,
                color:         GREEN,
                letterSpacing: 2,
                textTransform: "uppercase",
                mb:            1.5,
              }}
            >
              [ OUR SERVICES ]
            </Typography>
            <SectionHeading sx={{ color: TEXT, mb: 1 }}>
              What We Offer
            </SectionHeading>
            <Typography sx={{ fontSize: 15, color: MUTED, maxWidth: 560, lineHeight: 1.7 }}>
              Explore the full range of services GIEVA provides to support students, families
              and institutions across every stage of the educational journey.
            </Typography>
          </Box>

          {loadingServices ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: GOLD }} />
            </Box>
          ) : fetchError ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{fetchError}</Alert>
          ) : services.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: MUTED }}>
                No services available at the moment. Please check back soon.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {services.map((service) => (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
                  <ServiceCard service={service} onClick={handleOpenService} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>

      {/* ══════════════════════════════════════════════════════
          SERVICE DETAIL MODAL
      ══════════════════════════════════════════════════════ */}
      <ServiceModal
        service={selectedService}
        open={modalOpen}
        onClose={handleCloseModal}
        loading={modalLoading}
      />
    </Box>
  );
}
