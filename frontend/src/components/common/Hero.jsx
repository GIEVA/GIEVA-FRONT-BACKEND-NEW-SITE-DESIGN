import { Box, Container, Typography } from "@mui/material";

export default function Hero({
  title,
  subtitle,
  description,
  image,
  height = 700,
  children,
  overlay = "rgba(0,0,0,.35)",
  align = "center",
}) {
  return (
    <Box
      sx={{
        position: "relative",
        height,
        overflow: "hidden",
      }}
    >
      {/* Background Image */}

      <Box
        component="img"
        src={image}
        alt={title}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Overlay */}

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: overlay,
        }}
      />

      {/* Content */}

      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent:
            align === "center"
              ? "center"
              : "flex-start",
        }}
      >
        <Box
          sx={{
            maxWidth: 760,
            color: "#fff",
            textAlign: align,
          }}
        >
          {subtitle && (
            <Typography
              sx={{
                mb: 2,
                color: "#E65320",
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              {subtitle}
            </Typography>
          )}

          <Typography
            variant="h1"
            sx={{
              fontWeight: 800,
              fontSize: {
                xs: 40,
                md: 56,
                lg: 68,
              },
              mb: 3,
              lineHeight: 1.1,
            }}
          >
            {title}
          </Typography>

          {description && (
            <Typography
              sx={{
                fontSize: 20,
                opacity: .92,
                lineHeight: 1.8,
              }}
            >
              {description}
            </Typography>
          )}

          {children}
        </Box>
      </Container>
    </Box>
  );
}