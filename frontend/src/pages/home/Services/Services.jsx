import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, CircularProgress, Alert } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import Section from "../../../components/ui/Section";
import SectionHeader from "../../../components/ui/SectionHeader";
import { FeatureGrid } from "../../../components/marketing";

import { getServices } from "../../../services/publicServiceService"; 

// Optional fallback icons if the API doesn't return icons
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import FlightTakeoffRoundedIcon from "@mui/icons-material/FlightTakeoffRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";

const FALLBACK_ICONS = [
    <SchoolRoundedIcon key="1" />,
    <WorkspacePremiumRoundedIcon key="2" />,
    <FlightTakeoffRoundedIcon key="3" />,
    <MenuBookRoundedIcon key="4" />,
    <PsychologyRoundedIcon key="5" />,
    <SupportAgentRoundedIcon key="6" />,
];

export default function Services({
    eyebrow = "Our Services",
    title = "Comprehensive Educational & Career Solutions",
    description = "From admissions and scholarships to visa assistance and career development, we provide end-to-end support to help students and professionals achieve their global ambitions.",
    variant = "glass",
    columns = {
        xs: 1,
        sm: 2,
        lg: 3,
    },
    sx = {},
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        getServices()
            .then((data) => {
                if (!isMounted) return;

                const list = Array.isArray(data) ? data : [];

                // Take only the first 6 services
                const limited = list.slice(0, 6).map((service, index) => ({
                    id: service.id,
                    title: service.title,
                    description: service.description,
                    // Map API image field → what FeatureGrid expects
                    image: service.imageUrl || service.image || null,
                    href: `/services/${service.id}`,
                    featured: service.featured ?? false,
                    category: service.category || "",
                    order: service.order ?? index + 1,
                    // Keep an icon so existing FeatureGrid still works
                    icon: FALLBACK_ICONS[index % FALLBACK_ICONS.length],
                }));

                setItems(limited);
            })
            .catch(() => {
                if (isMounted) {
                    setError("Unable to load services at the moment.");
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <Section sx={sx}>
            <SectionHeader
                eyebrow={eyebrow}
                title={title}
                description={description}
                align="center"
                maxWidth="md"
            />

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ maxWidth: 480, mx: "auto" }}>
                    {error}
                </Alert>
            ) : (
                <>
                    <FeatureGrid
                        items={items}
                        columns={columns}
                        variant={variant}
                    />

                    {/* See Complete Services Button */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            mt: 6,
                        }}
                    >
                        <Button
                            component={RouterLink}
                            to="/our-services"          // ← change if your route is different
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            size="large"
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderRadius: 3,
                                textTransform: "none",
                                fontWeight: 700,
                                bgcolor: "#F97316",     // your orange
                                "&:hover": {
                                    bgcolor: "#ea580c",
                                },
                            }}
                        >
                            See Complete Services
                        </Button>
                    </Box>
                </>
            )}
        </Section>
    );
}

Services.propTypes = {
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    variant: PropTypes.oneOf(["default", "glass", "outlined", "filled"]),
    columns: PropTypes.shape({
        xs: PropTypes.number,
        sm: PropTypes.number,
        lg: PropTypes.number,
    }),
    sx: PropTypes.object,
};