import PropTypes from "prop-types";
import { forwardRef } from "react";
import {
  Button,
  CircularProgress,
} from "@mui/material";

const BaseButton = forwardRef(function BaseButton(
  {
    children,
    loading = false,
    disabled = false,
    startIcon,
    endIcon,
    sx = {},
    size = "large",
    ...props
  },
  ref
) {
  return (
    <Button
      ref={ref}
      size={size}
      disabled={disabled || loading}
      startIcon={!loading ? startIcon : undefined}
      endIcon={!loading ? endIcon : undefined}
      sx={{
        minWidth: 170,
        transition: "all .35s ease",
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

BaseButton.propTypes = {
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

export default BaseButton;