import { InlineMath, BlockMath } from "react-katex";
import { Typography } from "@mui/material";

export default function QuestionPreview({ text, variant = "body1", component, sx = {} }) {
  const parts = (text || "").split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g).filter(Boolean);

  return (
    <Typography variant={variant} component={component || (variant === "span" ? "span" : "div")} sx={sx}>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return <BlockMath key={i} math={part.slice(2, -2)} />;
        }
        if (part.startsWith("$") && part.endsWith("$")) {
          return <InlineMath key={i} math={part.slice(1, -1)} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </Typography>
  );
}