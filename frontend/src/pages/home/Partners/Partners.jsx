import PropTypes from "prop-types";

import Section from "../../../components/ui/Section";
import SectionHeader from "../../../components/ui/SectionHeader";
import { LogoCloud } from "../../../components/marketing";

import partnerData from "./PartnerData";

export default function Partners({
    eyebrow = "Our Partners",
    title = "Trusted by Leading Institutions Worldwide",
    description = "We collaborate with universities, organizations, and strategic partners to create opportunities that transform lives through education, innovation, and global engagement.",

    logos = partnerData,

    variant = "grayscale",

    columns = {
        xs: 2,
        sm: 3,
        md: 6,
    },

    sx = {},
}) {
    return (
        <Section
            sx={sx}
        >
            <SectionHeader
                eyebrow={eyebrow}
                title={title}
                description={description}
                align="center"
                maxWidth="md"
            />

            <LogoCloud
                logos={logos}
                columns={columns}
                variant={variant}
            />
        </Section>
    );
}

Partners.propTypes = {
    eyebrow: PropTypes.string,

    title: PropTypes.string,

    description: PropTypes.string,

    logos: PropTypes.array,

    variant: PropTypes.oneOf([
        "default",
        "grayscale",
        "outlined",
    ]),

    columns: PropTypes.shape({
        xs: PropTypes.number,
        sm: PropTypes.number,
        md: PropTypes.number,
    }),

    sx: PropTypes.object,
};