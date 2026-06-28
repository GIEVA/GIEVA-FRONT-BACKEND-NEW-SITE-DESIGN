
// pages/CreateArticle.jsx
// Premium CMS article creation page.
// Uses InlineEditor for title/subtitle (inline marks only, no block tags).
// Uses TiptapEditor for body content (full block + inline editing).
// Fixes: clean HTML saved for title/subtitle, no wrapping <p>/<h1> tags.

import {
  Box, Typography, Paper, TextField, Button, Stack, Chip,
  CircularProgress, Switch, FormControlLabel, MenuItem,
  Grid, Divider, Alert, Snackbar, LinearProgress,
} from "@mui/material";

import {
  CloudUpload, Save, Publish, ArrowBack,
  Tag, Tune, Image as ImageIcon,
} from "@mui/icons-material";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createArticle } from "../services/articleService";
import TiptapEditor from "../components/TiptapEditor";
import InlineEditor from "../components/InlineEditor";

const NAVY  = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD  = "#D4A017";
const BG    = "#F7F9FC";
const BORDER = "#E6E9F0";

const CATEGORIES = [
  { value: "study-abroad",  label: "Study Abroad" },
  { value: "technology",    label: "Technology" },
  { value: "scholarships",  label: "Scholarships" },
  { value: "ai",            label: "AI" },
  { value: "career",        label: "Career" },
  { value: "news",          label: "News" },
];

// ── Section label ────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <Typography sx={{ fontSize: 13, fontWeight: 700, color: NAVY, mb: 1, textTransform: "uppercase", letterSpacing: 0.8 }}>
    {children}
  </Typography>
);

