import { Box, Container, Typography } from "@mui/material";
import Marquee from "react-fast-marquee";

// Replace these imports with your actual partner logos
import partner1 from "../../assets/partners/partner1.png";
import partner2 from "../../assets/partners/partner2.png";
import partner3 from "../../assets/partners/partner3.png";
import partner4 from "../../assets/partners/partner4.png";
import partner5 from "../../assets/partners/partner5.png";
import partner6 from "../../assets/partners/partner6.png";

const partners = [
    partner1,
    partner2,
    partner3,
    partner4,
    partner5,
    partner6,
];

export default function PartnersSection() {
    return (
        <Box
            sx={{
                py: 8,
                bgcolor: "#fff",
            }}
        >
            <Container maxWidth="xl">

                <Typography
                    variant="h4"
                    fontWeight={700}
                    textAlign="center"
                    mb={6}
                >
                    Trusted By Leading Organizations
                </Typography>

                <Marquee
                    speed={45}
                    gradient={false}
                    pauseOnHover
                >
                    {partners.map((logo, index) => (
                        <Box
                            key={index}
                            sx={{
                                mx: 5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Box
                                component="img"
                                src={logo}
                                alt={`Partner ${index + 1}`}
                                sx={{
                                    height: 90,
                                    objectFit: "contain",
                                    filter: "grayscale(100%)",
                                    transition: ".3s",

                                    "&:hover": {
                                        filter: "grayscale(0%)",
                                        transform: "scale(1.05)",
                                    },
                                }}
                            />
                        </Box>
                    ))}
                </Marquee>

            </Container>
        </Box>
    );
}