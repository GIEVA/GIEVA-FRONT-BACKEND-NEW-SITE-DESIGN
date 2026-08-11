import { createTheme, responsiveFontSizes } from "@mui/material/styles";

import palette from "./palette";
import typography from "./typography";
import breakpoints from "./breakpoints";
import components from "./components";

import customShadows from "./shadows";
import spacingTokens from "./spacing";
import gradients from "./gradients";

// Create base theme
let theme = createTheme({
  palette,
  typography,
  breakpoints,
});

// Extend theme with custom tokens
theme = createTheme(theme, {
  customShadows,
  spacingTokens,
  gradients,
  components,
});

// Make typography responsive
theme = responsiveFontSizes(theme);

export default theme;