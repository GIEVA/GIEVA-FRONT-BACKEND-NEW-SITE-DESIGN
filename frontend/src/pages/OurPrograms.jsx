import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography, Chip, Stack, CircularProgress, Alert, Breadcrumbs } from "@mui/material";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import { getPrograms } from "../services/publicProgramService";

const NAVY     = "#0B1F3A";
const GREEN    = "#16A34A";
const PAPER    = "#F6F8FB";
const HAIRLINE = "#E2E8F0";

const FONT_DISPLAY = `"Fraunces", serif`;
const FONT_MONO    = `"IBM Plex Mono", monospace`;

function useGoogleFonts() {
  useEffect(() => {
    const id = "programs-page-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,400;1,500&family=IBM+Plex+Mono:wght@500&display=swap";
    document.head.appendChild(link);
  }, []);
}

const pad2 = (n) => String(n).padStart(2, "0");

export default function OurPrograms() {
  useGoogleFonts();

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    let isMounted = true;
    getPrograms()
      .then((data) => { if (isMounted) setPrograms(Array.isArray(data) ? data : []); })
      .catch(() => { if (isMounted) setError("We couldn't load programs right now. Please try again shortly."); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const categories = ["All", ...Array.from(new Set(programs.map((p) => p.category).filter(Boolean)))];
  const visible = activeCategory === "All" ? programs : programs.filter((p) => p.category === activeCategory);

  return (
    <Box sx={{ bgcolor: PAPER, minHeight: "100vh" }}>
      {/* HERO */}
      <Box
        sx={{
          background: `linear-gradient(160deg, ${NAVY} 0%, #123059 55%, ${NAVY} 100%)`,
          color: "#fff",
          px: { xs: 3, md: 8 },
          pt: { xs: 10, md: 14 },
          pb: { xs: 8, md: 12 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box aria-hidden sx={{
          position: "absolute", right: { xs: -80, md: -40 }, top: -60,
          width: 360, height: 360, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.08)",
        }} />
        <Box aria-hidden sx={{
          position: "absolute", right: { xs: -40, md: 40 }, top: 20,
          width: 220, height: 220, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.08)",
        }} />

        <Breadcrumbs sx={{ mb: 3, "& a, & p": { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 } }}>
          <RouterLink to="/" style={{ color: "inherit", textDecoration: "none" }}>Home</RouterLink>
          <Typography sx={{ color: "#fff" }}>Programs</Typography>
        </Breadcrumbs>

        <Typography sx={{
          fontFamily: FONT_MONO, fontSize: 12.5, letterSpacing: 3, textTransform: "uppercase",
          color: GREEN, mb: 2, fontWeight: 500,
        }}>
          What We Run
        </Typography>

        <Typography sx={{
          fontFamily: FONT_DISPLAY, fontWeight: 500,
          fontSize: { xs: "2.4rem", sm: "3.2rem", md: "4.2rem" },
          lineHeight: 1.05, maxWidth: 820, color: "#fff",
        }}>
          Where Nigeria's youth <Box component="span" sx={{ fontStyle: "italic", color: GREEN }}>build</Box> what's next.
        </Typography>

        <Typography sx={{
          mt: 3, maxWidth: 560, fontSize: { xs: 15, md: 16.5 }, lineHeight: 1.8,
          color: "rgba(255,255,255,0.75)",
        }}>
          Every program below is a working group, not a brochure page — real clubs, real cohorts,
          run by and for young people across Nigeria. Pick one to see how it runs.
        </Typography>
      </Box>

      {/* CATEGORY FILTER */}
      {categories.length > 1 && (
        <Box sx={{
          px: { xs: 3, md: 8 }, py: 3, display: "flex", gap: 1.25, flexWrap: "wrap",
          borderBottom: `1px solid ${HAIRLINE}`, bgcolor: "#fff",
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

      {/* DIRECTORY */}
      <Box sx={{ px: { xs: 3, md: 8 }, py: { xs: 6, md: 9 } }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress sx={{ color: GREEN }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ maxWidth: 480, mx: "auto" }}>{error}</Alert>
        ) : visible.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY, mb: 1 }}>
              Nothing here yet.
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
              Check back soon — new programs are added regularly.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: "relative", maxWidth: 980, mx: "auto" }}>
            <Box sx={{
              position: "absolute", left: { xs: 22, md: 34 }, top: 12, bottom: 12,
              width: "1px", bgcolor: HAIRLINE, display: { xs: "none", sm: "block" },
            }} />

            <Stack spacing={0}>
              {visible.map((p, i) => (
                <ProgramRow key={p.id} program={p} index={i} />
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function ProgramRow({ program, index }) {
  const [hover, setHover] = useState(false);

  return (
    <Box
      component={RouterLink}
      to={`/our-programs/${program.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
        px: { xs: 2, md: 3 },
        textDecoration: "none",
        color: "inherit",
        borderBottom: `1px solid ${HAIRLINE}`,
        borderTop: index === 0 ? `1px solid ${HAIRLINE}` : "none",
        position: "relative",
        transition: "background-color 0.25s ease",
        bgcolor: hover ? `${GREEN}08` : "transparent",
      }}
    >
      {/* index + node */}
      <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 2, flexShrink: 0 }}>
        <Box sx={{
          width: 11, height: 11, borderRadius: "50%",
          bgcolor: hover ? GREEN : "#fff",
          border: `2px solid ${hover ? GREEN : HAIRLINE}`,
          transition: "all 0.25s ease",
          zIndex: 1,
        }} />
        <Typography sx={{
          fontFamily: FONT_DISPLAY, fontStyle: "italic", fontWeight: 500,
          fontSize: 28, color: hover ? GREEN : "#CBD5E1",
          transition: "color 0.25s ease", width: 48,
        }}>
          {pad2(index + 1)}
        </Typography>
      </Box>

      {/* image */}
      <Box sx={{
        width: { xs: 84, md: 120 }, height: { xs: 64, md: 88 }, borderRadius: 2,
        overflow: "hidden", flexShrink: 0, bgcolor: "#EEF2F6",
      }}>
        {program.heroImageUrl && (
          <Box
            component="img"
            src={program.heroImageUrl}
            alt={program.title}
            sx={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: hover ? "scale(1.08)" : "scale(1)",
              transition: "transform 0.5s ease",
            }}
          />
        )}
      </Box>

      {/* text */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{
          fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: { xs: 20, md: 26 },
          color: NAVY, mb: 0.4,
        }}>
          {program.title}
        </Typography>
        {program.tagline && (
          <Typography sx={{
            fontSize: { xs: 12.5, md: 13.5 }, color: "text.secondary",
            display: { xs: "none", sm: "-webkit-box" },
            WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {program.tagline}
          </Typography>
        )}
      </Box>

      {/* category chip */}
      {program.category && (
        <Chip
          label={program.category}
          size="small"
          sx={{
            display: { xs: "none", md: "flex" },
            fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500,
            bgcolor: `${NAVY}0A`, color: NAVY, borderRadius: 999,
          }}
        />
      )}

      {/* arrow */}
      <Box sx={{
        width: 36, height: 36, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${hover ? GREEN : HAIRLINE}`,
        color: hover ? GREEN : "#94A3B8",
        transform: hover ? "translateX(4px)" : "translateX(0)",
        transition: "all 0.25s ease",
        flexShrink: 0,
      }}>
        <ArrowOutwardRoundedIcon sx={{ fontSize: 18 }} />
      </Box>
    </Box>
  );
}