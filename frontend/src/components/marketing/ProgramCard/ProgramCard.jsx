import PropTypes from "prop-types";

import {
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Typography,
    Chip,
    Stack,
} from "@mui/material";

import { ActionGroup } from "../ActionGroup";

export default function ProgramCard({
    program,
    sx = {},
}) {
    const {
        image,
        title,
        description,
        badge,
        actions = [],
    } = program;

    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                borderRadius: 4,
                overflow: "hidden",
                ...sx,
            }}
        >
            <CardMedia
                component="img"
                height="220"
                image={
                    image?.src ??
                    "/placeholders/program.png"
                }
                alt={
                    image?.alt ??
                    title
                }
            />

            <CardContent>
                <Stack spacing={2}>
                    {badge && (
                        <Chip
                            label={badge}
                            size="small"
                            color="primary"
                        />
                    )}

                    <Typography
                        variant="h5"
                    >
                        {title}
                    </Typography>

                    <Typography
                        color="text.secondary"
                    >
                        {description}
                    </Typography>
                </Stack>
            </CardContent>

            {actions.length > 0 && (
                <CardActions
                    sx={{
                        px: 2,
                        pb: 2,
                    }}
                >
                    <ActionGroup
                        actions={actions}
                    />
                </CardActions>
            )}
        </Card>
    );
}

ProgramCard.propTypes = {
    program: PropTypes.shape({
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        badge: PropTypes.string,
        image: PropTypes.object,
        actions: PropTypes.array,
    }).isRequired,

    sx: PropTypes.object,
};