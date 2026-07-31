// pages/ServiceDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box, Container, Typography, Chip, CircularProgress, Alert,
  Button, Breadcrumbs, Link as MuiLink, Divider,
} from "@mui/material";
import { Home, ChevronRight, Star, OpenInNew } from "@mui/icons-material";
import { getService } from "../services/publicServiceService";

const NAVY   = "#0F172A";
const GREEN  = "#16A34A";
const ORANGE = "#F97316";
const BG     = "#F8FAFC";
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
        <Container maxWidth="md">
          <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 16, color: MUTED }} />} sx={{ mb: 2.5 }}>
            <MuiLink component={Link} to="/" sx={{
              color: MUTED, fontSize: 14, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 0.5, "&:hover": { color: ORANGE },
            }}>
              <Home sx={{ fontSize: 15 }} /> Home
            </MuiLink>
            <MuiLink component={Link} to="/our-services" sx={{
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
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 12 }}>
        {service.imageUrl && (
          <Box
            component="img"
            src={service.imageUrl}
            alt={service.title}
            sx={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 3, mb: 5 }}
          />
        )}

        <Typography sx={{ fontSize: 16, color: MUTED, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
          {service.description || "No additional details available for this service."}
        </Typography>

        {service.href && (
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
      </Container>
    </Box>
  );
}