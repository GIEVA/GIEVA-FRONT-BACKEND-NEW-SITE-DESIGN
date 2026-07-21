import {
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Rating,
  Stack,
  Typography,
} from "@mui/material";

import FormatQuoteIcon from "@mui/icons-material/FormatQuote";

const testimonials = [
  {
    name: "Blessing Johnson",
    title: "MSc Student - Canada",
    image: "/images/testimonials/user1.jpg",
    rating: 5,
    comment:
      "GIEVA made my study abroad journey stress-free. From admission to visa processing, every step was handled professionally.",
  },
  {
    name: "David Musa",
    title: "Scholarship Recipient",
    image: "/images/testimonials/user2.jpg",
    rating: 5,
    comment:
      "The scholarship mentorship completely changed my future. I secured a fully funded opportunity I never imagined possible.",
  },
  {
    name: "Esther Williams",
    title: "Career Development Program",
    image: "/images/testimonials/user3.jpg",
    rating: 5,
    comment:
      "The career coaching and CV review sessions gave me confidence and helped me secure my dream job.",
  },
];

export default function TestimonialsSection() {
  return (
    <Box
      sx={{
        py: {
          xs: 8,
          md: 12,
        },
        bgcolor: "#fff",
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
            TESTIMONIALS
          </Typography>

          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
          >
            What Our Students Say
          </Typography>

          <Typography
            color="text.secondary"
            maxWidth={700}
            textAlign="center"
          >
            Hear directly from students and professionals whose
            lives have been transformed through GIEVA’s services.
          </Typography>
        </Stack>

        {/* Testimonial Cards */}

        <Grid container spacing={4}>
          {testimonials.map((item) => (
            <Grid
              item
              xs={12}
              md={4}
              key={item.name}
            >
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: "grey.200",
                  transition: ".3s",

                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 8,
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: 4,
                  }}
                >
                  <FormatQuoteIcon
                    color="primary"
                    sx={{
                      fontSize: 45,
                      mb: 2,
                    }}
                  />

                  <Typography
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.9,
                      mb: 4,
                    }}
                  >
                    "{item.comment}"
                  </Typography>

                  <Rating
                    value={item.rating}
                    readOnly
                    sx={{
                      mb: 3,
                    }}
                  />

                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                  >
                    <Avatar
                      src={item.image}
                      sx={{
                        width: 60,
                        height: 60,
                      }}
                    />

                    <Box>
                      <Typography
                        fontWeight={700}
                      >
                        {item.name}
                      </Typography>

                      <Typography
                        color="text.secondary"
                        fontSize={14}
                      >
                        {item.title}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}