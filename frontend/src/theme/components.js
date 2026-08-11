const components = {
  //----------------------------------
  // Button
  //----------------------------------
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },

    styleOverrides: {
      root: {
        borderRadius: 9999,
        padding: "12px 28px",
        fontWeight: 700,
        textTransform: "none",
        fontSize: "1rem",
        transition: "all .3s ease",
      },

     containedPrimary: ({ theme }) => ({
    boxShadow: theme.customShadows.button,

    "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: theme.customShadows.buttonHover,
    },
    }),
      outlinedPrimary: {
        borderWidth: 2,

        "&:hover": {
          borderWidth: 2,
        },
      },
    },
  },

  //----------------------------------
  // Card
  //----------------------------------

MuiCard: {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: 24,
      overflow: "hidden",
      boxShadow: theme.customShadows.card,
      transition: "transform .35s ease, box-shadow .35s ease",

      "&:hover": {
        transform: "translateY(-8px)",
        boxShadow: theme.customShadows.cardHover,
      },
    }),
  },
},

  //----------------------------------
  // Paper
  //----------------------------------

  MuiPaper: {
    styleOverrides: {
      rounded: {
        borderRadius: 24,
      },
    },
  },

  //----------------------------------
  // Container
  //----------------------------------

  MuiContainer: {
    defaultProps: {
      maxWidth: "xl",
    },
  },

  //----------------------------------
  // AppBar
  //----------------------------------

MuiAppBar: {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: "rgba(255,255,255,.85)",
      backdropFilter: "blur(18px)",
      color: theme.palette.primary.main,
      boxShadow: theme.customShadows.navbar,
    }),
  },
},

  //----------------------------------
  // Accordion
  //----------------------------------

  MuiAccordion: {
    styleOverrides: {
      root: {
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: 16,

        "&:before": {
          display: "none",
        },
      },
    },
  },

  //----------------------------------
  // Accordion Summary
  //----------------------------------

  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        minHeight: 72,

        "& .MuiAccordionSummary-content": {
          margin: "16px 0",
        },
      },
    },
  },

  //----------------------------------
  // Divider
  //----------------------------------

  MuiDivider: {
    styleOverrides: {
      root: {
        opacity: .5,
      },
    },
  },

  //----------------------------------
  // Chip
  //----------------------------------

  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 999,
        fontWeight: 600,
      },
    },
  },

  //----------------------------------
  // Link
  //----------------------------------

  MuiLink: {
    defaultProps: {
      underline: "none",
    },
  },

  //----------------------------------
  // TextField
  //----------------------------------

  MuiTextField: {
    defaultProps: {
      variant: "outlined",
      fullWidth: true,
    },
  },

  //----------------------------------
  // Outlined Input
  //----------------------------------

  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 16,

        "& fieldset": {
          borderWidth: 2,
        },

        "&:hover fieldset": {
          borderWidth: 2,
        },

        "&.Mui-focused fieldset": {
          borderWidth: 2,
        },
      },
    },
  },
};

export default components;