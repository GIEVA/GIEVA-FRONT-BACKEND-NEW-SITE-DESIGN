import PropTypes from "prop-types";
import { Stack } from "@mui/material";

import Section from "../../../components/ui/Section";
import SectionHeader from "../../../components/ui/SectionHeader";

import {
    ImageCard,
    FeatureGrid,
    SplitSection,
} from "../../../components/marketing";

import { HeroActions } from "../hero";

import aboutData from "./AboutData";

export default function AboutPreview({
    data = aboutData,
    reverse = false,
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

                        <HeroActions
                            primary={actions.primary}
                            secondary={actions.secondary}
                        />
                    </Stack>
                }
            />
        </Section>
    );
}

AboutPreview.propTypes = {
    data: PropTypes.shape({
        eyebrow: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
        image: PropTypes.object,
        features: PropTypes.array,
        actions: PropTypes.object,
    }),

    reverse: PropTypes.bool,

    sx: PropTypes.object,
};