import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
} from "@mui/material";

import {
  useState,
  useMemo,
} from "react";

import ExamCard from "../../components/exams/ExamCard";

import { EXAM_CATALOG }
  from "../../constants/examCatalogData";

export default function ExamCatalog() {
  const [search, setSearch] =
    useState("");

  const exams = useMemo(
    () =>
      EXAM_CATALOG.filter(
        (exam) =>
          exam.title
            .toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          exam.description
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      ),
    [search]
  );

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 6,
      }}
    >
      <Box mb={6}>
        <Typography
          variant="h3"
          fontWeight={700}
        >
          Exam Registration Services
        </Typography>

        <Typography
          mt={1}
          color="text.secondary"
        >
          Let GIEVA handle
          your registration
          process while you
          focus on preparing
          for success.
        </Typography>
      </Box>

      <TextField
        fullWidth
        placeholder="Search exams..."
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
        sx={{ mb: 4 }}
      />

      <Grid container spacing={3}>
        {exams.map((exam) => (
          <Grid
            item
            xs={12}
            sm={6}
            lg={4}
            key={
              exam.examType
            }
          >
            <ExamCard
              exam={exam}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}