import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
} from "@mui/material";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import API from "../services/api";

const NAVY = "#0B1F3A";

export default function PublicArticles() {

  const navigate =
    useNavigate();

  const [articles,
    setArticles] =
    useState([]);

  useEffect(() => {

    fetchArticles();

  }, []);

  const fetchArticles =
    async () => {

      try {

        const res =
          await API.get(
            "/api/public/articles"
          );

        setArticles(
          res.data.articles || []
        );

      } catch (err) {

        console.error(err);
      }
    };



  return (
    <Box p={4}>

      <Typography
        variant="h3"
        fontWeight="bold"
        color={NAVY}
        mb={4}
      >
        Latest Articles
      </Typography>

      <Grid
        container
        spacing={4}
      >

        {articles.map(
          (article) => (

            <Grid
              item
              xs={12}
              md={6}
              lg={4}
              key={article.id}
            >

              <Card
                sx={{
                  cursor: "pointer",
                  borderRadius: 5,
                }}
                onClick={() =>
                  navigate(
                    `/articles/${article.slug}`
                  )
                }
              >

                <Box
                  component="img"
                  src={
                    article.coverImageUrl
                  }
                  sx={{
                    width: "100%",
                    height: 240,
                    objectFit: "cover",
                  }}
                />

                <CardContent>

                  <Chip
                    label={
                      article.category
                    }
                    sx={{
                      mb: 2,
                    }}
                  />

                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    mb={2}
                  >
                    {article.title}
                  </Typography>

                  <Typography
                    color="text.secondary"
                  >
                    {
                      article.excerpt
                    }
                  </Typography>

                </CardContent>

              </Card>

            </Grid>
          )
        )}

      </Grid>

    </Box>
  );
}