import PropTypes from "prop-types";
import { forwardRef } from "react";

import {
    Button,
    CircularProgress,
    useTheme,
} from "@mui/material";

const SecondaryButton = forwardRef(function SecondaryButton(
    {
        children,

        loading = false,

        disabled = false,

        startIcon,

        endIcon,

        size = "large",

        sx = {},

        ...props
    },
    ref
) {
    const theme = useTheme();

    return (
        <Button
            ref={ref}
            variant="outlined"
            color="primary"
            size={size}
            disabled={disabled || loading}
            startIcon={!loading ? startIcon : null}
            endIcon={!loading ? endIcon : null}
            sx={{
                minWidth: 170,

                px: 4,

                py: 1.5,

                borderWidth: 2,

                borderColor:
                    theme.palette.primary.main,

                color:
                    theme.palette.primary.main,

                borderRadius:
                    theme.spacingTokens.radius.round,

                transition: "all .35s ease",

                backgroundColor: "transparent",

                "&:hover": {
                    borderWidth: 2,

                    backgroundColor:
                        theme.palette.primary.main,

                    color:
                        theme.palette.common.white,

                    transform: "translateY(-3px)",

                    boxShadow:
                        theme.customShadows.card,
                },

                "&:active": {
                    transform: "translateY(0px)",
                },

                ...sx,
            }}
            {...props}
        >
            {loading ? (
                <CircularProgress
                    size={22}
                    color="inherit"
                />
            ) : (
                children
            )}
        </Button>
    );
});

SecondaryButton.propTypes = {
    children: PropTypes.node,

    loading: PropTypes.bool,

    disabled: PropTypes.bool,

    startIcon: PropTypes.node,

    endIcon: PropTypes.node,

    size: PropTypes.oneOf([
        "small",
        "medium",
        "large",
    ]),

    sx: PropTypes.object,
};

export default SecondaryButton;