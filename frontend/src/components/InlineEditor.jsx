
// components/InlineEditor.jsx
// A constrained Tiptap editor for TITLE and SUBTITLE fields.
// Only allows INLINE marks: bold, italic, underline, strikethrough, highlight.
// No block-level elements (no headings, no paragraphs beyond a single line).
// Saves as HTML string like: "My <strong>Bold</strong> Title"
// (the outer <p> wrapper is stripped on save so you get clean inline HTML)

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import { Box, IconButton, Stack, Tooltip, Divider } from "@mui/material";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  StrikethroughS,
  Highlight as HighlightIcon,
  FormatClear,
} from "@mui/icons-material";
import { useEffect } from "react";

// Strip the wrapping <p>...</p> tags that Tiptap always adds
// so the stored value is clean inline HTML, e.g. "Hello <strong>World</strong>"
const stripOuterP = (html = "") =>
  html.replace(/^<p>([\s\S]*)<\/p>$/, "$1").trim();

// Prevent Enter key from creating new paragraphs in a single-line field
const NoNewLine = Extension.create({
  name: "noNewLine",
  addKeyboardShortcuts() {
    return {
      Enter: () => true,      // block Enter
      "Shift-Enter": () => true, // block Shift+Enter
    };
  },
});

export default function InlineEditor({
  value = "",
  onChange,
  placeholder = "Enter text...",
  fontSize = 16,
  fontWeight = 400,
  minHeight = 48,
  sx = {},
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable all block-level extensions
        heading:      false,
        blockquote:   false,
        codeBlock:    false,
        bulletList:   false,
        orderedList:  false,
        listItem:     false,
        horizontalRule: false,
        hardBreak:    false,
        // Keep bold, italic, strike from StarterKit
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder }),
      NoNewLine,
    ],
    content: value ? `<p>${value}</p>` : "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const raw = editor.getHTML();
      onChange(stripOuterP(raw));
    },
  });

  // Sync external value changes (e.g. when form resets)
  useEffect(() => {
    if (!editor) return;
    const current = stripOuterP(editor.getHTML());
    if (current !== value) {
      editor.commands.setContent(value ? `<p>${value}</p>` : "");
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  const ToolBtn = ({ title, onClick, active, children }) => (
    <Tooltip title={title} placement="top">
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1,
          bgcolor: active ? "rgba(30,127,79,0.12)" : "transparent",
          color: active ? "#1E7F4F" : "#64748b",
          "&:hover": { bgcolor: "rgba(30,127,79,0.1)" },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );

  return (
    <Box
      sx={{
        border: "1px solid #d1d5db",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#fff",
        "&:focus-within": { borderColor: "#1E7F4F", boxShadow: "0 0 0 3px rgba(30,127,79,0.1)" },
        transition: "border-color 0.15s, box-shadow 0.15s",
        ...sx,
      }}
    >
      {/* INLINE TOOLBAR */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.25}
        sx={{
          px: 1,
          py: 0.5,
          borderBottom: "1px solid #f1f5f9",
          bgcolor: "#fafbfc",
        }}
      >
        <ToolBtn title="Bold (⌘B)" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          <FormatBold fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Italic (⌘I)" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <FormatItalic fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Underline (⌘U)" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}>
          <FormatUnderlined fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
          <StrikethroughS fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Highlight" onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")}>
          <HighlightIcon fontSize="small" />
        </ToolBtn>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <ToolBtn title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().run()}>
          <FormatClear fontSize="small" />
        </ToolBtn>
      </Stack>

      {/* EDITOR CONTENT */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          minHeight,
          fontSize,
          fontWeight,
          lineHeight: 1.5,
          color: "#0f172a",
          // Style the placeholder
          "& .tiptap p.is-editor-empty:first-child::before": {
            content: "attr(data-placeholder)",
            color: "#94a3b8",
            pointerEvents: "none",
            float: "left",
            height: 0,
          },
          // Make the content look like a field, not a doc
          "& .tiptap": {
            outline: "none",
            minHeight,
          },
          "& .tiptap p": {
            margin: 0,
          },
          "& mark": {
            bgcolor: "#fef08a",
            borderRadius: "2px",
            px: "2px",
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}