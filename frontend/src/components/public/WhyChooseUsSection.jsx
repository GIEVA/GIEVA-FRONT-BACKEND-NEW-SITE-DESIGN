import {
  Box,
  Button,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { Link } from "react-router-dom";

import SectionHeader from "../common/SectionHeader";
import SectionWrapper from "../common/SectionWrapper";

import whyImage from "../../assets/images/about/why-choose-us.jpg";

const reasons = [
  "Experienced education consultants",
  "Global university partnerships",
  "Personalized mentorship",
  "International scholarship guidance",
  "Professional career coaching",
  "Visa & travel support",
  "Transparent application process",
  "Dedicated post-admission support",
];

export default function WhyChooseUsSection() {
  return (
    <SectionWrapper background="#fff">
      <Container maxWidth="xl">
        <Grid
          container
          spacing={8}
          alignItems="center"
        >
          {/* Left */}

          <Grid
            item
            xs={12}
            lg={6}
          >
            <SectionHeader
              align="flex-start"
              eyebrow="WHY CHOOSE GIEVA"
              title="Your Trusted Partner for Global Educational Success"
              description="We combine expertise, innovation and personalized support to help students and professionals achieve their educational and career goals."
            />

            <List disablePadding>
              {reasons.map((item) => (
                <ListItem
                  key={item}
                  disablePadding
                  sx={{
                    mb: 2,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 42,
                    }}
                  >
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>

                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>

            <Button
              component={Link}
              to="/book-consultancy"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                mt: 4,
                px: 5,
                py: 1.5,
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Book Consultancy
            </Button>
          </Grid>

          {/* Right */}

          <Grid
            item
            xs={12}
            lg={6}
          >
            <Box
              component="img"
              src={whyImage}
              alt="Why Choose GIEVA"
              sx={{
                width: "100%",
                borderRadius: 5,
                display: "block",
              }}
            />

            <Paper
              elevation={10}
              sx={{
                mt: -8,
                ml: {
                  xs: 2,
                  md: 6,
                },
                p: 4,
                borderRadius: 4,
                position: "relative",
                maxWidth: 420,
              }}
            >
              <Typography
                variant="h3"
                fontWeight={800}
                color="primary"
              >
                98%
              </Typography>

              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
              >
                Student Satisfaction
              </Typography>

              <Typography color="text.secondary">
                Thousands of students have trusted GIEVA to guide
                their educational journey and professional growth.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </SectionWrapper>
  );
}