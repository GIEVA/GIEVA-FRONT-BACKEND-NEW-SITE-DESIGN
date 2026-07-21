import {
    Card,
    CardContent,
    Container,
    Grid,
    Typography,
} from "@mui/material";

import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import VisibilityIcon from "@mui/icons-material/Visibility";

import SectionHeader from "../common/SectionHeader";
import SectionWrapper from "../common/SectionWrapper";

export default function MissionVisionSection() {
    return (
        <SectionWrapper background="#fff">

            <Container maxWidth="xl">

                <SectionHeader
                    eyebrow="MISSION & VISION"
                    title="Driven by Purpose"
                    description="Everything we do is guided by a commitment to educational excellence and global impact."
                />

                <Grid container spacing={4}>

                    <Grid item xs={12} md={6}>

                        <Card
                            sx={{
                                height: "100%",
                                borderRadius: 4,
                            }}
                        >
                            <CardContent sx={{ p: 5 }}>

                                <TrackChangesIcon
                                    color="primary"
                                    sx={{
                                        fontSize: 60,
                                        mb: 2,
                                    }}
                                />

                                <Typography
                                    variant="h4"
                                    fontWeight={700}
                                    mb={2}
                                >
                                    Our Mission
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                    lineHeight={1.9}
                                >
                                    To empower individuals and
                                    institutions through quality
                                    education, international
                                    opportunities, innovation,
                                    mentorship and lifelong learning.
                                </Typography>

                            </CardContent>

                        </Card>

                    </Grid>

                    <Grid item xs={12} md={6}>

                        <Card
                            sx={{
                                height: "100%",
                                borderRadius: 4,
                            }}
                        >
                            <CardContent sx={{ p: 5 }}>

                                <VisibilityIcon
                                    color="primary"
                                    sx={{
                                        fontSize: 60,
                                        mb: 2,
                                    }}
                                />

                                <Typography
                                    variant="h4"
                                    fontWeight={700}
                                    mb={2}
                                >
                                    Our Vision
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                    lineHeight={1.9}
                                >
                                    To become Africa's leading
                                    education and global mobility
                                    organization connecting people
                                    with opportunities worldwide.
                                </Typography>

                            </CardContent>

                        </Card>

                    </Grid>

                </Grid>

            </Container>

        </SectionWrapper>
    );
}