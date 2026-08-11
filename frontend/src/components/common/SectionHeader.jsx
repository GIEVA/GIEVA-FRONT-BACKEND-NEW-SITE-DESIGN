import {
    Stack,
    Typography,
} from "@mui/material";

export default function SectionHeader({
    eyebrow,
    title,
    description,
    align = "center",
    maxWidth = 700,
    mb = 7,
}) {
    return (
        <Stack
            spacing={2}
            alignItems={align}
            mb={mb}
        >
            {eyebrow && (
                <Typography
                    color="primary"
                    fontWeight={700}
                    letterSpacing={2}
                >
                    {eyebrow}
                </Typography>
            )}

            <Typography
                variant="h3"
                fontWeight={800}
                textAlign={align}
            >
                {title}
            </Typography>

            {description && (
                <Typography
                    color="text.secondary"
                    textAlign={align}
                    maxWidth={maxWidth}
                >
                    {description}
                </Typography>
            )}
        </Stack>
    );
}