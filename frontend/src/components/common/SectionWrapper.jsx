import { Box } from "@mui/material";

export default function SectionWrapper({
    children,
    background = "#fff",
    py = {
        xs: 8,
        md: 12,
    },
    ...props
}) {
    return (
        <Box
            sx={{
                py,
                bgcolor: background,
            }}
            {...props}
        >
            {children}
        </Box>
    );
}