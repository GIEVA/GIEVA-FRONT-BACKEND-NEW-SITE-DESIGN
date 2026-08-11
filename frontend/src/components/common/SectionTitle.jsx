import { Typography } from "@mui/material";

export default function SectionTitle({
    children,
    align = "center",
}) {
    return (
        <Typography
            variant="h3"
            fontWeight={800}
            textAlign={align}
        >
            {children}
        </Typography>
    );
}