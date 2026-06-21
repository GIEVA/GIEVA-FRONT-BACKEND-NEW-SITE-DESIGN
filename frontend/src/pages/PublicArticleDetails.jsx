import {
  Box,
  Typography,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import API from "../services/api";

const NAVY = "#0B1F3A";

export default function PublicArticleDetails() {

  const { slug } =
    useParams();

  const [article,
    setArticle] =
    useState(null);

  const [loading,
    setLoading] =
    useState(true);



  useEffect(() => {

    fetchArticle();

  }, [slug]);



  const fetchArticle =
    async () => {

      try {

        const res =
          await API.get(
            `/api/public/articles/slug/${slug}`
          );

        setArticle(
          res.data.article
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
    <Box>

      <Box
        component="img"
        src={
          article.coverImageUrl
        }
        sx={{
          width: "100%",
          height: 500,
          objectFit: "cover",
        }}
      />

      <Box
        maxWidth="900px"
        mx="auto"
        p={4}
      >

        <Stack
          direction="row"
          spacing={2}
          mb={3}
        >

          <Chip
            label={
              article.category
            }
          />

          <Chip
            label={
              article.readingTime
            }
          />

        </Stack>

        <Typography
          variant="h2"
          fontWeight="bold"
          color={NAVY}
          mb={3}
        >
          {article.title}
        </Typography>

        <Typography
          variant="h6"
          color="text.secondary"
          mb={5}
        >
          {article.subtitle}
        </Typography>

        <Box
          sx={{
            fontSize: "1.05rem",
            lineHeight: 2,
          }}
          dangerouslySetInnerHTML={{
            __html:
              article.content,
          }}
        />

      </Box>

    </Box>
  );
}