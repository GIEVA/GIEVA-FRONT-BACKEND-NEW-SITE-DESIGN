import PropTypes from "prop-types";

import {
  Box,
  Button,
} from "@mui/material";

import {
  ArrowForward,
} from "@mui/icons-material";

import {
  useNavigate,
} from "react-router-dom";

import Section from "../../../components/ui/Section";
import SectionHeader from "../../../components/ui/SectionHeader";


import { ArticleGrid } from "../../../components/marketing/ArticleGrid";

export default function News({
  sx = {},
}) {
  const navigate = useNavigate();

  return (
    <Section
      sx={{
        bgcolor: "background.default",
        ...sx,
      }}
    >
      <SectionHeader
        eyebrow="Latest News"
        title="Insights, Updates & Opportunities"
        description="Explore the latest articles on scholarships, study abroad opportunities, artificial intelligence, technology, global education, career development, and other topics to keep you informed."
        align="center"
        maxWidth="md"
      />

      <ArticleGrid limit={5} />

      <Box
        mt={6}
        display="flex"
        justifyContent="center"
      >
        <Button
          variant="outlined"
          size="large"
          endIcon={<ArrowForward />}
          onClick={() =>
            navigate("/articles")
          }
          sx={{
            borderRadius: 100,
            px: 4,
            py: 1.4,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          View All Articles
        </Button>
      </Box>
    </Section>
  );
}

News.propTypes = {
  sx: PropTypes.object,
};