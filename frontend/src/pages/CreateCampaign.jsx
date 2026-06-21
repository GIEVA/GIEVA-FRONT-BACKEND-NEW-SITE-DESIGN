import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {

  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Stack,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider,
  Chip,

} from "@mui/material";

import {
  CloudUpload,
  Publish,
  Save,
} from "@mui/icons-material";

import slugify
from "slugify";

import TiptapEditor
from "../components/TiptapEditor";

import {
  createCampaign,
} from "../services/campaignService";



const CreateCampaign = () => {

  const navigate =
    useNavigate();



  const [loading,
    setLoading] =
      useState(false);



  const [preview,
    setPreview] =
      useState(null);



  const [form,
    setForm] =
      useState({

        title: "",

        description: "",

        type: "general",

        status: "draft",

        startDate: "",

        endDate: "",

        registrationLink: "",

        requiresRegistration:
          true,

        featured:
          false,

        coverImage:
          null,
      });



  // ======================================================
  // SLUG
  // ======================================================

  const slug =
    slugify(
      form.title || "",
      {

        lower: true,

        strict: true,
      }
    );



  // ======================================================
  // INPUT CHANGE
  // ======================================================

  const handleChange =
    (e) => {

      const {
        name,
        value,
      } = e.target;



      setForm({

        ...form,

        [name]:
          value,
      });
    };



  // ======================================================
  // IMAGE
  // ======================================================

  const handleImage =
    (e) => {

      const file =
        e.target.files[0];



      if (!file)
        return;



      setForm({

        ...form,

        coverImage:
          file,
      });



      setPreview(

        URL.createObjectURL(
          file
        )
      );
    };



  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit =
    async (
      status = "draft"
    ) => {

      try {

        setLoading(true);



        const formData =
          new FormData();



        Object.entries({

          ...form,

          status,
        }).forEach(

          ([key, value]) => {

            if (
              key ===
              "coverImage"
            )
              return;

            formData.append(
              key,
              value
            );
          }
        );



        if (
          form.coverImage
        ) {

          formData.append(

            "coverImage",

            form.coverImage
          );
        }



        await createCampaign(
          formData
        );



        navigate(
          "/admin/campaigns"
        );

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    };



  return (

    <Box p={3}>

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <Box
        mb={4}
      >

        <Typography
          variant="h4"
          fontWeight="bold"
        >

          Create Campaign

        </Typography>



        <Typography
          color="text.secondary"
        >

          Create and publish campaigns,
          webinars, SAT programs,
          tutorials and more.

        </Typography>

      </Box>



      <Grid
        container
        spacing={3}
      >

        {/* ====================================================== */}
        {/* MAIN */}
        {/* ====================================================== */}

        <Grid
          item
          xs={12}
          md={8}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            {/* TITLE */}

            <TextField

              fullWidth

              label="Campaign Title"

              name="title"

              value={form.title}

              onChange={
                handleChange
              }

              sx={{
                mb: 3,
              }}
            />



            {/* SLUG */}

            <Box mb={3}>

              <Typography
                variant="body2"
                color="text.secondary"
              >

                Campaign Slug

              </Typography>



              <Chip
                label={slug}
                color="primary"
              />

            </Box>



            {/* DESCRIPTION */}

            <Box mb={4}>

              <Typography
                mb={1}
                fontWeight="bold"
              >

                Description

              </Typography>



              <TiptapEditor

                value={
                  form.description
                }

                onChange={(
                  value
                ) =>
                  setForm({

                    ...form,

                    description:
                      value,
                  })
                }
              />

            </Box>



            {/* TYPE */}

            <Grid
              container
              spacing={2}
            >

              <Grid
                item
                xs={12}
                md={6}
              >

                <TextField

                  select

                  fullWidth

                  label="Campaign Type"

                  name="type"

                  value={form.type}

                  onChange={
                    handleChange
                  }
                >

                  <MenuItem value="general">
                    General
                  </MenuItem>

                  <MenuItem value="webinar">
                    Webinar
                  </MenuItem>

                  <MenuItem value="sat">
                    SAT
                  </MenuItem>

                  <MenuItem value="tutorial">
                    Tutorial
                  </MenuItem>

                </TextField>

              </Grid>



              <Grid
                item
                xs={12}
                md={6}
              >

                <TextField

                  fullWidth

                  label="Registration Link"

                  name="registrationLink"

                  value={
                    form.registrationLink
                  }

                  onChange={
                    handleChange
                  }
                />

              </Grid>

            </Grid>



            {/* DATES */}

            <Grid
              container
              spacing={2}
              mt={1}
            >

              <Grid
                item
                xs={12}
                md={6}
              >

                <TextField

                  fullWidth

                  type="datetime-local"

                  label="Start Date"

                  name="startDate"

                  InputLabelProps={{
                    shrink: true,
                  }}

                  value={
                    form.startDate
                  }

                  onChange={
                    handleChange
                  }
                />

              </Grid>



              <Grid
                item
                xs={12}
                md={6}
              >

                <TextField

                  fullWidth

                  type="datetime-local"

                  label="End Date"

                  name="endDate"

                  InputLabelProps={{
                    shrink: true,
                  }}

                  value={
                    form.endDate
                  }

                  onChange={
                    handleChange
                  }
                />

              </Grid>

            </Grid>

          </Paper>

        </Grid>



        {/* ====================================================== */}
        {/* SIDEBAR */}
        {/* ====================================================== */}

        <Grid
          item
          xs={12}
          md={4}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={2}
            >

              Campaign Settings

            </Typography>



            <Divider
              sx={{
                mb: 3,
              }}
            />



            {/* IMAGE */}

            <Box mb={3}>

              <Typography
                mb={1}
                fontWeight="bold"
              >

                Cover Image

              </Typography>



              <Button

                component="label"

                variant="outlined"

                startIcon={
                  <CloudUpload />
                }

                fullWidth
              >

                Upload Image

                <input

                  hidden

                  type="file"

                  accept="image/*"

                  onChange={
                    handleImage
                  }
                />

              </Button>



              {preview && (

                <Box
                  mt={2}
                >

                  <img

                    src={preview}

                    alt="preview"

                    style={{

                      width: "100%",

                      borderRadius: 12,

                      objectFit: "cover",
                    }}
                  />

                </Box>
              )}

            </Box>



            {/* SWITCHES */}

            <FormControlLabel

              control={

                <Switch

                  checked={
                    form.requiresRegistration
                  }

                  onChange={(e) =>
                    setForm({

                      ...form,

                      requiresRegistration:
                        e.target.checked,
                    })
                  }
                />
              }

              label="Requires Registration"
            />



            <FormControlLabel

              control={

                <Switch

                  checked={
                    form.featured
                  }

                  onChange={(e) =>
                    setForm({

                      ...form,

                      featured:
                        e.target.checked,
                    })
                  }
                />
              }

              label="Featured Campaign"
            />



            {/* BUTTONS */}

            <Stack
              spacing={2}
              mt={4}
            >

              <Button

                fullWidth

                variant="outlined"

                startIcon={<Save />}

                disabled={loading}

                onClick={() =>
                  handleSubmit(
                    "draft"
                  )
                }
              >

                Save Draft

              </Button>



              <Button

                fullWidth

                variant="contained"

                startIcon={<Publish />}

                disabled={loading}

                onClick={() =>
                  handleSubmit(
                    "active"
                  )
                }
              >

                {loading
                  ? (
                    <CircularProgress
                      size={24}
                      sx={{
                        color:
                          "#fff",
                      }}
                    />
                  )
                  : "Publish Campaign"
                }

              </Button>

            </Stack>

          </Paper>

        </Grid>

      </Grid>

    </Box>
  );
};

export default CreateCampaign;