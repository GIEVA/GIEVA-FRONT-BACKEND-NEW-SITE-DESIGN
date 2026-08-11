// pages/ProgramDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { Box, Typography, CircularProgress, Alert, Breadcrumbs } from "@mui/material";
import { getProgram } from "../services/publicProgramService";

export default function ProgramDetail() {
  const { slug } = useParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getProgram(slug)
      .then((data) => { if (isMounted) setProgram(data); })
      .catch(() => { if (isMounted) setError("This program could not be found."); })
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, [slug]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}><CircularProgress /></Box>;
  }

  if (error || !program) {
    return <Box sx={{ maxWidth: 480, mx: "auto", py: 12 }}><Alert severity="error">{error}</Alert></Box>;
  }

  return (
    <Box>
      {/* Hero banner */}
      <Box sx={{ bgcolor: "#B45309", borderRadius: { md: 4 }, mx: { xs: 0, md: 3 }, mt: 3, p: { xs: 4, md: 6 } }}>
        <Typography sx={{ fontSize: { xs: 32, md: 48 }, fontWeight: 800, color: "#fff", textTransform: "uppercase" }}>
          {program.title}
        </Typography>
        <Breadcrumbs sx={{ mt: 1, "& a, & p": { color: "#fff", fontWeight: 600, fontSize: 14 } }}>
          <RouterLink to="/" style={{ color: "#fff", textDecoration: "none" }}>Home</RouterLink>
          <Typography sx={{ color: "#fff" }}>{program.title}</Typography>
        </Breadcrumbs>
      </Box>

      {/* Hero image */}
      {program.heroImageUrl && (
        <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, px: 2 }}>
          <Box component="img" src={program.heroImageUrl} alt={program.title}
            sx={{ width: "100%", borderRadius: 3, objectFit: "cover" }} />
        </Box>
      )}

      {/* Intro */}
      <Box sx={{ maxWidth: 900, mx: "auto", mt: 5, px: 2 }}>
        <Typography sx={{ fontSize: 32, fontWeight: 800, color: "#16A34A", mb: 0.5 }}>
          {program.title}
        </Typography>
        {program.tagline && (
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", mb: 2 }}>
            {program.tagline}
          </Typography>
        )}
        {program.description && (
          <Typography sx={{ fontSize: 15, lineHeight: 1.8, color: "text.primary" }}>
            {program.description}
          </Typography>
        )}
      </Box>

      {/* Sections */}
      <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, px: 2, pb: 8 }}>
        {(program.sections || []).map((section) => (
          <Box key={section.id} sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 700, mb: 1 }}>{section.name}</Typography>
            {section.imageUrl && (
              <Box component="img" src={section.imageUrl} alt={section.name}
                sx={{ width: "100%", maxWidth: 400, borderRadius: 2, mb: 1.5, objectFit: "cover" }} />
            )}
            <Typography sx={{ fontSize: 14.5, lineHeight: 1.8, color: "text.secondary" }}>
              {section.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}