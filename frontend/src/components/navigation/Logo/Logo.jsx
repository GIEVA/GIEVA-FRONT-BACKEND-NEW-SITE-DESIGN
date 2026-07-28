import PropTypes from "prop-types";

import {
  Box,
  Typography,
} from "@mui/material";

import {
  Link as RouterLink,
} from "react-router-dom";

// Replace this later with your actual logo asset
import logoImage from "../../../assets/logo/GIEVALogo.png";

export default function Logo({
  size = "medium",
  color = "dark",
  clickable = true,
  src = null,
}) {
  const dimensions = {
    small: 34,
    medium: 42,
    large: 56,
  };

  const textVariants = {
    small: "h6",
    medium: "h5",
    large: "h4",
  };

  const textColor =
    color === "light"
      ? "#FFFFFF"
      : "#17153B";

  const logo = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        userSelect: "none",
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src || logoImage}
          alt="GIEVA"
          sx={{
            width: dimensions[size],
            height: dimensions[size],
            objectFit: "contain",
          }}
        />
      ) : (
        <Box
          sx={{
            width: dimensions[size],
            height: dimensions[size],
            borderRadius: "50%",
            background:
              "linear-gradient(135deg,#1E7F4F,#FF6B35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize:
              size === "large"
                ? 22
                : size === "medium"
                ? 18
                : 15,
          }}
        >
          G
        </Box>
      )}

      <Typography
        variant={textVariants[size]}
        sx={{
          fontWeight: 800,
          color: textColor,
          letterSpacing: "-0.5px",
          lineHeight: 1,
        }}
      >
        GIEVA
        <Typography
          component="span"
          sx={{
            color: "#1E7F4F",
            fontWeight: 700,
            fontSize: "0.65em",
            ml: 0.2,
          }}
        >
          .org
        </Typography>
      </Typography>
    </Box>
  );

  if (!clickable) return logo;

  return (
    <Box
      component={RouterLink}
      to="/"
      sx={{
        display: "inline-flex",
        textDecoration: "none",
      }}
    >
      {logo}
    </Box>
  );
}

Logo.propTypes = {
  size: PropTypes.oneOf([
    "small",
    "medium",
    "large",
  ]),

  color: PropTypes.oneOf([
    "light",
    "dark",
  ]),

  clickable: PropTypes.bool,

  src: PropTypes.string,
};