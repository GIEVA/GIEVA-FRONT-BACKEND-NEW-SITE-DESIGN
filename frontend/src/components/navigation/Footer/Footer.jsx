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