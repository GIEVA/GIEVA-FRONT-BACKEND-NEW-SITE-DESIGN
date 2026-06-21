import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Paper,
  InputBase,
  Chip,
  Avatar,
  IconButton,
  Button,
  Skeleton,
  Alert,
  Divider,
  Tooltip,
} from "@mui/material";

import {
  Search,
  BookmarkBorder,
  Bookmark,
  FilterList,
  ArrowBack,
  VideoLibrary,
  MenuBook,
  Refresh,
  Clear,
} from "@mui/icons-material";

import { getAllCourses } from "../services/Courseservice";
import API from "../services/api";

const BRAND = "#14532d";
const BRAND_MID = "#16a34a";
const BRAND_LIGHT = "#bbf7d0";
const SURFACE = "#f9fafb";
const CARD = "#ffffff";
const BORDER = "#e5e7eb";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6b7280";
const TEXT_MUTED = "#9ca3af";

const CATEGORIES = ["All", "SAT", "IELTS", "CODING", "GRE", "TOEFL"];

const CATEGORY_META = {
  SAT: { bg: "#eff6ff", text: "#1d4ed8", label: "SAT Prep" },
  IELTS: { bg: "#fef3c7", text: "#92400e", label: "IELTS" },
  CODING: { bg: "#f0fdf4", text: "#166534", label: "Coding" },
  GRE: { bg: "#f5f3ff", text: "#5b21b6", label: "GRE Prep" },
  TOEFL: { bg: "#fff7ed", text: "#9a3412", label: "TOEFL" },
};

const LEVELS = ["All Levels", "Beginner", "Intermediate", "Advanced"];

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const formatPrice = (price) =>
  Number(price) === 0
    ? "Free"
    : `₦${Number(price).toLocaleString("en-NG")}/mo`;

const CourseCatalog = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All Levels");
  const [saved, setSaved] = useState([]);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getAllCourses();

      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to fetch courses"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const toggleSave = (id) => {
    setSaved((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        course.description
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        course.tutor?.fullName
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        course.category === category;

      const matchesLevel =
        level === "All Levels" ||
        course.level === level;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLevel
      );
    });
  }, [courses, search, category, level]);

  return (
    <Box bgcolor={SURFACE} minHeight="100vh">

      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          bgcolor: "white",
          borderBottom: `1px solid ${BORDER}`,
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>

          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            Course Catalogue
          </Typography>
        </Box>

        <Tooltip title="Refresh">
          <IconButton onClick={fetchCourses}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          background: `linear-gradient(130deg, ${BRAND} 0%, #166534 100%)`,
          px: 4,
          py: 5,
        }}
      >
        <Typography
          sx={{
            fontSize: 30,
            fontWeight: 900,
            color: "white",
            mb: 1,
          }}
        >
          Expand your skills. Advance your future.
        </Typography>

        <Typography
          sx={{
            color: "rgba(255,255,255,0.75)",
            mb: 3,
          }}
        >
          Expert-taught prep courses for SAT,
          IELTS, GRE, TOEFL & Coding
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "white",
            borderRadius: "12px",
            px: 2,
            py: 1,
            maxWidth: 500,
          }}
        >
          <Search sx={{ color: TEXT_MUTED, mr: 1 }} />

          <InputBase
            placeholder="Search courses..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            sx={{ flex: 1 }}
          />

          {search && (
            <IconButton
              size="small"
              onClick={() => setSearch("")}
            >
              <Clear />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box px={4} py={4}>

        <Box
          display="flex"
          flexWrap="wrap"
          gap={1}
          mb={3}
        >
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setCategory(cat)}
              sx={{
                bgcolor:
                  category === cat
                    ? BRAND
                    : "white",
                color:
                  category === cat
                    ? "white"
                    : TEXT_SECONDARY,
              }}
            />
          ))}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 8 }).map(
                (_, i) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    key={i}
                  >
                    <Skeleton
                      variant="rectangular"
                      height={300}
                    />
                  </Grid>
                )
              )
            : filteredCourses.map((course) => {
                const price = Number(
                  course.monthlyPrice || 0
                );

                const tutorName =
                  course.tutor?.fullName ||
                  "Instructor";

                const catMeta =
                  CATEGORY_META[
                    course.category
                  ];

                return (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    key={course.id}
                  >
                    <Paper
                      onClick={() =>
                        navigate(
                          `/courses/${course.id}`
                        )
                      }
                      sx={{
                        borderRadius: "18px",
                        overflow: "hidden",
                        cursor: "pointer",
                        border: `1px solid ${BORDER}`,
                        transition: "0.2s",
                        "&:hover": {
                          transform:
                            "translateY(-4px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          height: 160,
                          background:
                            course.thumbnail
                              ? `url(${course.thumbnail}) center/cover`
                              : `linear-gradient(135deg, ${BRAND}, #15803d)`,
                          position: "relative",
                        }}
                      >
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSave(course.id);
                          }}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            bgcolor:
                              "rgba(0,0,0,0.4)",
                            color: "white",
                          }}
                        >
                          {saved.includes(
                            course.id
                          ) ? (
                            <Bookmark />
                          ) : (
                            <BookmarkBorder />
                          )}
                        </IconButton>
                      </Box>

                      <Box p={2.5}>
                        <Chip
                          label={catMeta?.label}
                          size="small"
                          sx={{
                            mb: 1,
                            bgcolor: catMeta?.bg,
                            color: catMeta?.text,
                          }}
                        />

                        <Chip
                          label={
                            course.tutorialMode ===
                            "virtual"
                              ? "Virtual"
                              : "Onsite"
                          }
                          size="small"
                          sx={{
                            ml: 1,
                            mb: 1,
                          }}
                        />

                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: 16,
                            mb: 1,
                          }}
                        >
                          {course.title}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 13,
                            color:
                              TEXT_SECONDARY,
                            mb: 2,
                          }}
                        >
                          {course.description}
                        </Typography>

                        <Box
                          display="flex"
                          alignItems="center"
                          gap={1}
                          mb={2}
                        >
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: BRAND,
                              fontSize: 10,
                            }}
                          >
                            {getInitials(
                              tutorName
                            )}
                          </Avatar>

                          <Typography
                            sx={{
                              fontSize: 12,
                            }}
                          >
                            {tutorName}
                          </Typography>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <Typography
                          sx={{
                            fontSize: 22,
                            fontWeight: 900,
                            color: BRAND,
                          }}
                        >
                          {formatPrice(price)}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 11,
                            color: TEXT_MUTED,
                          }}
                        >
                          Up to{" "}
                          {
                            course.maxDurationMonths
                          }{" "}
                          months
                        </Typography>

                        <Button
                          fullWidth
                          variant="contained"
                          sx={{
                            mt: 2,
                            bgcolor: BRAND,
                          }}
                        >
                          {course.enrolled
                            ? "Continue"
                            : "Subscribe"}
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
        </Grid>
      </Box>
    </Box>
  );
};

export default CourseCatalog;