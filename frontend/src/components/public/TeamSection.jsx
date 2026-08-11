import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import {
  Facebook,
  LinkedIn,
  X,
  ArrowForward,
} from "@mui/icons-material";

import { Link } from "react-router-dom";

// Replace with your images
import member1 from "../../assets/images/team/member1.jpg";
import member2 from "../../assets/images/team/member2.jpg";
import member3 from "../../assets/images/team/member3.jpg";
import member4 from "../../assets/images/team/member4.jpg";

const members = [
  {
    name: "Dr. John Doe",
    role: "Founder & Executive Director",
    image: member1,
  },
  {
    name: "Jane Smith",
    role: "Head of International Admissions",
    image: member2,
  },
  {
    name: "Michael Johnson",
    role: "Career Development Lead",
    image: member3,
  },
  {
    name: "Sarah Williams",
    role: "Scholarship Advisor",
    image: member4,
  },
];

export default function TeamSection() {
  return (
    <Box
      sx={{
        py: {
          xs: 8,
          md: 12,
        },
        bgcolor: "#F8FAFC",
      }}
    >
      <Container maxWidth="xl">
        {/* Heading */}

        <Stack
          spacing={2}
          alignItems="center"
          mb={7}
        >
          <Typography
            color="primary"
            fontWeight={700}
            letterSpacing={2}
          >
            OUR TEAM
          </Typography>

          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
          >
            Meet the Experts Behind GIEVA
          </Typography>

          <Typography
            color="text.secondary"
            maxWidth={700}
            textAlign="center"
          >
            Our passionate team of education consultants,
            mentors and professionals are committed to helping
            students and institutions achieve success globally.
          </Typography>
        </Stack>

        {/* Team Cards */}

        <Grid container spacing={4}>
          {members.map((member) => (
            <Grid
              item
              xs={12}
              sm={6}
              lg={3}
              key={member.name}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  transition: ".35s",
                  height: "100%",

                  "&:hover": {
                    transform: "translateY(-10px)",
                    boxShadow: 10,
                  },
                }}
              >
                <CardMedia
                  component="img"
                  image={member.image}
                  alt={member.name}
                  sx={{
                    height: 320,
                    objectFit: "cover",
                  }}
                />

                <CardContent>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    gutterBottom
                  >
                    {member.name}
                  </Typography>

                  <Typography
                    color="primary"
                    sx={{
                      mb: 3,
                    }}
                  >
                    {member.role}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                  >
                    <IconButton size="small">
                      <Facebook />
                    </IconButton>

                    <IconButton size="small">
                      <LinkedIn />
                    </IconButton>

                    <IconButton size="small">
                      <X />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* CTA */}

        <Stack
          alignItems="center"
          mt={8}
        >
          <Button
            component={Link}
            to="/team"
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            sx={{
              px: 5,
              py: 1.5,
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Meet Our Full Team
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}