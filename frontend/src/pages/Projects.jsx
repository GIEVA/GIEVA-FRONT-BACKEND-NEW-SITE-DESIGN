import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Chip, Stack, CircularProgress, Alert, Breadcrumbs,
} from "@mui/material";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { getProjects } from "../services/publicProjectService";

const NAVY     = "#0B1F3A";
const GREEN    = "#16A34A";
const GOLD     = "#D4A017";
const PAPER    = "#F6F8FB";
const HAIRLINE = "#E2E8F0";
const TEXT     = "#0F172A";
const MUTED    = "#64748B";

const FONT_DISPLAY = `"Fraunces", serif`;
const FONT_MONO    = `"IBM Plex Mono", monospace`;

function useGoogleFonts() {
  useEffect(() => {
    const id = "projects-page-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=IBM+Plex+Mono:wght@500&display=swap";
    document.head.appendChild(link);
  }, []);
}

// Animated count-up for the stat strip
function useCountUp(target, duration = 1200, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

export default function Projects() {
  useGoogleFonts();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getProjects()
      .then((data) => {
        if (isMounted) setProjects(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (isMounted) setError("We couldn't load our projects right now. Please try again shortly.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setStatsVisible(true), 150);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((p) => p.category).filter(Boolean)))],
    [projects]
  );

  const partnersCount = useMemo(
    () => new Set(projects.map((p) => p.partnerName).filter(Boolean)).size,
    [projects]
  );

  const featured = useMemo(
    () => projects.find((p) => p.featured) || projects[0],
    [projects]
  );

  const rest = useMemo(
    () => projects.filter((p) => p.id !== featured?.id),
    [projects, featured]
  );

  const visibleRest = useMemo(() => {
    return activeCategory === "All"
      ? rest
      : rest.filter((p) => p.category === activeCategory);
  }, [rest, activeCategory]);

  const showFeatured = activeCategory === "All" && featured;

  const projectCount = useCountUp(projects.length, 1000, statsVisible);
  const categoryCount = useCountUp(Math.max(categories.length - 1, 0), 1000, statsVisible);
  const partnerCount = useCountUp(partnersCount, 1000, statsVisible);

  return (
    <Box sx={{ bgcolor: PAPER, minHeight: "100vh" }}>
      {/* ── HERO ─────────────────────────────────────── */}
      <Box
        sx={{
          background: `linear-gradient(160deg, ${NAVY} 0%, #123059 55%, ${NAVY} 100%)`,
          color: "#fff",
          px: { xs: 3, md: 8 },
          pt: { xs: 10, md: 14 },
          pb: { xs: 10, md: 14 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box aria-hidden sx={{
          position: "absolute", right: { xs: -100, md: -60 }, top: -80,
          width: 420, height: 420, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.07)",
        }} />
        <Box aria-hidden sx={{
          position: "absolute", right: { xs: -60, md: 60 }, top: 40,
          width: 260, height: 260, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.07)",
        }} />
        <Box aria-hidden sx={{
          position: "absolute", left: { xs: -140, md: -100 }, bottom: -140,
          width: 340, height: 340, borderRadius: "50%",
          background: `radial-gradient(circle, ${GREEN}22, transparent 70%)`,
        }} />

        <Breadcrumbs
          separator={<ChevronRightRoundedIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} />}
          sx={{ mb: 4, position: "relative", "& a, & p": { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 } }}
        >
          <RouterLink to="/" style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            <HomeRoundedIcon sx={{ fontSize: 15 }} /> Home
          </RouterLink>
          <Typography sx={{ color: "#fff" }}>Projects & Initiatives</Typography>
        </Breadcrumbs>

        <Typography sx={{
          fontFamily: FONT_MONO, fontSize: 12.5, letterSpacing: 3, textTransform: "uppercase",
          color: GOLD, mb: 2, fontWeight: 500, position: "relative",
        }}>
          Impact in Motion
        </Typography>

        <Typography sx={{
          fontFamily: FONT_DISPLAY, fontWeight: 500,
          fontSize: { xs: "2.4rem", sm: "3.2rem", md: "4.4rem" },
          lineHeight: 1.04, maxWidth: 900, color: "#fff", position: "relative",
        }}>
          Projects that <Box component="span" sx={{ fontStyle: "italic", color: GREEN }}>move</Box> real lives forward.
        </Typography>

        <Typography sx={{
          mt: 3, maxWidth: 580, fontSize: { xs: 15, md: 16.5 }, lineHeight: 1.85,
          color: "rgba(255,255,255,0.72)", position: "relative",
        }}>
          From classroom initiatives to national partnerships — every project here is a living
          commitment, built with institutions, funders, and communities across Nigeria and beyond.
        </Typography>

        {/* STAT STRIP */}
        {!loading && !error && projects.length > 0 && (
          <Stack
            direction="row"
            spacing={{ xs: 4, md: 7 }}
            sx={{ mt: { xs: 6, md: 8 }, position: "relative", flexWrap: "wrap", rowGap: 3 }}
          >
            {[
              { label: "Active Projects", value: projectCount },
              { label: "Categories", value: categoryCount },
              { label: "Partner Organizations", value: partnerCount },
            ].map((s) => (
              <Box key={s.label}>
                <Typography sx={{
                  fontFamily: FONT_DISPLAY, fontSize: { xs: 32, md: 42 }, fontWeight: 600,
                  color: "#fff", lineHeight: 1,
                }}>
                  {s.value}
                  <Box component="span" sx={{ color: GREEN }}>+</Box>
                </Typography>
                <Typography sx={{
                  fontFamily: FONT_MONO, fontSize: 11.5, letterSpacing: 1.2,
                  textTransform: "uppercase", color: "rgba(255,255,255,0.55)", mt: 0.75,
                }}>
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* CATEGORY FILTER */}
      {!loading && !error && categories.length > 1 && (
        <Box sx={{
          px: { xs: 3, md: 8 }, py: 3, display: "flex", gap: 1.25, flexWrap: "wrap",
          borderBottom: `1px solid ${HAIRLINE}`, bgcolor: "#fff", position: "sticky", top: 0, zIndex: 5,
        }}>
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setActiveCategory(cat)}
              sx={{
                fontFamily: FONT_MONO, fontSize: 12, fontWeight: 500, letterSpacing: 0.4,
                px: 1, borderRadius: 999, cursor: "pointer",
                bgcolor: activeCategory === cat ? NAVY : "transparent",
                color: activeCategory === cat ? "#fff" : NAVY,
                border: `1px solid ${activeCategory === cat ? NAVY : HAIRLINE}`,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: activeCategory === cat ? NAVY : `${GREEN}10`,
                  borderColor: activeCategory === cat ? NAVY : GREEN,
                },
              }}
            />
          ))}
        </Box>
      )}

      {/* CONTENT */}
      <Box sx={{ px: { xs: 3, md: 8 }, py: { xs: 6, md: 9 } }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
            <CircularProgress sx={{ color: GREEN }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ maxWidth: 480, mx: "auto" }}>{error}</Alert>
        ) : projects.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 12 }}>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: NAVY, mb: 1 }}>
              Nothing published yet.
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: 14 }}>
              Check back soon — new projects are added regularly.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxWidth: 1280, mx: "auto" }}>
            {/* FEATURED SPOTLIGHT */}
            {showFeatured && <FeaturedCard project={featured} />}

            {/* GRID */}
            {visibleRest.length > 0 ? (
              <Box
                sx={{
                  mt: showFeatured ? { xs: 5, md: 7 } : 0,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: { xs: 3, md: 3.5 },
                }}
              >
                {visibleRest.map((p, i) => (
                  <ProjectCard key={p.id} project={p} index={i} />
                ))}
              </Box>
            ) : (
              !showFeatured && (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Typography sx={{ color: MUTED, fontSize: 14 }}>
                    No projects in this category yet.
                  </Typography>
                </Box>
              )
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// FEATURED SPOTLIGHT — large split hero card
// ─────────────────────────────────────────────────────────────
function FeaturedCard({ project }) {
  const [hover, setHover] = useState(false);
  const content = (
    <Box
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" },
        borderRadius: 4,
        overflow: "hidden",
        bgcolor: "#fff",
        border: `1px solid ${HAIRLINE}`,
        boxShadow: hover
          ? "0 28px 60px -20px rgba(11,31,58,0.28)"
          : "0 14px 40px -24px rgba(11,31,58,0.18)",
        transition: "box-shadow 0.4s ease, transform 0.4s ease",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        textDecoration: "none",
        color: "inherit",
        cursor: project.href ? "pointer" : "default",
      }}
    >
      <Box sx={{ position: "relative", minHeight: { xs: 240, md: 380 }, overflow: "hidden", bgcolor: "#EEF2F6" }}>
        {project.imageUrl && (
          <Box
            component="img"
            src={project.imageUrl}
            alt={project.title}
            sx={{
              width: "100%", height: "100%", objectFit: "cover",
              position: "absolute", inset: 0,
              transform: hover ? "scale(1.06)" : "scale(1)",
              transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        )}
        <Box sx={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 40%, rgba(11,31,58,0.55) 100%)",
          display: { xs: "flex", md: "none" }, alignItems: "flex-end", p: 3,
        }}>
          <Chip label="Featured" size="small" sx={{
            fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, bgcolor: GOLD, color: NAVY,
          }} />
        </Box>
      </Box>

      <Box sx={{ p: { xs: 3.5, md: 5.5 }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Chip
          label="Featured"
          size="small"
          sx={{
            display: { xs: "none", md: "inline-flex" },
            alignSelf: "flex-start", mb: 2.5,
            fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
            bgcolor: `${GOLD}18`, color: "#946A0A",
          }}
        />

        <Typography sx={{
          fontFamily: FONT_MONO, fontSize: 11.5, letterSpacing: 1.4, textTransform: "uppercase",
          color: GREEN, mb: 1.5, fontWeight: 600,
        }}>
          {project.category || "General"}
        </Typography>

        <Typography sx={{
          fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: { xs: 24, md: 32 },
          color: NAVY, lineHeight: 1.15, mb: 2,
        }}>
          {project.title}
        </Typography>

        {project.description && (
          <Typography sx={{
            fontSize: 14.5, color: MUTED, lineHeight: 1.8, mb: 3,
            display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {project.description}
          </Typography>
        )}

        <Stack direction="row" alignItems="center" spacing={2}>
          {project.partnerName && (
            <Typography sx={{
              fontFamily: FONT_MONO, fontSize: 12, color: NAVY, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 0.75,
            }}>
              <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: GREEN, display: "inline-block" }} />
              In partnership with {project.partnerName}
            </Typography>
          )}
        </Stack>

        {project.href && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 3, color: GREEN, fontWeight: 700, fontSize: 13.5 }}>
            Learn more
            <ArrowOutwardRoundedIcon sx={{
              fontSize: 17, transition: "transform 0.25s ease",
              transform: hover ? "translate(3px, -3px)" : "translate(0,0)",
            }} />
          </Stack>
        )}
      </Box>
    </Box>
  );

  if (project.href) {
    return (
      <Box
        component="a"
        href={project.href}
        target={project.external ? "_blank" : undefined}
        rel={project.external ? "noopener noreferrer" : undefined}
        sx={{ display: "block", textDecoration: "none" }}
      >
        {content}
      </Box>
    );
  }
  return content;
}

