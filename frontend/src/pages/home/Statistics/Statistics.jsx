import PropTypes from "prop-types";

import Section from "../../../components/ui/Section";
import SectionHeader from "../../../components/ui/SectionHeader";

import { MetricGrid } from "../../../components/marketing";

import statisticsData from "./StatisticsData";

export default function Statistics({
    data = statisticsData,
    sx = {},
}) {
    const {
        eyebrow,
        title,
        description,
        metrics,
    } = data;

    return (
        <Section sx={sx}>
            <SectionHeader
                eyebrow={eyebrow}
                title={title}
                description={description}
                align="center"
                maxWidth="md"
            />

            <MetricGrid
                metrics={metrics}
                gridSize={{
                    xs: 12,
                    sm: 6,
                    lg: 3,
                }}
            />
        </Section>
    );
}

Statistics.propTypes = {
    data: PropTypes.shape({
        eyebrow: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
        metrics: PropTypes.array,
    }),

    sx: PropTypes.object,
};