import {
  Box,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from "@mui/material";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import {

  getArticleBySlug,
  getRelatedArticles,

} from "../services/publicArticleService";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";

export default function PublicArticleDetailsUsers() {

  const { slug } =
    useParams();

  const navigate =
    useNavigate();

  const [article,
    setArticle] =
    useState(null);

  const [related,
    setRelated] =
    useState([]);

  const [loading,
    setLoading] =
    useState(true);



  useEffect(() => {

    fetchArticle();

  }, [slug]);



  const fetchArticle =
    async () => {

      try {

        setLoading(true);

        const res =
          await getArticleBySlug(
            slug
          );

        setArticle(
          res.article
        );

        const relatedRes =
          await getRelatedArticles(
            res.article.id
          );

        setRelated(
          relatedRes.articles || []
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
    <Box
      sx={{
        bgcolor: "#fff",
      }}
    >

      {/* HERO */}

      <Box
        component="img"
        src={
          article.coverImageUrl
        }
        sx={{
          width: "100%",
          height: {
            xs: 300,
            md: 550,
          },
          objectFit: "cover",
        }}
      />



      <Box
        maxWidth="1000px"
        mx="auto"
        px={3}
        py={6}
      >

        <Stack
          direction="row"
          spacing={2}
          mb={4}
          flexWrap="wrap"
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

          <Chip
            label={`${article.views} views`}
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
          variant="h5"
          color="text.secondary"
          mb={5}
          lineHeight={1.7}
        >
          {article.subtitle}
        </Typography>



        <Box
          sx={{

            "& p": {
              fontSize: "1.1rem",
              lineHeight: 2,
              mb: 3,
              color: "#334155",
            },

            "& h1, & h2, & h3": {
              color: NAVY,
              fontWeight: "bold",
              mt: 5,
              mb: 3,
            },

            "& img": {
              width: "100%",
              borderRadius: 4,
              my: 4,
            },
          }}
          dangerouslySetInnerHTML={{
            __html:
              article.content,
          }}
        />



        {/* RELATED */}

        {!!related.length && (

          <Box mt={10}>

            <Typography
              variant="h4"
              fontWeight="bold"
              color={NAVY}
              mb={4}
            >
              Related Articles
            </Typography>

            <Grid
              container
              spacing={4}
            >

              {related.map(
                (item) => (

                  <Grid
                    item
                    xs={12}
                    md={4}
                    key={item.id}
                  >

                    <Card
                      sx={{
                        borderRadius: 5,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        navigate(
                          `/articles/${item.slug}`
                        )
                      }
                    >

                      <Box
                        component="img"
                        src={
                          item.coverImageUrl
                        }
                        sx={{
                          width: "100%",
                          height: 220,
                          objectFit: "cover",
                        }}
                      />

                      <CardContent>

                        <Typography
                          fontWeight="bold"
                          variant="h6"
                        >
                          {item.title}
                        </Typography>

                      </CardContent>

                    </Card>

                  </Grid>
                )
              )}

            </Grid>

          </Box>
        )}

      </Box>

    </Box>
  );
}