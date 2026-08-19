import {
  Box,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";

import {
  Link as RouterLink,
} from "react-router-dom";

import {
  Facebook,
  Instagram,
  LinkedIn,
  X,
  YouTube,
  LocationOn,
  Phone,
  Email,
} from "@mui/icons-material";

import Logo from "../Logo/Logo";

import {
  footerNavigation,
  socialLinks,
} from "../navigation.config";

const icons = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: LinkedIn,
  twitter: X,
  youtube: YouTube,
};

const offices = [
  {
    name: "Abuja Office",
    address: "Lagos State House, Plot 78 Ralph Shodeinde Street, 3rd Floor, Suite 329, Central Business District, Abuja",
    phone: "+234 703-525-0399",
    email: "contact@gieva.org",
  },
  {
    name: "Lagos Office",
    address: "561 Ladipo Bus Stop, Agege Motor Road, Beside Coca Cola Depot (Opposite Tamarin Hotel), Oshodi, Lagos",
    phone: "+234 703-525-0344",
    email: "contactlagos@gieva.org",
  },
  {
    name: "Jos Office",
    address: "ECWA Production Building, Room 9 & 10, Kano-Beach Road, Jos, Plateau State",
    phone: "+234 810-028-9330",
    email: "contactjos@gieva.org",
  },
];

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#17153B",
        color: "#fff",
        pt: 8,
        pb: 3,
        mt: 10,
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={6}>
          {/* =====================================
              BRAND
          ===================================== */}

          <Grid item xs={12} md={4}>
            <Logo color="light" />

            <Typography
              mt={3}
              color="rgba(255,255,255,.75)"
              lineHeight={1.8}
            >
              GIEVA is committed to empowering
              students through educational
              consultancy, scholarships,
              international admissions, and
              career development.
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              mt={3}
            >
              {socialLinks.map((social) => {
                const Icon =
                  icons[social.icon];

                return (
                  <IconButton
                    key={social.label}
                    component="a"
                    href={social.url}
                    target="_blank"
                    sx={{
                      color: "#fff",

                      "&:hover": {
                        bgcolor:
                          "rgba(255,255,255,.08)",
                      },
                    }}
                  >
                    <Icon />
                  </IconButton>
                );
              })}
            </Stack>
          </Grid>

          {/* =====================================
              LINKS
          ===================================== */}

          {Object.entries(
            footerNavigation
          ).map(([title, links]) => (
            <Grid
              item
              xs={12}
              sm={4}
              md={2.6}
              key={title}
            >
              <Typography
                fontWeight={700}
                mb={2}
              >
                {title.charAt(0).toUpperCase() +
                  title.slice(1)}
              </Typography>

              <Stack spacing={1.4}>
                {links.map((link) => (
                  <Link
                    key={link.label}
                    component={
                      RouterLink
                    }
                    to={link.path}
                    underline="none"
                    color="inherit"
                    sx={{
                      opacity: .75,

                      transition:
                        ".25s",

                      "&:hover": {
                        opacity: 1,

                        color:
                          "#2AAE66",
                      },
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Divider
          sx={{
            my: 5,
            borderColor:
              "rgba(255,255,255,.1)",
          }}
        />

        {/* =====================================
            OFFICE LOCATIONS
        ===================================== */}

        <Typography
          fontWeight={700}
          mb={3}
        >
          Our Offices
        </Typography>

        <Grid container spacing={4}>
          {offices.map((office) => (
            <Grid item xs={12} sm={6} md={4} key={office.name}>
              <Typography
                fontWeight={700}
                fontSize={15}
                mb={1.25}
                color="rgba(255,255,255,.95)"
              >
                {office.name}
              </Typography>

              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <LocationOn sx={{ fontSize: 17, color: "#2AAE66", mt: 0.3, flexShrink: 0 }} />
                  <Typography
                    color="rgba(255,255,255,.7)"
                    fontSize={13.5}
                    lineHeight={1.65}
                  >
                    {office.address}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Phone sx={{ fontSize: 16, color: "#2AAE66", flexShrink: 0 }} />
                  <Link
                    href={`tel:${office.phone.replace(/[^+\d]/g, "")}`}
                    underline="none"
                    color="inherit"
                    sx={{
                      fontSize: 13.5,
                      opacity: 0.7,
                      transition: ".25s",
                      "&:hover": { opacity: 1, color: "#2AAE66" },
                    }}
                  >
                    {office.phone}
                  </Link>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Email sx={{ fontSize: 16, color: "#2AAE66", flexShrink: 0 }} />
                  <Link
                    href={`mailto:${office.email}`}
                    underline="none"
                    color="inherit"
                    sx={{
                      fontSize: 13.5,
                      opacity: 0.7,
                      transition: ".25s",
                      "&:hover": { opacity: 1, color: "#2AAE66" },
                    }}
                  >
                    {office.email}
                  </Link>
                </Stack>
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Divider
          sx={{
            my: 5,
            borderColor:
              "rgba(255,255,255,.1)",
          }}
        />

        {/* =====================================
            BOTTOM
        ===================================== */}

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          spacing={2}
        >
          <Typography
            color="rgba(255,255,255,.6)"
          >
            © {new Date().getFullYear()} GIEVA.
            All rights reserved.
          </Typography>

          <Typography
            color="rgba(255,255,255,.6)"
          >
            Built with ❤️ to transform
            education.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}