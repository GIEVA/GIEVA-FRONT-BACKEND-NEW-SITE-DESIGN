import { useTheme } from "@mui/material";
import BaseButton from "./BaseButton";

export default function GradientButton({
  sx,
  ...props
}) {
  const theme = useTheme();

  return (
    <BaseButton
      variant="contained"
      sx={{
        background: theme.gradients.secondary,

        color: theme.palette.common.white,

        borderRadius:
          theme.spacingTokens.radius.round,

        boxShadow:
          theme.customShadows.button,

        "&:hover": {
          background: theme.gradients.sunset,

          transform: "translateY(-4px)",

          boxShadow:
            theme.customShadows.buttonHover,
        },

        "&:active": {
          transform: "translateY(0px)",
        },

        ...sx,
      }}
      {...props}
    />
  );
}