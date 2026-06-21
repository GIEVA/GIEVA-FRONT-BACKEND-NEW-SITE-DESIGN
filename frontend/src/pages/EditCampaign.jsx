import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
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

  Save,
  Publish,
  Archive,
  Star,
  CloudUpload,

} from "@mui/icons-material";

import slugify
from "slugify";

import TiptapEditor
from "../components/TiptapEditor";

import {

  getCampaign,
  updateCampaign,
  publishCampaign,
  archiveCampaign,
  featureCampaign,

} from "../services/campaignService";



const EditCampaign = () => {

  const { id } =
    useParams();

  const navigate =
    useNavigate();



  const [loading,
    setLoading] =
      useState(true);

  const [saving,
    setSaving] =
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
  // FETCH
  // ======================================================

  const fetchCampaign =
    async () => {

      try {

        const data =
          await getCampaign(id);



        setForm({

          ...data,

          coverImage:
            null,
        });



        setPreview(
          data.imageUrl
        );

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    };



  useEffect(() => {

    fetchCampaign();

  }, [id]);



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
  // SAVE
  // ======================================================

  const handleSave =
    async () => {

      try {

        setSaving(true);



        const formData =
          new FormData();



        Object.entries(form)
          .forEach(

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



        await updateCampaign(
          id,
          formData
        );



        navigate(
          "/admin/campaigns"
        );

      } catch (error) {

        console.error(error);

      } finally {

        setSaving(false);
      }
    };



  // ======================================================
  // PUBLISH
  // ======================================================

  const handlePublish =
    async () => {

      try {

        await publishCampaign(
          id
        );

        fetchCampaign();

      } catch (error) {

        console.error(error);
      }
    };



  // ======================================================
  // ARCHIVE
  // ======================================================

  const handleArchive =
    async () => {

      try {

        await archiveCampaign(
          id
        );

        fetchCampaign();

      } catch (error) {

        console.error(error);
      }
    };



  // ======================================================
  // FEATURE
  // ======================================================

  const handleFeature =
    async () => {

      try {

        await featureCampaign(
          id
        );

        fetchCampaign();

      } catch (error) {

        console.error(error);
      }
    };



  if (loading) {

    return (

      <Box
        textAlign="center"
        mt={10}
      >

        <CircularProgress />

      </Box>
    );
  }



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

          Edit Campaign

        </Typography>



        <Typography
          color="text.secondary"
        >

          Update campaign information,
          content and settings.

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

                Slug

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



            {/* STATUS */}

            <Box mb={2}>

              <Chip

                label={
                  form.status
                }

                color="primary"
              />

            </Box>



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

                fullWidth

                startIcon={
                  <CloudUpload />
                }
              >

                Replace Image

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

                <Box mt={2}>

                  <img

                    src={preview}

                    alt="preview"

                    style={{

                      width: "100%",

                      borderRadius: 12,
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

              label="Featured"
            />



            {/* ACTIONS */}

            <Stack
              spacing={2}
              mt={4}
            >

              <Button

                variant="contained"

                startIcon={<Save />}

                disabled={saving}

                onClick={
                  handleSave
                }
              >

                {saving
                  ? (
                    <CircularProgress
                      size={24}
                      sx={{
                        color:
                          "#fff",
                      }}
                    />
                  )
                  : "Save Changes"
                }

              </Button>



              <Button

                variant="outlined"

                color="success"

                startIcon={<Publish />}

                onClick={
                  handlePublish
                }
              >

                Publish Campaign

              </Button>



              <Button

                variant="outlined"

                color="warning"

                startIcon={<Star />}

                onClick={
                  handleFeature
                }
              >

                Toggle Featured

              </Button>



              <Button

                variant="outlined"

                color="secondary"

                startIcon={<Archive />}

                onClick={
                  handleArchive
                }
              >

                Archive Campaign

              </Button>

            </Stack>

          </Paper>

        </Grid>

      </Grid>

    </Box>
  );
};

export default EditCampaign;