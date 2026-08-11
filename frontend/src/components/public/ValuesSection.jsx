import {
    Card,
    CardContent,
    Container,
    Grid,
    Typography,
} from "@mui/material";

import FavoriteIcon from "@mui/icons-material/Favorite";
import PublicIcon from "@mui/icons-material/Public";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import Diversity3Icon from "@mui/icons-material/Diversity3";

import SectionHeader from "../common/SectionHeader";
import SectionWrapper from "../common/SectionWrapper";

const values = [
    {
        icon: <FavoriteIcon color="primary" sx={{ fontSize: 50 }} />,
        title: "Integrity",
        description:
            "We uphold honesty, transparency and accountability in everything we do.",
    },
    {
        icon: <PublicIcon color="primary" sx={{ fontSize: 50 }} />,
        title: "Global Impact",
        description:
            "Connecting people with educational opportunities across the world.",
    },
    {
        icon: <EmojiObjectsIcon color="primary" sx={{ fontSize: 50 }} />,
        title: "Innovation",
        description:
            "Leveraging technology and creativity to transform learning.",
    },
    {
        icon: <Diversity3Icon color="primary" sx={{ fontSize: 50 }} />,
        title: "Inclusiveness",
        description:
            "Creating opportunities for everyone regardless of background.",
    },
];

export default function ValuesSection() {
    return (
        <SectionWrapper background="#F8FAFC">

            <Container maxWidth="xl">

                <SectionHeader
                    eyebrow="OUR VALUES"
                    title="The Principles That Define Us"
                    description="These core values shape our culture and every decision we make."
                />

                <Grid container spacing={4}>

                    {values.map((value) => (
                        <Grid
                            item
                            xs={12}
                            sm={6}
                            lg={3}
                            key={value.title}
                        >
                            <Card
                                sx={{
                                    height: "100%",
                                    textAlign: "center",
                                    borderRadius: 4,
                                }}
                            >
                                <CardContent sx={{ p: 4 }}>

                                    {value.icon}

                                    <Typography
                                        variant="h5"
                                        fontWeight={700}
                                        mt={3}
                                        mb={2}
                                    >
                                        {value.title}
                                    </Typography>

                                    <Typography
                                        color="text.secondary"
                                    >
                                        {value.description}
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