export default function CreateArticle() {
  const navigate = useNavigate();

  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [tagInput, setTagInput]   = useState("");
  const [coverPreview, setCoverPreview] = useState(null);

  const [form, setForm] = useState({
    title:          "",
    subtitle:       "",
    excerpt:        "",
    content:        "",
    category:       "",
    tags:           [],
    seoTitle:       "",
    seoDescription: "",
    seoKeywords:    [],
    status:         "draft",
    isFeatured:     false,
    allowComments:  true,
    coverImage:     null,
  });

  const setField = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  // ── Tags ────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim();
    if (!t || form.tags.includes(t)) return;
    setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };
  const removeTag = (i) => setForm((f) => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }));

  // ── Cover image ─────────────────────────────────────────────
  const handleCoverImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, coverImage: file }));
    setCoverPreview(URL.createObjectURL(file));
  };
  const removeCover = () => {
    setForm((f) => ({ ...f, coverImage: null }));
    setCoverPreview(null);
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (publish = false) => {
    if (!form.title?.replace(/<[^>]*>/g, "").trim()) {
      setToast({ msg: "Article title is required", severity: "error" });
      return;
    }
    if (!form.content?.replace(/<[^>]*>/g, "").trim()) {
      setToast({ msg: "Article content is required", severity: "error" });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      const payload = { ...form, status: publish ? "published" : form.status };

      Object.entries(payload).forEach(([key, value]) => {
        if (key === "coverImage") return;
        if (key === "tags" || key === "seoKeywords") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });

      if (form.coverImage) formData.append("coverImage", form.coverImage);

      await createArticle(formData);

      setToast({ msg: publish ? "Article published!" : "Draft saved!", severity: "success" });
      setTimeout(() => navigate("/admin/cms/articles"), 1200);
    } catch (err) {
      console.error(err);
      setToast({ msg: err?.response?.data?.message || "Failed to save article", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const wordCount = form.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG, p: { xs: 2, md: 4 } }}>

      {loading && <LinearProgress sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 2000, "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />}

      {/* HEADER */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/admin/cms/articles")}
            sx={{ color: NAVY, textTransform: "none", fontWeight: 600 }}
          >
            Articles
          </Button>
          <Typography sx={{ color: "#cbd5e1", fontSize: 18 }}>/</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: NAVY }}>Create Article</Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<Save />}
            disabled={loading}
            onClick={() => handleSubmit(false)}
            sx={{ borderColor: BORDER, color: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2.5 }}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Publish />}
            disabled={loading}
            onClick={() => handleSubmit(true)}
            sx={{ bgcolor: GREEN, textTransform: "none", fontWeight: 700, borderRadius: 2.5, "&:hover": { bgcolor: "#166d3e" } }}
          >
            Publish
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} alignItems="flex-start">

        {/* ── LEFT: MAIN CONTENT ── */}
        <Grid item xs={12} lg={8}>

          {/* TITLE */}
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 3, mb: 3 }}>
            <SectionLabel>Article Title *</SectionLabel>
            <InlineEditor
              value={form.title}
              onChange={setField("title")}
              placeholder="Enter a compelling article title..."
              fontSize={22}
              fontWeight={700}
              minHeight={52}
            />

            <Box mt={2.5}>
              <SectionLabel>Subtitle</SectionLabel>
              <InlineEditor
                value={form.subtitle}
                onChange={setField("subtitle")}
                placeholder="Add a supporting subtitle..."
                fontSize={16}
                fontWeight={400}
                minHeight={44}
              />
            </Box>
          </Paper>

          {/* COVER IMAGE */}
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 3, mb: 3 }}>
            <SectionLabel>Cover Image</SectionLabel>

            {coverPreview ? (
              <Box sx={{ position: "relative" }}>
                <Box
                  component="img"
                  src={coverPreview}
                  sx={{ width: "100%", height: 260, objectFit: "cover", borderRadius: 2, display: "block" }}
                />
                <Button
                  onClick={removeCover}
                  size="small"
                  variant="contained"
                  sx={{
                    position: "absolute", top: 10, right: 10,
                    bgcolor: "rgba(0,0,0,0.65)", color: "#fff",
                    textTransform: "none", fontWeight: 700, borderRadius: 2,
                    "&:hover": { bgcolor: "#ef4444" },
                  }}
                >
                  Remove
                </Button>
              </Box>
            ) : (
              <Button
                component="label"
                variant="outlined"
                startIcon={<ImageIcon />}
                fullWidth
                sx={{
                  borderColor: BORDER, borderStyle: "dashed", borderRadius: 2,
                  color: "#94a3b8", py: 4, textTransform: "none", fontSize: 14,
                  "&:hover": { borderColor: GREEN, color: GREEN, bgcolor: "rgba(30,127,79,0.04)" },
                }}
              >
                Click to upload cover image (JPG, PNG, WebP)
                <input hidden type="file" accept="image/*" onChange={handleCoverImage} />
              </Button>
            )}
          </Paper>

          {/* EXCERPT */}
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 3, mb: 3 }}>
            <SectionLabel>Excerpt</SectionLabel>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Write a short summary that appears in article previews..."
              value={form.excerpt}
              onChange={(e) => setField("excerpt")(e.target.value)}
              sx={{ "& fieldset": { borderColor: BORDER } }}
            />
            <Typography sx={{ fontSize: 12, color: "#94a3b8", mt: 1 }}>
              {form.excerpt.length}/300 characters
            </Typography>
          </Paper>

          {/* BODY CONTENT */}
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <SectionLabel>Content *</SectionLabel>
              <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>{wordCount} words</Typography>
            </Box>
            <TiptapEditor
              content={form.content}
              onChange={setField("content")}
              minHeight={500}
            />
          </Paper>
        </Grid>

        {/* ── RIGHT: SETTINGS ── */}
        <Grid item xs={12} lg={4}>

          {/* PUBLISH SETTINGS */}
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 3, mb: 3 }}>
            <SectionLabel>Publish Settings</SectionLabel>

            <TextField
              select
              fullWidth
              label="Status"
              value={form.status}
              onChange={(e) => setField("status")(e.target.value)}
              size="small"
              sx={{ mb: 2, "& fieldset": { borderColor: BORDER } }}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="review">In Review</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="published">Published</MenuItem>
            </TextField>

            <Stack spacing={0.5}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isFeatured}
                    onChange={(e) => setField("isFeatured")(e.target.checked)}
                    size="small"
                    sx={{ "& .MuiSwitch-thumb": { bgcolor: form.isFeatured ? GOLD : undefined } }}
                  />
                }
                label={<Typography sx={{ fontSize: 14, fontWeight: 600 }}>Featured article</Typography>}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.allowComments}
                    onChange={(e) => setField("allowComments")(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography sx={{ fontSize: 14, fontWeight: 600 }}>Allow comments</Typography>}
              />
            </Stack>
          </Paper>

          {/* CATEGORY */}
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 3, mb: 3 }}>
            <SectionLabel>Category</SectionLabel>
            <TextField
              select
              fullWidth
              size="small"
              value={form.category}
              onChange={(e) => setField("category")(e.target.value)}
              label="Select category"
              sx={{ "& fieldset": { borderColor: BORDER } }}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </TextField>
          </Paper>

          {/* TAGS */}
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 3, mb: 3 }}>
            <SectionLabel>Tags</SectionLabel>
            <Stack direction="row" spacing={1} mb={1.5}>
              <TextField
                size="small"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                sx={{ flex: 1, "& fieldset": { borderColor: BORDER } }}
              />
              <Button variant="contained" onClick={addTag}
                sx={{ bgcolor: NAVY, textTransform: "none", borderRadius: 2, fontWeight: 700, "&:hover": { bgcolor: GREEN }, flexShrink: 0 }}>
                Add
              </Button>
            </Stack>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {form.tags.map((tag, i) => (
                <Chip key={i} label={tag} size="small" onDelete={() => removeTag(i)}
                  sx={{ bgcolor: "#EEF2F7", fontWeight: 600, mb: 0.5 }} />
              ))}
              {form.tags.length === 0 && (
                <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No tags yet</Typography>
              )}
            </Stack>
          </Paper>

          {/* SEO */}
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Tune sx={{ fontSize: 16, color: NAVY }} />
              <SectionLabel>SEO Settings</SectionLabel>
            </Box>

            <Stack spacing={2}>
              <TextField
                label="SEO Title"
                size="small"
                fullWidth
                value={form.seoTitle}
                onChange={(e) => setField("seoTitle")(e.target.value)}
                helperText={`${form.seoTitle.length}/60`}
                sx={{ "& fieldset": { borderColor: BORDER } }}
              />
              <TextField
                label="Meta Description"
                size="small"
                multiline
                rows={3}
                fullWidth
                value={form.seoDescription}
                onChange={(e) => setField("seoDescription")(e.target.value)}
                helperText={`${form.seoDescription.length}/160`}
                sx={{ "& fieldset": { borderColor: BORDER } }}
              />
            </Stack>

            {/* SEO PREVIEW */}
            {(form.seoTitle || form.title) && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "#F8FAFC", borderRadius: 2, border: `1px solid ${BORDER}` }}>
                <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.75, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Google Preview
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#1a0dab", fontWeight: 500, lineHeight: 1.3, mb: 0.5 }}
                  dangerouslySetInnerHTML={{ __html: form.seoTitle || form.title }} />
                <Typography sx={{ fontSize: 13, color: "#006621", mb: 0.5 }}>
                  yoursite.com › articles
                </Typography>
                {form.seoDescription && (
                  <Typography sx={{ fontSize: 13, color: "#545454", lineHeight: 1.45 }}>
                    {form.seoDescription.slice(0, 160)}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* TOAST */}
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// import {
//   Box,
//   Typography,
//   Paper,
//   TextField,
//   Button,
//   Stack,
//   Chip,
//   CircularProgress,
//   Switch,
//   FormControlLabel,
//   MenuItem,
// } from "@mui/material";

// import {
//   CloudUpload,
//   Save,
//   Publish,
// } from "@mui/icons-material";

// import {
//   useState,
// } from "react";

// import {
//   useNavigate,
// } from "react-router-dom";

// import {
//   createArticle,
// } from "../services/articleService";
// // import ReactQuill from "react-quill";
// // import "react-quill/dist/quill.snow.css";
// import TiptapEditor from "../components/TiptapEditor";

// const NAVY = "#0B1F3A";
// const GREEN = "#1E7F4F";
// const GOLD = "#D4A017";

// // const quillModules = {
// //   toolbar: [
// //     [{ header: [1, 2, 3, false] }],
// //     [{ font: [] }],
// //     [{ size: [] }],

// //     ["bold", "italic", "underline", "strike"],

// //     [{ color: [] }, { background: [] }],

// //     [{ script: "sub" }, { script: "super" }],

// //     [{ list: "ordered" }, { list: "bullet" }],
// //     [{ indent: "-1" }, { indent: "+1" }],

// //     [{ align: [] }],

// //     ["link", "image", "video"],

// //     ["blockquote", "code-block"],

// //     ["clean"],
// //   ],
// // };

// export default function CreateArticle() {

//   const navigate =
//     useNavigate();

//   const [loading,
//     setLoading] =
//     useState(false);

//   const [tagInput,
//     setTagInput] =
//     useState("");

//   const [form,
//     setForm] =
//     useState({

//       title: "",
//       subtitle: "",
//       excerpt: "",
//       content: "",
//       category: "",
//       tags: [],
//       seoTitle: "",
//       seoDescription: "",
//       seoKeywords: [],
//       status: "draft",
//       isFeatured: false,
//       allowComments: true,
//       coverImage: null,
//     });



//   const handleAddTag =
//     () => {

//       if (!tagInput.trim())
//         return;

//       setForm({
//         ...form,
//         tags: [
//           ...form.tags,
//           tagInput,
//         ],
//       });

//       setTagInput("");
//     };



// const handleSubmit =
//   async (publish = false) => {

//     try {

//       setLoading(true);

//       const formData =
//         new FormData();



//       // ======================================================
//       // APPEND NORMAL FIELDS
//       // ======================================================

//       Object.entries({

//         ...form,

//         status:
//           publish
//             ? "published"
//             : form.status,

//       }).forEach(
//         ([key, value]) => {

//           // SKIP FILE
//           if (
//             key === "coverImage"
//           ) {
//             return;
//           }



//           if (

//             key === "tags" ||

//             key === "seoKeywords"
//           ) {

//             formData.append(

//               key,

//               JSON.stringify(
//                 value
//               )
//             );

//           } else {

//             formData.append(
//               key,
//               value
//             );
//           }
//         }
//       );



//       // ======================================================
//       // APPEND FILE ONCE
//       // ======================================================

//       if (
//         form.coverImage
//       ) {

//         formData.append(

//           "coverImage",

//           form.coverImage
//         );
//       }



//       await createArticle(
//         formData
//       );



//       navigate(
//         "/admin/cms/articles"
//       );

//     } catch (err) {

//       console.error(err);

//     } finally {

//       setLoading(false);
//     }
//   };



//   return (
//     <Box p={3}>

//       <Typography
//         variant="h4"
//         fontWeight="bold"
//         color={NAVY}
//         mb={3}
//       >
//         Create Article
//       </Typography>

//       <Paper
//         sx={{
//           p: 4,
//           borderRadius: 5,
//         }}
//       >

//         <Stack spacing={3}>

//           <Box>
//           <Typography mb={1} fontWeight="bold">
//             Article Title
//           </Typography>

//           <TextField
//             fullWidth
//             placeholder="Enter article title"
//             value={form.title}
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 title: e.target.value,
//               })
//             }
//           />

//          {/* <TiptapEditor
//           content={form.title}
//           onChange={(value) =>
//             setForm({
//               ...form,
//               title: value,
//             })
//           }
//           minHeight={120}
//         /> */}
//         </Box>

//           <Box>
//           <Typography mb={1} fontWeight="bold">
//             Article Subtitle
//           </Typography>

//           <TextField
//             fullWidth
//             multiline
//             rows={2}
//             placeholder="Enter article subtitle"
//             value={form.subtitle}
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 subtitle: e.target.value,
//               })
//             }
//           />

//           {/* <TiptapEditor
//             content={form.subtitle}
//             onChange={(value) =>
//               setForm({
//                 ...form,
//                 subtitle: value,
//               })
//             }
//             minHeight={120}
//           /> */}
//         </Box>

//         <Button
//             component="label"
//             startIcon={
//               <CloudUpload />
//             }
//             variant="outlined"
//           >

//             Upload Cover Image

//             <input
//               hidden
//               type="file"
//               accept="image/*"
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   coverImage:
//                     e.target
//                       .files[0],
//                 })
//               }
//             />

//           </Button>

//           {form.coverImage && (

//             <Typography
//               variant="body2"
//             >
//               {
//                 form.coverImage.name
//               }
//             </Typography>
//           )}

//           <TextField
//             label="Excerpt"
//             multiline
//             rows={3}
//             fullWidth
//             value={form.excerpt}
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 excerpt:
//                   e.target.value,
//               })
//             }
//           />

//           <Box>
//           <Typography mb={1} fontWeight="bold">
//             Content
//           </Typography>

//          <TiptapEditor
//           content={form.content}
//           onChange={(value) =>
//             setForm({
//               ...form,
//               content: value,
//             })
//           }
//           minHeight={400}
//         />
//         </Box>

//           <TextField
//             select
//             fullWidth
//             label="Category"
//             value={form.category}
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 category:
//                   e.target.value,
//               })
//             }
//           >

//             <MenuItem value="study-abroad">
//               Study Abroad
//             </MenuItem>

//             <MenuItem value="technology">
//               Technology
//             </MenuItem>

//             <MenuItem value="scholarships">
//               Scholarships
//             </MenuItem>

//             <MenuItem value="ai">
//               AI
//             </MenuItem>

//           </TextField>

//           <Box>

//             <Typography
//               mb={1}
//               fontWeight="bold"
//             >
//               Tags
//             </Typography>

//             <Stack
//               direction="row"
//               spacing={1}
//               mb={2}
//             >

//               <TextField
//                 label="Add Tag"
//                 value={tagInput}
//                 onChange={(e) =>
//                   setTagInput(
//                     e.target.value
//                   )
//                 }
//               />

//               <Button
//                 variant="contained"
//                 onClick={
//                   handleAddTag
//                 }
//                 sx={{
//                   bgcolor: GREEN,
//                 }}
//               >
//                 Add
//               </Button>

//             </Stack>

//             <Stack
//               direction="row"
//               spacing={1}
//               flexWrap="wrap"
//             >

//               {form.tags.map(
//                 (tag, index) => (

//                   <Chip
//                     key={index}
//                     label={tag}
//                     onDelete={() => {

//                       setForm({
//                         ...form,
//                         tags:
//                           form.tags.filter(
//                             (_, i) =>
//                               i !== index
//                           ),
//                       });
//                     }}
//                   />
//                 )
//               )}

//             </Stack>

//           </Box>

//           <TextField
//             label="SEO Title"
//             fullWidth
//             value={form.seoTitle}
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 seoTitle:
//                   e.target.value,
//               })
//             }
//           />

//           <TextField
//             label="SEO Description"
//             multiline
//             rows={3}
//             fullWidth
//             value={
//               form.seoDescription
//             }
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 seoDescription:
//                   e.target.value,
//               })
//             }
//           />

          

          

//           <Stack
//             direction="row"
//             spacing={3}
//           >

//             <FormControlLabel
//               control={

//                 <Switch
//                   checked={
//                     form.isFeatured
//                   }
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       isFeatured:
//                         e.target
//                           .checked,
//                     })
//                   }
//                 />
//               }
//               label="Featured"
//             />

//             <FormControlLabel
//               control={

//                 <Switch
//                   checked={
//                     form.allowComments
//                   }
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       allowComments:
//                         e.target
//                           .checked,
//                     })
//                   }
//                 />
//               }
//               label="Allow Comments"
//             />

//           </Stack>

//           <Stack
//             direction="row"
//             spacing={2}
//           >

//             <Button
//               variant="outlined"
//               startIcon={<Save />}
//               onClick={() =>
//                 handleSubmit(false)
//               }
//             >
//               Save Draft
//             </Button>

//             <Button
//               variant="contained"
//               disabled={loading}
//               startIcon={
//                 <Publish />
//               }
//               onClick={() =>
//                 handleSubmit(true)
//               }
//               sx={{
//                 bgcolor: GREEN,
//               }}
//             >
//               {loading ? (
//                 <CircularProgress
//                   size={24}
//                   sx={{
//                     color: "#fff",
//                   }}
//                 />
//               ) : (
//                 "Publish Article"
//               )}
//             </Button>

//           </Stack>

//         </Stack>

//       </Paper>

//     </Box>
//   );
// }