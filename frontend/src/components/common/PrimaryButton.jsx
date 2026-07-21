import { Button } from "@mui/material";
import { Link } from "react-router-dom";

export default function PrimaryButton({
    to,
    children,
    endIcon,
    startIcon,
    ...props
}) {
    return (
        <Button
            component={Link}
            to={to}
            variant="contained"
            size="large"
            startIcon={startIcon}
            endIcon={endIcon}
            sx={{
                px: 5,
                py: 1.5,
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 700,
            }}
            {...props}
        >
            {children}
        </Button>
    );
}