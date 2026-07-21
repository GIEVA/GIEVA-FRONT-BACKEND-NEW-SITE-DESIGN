import {
  Box,
  Container,
  Grid,
  Stack,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
} from "@mui/material";

import {
  Facebook,
  Instagram,
  LinkedIn,
  YouTube,
  X,
  ArrowForward,
  LocationOn,
  Phone,
  Language,
} from "@mui/icons-material";

import { Link } from "react-router-dom";

import logo from "../../assets/logo.png";

const companyLinks = [
  { label: "About", link: "/about" },
  { label: "Partners", link: "/partners" },
  { label: "Team", link: "/team" },
];

const serviceLinks = [
  { label: "Study Abroad", link: "/services" },
  { label: "HEALS", link: "/services" },
  { label: "Career Advising", link: "/services" },
  { label: "Scholarships", link: "/services" },
];

const socials = [
  {
    icon: <Instagram />,
    link: "https://instagram.com/gieva.org",
  },
  {
    icon: <Facebook />,
    link: "https://facebook.com/gieva.org",
  },
  {
    icon: <X />,
    link: "https://x.com/gieva_org",
  },
  {
    icon: <LinkedIn />,
    link: "https://linkedin.com/company/gieva-org",
  },
  {
    icon: <YouTube />,
    link: "https://youtube.com/@gieva-org",
  },
];

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#120633",
        color: "#fff",
        mt: 10,
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          py: 8,
        }}
      >
        {/* Top */}

        <Grid
          container
          spacing={6}
        >
          {/* Brand */}

          <Grid
            item
            xs={12}
            md={4}
          >
            <Stack spacing={3}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <Box
                  component="img"
                  src={logo}
                  alt="logo"
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                  }}
                />

                <Typography
                  fontSize={30}
                  fontWeight={700}
                >
                  GIEVA

                  <Typography
                    component="span"
                    color="#1BAA5C"
                    fontWeight={400}
                  >
                    .org
                  </Typography>
                </Typography>
              </Stack>

              <Typography color="rgba(255,255,255,.75)">
                Sign up to our newsletter to receive the latest
                updates, scholarship opportunities and educational
                news.
              </Typography>

              <Stack
                direction="row"
                spacing={1}
              >
                <TextField
                  placeholder="Enter Email Address"
                  size="small"
                  fullWidth
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: 2,
                  }}
                />

                <Button
                  variant="contained"
                  color="warning"
                  sx={{
                    minWidth: 56,
                  }}
                >
                  <ArrowForward />
                </Button>
              </Stack>
            </Stack>
          </Grid>

          {/* Company */}

          <Grid
            item
            xs={6}
            md={2}
          >
            <Typography
              fontWeight={700}
              mb={3}
              color="#FF8A65"
            >
              COMPANY
            </Typography>

            <Stack spacing={2}>
              {companyLinks.map((item) => (
                <Typography
                  key={item.label}
                  component={Link}
                  to={item.link}
                  sx={{
                    color: "#fff",
                    textDecoration: "none",

                    "&:hover": {
                      color: "#FF8A65",
                    },
                  }}
                >
                  {item.label}
                </Typography>
              ))}
            </Stack>
          </Grid>

          {/* Services */}

          <Grid
            item
            xs={6}
            md={2}
          >
            <Typography
              fontWeight={700}
              mb={3}
              color="#FF8A65"
            >
              SERVICES
            </Typography>

            <Stack spacing={2}>
              {serviceLinks.map((item) => (
                <Typography
                  key={item.label}
                  component={Link}
                  to={item.link}
                  sx={{
                    color: "#fff",
                    textDecoration: "none",

                    "&:hover": {
                      color: "#FF8A65",
                    },
                  }}
                >
                  {item.label}
                </Typography>
              ))}
            </Stack>
          </Grid>

          {/* Contact */}

          <Grid
            item
            xs={12}
            md={4}
          >
            <Typography
              fontWeight={700}
              mb={3}
              color="#FF8A65"
            >
              CONTACT
            </Typography>

            <Stack spacing={3}>
              <Stack
                direction="row"
                spacing={2}
              >
                <LocationOn />

                <Typography color="rgba(255,255,255,.8)">
                  Lagos State House, 3rd Floor, Suite 329,
                  Plot 78 Ralph Shodeinde Street,
                  CBD Abuja, Nigeria
                </Typography>
              </Stack>

              <Stack
                direction="row"
                spacing={2}
              >
                <Phone />

                <Typography>
                  +2347035250399
                </Typography>
              </Stack>

              <Stack
                direction="row"
                spacing={2}
              >
                <Language />

                <Typography>
                  www.gieva.org
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        <Divider
          sx={{
            my: 5,
            borderColor: "rgba(255,255,255,.15)",
          }}
        />

        {/* Bottom */}

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={3}
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack
            direction="row"
            spacing={3}
          >
            <Typography
              component={Link}
              to="/terms"
              sx={{
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Terms
            </Typography>

            <Typography
              component={Link}
              to="/privacy"
              sx={{
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Privacy
            </Typography>
          </Stack>

          <Typography
            color="rgba(255,255,255,.7)"
          >
            © {year} GIEVA. All Rights Reserved.
          </Typography>

          <Stack
            direction="row"
            spacing={1}
          >
            {socials.map((social, index) => (
              <IconButton
                key={index}
                component="a"
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "#fff",

                  "&:hover": {
                    bgcolor: "#E65320",
                  },
                }}
              >
                {social.icon}
              </IconButton>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}