// ─────────────────────────────────────────────────────────────
// GRID CARD — hover-reveal overlay
// ─────────────────────────────────────────────────────────────
function ProjectCard({ project, index }) {
  const [hover, setHover] = useState(false);

  const card = (
    <Box
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      sx={{
        position: "relative",
        borderRadius: 3.5,
        overflow: "hidden",
        bgcolor: "#fff",
        border: `1px solid ${HAIRLINE}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: hover
          ? "0 20px 44px -18px rgba(11,31,58,0.24)"
          : "0 6px 18px -14px rgba(11,31,58,0.12)",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        transition: "box-shadow 0.35s ease, transform 0.35s ease",
        textDecoration: "none",
        color: "inherit",
        opacity: 0,
        animation: "gieva-project-fade-in 0.5s ease forwards",
        animationDelay: `${Math.min(index * 60, 400)}ms`,
        "@keyframes gieva-project-fade-in": {
          from: { opacity: 0, transform: "translateY(14px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box sx={{ position: "relative", height: 190, overflow: "hidden", bgcolor: "#EEF2F6" }}>
        {project.imageUrl ? (
          <Box
            component="img"
            src={project.imageUrl}
            alt={project.title}
            sx={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: hover ? "scale(1.08)" : "scale(1)",
              transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        ) : (
          <Box sx={{
            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: FONT_DISPLAY, fontSize: 40, color: `${NAVY}22`, fontWeight: 600,
          }}>
            {project.title?.[0] || "P"}
          </Box>
        )}

        <Box sx={{
          position: "absolute", inset: 0,
          background: hover
            ? "linear-gradient(180deg, rgba(11,31,58,0.05) 0%, rgba(11,31,58,0.75) 100%)"
            : "linear-gradient(180deg, rgba(11,31,58,0) 55%, rgba(11,31,58,0.35) 100%)",
          transition: "background 0.35s ease",
        }} />

        <Chip
          label={project.category || "General"}
          size="small"
          sx={{
            position: "absolute", top: 12, left: 12,
            fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700,
            bgcolor: "rgba(255,255,255,0.92)", color: NAVY, height: 22,
          }}
        />

        {project.href && (
          <Box sx={{
            position: "absolute", top: 12, right: 12,
            width: 30, height: 30, borderRadius: "50%",
            bgcolor: hover ? GREEN : "rgba(255,255,255,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s ease",
            transform: hover ? "scale(1)" : "scale(0.85)",
            opacity: hover ? 1 : 0,
          }}>
            <ArrowOutwardRoundedIcon sx={{ fontSize: 15, color: hover ? "#fff" : NAVY }} />
          </Box>
        )}

        {/* description reveal on hover, over the image */}
        {project.description && (
          <Box sx={{
            position: "absolute", left: 0, right: 0, bottom: 0, p: 2,
            opacity: hover ? 1 : 0,
            transform: hover ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.3s ease",
          }}>
            <Typography sx={{
              fontSize: 12.5, color: "rgba(255,255,255,0.9)", lineHeight: 1.6,
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {project.description}
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
        <Typography sx={{
          fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 17.5,
          color: NAVY, lineHeight: 1.3, mb: project.partnerName ? 1 : 0,
        }}>
          {project.title}
        </Typography>

        {project.partnerName && (
          <Typography sx={{
            fontFamily: FONT_MONO, fontSize: 11, color: MUTED, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 0.6, mt: "auto", pt: 1,
          }}>
            <Box component="span" sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: GREEN, display: "inline-block", flexShrink: 0 }} />
            {project.partnerName}
          </Typography>
        )}
      </Box>
    </Box>
  );

  if (project.href) {
    return (
      <Box
        component="a"
        href={project.href}
        target={project.external ? "_blank" : undefined}
        rel={project.external ? "noopener noreferrer" : undefined}
        sx={{ display: "block", height: "100%", textDecoration: "none" }}
      >
        {card}
      </Box>
    );
  }
  return card;
}