import PropTypes from "prop-types";

import {
    Avatar,
    Card,
    CardContent,
    Chip,
    Rating,
    Stack,
    Typography,
} from "@mui/material";

export default function TestimonialCard({
    testimonial,
    sx = {},
}) {
    const {
        name,
        role,
        organization,
        avatar,
        quote,
        rating = 5,
        program,
    } = testimonial;

    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                borderRadius: 4,
                ...sx,
            }}
        >
            <CardContent>
                <Stack spacing={3}>
                    <Rating
                        value={rating}
                        readOnly
                    />

                    <Typography
                        variant="body1"
                        color="text.secondary"
                    >
                        "{quote}"
                    </Typography>

                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                    >
                        <Avatar
                            src={avatar?.src}
                            alt={avatar?.alt}
                            sx={{
                                width: 56,
                                height: 56,
                            }}
                        />

                        <Stack spacing={0.5}>
                            <Typography
                                variant="subtitle1"
                            >
                                {name}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {role}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {organization}
                            </Typography>
                        </Stack>
                    </Stack>

                    {program && (
                        <Chip
                            label={program}
                            color="primary"
                            size="small"
                        />
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}

TestimonialCard.propTypes = {
    testimonial: PropTypes.shape({
        name: PropTypes.string.isRequired,
        role: PropTypes.string,
        organization: PropTypes.string,
        quote: PropTypes.string.isRequired,
        rating: PropTypes.number,
        program: PropTypes.string,
        avatar: PropTypes.shape({
            src: PropTypes.string,
            alt: PropTypes.string,
        }),
    }).isRequired,

    sx: PropTypes.object,
};