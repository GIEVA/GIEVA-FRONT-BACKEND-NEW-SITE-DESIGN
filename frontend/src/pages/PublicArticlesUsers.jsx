import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  CircularProgress,
  Button,
} from "@mui/material";

import {
  TrendingUp,
} from "@mui/icons-material";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {

  getPublishedArticles,
  getFeaturedArticles,
  getTrendingArticles,

} from "../services/publicArticleService";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";

export default function PublicArticlesUsers() {

  const navigate =
    useNavigate();

  const [articles,
    setArticles] =
    useState([]);

  const [featured,
    setFeatured] =
    useState([]);

  const [trending,
    setTrending] =
    useState([]);

  const [search,
    setSearch] =
    useState("");

  const [loading,
    setLoading] =
    useState(true);



  useEffect(() => {

    fetchAll();

  }, [search]);



  const fetchAll =
    async () => {

      try {

        setLoading(true);

        const [
          articlesRes,
          featuredRes,
          trendingRes,
        ] =
          await Promise.all([

            getPublishedArticles({
              search,
            }),

            getFeaturedArticles(),

            getTrendingArticles(),
          ]);

        setArticles(
          articlesRes.articles || []
        );

        setFeatured(
          featuredRes.articles || []
        );

        setTrending(
          trendingRes.articles || []
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);
      }
    };



  return (
    <Box
      sx={{
        bgcolor: "#F8FAFC",
        minHeight: "100vh",
      }}
    >

      {/* HERO */}

      <Box
        sx={{
          background:
            `linear-gradient(
              135deg,
              ${NAVY},
              ${GREEN}
            )`,

          color: "#fff",

          py: 10,
          px: 3,
        }}
      >

        <Box
          maxWidth="1200px"
          mx="auto"
        >

          <Typography
            variant="h2"
            fontWeight="bold"
            mb={2}
          >
            GIEVA Insights
          </Typography>

          <Typography
            variant="h6"
            sx={{
              opacity: 0.9,
              maxWidth: 700,
            }}
            mb={4}
          >
            Study abroad,
            scholarships,
            technology,
            AI and global education
            insights.
          </Typography>

          <TextField
            fullWidth
            placeholder="Search articles..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            sx={{
              bgcolor: "#fff",
              borderRadius: 3,
              maxWidth: 600,
            }}
          />

        </Box>

      </Box>



      <Box
        maxWidth="1300px"
        mx="auto"
        p={3}
      >

        {/* FEATURED */}

        {!!featured.length && (

          <Box mb={8}>

            <Typography
              variant="h4"
              fontWeight="bold"
              color={NAVY}
              mb={4}
            >
              Featured Articles
            </Typography>

            <Grid
              container
              spacing={4}
            >

              {featured.map(
                (article) => (

                  <Grid
                    item
                    xs={12}
                    md={6}
                    key={article.id}
                  >

                    <Card
                      sx={{
                        borderRadius: 6,
                        overflow: "hidden",
                        cursor: "pointer",
                        boxShadow:
                          "0 12px 30px rgba(0,0,0,0.08)",
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
                          height: 320,
                          objectFit: "cover",
                        }}
                      />

                      <CardContent
                        sx={{
                          p: 4,
                        }}
                      >

                        <Chip
                          label={
                            article.category
                          }
                          sx={{
                            bgcolor: GOLD,
                            color: "#fff",
                            mb: 2,
                          }}
                        />

                        <Typography
                          variant="h4"
                          fontWeight="bold"
                          mb={2}
                        >
                          {
                            article.title
                          }
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
        )}



        {/* TRENDING */}

        {!!trending.length && (

          <Box mb={8}>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              mb={4}
            >

              <TrendingUp
                sx={{
                  color: GOLD,
                }}
              />

              <Typography
                variant="h4"
                fontWeight="bold"
                color={NAVY}
              >
                Trending Articles
              </Typography>

            </Stack>

            <Grid
              container
              spacing={3}
            >

              {trending.slice(0, 4)
                .map((article) => (

                  <Grid
                    item
                    xs={12}
                    md={3}
                    key={article.id}
                  >

                    <Card
                      sx={{
                        borderRadius: 5,
                        cursor: "pointer",
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
                          height: 180,
                          objectFit: "cover",
                        }}
                      />

                      <CardContent>

                        <Typography
                          fontWeight="bold"
                        >
                          {
                            article.title
                          }
                        </Typography>

                      </CardContent>

                    </Card>

                  </Grid>
                ))}

            </Grid>

          </Box>
        )}



        {/* ALL ARTICLES */}

        <Typography
          variant="h4"
          fontWeight="bold"
          color={NAVY}
          mb={4}
        >
          Latest Articles
        </Typography>

        {loading ? (

          <Box
            display="flex"
            justifyContent="center"
            mt={10}
          >
            <CircularProgress />
          </Box>

        ) : (

          <Grid
            container
            spacing={4}
          >

            {articles.map(
              (article) => (

                <Grid
                  item
                  xs={12}
                  md={4}
                  key={article.id}
                >

                  <Card
                    sx={{
                      borderRadius: 5,
                      overflow: "hidden",
                      cursor: "pointer",
                      height: "100%",
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
                        height: 220,
                        objectFit: "cover",
                      }}
                    />

                    <CardContent
                      sx={{
                        p: 3,
                      }}
                    >

                      <Stack
                        direction="row"
                        spacing={1}
                        mb={2}
                      >

                        <Chip
                          label={
                            article.category
                          }
                          size="small"
                        />

                        <Chip
                          label={
                            article.readingTime
                          }
                          size="small"
                        />

                      </Stack>

                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        mb={2}
                      >
                        {
                          article.title
                        }
                      </Typography>

                      <Typography
                        color="text.secondary"
                        mb={2}
                      >
                        {
                          article.excerpt
                        }
                      </Typography>

                      <Button
                        sx={{
                          color: GREEN,
                          fontWeight: "bold",
                        }}
                      >
                        Read More →
                      </Button>

                    </CardContent>

                  </Card>

                </Grid>
              )
            )}

          </Grid>
        )}

      </Box>

    </Box>
  );
}