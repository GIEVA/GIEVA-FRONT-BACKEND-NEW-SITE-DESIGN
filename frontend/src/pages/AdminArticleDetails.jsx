import {
  Box,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  Paper,
} from "@mui/material";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  getAdminArticleById,
} from "../services/articleService";

const NAVY = "#0B1F3A";

export default function AdminArticleDetails() {

  const { id } =
    useParams();

  const [article,
    setArticle] =
    useState(null);

  const [loading,
    setLoading] =
    useState(true);



  useEffect(() => {

    fetchArticle();

  }, []);



  const fetchArticle =
    async () => {

      try {

        const res =
          await getAdminArticleById(
            id
          );

        setArticle(
          res.article || res
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);
      }
    };



  if (loading) {

    return (
      <Box
        display="flex"
        justifyContent="center"
        mt={10}
      >
        <CircularProgress />
      </Box>
    );
  }



  if (!article)
    return null;



  return (
    <Box p={3}>

      <Paper
        sx={{
          borderRadius: 5,
          overflow: "hidden",
        }}
      >

        {article.coverImageUrl && (

          <Box
            component="img"
            src={
              article.coverImageUrl
            }
            sx={{
              width: "100%",
              height: 420,
              objectFit: "cover",
            }}
          />
        )}

        <Box p={4}>

          <Stack
            direction="row"
            spacing={1}
            mb={2}
          >

            <Chip
              label={
                article.category
              }
            />

            {article.isFeatured && (

              <Chip
                label="Featured"
                color="warning"
              />
            )}

          </Stack>

          <Typography
            variant="h3"
            fontWeight="bold"
            color={NAVY}
            mb={2}
          >
            {article.title}
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            mb={4}
          >
            {
              article.subtitle
            }
          </Typography>

          <Box
            dangerouslySetInnerHTML={{
              __html:
                article.content,
            }}
          />

        </Box>

      </Paper>

    </Box>
  );
}