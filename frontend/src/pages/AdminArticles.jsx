import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  IconButton,
  Avatar,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";

import {
  Add,
  Edit,
  Delete,
  Visibility,
  Star,
} from "@mui/icons-material";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getAdminArticles,
  publishArticle,
  deleteArticle,
  toggleFeaturedArticle,
} from "../services/articleService";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";

export default function AdminArticles() {

  const navigate =
    useNavigate();

  const [articles,
    setArticles] =
    useState([]);

  const [loading,
    setLoading] =
    useState(true);

  const [search,
    setSearch] =
    useState("");

  const [status,
    setStatus] =
    useState("");



  const fetchArticles =
    async () => {

      try {

        setLoading(true);

        const res =
          await getAdminArticles({
            search,
            status,
          });

        setArticles(
          res.articles || []
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);
      }
    };



  useEffect(() => {

    fetchArticles();

  }, [search, status]);



  const handlePublish =
    async (id) => {

      try {

        await publishArticle(id);

        fetchArticles();

      } catch (err) {

        console.error(err);
      }
    };



  const handleFeature =
    async (id) => {

      try {

        await toggleFeaturedArticle(id);

        fetchArticles();

      } catch (err) {

        console.error(err);
      }
    };



  const handleDelete =
    async (id) => {

      const confirmDelete =
        window.confirm(
          "Delete article?"
        );

      if (!confirmDelete)
        return;

      try {

        await deleteArticle(id);

        fetchArticles();

      } catch (err) {

        console.error(err);
      }
    };



  return (
    <Box p={3}>

      {/* HEADER */}

      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          md: "center",
        }}
        mb={4}
      >

        <Box>

          <Typography
            variant="h4"
            fontWeight="bold"
            color={NAVY}
          >
            CMS Articles
          </Typography>

          <Typography
            color="text.secondary"
          >
            Manage platform articles
          </Typography>

        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() =>
            navigate(
              "/admin/cms/articles/create"
            )
          }
          sx={{
            bgcolor: GREEN,
            borderRadius: 3,
            px: 3,
            py: 1.2,
          }}
        >
          Create Article
        </Button>

      </Stack>



      {/* FILTERS */}

      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        spacing={2}
        mb={4}
      >

        <TextField
          label="Search"
          fullWidth
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
          sx={{
            minWidth: 180,
          }}
        >

          <MenuItem value="">
            All
          </MenuItem>

          <MenuItem value="draft">
            Draft
          </MenuItem>

          <MenuItem value="published">
            Published
          </MenuItem>

        </TextField>

      </Stack>



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
          spacing={3}
        >

          {articles.map((article) => (

            <Grid
              item
              xs={12}
              md={6}
              lg={4}
              key={article.id}
            >

              <Card
                sx={{
                  borderRadius: 5,
                  overflow: "hidden",
                  height: "100%",
                  boxShadow:
                    "0 8px 24px rgba(0,0,0,0.08)",
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
                      height: 220,
                      objectFit: "cover",
                    }}
                  />
                )}

                <CardContent>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >

                    <Chip
                      label={
                        article.status
                      }
                      sx={{
                        bgcolor:
                          article.status ===
                          "published"
                            ? GREEN
                            : GOLD,

                        color: "#fff",
                      }}
                    />

                    {article.isFeatured && (

                      <Star
                        sx={{
                          color: GOLD,
                        }}
                      />
                    )}

                  </Stack>

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    gutterBottom
                  >
                    {article.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mb={2}
                  >
                    {article.excerpt}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    mb={2}
                  >

                    {article.tags?.map(
                      (tag) => (

                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                        />
                      )
                    )}

                  </Stack>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {
                        article.readingTime
                      }
                    </Typography>

                    <Stack
                      direction="row"
                    >

                      <IconButton
                        onClick={() =>
                          navigate(
                            `/admin/cms/articles/${article.id}`
                          )
                        }
                      >
                        <Visibility />
                      </IconButton>

                      <IconButton
                        onClick={() =>
                          navigate(
                            `/admin/cms/articles/${article.id}/edit`
                          )
                        }
                      >
                        <Edit />
                      </IconButton>

                      <IconButton
                        onClick={() =>
                          handlePublish(
                            article.id
                          )
                        }
                      >
                        🚀
                      </IconButton>

                      <IconButton
                        onClick={() =>
                          handleFeature(
                            article.id
                          )
                        }
                      >
                        ⭐
                      </IconButton>

                      <IconButton
                        color="error"
                        onClick={() =>
                          handleDelete(
                            article.id
                          )
                        }
                      >
                        <Delete />
                      </IconButton>

                    </Stack>

                  </Stack>

                </CardContent>

              </Card>

            </Grid>
          ))}

        </Grid>
      )}

    </Box>
  );
}