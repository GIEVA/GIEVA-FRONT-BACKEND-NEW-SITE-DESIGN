import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box, Container, Typography, Chip, CircularProgress, Alert,
  Button, Breadcrumbs, Link as MuiLink, Divider, Grid, Paper, Stack,
} from "@mui/material";
import {
  Home, ChevronRight, Star, OpenInNew,
  LocationOn, Phone, Email, AccessTime, Link as LinkIcon,
} from "@mui/icons-material";
import { getService } from "../services/publicServiceService";

const NAVY   = "#0F172A";
const GREEN  = "#16A34A";
const ORANGE = "#F97316";
const BG     = "#F8FAFC";
const CARD   = "#FFFFFF";
const BORDER = "#E2E8F0";
const MUTED  = "#64748B";

export default function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getService(id)
      .then((data) => { if (isMounted) setService(data); })
      .catch(() => { if (isMounted) setError("This service could not be found."); })
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 14 }}>
        <CircularProgress sx={{ color: ORANGE }} />
      </Box>
    );
  }

  if (error || !service) {
    return (
      <Container maxWidth="sm" sx={{ py: 14 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const offices = Array.isArray(service.offices) ? service.offices : [];
  const resources = Array.isArray(service.resources) ? service.resources : [];
  const ctaButtons = Array.isArray(service.ctaButtons) ? service.ctaButtons : [];
  const contentParagraphs = (service.content || "").split(/\n\s*\n/).filter(Boolean);

  return (
    <Box sx={{ bgcolor: BG, minHeight: "100vh", color: NAVY }}>
      {/* HERO */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)",
          py: { xs: 6, md: 8 },
          px: { xs: 3, md: 8 },
          mb: { xs: 5, md: 7 },
          borderRadius: { xs: 0, md: "0 0 24px 24px" },
        }}
      >
        <Container maxWidth="lg">
          <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 16, color: MUTED }} />} sx={{ mb: 2.5 }}>
            <MuiLink component={Link} to="/" sx={{
              color: MUTED, fontSize: 14, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 0.5, "&:hover": { color: ORANGE },
            }}>
              <Home sx={{ fontSize: 15 }} /> Home
            </MuiLink>
            <MuiLink component={Link} to="/services" sx={{
              color: MUTED, fontSize: 14, textDecoration: "none", "&:hover": { color: ORANGE },
            }}>
              Services
            </MuiLink>
            <Typography sx={{ color: NAVY, fontSize: 14, fontWeight: 600 }}>{service.title}</Typography>
          </Breadcrumbs>

          {service.category && (
            <Chip
              label={service.category}
              size="small"
              sx={{ mb: 2, bgcolor: "#ECFDF5", color: GREEN, fontWeight: 700, fontSize: 11 }}
            />
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {service.featured && <Star sx={{ fontSize: 22, color: ORANGE }} />}
            <Typography sx={{ fontSize: { xs: 30, md: 44 }, fontWeight: 800, lineHeight: 1.15 }}>
              {service.title}
            </Typography>
          </Box>

          {service.description && (
            <Typography sx={{ fontSize: 15.5, color: MUTED, lineHeight: 1.8, mt: 2, maxWidth: 720 }}>
              {service.description}
            </Typography>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 12 }}>
        <Grid container spacing={5}>
          {/* MAIN CONTENT */}
          <Grid item xs={12} md={offices.length > 0 ? 8 : 12}>
            {service.imageUrl && (
              <Box
                component="img"
                src={service.imageUrl}
                alt={service.title}
                sx={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 3, mb: 5 }}
              />
            )}

            {contentParagraphs.length > 0 ? (
              <Stack spacing={2.5}>
                {contentParagraphs.map((p, i) => (
                  <Typography key={i} sx={{ fontSize: 15.5, color: MUTED, lineHeight: 1.85, whiteSpace: "pre-line" }}>
                    {p}
                  </Typography>
                ))}
              </Stack>
            ) : (
              <Typography sx={{ fontSize: 16, color: MUTED, lineHeight: 1.85 }}>
                No additional details available for this service.
              </Typography>
            )}

            {/* RESOURCE LINKS */}
            {resources.length > 0 && (
              <Box sx={{ mt: 5 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: GREEN, letterSpacing: 1.2, textTransform: "uppercase", mb: 2 }}>
                  Useful Links
                </Typography>
                <Stack spacing={1.5}>
                  {resources.map((r) => (
                    <MuiLink
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: "flex", alignItems: "center", gap: 1,
                        fontSize: 14.5, color: NAVY, fontWeight: 600, textDecoration: "none",
                        "&:hover": { color: ORANGE },
                      }}
                    >
                      <LinkIcon sx={{ fontSize: 16 }} />
                      {r.label}
                    </MuiLink>
                  ))}
                </Stack>
              </Box>
            )}

            {/* CTA BUTTONS */}
            {ctaButtons.length > 0 && (
              <>
                <Divider sx={{ my: 5 }} />
                <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
                  {ctaButtons.map((c) => (
                    <Button
                      key={c.id}
                      variant="contained"
                      endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                      component={c.external ? "a" : Link}
                      href={c.external ? c.href : undefined}
                      to={!c.external ? c.href : undefined}
                      target={c.external ? "_blank" : undefined}
                      rel={c.external ? "noreferrer" : undefined}
                      sx={{
                        bgcolor: ORANGE, color: "#fff", textTransform: "none", fontWeight: 700,
                        borderRadius: 2.5, px: 4, py: 1.5, "&:hover": { bgcolor: "#ea580c" },
                      }}
                    >
                      {c.label}
                    </Button>
                  ))}
                </Stack>
              </>
            )}

            {/* Legacy single href fallback, only if no CTA buttons were added */}
            {ctaButtons.length === 0 && service.href && (
              <>
                <Divider sx={{ my: 5 }} />
                <Button
                  variant="contained"
                  endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                  component={service.href.startsWith("http") ? "a" : Link}
                  href={service.href.startsWith("http") ? service.href : undefined}
                  to={!service.href.startsWith("http") ? service.href : undefined}
                  target={service.href.startsWith("http") ? "_blank" : undefined}
                  rel={service.href.startsWith("http") ? "noreferrer" : undefined}
                  sx={{
                    bgcolor: ORANGE, color: "#fff", textTransform: "none", fontWeight: 700,
                    borderRadius: 2.5, px: 4, py: 1.5, "&:hover": { bgcolor: "#ea580c" },
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </Grid>

          {/* OFFICES SIDEBAR */}
          {offices.length > 0 && (
            <Grid item xs={12} md={4}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: GREEN, letterSpacing: 1.2, textTransform: "uppercase", mb: 2 }}>
                Visit Our Office
              </Typography>
              <Stack spacing={2.5}>
                {offices.map((o) => (
                  <Paper
                    key={o.id}
                    elevation={0}
                    sx={{ bgcolor: NAVY, color: "#fff", borderRadius: 3, p: 3 }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: 15.5, mb: 1.5 }}>
                      {o.name}
                    </Typography>
                    <Stack spacing={1.25}>
                      {o.address && (
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <LocationOn sx={{ fontSize: 17, color: ORANGE, mt: 0.2, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 13, lineHeight: 1.6, opacity: 0.85 }}>{o.address}</Typography>
                        </Stack>
                      )}
                      {o.phone && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Phone sx={{ fontSize: 16, color: ORANGE, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 13, opacity: 0.85 }}>{o.phone}</Typography>
                        </Stack>
                      )}
                      {o.email && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Email sx={{ fontSize: 16, color: ORANGE, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 13, opacity: 0.85 }}>{o.email}</Typography>
                        </Stack>
                      )}
                      {o.hours && (
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <AccessTime sx={{ fontSize: 16, color: ORANGE, mt: 0.2, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 13, lineHeight: 1.6, opacity: 0.85 }}>{o.hours}</Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}