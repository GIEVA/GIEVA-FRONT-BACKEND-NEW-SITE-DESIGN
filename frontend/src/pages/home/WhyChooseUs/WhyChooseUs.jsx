import PropTypes from "prop-types";
import { Stack } from "@mui/material";

import Section from "../../../components/ui/Section";
import SectionHeader from "../../../components/ui/SectionHeader";

import {
    ActionGroup,
    FeatureGrid,
    ImageCard,
    SplitSection,
} from "../../../components/marketing";

import whyChooseUsData from "./WhyChooseUsData";

export default function WhyChooseUs({
    data = whyChooseUsData,
    reverse = true,
    sx = {},
}) {
    const {
        eyebrow,
        title,
        description,
        image,
        features,
        actions,
    } = data;

    return (
        <Section sx={sx}>
            <SplitSection
                reverse={reverse}
                left={
                    <ImageCard
                        image={image}
                    />
                }
                right={
                    <Stack spacing={5}>
                        <SectionHeader
                            eyebrow={eyebrow}
                            title={title}
                            description={description}
                            align="left"
                        />

                        <FeatureGrid
                            items={features}
                            columns={{
                                xs: 1,
                                sm: 2,
                            }}
                            variant="minimal"
                        />

                        <ActionGroup
                            actions={actions}
                        />
                    </Stack>
                }
            />
        </Section>
    );
}

WhyChooseUs.propTypes = {
    data: PropTypes.shape({
        eyebrow: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
        image: PropTypes.object,
        features: PropTypes.array,
        actions: PropTypes.array,
    }),

    reverse: PropTypes.bool,

    sx: PropTypes.object,
};