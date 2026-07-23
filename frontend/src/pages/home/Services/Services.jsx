import PropTypes from "prop-types";

import Section from "../../../components/ui/Section";
import SectionHeader from "../../../components/ui/SectionHeader";
import { FeatureGrid } from "../../../components/marketing";

import serviceData from "./ServiceData";

export default function Services({
    eyebrow = "Our Services",

    title = "Comprehensive Educational & Career Solutions",

    description = "From admissions and scholarships to visa assistance and career development, we provide end-to-end support to help students and professionals achieve their global ambitions.",

    items = serviceData,

    variant = "glass",

    columns = {
        xs: 1,
        sm: 2,
        lg: 3,
    },

    sx = {},
}) {
    return (
        <Section sx={sx}>
            <SectionHeader
                eyebrow={eyebrow}
                title={title}
                description={description}
                align="center"
                maxWidth="md"
            />

            <FeatureGrid
                items={items}
                columns={columns}
                variant={variant}
            />
        </Section>
    );
}

Services.propTypes = {
    eyebrow: PropTypes.string,

    title: PropTypes.string,

    description: PropTypes.string,

    items: PropTypes.array,

    variant: PropTypes.oneOf([
        "default",
        "glass",
        "outlined",
        "filled",
    ]),

    columns: PropTypes.shape({
        xs: PropTypes.number,
        sm: PropTypes.number,
        lg: PropTypes.number,
    }),

    sx: PropTypes.object,
};