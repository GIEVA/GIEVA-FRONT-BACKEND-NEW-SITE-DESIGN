import { useEffect } from "react";

import {
  useEditor,
  EditorContent,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";

import TiptapImage from "@tiptap/extension-image";

import TextAlign from "@tiptap/extension-text-align";

import Placeholder from "@tiptap/extension-placeholder";

import CharacterCount from "@tiptap/extension-character-count";

import Underline from "@tiptap/extension-underline";

import Highlight from "@tiptap/extension-highlight";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

import Youtube from "@tiptap/extension-youtube";

import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from "@tiptap/extension-table";

import { common, createLowlight } from "lowlight";

import {
  Box,
  IconButton,
  Stack,
  Divider,
  Tooltip,
  Typography,
  MenuItem,
  Select,
} from "@mui/material";

import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Undo,
  Redo,
  Image,
  FormatUnderlined,
  Highlight as HighlightIcon,
  Code,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  TableChart,
  SmartDisplay,
} from "@mui/icons-material";

import {
  uploadArticleImage,
} from "../services/articleService";

const lowlight =
  createLowlight(common);



export default function TiptapEditor({
  content,
  onChange,
  minHeight = 200,
}) {

  // ======================================================
  // EDITOR
  // ======================================================

  const editor = useEditor({

    extensions: [

      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),

      Underline,

      Highlight,

      Placeholder.configure({
        placeholder:
          "Start writing your article...",
      }),

      CharacterCount,

      TiptapImage.configure({
        inline: false,
        allowBase64: true,
      }),

      TextAlign.configure({
        types: [
          "heading",
          "paragraph",
        ],
      }),

      CodeBlockLowlight.configure({
        lowlight,
      }),

      Youtube.configure({
        controls: true,
      }),

      Table.configure({
        resizable: true,
      }),

      TableRow,
      TableHeader,
      TableCell,
    ],

    content,

    immediatelyRender: false,

    onUpdate: ({ editor }) => {

      onChange(
        editor.getHTML()
      );
    },
  });



  // ======================================================
  // AUTOSAVE
  // ======================================================

  useEffect(() => {

    if (!editor)
      return;

    const interval =
      setInterval(() => {

        const content =
          editor.getHTML();

        localStorage.setItem(
          "article-draft",
          content
        );

      }, 10000);

    return () =>
      clearInterval(interval);

  }, [editor]);



  if (!editor)
    return null;



  // ======================================================
  // IMAGE UPLOAD
  // ======================================================

  const handleImageUpload =
    async (file) => {

      try {

        const response =
          await uploadArticleImage(
            file
          );

        const imageUrl =
          response.imageUrl;

        if (!imageUrl)
          return;

        editor
          .chain()
          .focus()
          .setImage({
            src: imageUrl,
          })
          .run();

      } catch (error) {

        console.error(
          "Image upload failed:",
          error
        );
      }
    };



  // ======================================================
  // YOUTUBE EMBED
  // ======================================================

  const addYoutubeVideo =
    () => {

      const url =
        prompt(
          "Enter YouTube URL"
        );

      if (!url)
        return;

      editor
        .chain()
        .focus()
        .setYoutubeVideo({
          src: url,
        })
        .run();
    };



  return (

    <Box
      sx={{
        border:
          "1px solid #dcdcdc",

        borderRadius: 3,

        overflow: "hidden",

        bgcolor: "#fff",
      }}
    >

      {/* ====================================================== */}
      {/* TOOLBAR */}
      {/* ====================================================== */}

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        sx={{
          p: 1.5,
          borderBottom:
            "1px solid #eee",
          bgcolor: "#fafafa",
        }}
      >

        {/* HEADINGS */}

        <Select
          size="small"
          defaultValue="paragraph"

          onChange={(e) => {

            const value =
              e.target.value;

            if (
              value === "paragraph"
            ) {

              editor
                .chain()
                .focus()
                .setParagraph()
                .run();

            } else {

              editor
                .chain()
                .focus()
                .toggleHeading({
                  level:
                    Number(value),
                })
                .run();
            }
          }}
        >

          <MenuItem value="paragraph">
            Paragraph
          </MenuItem>

          <MenuItem value={1}>
            H1
          </MenuItem>

          <MenuItem value={2}>
            H2
          </MenuItem>

          <MenuItem value={3}>
            H3
          </MenuItem>

        </Select>



        <Divider
          orientation="vertical"
          flexItem
        />



        {/* FORMATTING */}

        <Tooltip title="Bold">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleBold()
                .run()
            }
          >
            <FormatBold />
          </IconButton>
        </Tooltip>



        <Tooltip title="Italic">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleItalic()
                .run()
            }
          >
            <FormatItalic />
          </IconButton>
        </Tooltip>



        <Tooltip title="Underline">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleUnderline()
                .run()
            }
          >
            <FormatUnderlined />
          </IconButton>
        </Tooltip>



        <Tooltip title="Highlight">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHighlight()
                .run()
            }
          >
            <HighlightIcon />
          </IconButton>
        </Tooltip>



        <Divider
          orientation="vertical"
          flexItem
        />



        {/* ALIGNMENT */}

        <Tooltip title="Align Left">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .setTextAlign("left")
                .run()
            }
          >
            <FormatAlignLeft />
          </IconButton>
        </Tooltip>



        <Tooltip title="Align Center">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .setTextAlign("center")
                .run()
            }
          >
            <FormatAlignCenter />
          </IconButton>
        </Tooltip>



        <Tooltip title="Align Right">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .setTextAlign("right")
                .run()
            }
          >
            <FormatAlignRight />
          </IconButton>
        </Tooltip>



        <Tooltip title="Justify">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .setTextAlign("justify")
                .run()
            }
          >
            <FormatAlignJustify />
          </IconButton>
        </Tooltip>



        <Divider
          orientation="vertical"
          flexItem
        />



        {/* LISTS */}

        <Tooltip title="Bullet List">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleBulletList()
                .run()
            }
          >
            <FormatListBulleted />
          </IconButton>
        </Tooltip>



        <Tooltip title="Ordered List">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleOrderedList()
                .run()
            }
          >
            <FormatListNumbered />
          </IconButton>
        </Tooltip>



        <Tooltip title="Blockquote">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleBlockquote()
                .run()
            }
          >
            <FormatQuote />
          </IconButton>
        </Tooltip>



        <Tooltip title="Code Block">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleCodeBlock()
                .run()
            }
          >
            <Code />
          </IconButton>
        </Tooltip>



        <Divider
          orientation="vertical"
          flexItem
        />



        {/* TABLE */}

        <Tooltip title="Insert Table">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({
                  rows: 3,
                  cols: 3,
                  withHeaderRow: true,
                })
                .run()
            }
          >
            <TableChart />
          </IconButton>
        </Tooltip>



        {/* YOUTUBE */}

        <Tooltip title="Embed YouTube">
          <IconButton
            onClick={
              addYoutubeVideo
            }
          >
            <SmartDisplay />
          </IconButton>
        </Tooltip>



        {/* IMAGE */}

        <Tooltip title="Upload Image">
          <IconButton
            component="label"
          >

            <Image />

            <input
              hidden
              type="file"
              accept="image/*"

              onChange={async (e) => {

                const file =
                  e.target.files?.[0];

                if (!file)
                  return;

                await handleImageUpload(
                  file
                );
              }}
            />

          </IconButton>
        </Tooltip>



        <Divider
          orientation="vertical"
          flexItem
        />



        {/* UNDO */}

        <Tooltip title="Undo">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .undo()
                .run()
            }
          >
            <Undo />
          </IconButton>
        </Tooltip>



        {/* REDO */}

        <Tooltip title="Redo">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .redo()
                .run()
            }
          >
            <Redo />
          </IconButton>
        </Tooltip>

      </Stack>



      {/* ====================================================== */}
      {/* EDITOR */}
      {/* ====================================================== */}

      <EditorContent
        editor={editor}

        style={{
          minHeight,
          padding: "20px",
        }}
      />



      {/* ====================================================== */}
      {/* FOOTER */}
      {/* ====================================================== */}

      <Box
        sx={{
          px: 2,
          py: 1,
          borderTop:
            "1px solid #eee",
          bgcolor: "#fafafa",
          display: "flex",
          justifyContent:
            "space-between",
        }}
      >

        <Typography
          variant="caption"
        >
          Words:
          {" "}
          {
            editor.storage
              .characterCount
              .words()
          }
        </Typography>



        <Typography
          variant="caption"
        >
          Characters:
          {" "}
          {
            editor.storage
              .characterCount
              .characters()
          }
        </Typography>

      </Box>

    </Box>
  );
}