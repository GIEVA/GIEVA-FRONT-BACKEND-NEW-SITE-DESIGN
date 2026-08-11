import PropTypes from "prop-types";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import {
  CalendarMonth,
  AccessTime,
  ArrowForward,
} from "@mui/icons-material";

export default function ArticleCard({
  article,
  onClick,
}) {
  const publishedDate =
    article.publishedAt ||
    article.createdAt;

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 4,
        overflow: "hidden",
        border: (theme) =>
          `1px solid ${theme.palette.divider}`,
        transition:
          "all .3s ease",

        "&:hover": {
          transform:
            "translateY(-6px)",
          boxShadow: 6,
        },
      }}
    >
      <CardActionArea
        onClick={() =>
          onClick?.(article)
        }
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        {/* Image */}

        <Box
          component="img"
          src={
            article.coverImageUrl
          }
          alt={article.title}
          sx={{
            width: "100%",
            height: 220,
            objectFit: "cover",
          }}
        />

        {/* Content */}

        <CardContent
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Category */}

          {article.category && (
            <Chip
              label={
                article.category
              }
              size="small"
              color="primary"
              sx={{
                mb: 2,
                width: "fit-content",
              }}
            />
          )}

          {/* Title */}

          <Typography
            variant="h6"
            fontWeight={700}
            gutterBottom
            sx={{
              display:
                "-webkit-box",
              overflow: "hidden",
              WebkitBoxOrient:
                "vertical",
              WebkitLineClamp: 2,
            }}
          >
            {article.title}
          </Typography>

          {/* Excerpt */}

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              mb: 3,

              display:
                "-webkit-box",
              overflow: "hidden",
              WebkitBoxOrient:
                "vertical",
              WebkitLineClamp: 3,
            }}
          >
            {article.excerpt}
          </Typography>

          <Box flexGrow={1} />

          {/* Footer */}

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Stack
              spacing={0.5}
            >
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
              >
                <CalendarMonth
                  fontSize="small"
                  color="action"
                />

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {publishedDate
                    ? new Date(
                        publishedDate
                      ).toLocaleDateString()
                    : ""}
                </Typography>
              </Stack>

              {article.readingTime && (
                <Stack
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                >
                  <AccessTime
                    fontSize="small"
                    color="action"
                  />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {
                      article.readingTime
                    }
                  </Typography>
                </Stack>
              )}
            </Stack>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{
                color: "primary.main",
                fontWeight: 600,
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
              >
                Read More
              </Typography>

              <ArrowForward
                fontSize="small"
              />
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

ArticleCard.propTypes = {
  article: PropTypes.shape({
    id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]).isRequired,

    slug: PropTypes.string,

    title: PropTypes.string,

    excerpt: PropTypes.string,

    category: PropTypes.string,

    coverImageUrl:
      PropTypes.string,

    readingTime:
      PropTypes.string,

    publishedAt:
      PropTypes.string,

    createdAt:
      PropTypes.string,
  }).isRequired,

  onClick: PropTypes.func,
};