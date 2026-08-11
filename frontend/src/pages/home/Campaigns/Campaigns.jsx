import PropTypes from "prop-types";

import Section from "../../../components/ui/Section";
import SectionHeader from "../../../components/ui/SectionHeader";

import { CampaignSlider } from "../../../components/marketing/CampaignSlider";

export default function Campaigns({
  sx = {},
}) {
  return (
    <Section
        sx={{
            py: {
            xs: 8,
            md: 12,
            },
            bgcolor: "grey.50",
        }}
    >
      <SectionHeader
        eyebrow="Latest Opportunities"
        title="Don't Miss Our Latest Campaigns"
        description="Stay informed about upcoming webinars, scholarships, international exams, admissions, workshops, and other opportunities designed to help you achieve your academic and professional goals."
        align="center"
        maxWidth="md"
      />

      <CampaignSlider />
    </Section>
  );
}

Campaigns.propTypes = {
  sx: PropTypes.object,
};