import PropTypes from "prop-types";

import Section from "../../../components/ui/Section";
import SectionHeader from "../../../components/ui/SectionHeader";

import {
    ProgramGrid,
    ActionGroup,
} from "../../../components/marketing";

import programData from "./ProgramData";

export default function Programs({
    data = programData,
    sx = {},
}) {
    return (
        <Section sx={sx}>
            <SectionHeader
                eyebrow="Featured Programs"
                title="Discover Programs Designed for Your Success"
                description="Explore some of our most impactful educational and professional development programs that empower students and professionals to achieve their global ambitions."
                align="center"
                maxWidth="md"
            />

            <ProgramGrid
                programs={data}
                gridSize={{
                    xs: 12,
                    sm: 6,
                    lg: 4,
                }}
            />

            <ActionGroup
                actions={[
                    {
                        id: 1,
                        label: "View All Programs",
                        href: "/programs",
                        variant: "contained",
                    },
                ]}
            />
        </Section>
    );
}

Programs.propTypes = {
    data: PropTypes.array,

    sx: PropTypes.object,
};