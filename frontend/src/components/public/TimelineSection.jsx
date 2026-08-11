import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";

import SectionHeader from "../common/SectionHeader";
import SectionWrapper from "../common/SectionWrapper";

const timeline = [
  {
    year: "2014",
    title: "Organization Founded",
    description:
      "GIEVA began its mission to provide quality educational opportunities and mentorship.",
  },
  {
    year: "2017",
    title: "International Expansion",
    description:
      "Established collaborations with universities and educational organizations across multiple countries.",
  },
  {
    year: "2020",
    title: "Digital Transformation",
    description:
      "Launched virtual counselling, online mentorship and digital education services.",
  },
  {
    year: "2023",
    title: "Global Recognition",
    description:
      "Expanded scholarship support and international partnerships across several continents.",
  },
];

export default function TimelineSection() {
  return (
    <SectionWrapper background="#F8FAFC">
      <Container maxWidth="xl">
        <SectionHeader
          eyebrow="OUR JOURNEY"
          title="Milestones That Define Our Growth"
          description="Every milestone represents another step toward expanding educational opportunities around the world."
        />

        <Grid container spacing={4}>
          {timeline.map((item) => (
            <Grid
              item
              xs={12}
              md={6}
              key={item.year}
            >
              <Card
                elevation={0}
                sx={{
                  position: "relative",
                  borderRadius: 4,
                  overflow: "hidden",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 8,
                    height: "100%",
                    bgcolor: "primary.main",
                  }}
                />

                <CardContent
                  sx={{
                    p: 4,
                    pl: 5,
                  }}
                >
                  <Typography
                    variant="h2"
                    color="primary"
                    fontWeight={800}
                  >
                    {item.year}
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                    mt={2}
                    mb={2}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    lineHeight={1.9}
                  >
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </SectionWrapper>
  );
}