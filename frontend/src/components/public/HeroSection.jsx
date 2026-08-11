import { Stack, Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { Link } from "react-router-dom";

import Hero from "../common/Hero";

// replace with your hero image
import heroImage from "../../assets/images/home/hero.jpg";

export default function HeroSection() {
  return (
    <Hero
      image={heroImage}
      subtitle="WELCOME TO GIEVA"
      title="Building a World of Opportunities Through Education"
      description="Empowering students, professionals and institutions with global education, scholarships, career development and international opportunities."
    >
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        mt={5}
        justifyContent="center"
      >
        <Button
          component={Link}
          to="/book-consultancy"
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 3,
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Book Consultancy
        </Button>

        <Button
          component={Link}
          to="/services"
          variant="outlined"
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 3,
            color: "#fff",
            borderColor: "#fff",
            textTransform: "none",

            "&:hover": {
              borderColor: "#fff",
              bgcolor: "rgba(255,255,255,.12)",
            },
          }}
        >
          Explore Services
        </Button>
      </Stack>
    </Hero>
  );
}