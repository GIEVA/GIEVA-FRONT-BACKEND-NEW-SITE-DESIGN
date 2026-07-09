// pages/ExamCatalog.jsx
//
// Replaces the static EXAM_CATALOG import with a live API fetch.
// examCatalogData.js and examPrices.js are no longer needed by
// this page (they can be deleted once all references are removed).

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Container, Typography, Grid, TextField,
  CircularProgress, Alert, Chip,
} from "@mui/material";
import ExamCard from "../../components/exams/ExamCard";
import { listPublishedExams } from "../../services/examTypeService";

export default function ExamCatalog() {
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    listPublishedExams()
      .then(({ exams }) => setExams(exams || []))
      .catch(() => setError("Failed to load exam catalog. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      exams.filter(
        (exam) =>
          exam.title.toLowerCase().includes(search.toLowerCase()) ||
          exam.description.toLowerCase().includes(search.toLowerCase())
      ),
    [exams, search]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Box mb={6}>
        <Typography variant="h3" fontWeight={700}>
          Exam Registration Services
        </Typography>
        <Typography mt={1} color="text.secondary">
          Let GIEVA handle your registration process while you focus on preparing for success.
        </Typography>
      </Box>

      <TextField
        fullWidth
        placeholder="Search exams…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 4 }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#1E7F4F" }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="text.secondary">
            {search ? `No exams matching "${search}"` : "No exams available right now."}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((exam) => (
            <Grid item xs={12} sm={6} lg={4} key={exam.examType}>
              {/* ExamCard receives the same shape as before — the API
                  response mirrors the old static catalog structure so
                  ExamCard.jsx doesn't need to change at all. */}
              <ExamCard
                exam={{
                  ...exam,
                  // map API field to the shape ExamCard expects
                  amount: exam.pricingType === "flat"
                    ? exam.flatPrice
                    : Math.min(...(exam.priceVariants || []).map((v) => v.price)),
                  image:  exam.imageUrl,
                  route:  `/exam-register/${exam.examType}`,
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}


// import {
//   Box,
//   Container,
//   Typography,
//   Grid,
//   TextField,
// } from "@mui/material";

// import {
//   useState,
//   useMemo,
// } from "react";

// import ExamCard from "../../components/exams/ExamCard";

// import { EXAM_CATALOG }
//   from "../../constants/examCatalogData";

// export default function ExamCatalog() {
//   const [search, setSearch] =
//     useState("");

//   const exams = useMemo(
//     () =>
//       EXAM_CATALOG.filter(
//         (exam) =>
//           exam.title
//             .toLowerCase()
//             .includes(
//               search.toLowerCase()
//             ) ||
//           exam.description
//             .toLowerCase()
//             .includes(
//               search.toLowerCase()
//             )
//       ),
//     [search]
//   );

//   return (
//     <Container
//       maxWidth="xl"
//       sx={{
//         py: 6,
//       }}
//     >
//       <Box mb={6}>
//         <Typography
//           variant="h3"
//           fontWeight={700}
//         >
//           Exam Registration Services
//         </Typography>

//         <Typography
//           mt={1}
//           color="text.secondary"
//         >
//           Let GIEVA handle
//           your registration
//           process while you
//           focus on preparing
//           for success.
//         </Typography>
//       </Box>

//       <TextField
//         fullWidth
//         placeholder="Search exams..."
//         value={search}
//         onChange={(e) =>
//           setSearch(
//             e.target.value
//           )
//         }
//         sx={{ mb: 4 }}
//       />

//       <Grid container spacing={3}>
//         {exams.map((exam) => (
//           <Grid
//             item
//             xs={12}
//             sm={6}
//             lg={4}
//             key={
//               exam.examType
//             }
//           >
//             <ExamCard
//               exam={exam}
//             />
//           </Grid>
//         ))}
//       </Grid>
//     </Container>
//   );
// }