import PropTypes from "prop-types";

import {
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Chip,
    Stack,
    Typography,
    Box,
} from "@mui/material";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function CampaignCard({
    campaign,
    onClick,
    sx = {},
}) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                borderRadius: 4,
                overflow: "hidden",
                transition: "all .3s ease",
                cursor: "pointer",

                "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: 6,
                },

                ...sx,
            }}
        >
            <CardActionArea
                sx={{ height: "100%" }}
                onClick={() => onClick?.(campaign)}
            >
                <CardMedia
                    component="img"
                    height="220"
                    image={
                        campaign.imageUrl ||
                        "/placeholders/campaign.png"
                    }
                    alt={campaign.title}
                />

                <CardContent>
                    <Stack spacing={2}>
                        <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                        >
                            {campaign.featured && (
                                <Chip
                                    label="Featured"
                                    color="warning"
                                    size="small"
                                />
                            )}

                            {campaign.type && (
                                <Chip
                                    label={campaign.type}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                />
                            )}
                        </Stack>

                        <Typography
                            variant="h5"
                            fontWeight={700}
                        >
                            {campaign.title}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                display: "-webkit-box",
                                overflow: "hidden",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                            }}
                        >
                            {campaign.shortDescription ||
                                campaign.description}
                        </Typography>

                        <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            color="primary.main"
                            fontWeight={600}
                        >
                            Learn More

                            <ArrowForwardIcon
                                fontSize="small"
                            />
                        </Box>
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

CampaignCard.propTypes = {
    campaign: PropTypes.shape({
        id: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.string,
        ]).isRequired,

        title: PropTypes.string.isRequired,

        description: PropTypes.string,

        shortDescription: PropTypes.string,

        imageUrl: PropTypes.string,

        featured: PropTypes.bool,

        type: PropTypes.string,
    }).isRequired,

    onClick: PropTypes.func,

    sx: PropTypes.object,
};