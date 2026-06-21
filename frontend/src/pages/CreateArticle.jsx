import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel,
  MenuItem,
} from "@mui/material";

import {
  CloudUpload,
  Save,
  Publish,
} from "@mui/icons-material";

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  createArticle,
} from "../services/articleService";
// import ReactQuill from "react-quill";
// import "react-quill/dist/quill.snow.css";
import TiptapEditor from "../components/TiptapEditor";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";

// const quillModules = {
//   toolbar: [
//     [{ header: [1, 2, 3, false] }],
//     [{ font: [] }],
//     [{ size: [] }],

//     ["bold", "italic", "underline", "strike"],

//     [{ color: [] }, { background: [] }],

//     [{ script: "sub" }, { script: "super" }],

//     [{ list: "ordered" }, { list: "bullet" }],
//     [{ indent: "-1" }, { indent: "+1" }],

//     [{ align: [] }],

//     ["link", "image", "video"],

//     ["blockquote", "code-block"],

//     ["clean"],
//   ],
// };

export default function CreateArticle() {

  const navigate =
    useNavigate();

  const [loading,
    setLoading] =
    useState(false);

  const [tagInput,
    setTagInput] =
    useState("");

  const [form,
    setForm] =
    useState({

      title: "",
      subtitle: "",
      excerpt: "",
      content: "",
      category: "",
      tags: [],
      seoTitle: "",
      seoDescription: "",
      seoKeywords: [],
      status: "draft",
      isFeatured: false,
      allowComments: true,
      coverImage: null,
    });



  const handleAddTag =
    () => {

      if (!tagInput.trim())
        return;

      setForm({
        ...form,
        tags: [
          ...form.tags,
          tagInput,
        ],
      });

      setTagInput("");
    };



const handleSubmit =
  async (publish = false) => {

    try {

      setLoading(true);

      const formData =
        new FormData();



      // ======================================================
      // APPEND NORMAL FIELDS
      // ======================================================

      Object.entries({

        ...form,

        status:
          publish
            ? "published"
            : form.status,

      }).forEach(
        ([key, value]) => {

          // SKIP FILE
          if (
            key === "coverImage"
          ) {
            return;
          }



          if (

            key === "tags" ||

            key === "seoKeywords"
          ) {

            formData.append(

              key,

              JSON.stringify(
                value
              )
            );

          } else {

            formData.append(
              key,
              value
            );
          }
        }
      );



      // ======================================================
      // APPEND FILE ONCE
      // ======================================================

      if (
        form.coverImage
      ) {

        formData.append(

          "coverImage",

          form.coverImage
        );
      }



      await createArticle(
        formData
      );



      navigate(
        "/admin/cms/articles"
      );

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);
    }
  };



  return (
    <Box p={3}>

      <Typography
        variant="h4"
        fontWeight="bold"
        color={NAVY}
        mb={3}
      >
        Create Article
      </Typography>

      <Paper
        sx={{
          p: 4,
          borderRadius: 5,
        }}
      >

        <Stack spacing={3}>

          <Box>
          <Typography mb={1} fontWeight="bold">
            Article Title
          </Typography>

          <TextField
            fullWidth
            placeholder="Enter article title"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
          />

         {/* <TiptapEditor
          content={form.title}
          onChange={(value) =>
            setForm({
              ...form,
              title: value,
            })
          }
          minHeight={120}
        /> */}
        </Box>

          <Box>
          <Typography mb={1} fontWeight="bold">
            Article Subtitle
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Enter article subtitle"
            value={form.subtitle}
            onChange={(e) =>
              setForm({
                ...form,
                subtitle: e.target.value,
              })
            }
          />

          {/* <TiptapEditor
            content={form.subtitle}
            onChange={(value) =>
              setForm({
                ...form,
                subtitle: value,
              })
            }
            minHeight={120}
          /> */}
        </Box>

        <Button
            component="label"
            startIcon={
              <CloudUpload />
            }
            variant="outlined"
          >

            Upload Cover Image

            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm({
                  ...form,
                  coverImage:
                    e.target
                      .files[0],
                })
              }
            />

          </Button>

          {form.coverImage && (

            <Typography
              variant="body2"
            >
              {
                form.coverImage.name
              }
            </Typography>
          )}

          <TextField
            label="Excerpt"
            multiline
            rows={3}
            fullWidth
            value={form.excerpt}
            onChange={(e) =>
              setForm({
                ...form,
                excerpt:
                  e.target.value,
              })
            }
          />

          <Box>
          <Typography mb={1} fontWeight="bold">
            Content
          </Typography>

         <TiptapEditor
          content={form.content}
          onChange={(value) =>
            setForm({
              ...form,
              content: value,
            })
          }
          minHeight={400}
        />
        </Box>

          <TextField
            select
            fullWidth
            label="Category"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category:
                  e.target.value,
              })
            }
          >

            <MenuItem value="study-abroad">
              Study Abroad
            </MenuItem>

            <MenuItem value="technology">
              Technology
            </MenuItem>

            <MenuItem value="scholarships">
              Scholarships
            </MenuItem>

            <MenuItem value="ai">
              AI
            </MenuItem>

          </TextField>

          <Box>

            <Typography
              mb={1}
              fontWeight="bold"
            >
              Tags
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              mb={2}
            >

              <TextField
                label="Add Tag"
                value={tagInput}
                onChange={(e) =>
                  setTagInput(
                    e.target.value
                  )
                }
              />

              <Button
                variant="contained"
                onClick={
                  handleAddTag
                }
                sx={{
                  bgcolor: GREEN,
                }}
              >
                Add
              </Button>

            </Stack>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
            >

              {form.tags.map(
                (tag, index) => (

                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => {

                      setForm({
                        ...form,
                        tags:
                          form.tags.filter(
                            (_, i) =>
                              i !== index
                          ),
                      });
                    }}
                  />
                )
              )}

            </Stack>

          </Box>

          <TextField
            label="SEO Title"
            fullWidth
            value={form.seoTitle}
            onChange={(e) =>
              setForm({
                ...form,
                seoTitle:
                  e.target.value,
              })
            }
          />

          <TextField
            label="SEO Description"
            multiline
            rows={3}
            fullWidth
            value={
              form.seoDescription
            }
            onChange={(e) =>
              setForm({
                ...form,
                seoDescription:
                  e.target.value,
              })
            }
          />

          

          

          <Stack
            direction="row"
            spacing={3}
          >

            <FormControlLabel
              control={

                <Switch
                  checked={
                    form.isFeatured
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isFeatured:
                        e.target
                          .checked,
                    })
                  }
                />
              }
              label="Featured"
            />

            <FormControlLabel
              control={

                <Switch
                  checked={
                    form.allowComments
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      allowComments:
                        e.target
                          .checked,
                    })
                  }
                />
              }
              label="Allow Comments"
            />

          </Stack>

          <Stack
            direction="row"
            spacing={2}
          >

            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={() =>
                handleSubmit(false)
              }
            >
              Save Draft
            </Button>

            <Button
              variant="contained"
              disabled={loading}
              startIcon={
                <Publish />
              }
              onClick={() =>
                handleSubmit(true)
              }
              sx={{
                bgcolor: GREEN,
              }}
            >
              {loading ? (
                <CircularProgress
                  size={24}
                  sx={{
                    color: "#fff",
                  }}
                />
              ) : (
                "Publish Article"
              )}
            </Button>

          </Stack>

        </Stack>

      </Paper>

    </Box>
  );
}