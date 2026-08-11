import {
  useEffect,
  useState,
} from "react";

import {
  Grid,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

import { getPublishedArticles } from "../../../services/publicArticleService";

import { ArticleCard } from "../ArticleCard";

export default function ArticleGrid({
  limit = 5,
}) {
  const navigate = useNavigate();

  const [articles, setArticles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  // ======================================================
  // FETCH ARTICLES
  // ======================================================

  const fetchArticles =
    async () => {
      try {
        setLoading(true);

        const response =
          await getPublishedArticles();

        const latest =
          (response?.articles || [])
            .slice(0, limit);

        setArticles(latest);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchArticles();
  }, [limit]);

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <Box
        py={8}
        display="flex"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  // ======================================================
  // EMPTY
  // ======================================================

  if (!articles.length) {
    return (
      <Box
        py={8}
        textAlign="center"
      >
        <Typography
          variant="h6"
          color="text.secondary"
        >
          No published articles available.
        </Typography>
      </Box>
    );
  }

  // ======================================================
  // CONTENT
  // ======================================================

  return (
    <Grid
      container
      spacing={4}
    >
      {articles.map(
        (article) => (
          <Grid
            item
            xs={12}
            md={
              article === articles[0]
                ? 12
                : 6
            }
            lg={
              article === articles[0]
                ? 12
                : 6
            }
            key={article.id}
          >
            <ArticleCard
              article={article}
              onClick={() =>
                navigate(
                  `/articles/${article.slug}`
                )
              }
            />
          </Grid>
        )
      )}
    </Grid>
  );
}