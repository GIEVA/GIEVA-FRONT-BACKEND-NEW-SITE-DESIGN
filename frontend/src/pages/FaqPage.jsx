import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Container, Typography, Breadcrumbs, Link as MuiLink,
  TextField, InputAdornment, Chip, Stack,
  Accordion, AccordionSummary, AccordionDetails,
  CircularProgress, Alert,
} from "@mui/material";
import { Home, ChevronRight, Search, ExpandMore } from "@mui/icons-material";

import { getFaqs } from "../services/publicFaqService";

const NAVY   = "#0B1F3A";
const GREEN  = "#16A34A";
const ORANGE = "#F97316";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";
const BG     = "#F8FAFC";
const CARD   = "#FFFFFF";
const BORDER = "#E2E8F0";

export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getFaqs()
      .then((data) => { if (isMounted) setFaqs(Array.isArray(data) ? data : []); })
      .catch(() => { if (isMounted) setError("We couldn't load FAQs right now. Please try again shortly."); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)))],
    [faqs]
  );

  const filtered = useMemo(() => {
    return faqs.filter((f) => {
      const matchCategory = activeCategory === "All" || f.category === activeCategory;
      const matchSearch =
        !search ||
        f.question?.toLowerCase().includes(search.toLowerCase()) ||
        f.answer?.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [faqs, activeCategory, search]);

  // Group filtered results by category, in category order as they appear
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((f) => {
      const cat = f.category || "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(f);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <Box sx={{ bgcolor: BG, minHeight: "100vh" }}>
      {/* HERO */}
      <Box
        sx={{
          background: `linear-gradient(160deg, ${NAVY} 0%, #123059 55%, ${NAVY} 100%)`,
          color: "#fff",
          px: { xs: 3, md: 8 },
          pt: { xs: 10, md: 14 },
          pb: { xs: 8, md: 10 },
        }}
      >
        <Breadcrumbs
          separator={<ChevronRight sx={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }} />}
          sx={{ mb: 3, "& a, & p": { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 } }}
        >
          <MuiLink component={RouterLink} to="/" sx={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: 0.5 }}>
            <Home sx={{ fontSize: 15 }} /> Home
          </MuiLink>
          <Typography sx={{ color: "#fff" }}>FAQs</Typography>
        </Breadcrumbs>

        <Typography sx={{
          fontSize: 12.5, letterSpacing: 3, textTransform: "uppercase",
          color: GREEN, mb: 2, fontWeight: 700,
        }}>
          Got Questions?
        </Typography>

        <Typography sx={{
          fontWeight: 800, fontSize: { xs: "2rem", sm: "2.6rem", md: "3.4rem" },
          lineHeight: 1.1, maxWidth: 760, color: "#fff", mb: 3,
        }}>
          Frequently Asked Questions
        </Typography>

        <Typography sx={{
          maxWidth: 560, fontSize: { xs: 15, md: 16.5 }, lineHeight: 1.8,
          color: "rgba(255,255,255,0.75)", mb: 4,
        }}>
          Answers to the questions we get asked most — about our programs, admissions,
          volunteering, and how GIEVA works.
        </Typography>

        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          fullWidth
          sx={{
            maxWidth: 520,
            bgcolor: "#fff",
            borderRadius: 2,
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 20, color: MUTED }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* CATEGORY FILTER */}
      {categories.length > 1 && (
        <Box sx={{
          px: { xs: 3, md: 8 }, py: 3, display: "flex", gap: 1.25, flexWrap: "wrap",
          borderBottom: `1px solid ${BORDER}`, bgcolor: "#fff",
        }}>
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setActiveCategory(cat)}
              sx={{
                fontSize: 12.5, fontWeight: 600, letterSpacing: 0.3,
                px: 1, borderRadius: 999, cursor: "pointer",
                bgcolor: activeCategory === cat ? NAVY : "transparent",
                color: activeCategory === cat ? "#fff" : NAVY,
                border: `1px solid ${activeCategory === cat ? NAVY : BORDER}`,
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

      {/* FAQ LIST */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 9 } }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress sx={{ color: GREEN }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ maxWidth: 480, mx: "auto" }}>{error}</Alert>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 22, color: NAVY, mb: 1 }}>
              {search ? "No matching questions." : "Nothing here yet."}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
              {search ? "Try a different search term." : "Check back soon — new FAQs are added regularly."}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={5}>
            {grouped.map(([category, items]) => (
              <Box key={category}>
                <Typography sx={{
                  fontSize: 12.5, fontWeight: 700, color: GREEN, letterSpacing: 1.5,
                  textTransform: "uppercase", mb: 2,
                }}>
                  {category}
                </Typography>

                <Stack spacing={1.5}>
                  {items.map((item) => {
                    const panelId = `faq-${item.id}`;
                    return (
                      <Accordion
                        key={item.id}
                        expanded={expanded === panelId}
                        onChange={() => setExpanded(expanded === panelId ? null : panelId)}
                        elevation={0}
                        disableGutters
                        sx={{
                          border: `1px solid ${BORDER}`,
                          borderRadius: "12px !important",
                          bgcolor: CARD,
                          overflow: "hidden",
                          "&:before": { display: "none" },
                          transition: "border-color 0.2s ease",
                          "&:hover": { borderColor: expanded === panelId ? ORANGE : GREEN },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMore sx={{ color: expanded === panelId ? ORANGE : MUTED }} />}
                          sx={{ px: 3, py: 0.5 }}
                        >
                          <Typography sx={{ fontWeight: 700, fontSize: 15.5, color: TEXT }}>
                            {item.question}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 3, pb: 2.5, pt: 0 }}>
                          <Typography sx={{ fontSize: 14.5, color: MUTED, lineHeight: 1.8, whiteSpace: "pre-line" }}>
                            {item.answer}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
}