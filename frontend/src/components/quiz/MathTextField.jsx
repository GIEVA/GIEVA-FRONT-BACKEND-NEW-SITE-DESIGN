import { useState } from "react";
import { Box, TextField, Stack, Tooltip, IconButton, Typography, Popover } from "@mui/material";
import { InlineMath, BlockMath } from "react-katex";
import FunctionsIcon from "@mui/icons-material/Functions";

const BORDER = "#E6E9F0";
const MUTED = "#64748B";
const NAVY = "#0B1F3A";

// Common symbols/templates a science/math quiz author will actually reach for.
// label = what the button shows, insert = the LaTeX snippet inserted at cursor.
const SNIPPETS = [
  { label: "x²", insert: "x^{2}" },
  { label: "√x", insert: "\\sqrt{x}" },
  { label: "a/b", insert: "\\frac{a}{b}" },
  { label: "±", insert: "\\pm" },
  { label: "≤", insert: "\\leq" },
  { label: "≥", insert: "\\geq" },
  { label: "≠", insert: "\\neq" },
  { label: "×", insert: "\\times" },
  { label: "÷", insert: "\\div" },
  { label: "π", insert: "\\pi" },
  { label: "Δ", insert: "\\Delta" },
  { label: "θ", insert: "\\theta" },
  { label: "∑", insert: "\\sum_{i=1}^{n}" },
  { label: "→", insert: "\\rightarrow" },
  { label: "H₂O", insert: "H_{2}O" },
  { label: "10ˣ", insert: "10^{x}" },
];

// Splits raw text on $...$ (inline math) and $$...$$ (block math),
// rendering the math parts with KaTeX and everything else as plain text.
function renderWithMath(text = "") {
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g).filter(Boolean);

  return parts.map((part, i) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const expr = part.slice(2, -2);
      try {
        return <BlockMath key={i} math={expr} />;
      } catch {
        return <Typography key={i} color="error" component="span">[Invalid formula: {expr}]</Typography>;
      }
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      const expr = part.slice(1, -1);
      try {
        return <InlineMath key={i} math={expr} />;
      } catch {
        return <Typography key={i} color="error" component="span">[Invalid formula: {expr}]</Typography>;
      }
    }
    return <span key={i}>{part}</span>;
  });
}

export default function MathTextField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholder,
  required = false,
  sx = {},
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [fieldRef, setFieldRef] = useState(null);

  const insertSnippet = (snippet) => {
    const el = fieldRef;
    if (!el) {
      onChange(value + `$${snippet}$`);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const wrapped = `$${snippet}$`;
    const next = value.slice(0, start) + wrapped + value.slice(end);
    onChange(next);
    // restore focus + cursor after the inserted snippet, on next tick
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + wrapped.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const hasMath = /\$[^$]+\$/.test(value || "");

  return (
    <Box sx={sx}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: MUTED }}>{label}</Typography>
        <Tooltip title="Insert math symbol">
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <FunctionsIcon sx={{ fontSize: 18, color: NAVY }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <TextField
        fullWidth
        multiline={multiline}
        rows={multiline ? rows : undefined}
        required={required}
        placeholder={placeholder || "Type text, or wrap math in $...$  e.g. Solve $x^{2} + 3x - 5 = 0$"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputRef={setFieldRef}
        sx={{ "& fieldset": { borderColor: BORDER } }}
      />

      {hasMath && (
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            border: `1px dashed ${BORDER}`,
            borderRadius: 2,
            bgcolor: "#F8FAFC",
            fontSize: 14,
          }}
        >
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: MUTED, mb: 0.5, textTransform: "uppercase" }}>
            Preview
          </Typography>
          {renderWithMath(value)}
        </Box>
      )}

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ p: 1.5, maxWidth: 280 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: MUTED, mb: 1 }}>
            Click to insert
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {SNIPPETS.map((s) => (
              <IconButton
                key={s.label}
                size="small"
                onClick={() => { insertSnippet(s.insert); setAnchorEl(null); }}
                sx={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: 1.5,
                  fontSize: 13,
                  width: 44,
                  height: 32,
                }}
              >
                {s.label}
              </IconButton>
            ))}
          </Stack>
          <Typography sx={{ fontSize: 10.5, color: MUTED, mt: 1.5, lineHeight: 1.5 }}>
            Or type LaTeX directly wrapped in <code>$...$</code>, e.g. <code>$\frac{"{a}"}{"{b}"}$</code>
          </Typography>
        </Box>
      </Popover>
    </Box>
  );
}