import PropTypes from "prop-types";

import Section from "../../../components/ui/Section";
import SectionHeader from "../../../components/ui/SectionHeader";

import { TestimonialGrid } from "../../../components/marketing";

import testimonialData from "./TestimonialData";

export default function Testimonials({
    data = testimonialData,
    sx = {},
}) {
    return (
        <Section sx={sx}>
            <SectionHeader
                eyebrow="Success Stories"
                title="Hear From Students We've Helped"
                description="Discover how our personalized guidance and support have empowered students to secure admissions, scholarships, and opportunities at leading institutions around the world."
                align="center"
                maxWidth="md"
            />

            <TestimonialGrid
                testimonials={data}
                gridSize={{
                    xs: 12,
                    md: 6,
                    lg: 4,
                }}
            />
        </Section>
    );
}

Testimonials.propTypes = {
    data: PropTypes.array,

    sx: PropTypes.object,
};