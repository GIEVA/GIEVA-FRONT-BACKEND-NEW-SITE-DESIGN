import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const faqs = [
  {
    question: "How can GIEVA help me study abroad?",
    answer:
      "We provide complete admission guidance including university selection, application preparation, scholarship support, visa processing, and pre-departure assistance.",
  },
  {
    question: "Do you assist with scholarship applications?",
    answer:
      "Yes. We help identify scholarship opportunities, review application documents, improve essays, prepare recommendation strategies, and increase your chances of success.",
  },
  {
    question: "Which international examinations can I register through GIEVA?",
    answer:
      "We support registration for IELTS, TOEFL, SAT, GRE, GMAT, Duolingo English Test, PTE, ACT and other internationally recognized examinations.",
  },
  {
    question: "Can professionals also benefit from your services?",
    answer:
      "Absolutely. We provide career counselling, CV optimization, interview coaching, professional development, international opportunities and leadership programmes.",
  },
  {
    question: "How do I book a consultation?",
    answer:
      "Simply click the 'Book Consultancy' button anywhere on the website to schedule a consultation with one of our experienced advisors.",
  },
];

export default function FAQSection() {
  return (
    <Box
      sx={{
        py: {
          xs: 8,
          md: 12,
        },
        bgcolor: "#F8FAFC",
      }}
    >
      <Container maxWidth="lg">
        <Stack
          spacing={2}
          alignItems="center"
          mb={7}
        >
          <Typography
            color="primary"
            fontWeight={700}
            letterSpacing={2}
          >
            FREQUENTLY ASKED QUESTIONS
          </Typography>

          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
          >
            Have Questions? We Have Answers.
          </Typography>

          <Typography
            color="text.secondary"
            textAlign="center"
            maxWidth={700}
          >
            Find answers to some of the most common questions about
            our educational consulting, scholarship support,
            admissions and career services.
          </Typography>
        </Stack>

        <Grid
          container
          spacing={5}
          alignItems="center"
        >
          {/* Left Illustration */}

          <Grid
            item
            xs={12}
            md={4}
          >
            <Stack
              alignItems="center"
              spacing={3}
            >
              <Box
                sx={{
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HelpOutlineIcon
                  sx={{
                    color: "#fff",
                    fontSize: 90,
                  }}
                />
              </Box>

              <Typography
                align="center"
                color="text.secondary"
              >
                Still have questions?
                <br />
                Our advisors are available to help you.
              </Typography>
            </Stack>
          </Grid>

          {/* Right FAQs */}

          <Grid
            item
            xs={12}
            md={8}
          >
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                disableGutters
                elevation={0}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "grey.200",

                  "&:before": {
                    display: "none",
                  },

                  "&.Mui-expanded": {
                    borderColor: "primary.main",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                >
                  <Typography
                    fontWeight={700}
                  >
                    {faq.question}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails>
                  <Typography
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.9,
                    }}
                  >
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}