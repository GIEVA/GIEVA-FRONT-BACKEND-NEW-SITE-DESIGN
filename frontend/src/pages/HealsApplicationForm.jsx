import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";

import {
  CloudUpload,
  Save,
  Send,
  InsertDriveFile,
  Delete,
} from "@mui/icons-material";

import {
  useState, useEffect
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  createHealsApplication,
  saveHealsProgress,
} from "../services/healsApplicationService";

import {
  useSearchParams,
} from "react-router-dom";

import {
  getHealsApplicationById,
} from "../services/healsApplicationService";

const BRAND = "#0B1F3A";

const MAX_FILE_SIZE =
  2 * 1024 * 1024;

export default function HealsApplicationForm() {

  const navigate =
    useNavigate();

    const [searchParams] =
  useSearchParams();

const editId =
  searchParams.get("id");

  const [loading,
    setLoading] =
    useState(false);

  const [savingDraft,
    setSavingDraft] =
    useState(false);

  const [applicationId,
    setApplicationId] =
    useState(null);

  const [error,
    setError] =
    useState("");

  const [success,
    setSuccess] =
    useState("");

  const [form,
    setForm] =
    useState({

      degreeProgram: "",
      desiredCountry: "",
      fieldOfStudy: "",

      fullName: "",
      gender: "",
      email: "",
      phone: "",
      address: "",

      highSchool: "",
      universityAttended: "",
      degreeReceived: "",

      budgetRange: "",
      financialNeeds: "",

      studentNotes: "",
    });

  const [files,
    setFiles] =
    useState({});


    useEffect(() => {

  if (editId) {
    fetchDraftApplication();
  }

}, [editId]);



const fetchDraftApplication =
  async () => {

    try {

      const res =
        await getHealsApplicationById(
          editId
        );

      const app =
        res.application || res;

      setApplicationId(
        app.id
      );

      setForm({

        degreeProgram:
          app.degreeProgram || "",

        desiredCountry:
          app.desiredCountry || "",

        fieldOfStudy:
          app.fieldOfStudy || "",

        fullName:
          app.fullName || "",

        gender:
          app.gender || "",

        email:
          app.email || "",

        phone:
          app.phone || "",

        address:
          app.address || "",

        highSchool:
          app.highSchool || "",

        universityAttended:
          app.universityAttended || "",

        degreeReceived:
          app.degreeReceived || "",

        budgetRange:
          app.budgetRange || "",

        financialNeeds:
          app.financialNeeds || "",

        studentNotes:
          app.studentNotes || "",
      });

    } catch (err) {

      console.error(err);
    }
  };


  // ======================================================
  // NORMAL FORM INPUTS
  // ======================================================

  const handleChange =
    (e) => {

      setForm({
        ...form,
        [e.target.name]:
          e.target.value,
      });
    };



  // ======================================================
  // FILE UPLOADS
  // ======================================================

  const handleFileChange =
    (e) => {

      const file =
        e.target.files[0];

      const field =
        e.target.name;

      if (!file) return;

      // PDF ONLY
      if (
        file.type !==
        "application/pdf"
      ) {

        setError(
          `${field} must be PDF`
        );

        return;
      }

      // MAX SIZE
      if (
        file.size >
        MAX_FILE_SIZE
      ) {

        setError(
          `${field} exceeds 2MB limit`
        );

        return;
      }

      setError("");

      setFiles((prev) => ({
        ...prev,
        [field]: file,
      }));
    };



  // ======================================================
  // REMOVE FILE
  // ======================================================

  const removeFile =
    (field) => {

      const updated = {
        ...files,
      };

      delete updated[field];

      setFiles(updated);
    };



  // ======================================================
  // BUILD FORMDATA
  // ======================================================

  const buildFormData =
    () => {

      const formData =
        new FormData();

      Object.keys(form).forEach(
        (key) => {

          formData.append(
            key,
            form[key]
          );
        }
      );

      Object.keys(files).forEach(
        (key) => {

          if (files[key]) {

            formData.append(
              key,
              files[key]
            );
          }
        }
      );

      return formData;
    };



  // ======================================================
  // SAVE DRAFT
  // ======================================================

  const handleSaveDraft =
    async () => {

      try {

        setSavingDraft(true);

        setError("");

        const formData =
          buildFormData();

        formData.append(
        "status",
        "draft"
        );

        let res;

        if (applicationId) {

          res =
            await saveHealsProgress(
              applicationId,
              formData
            );

        } else {

          res =
            await createHealsApplication(
              formData
            );

          setApplicationId(
            res.application.id
          );
        }

        setSuccess(
          "Draft saved successfully"
        );

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.message ||
          "Failed to save draft"
        );

      } finally {

        setSavingDraft(false);
      }
    };



  // ======================================================
  // SUBMIT APPLICATION
  // ======================================================

  const handleSubmit =
    async () => {

      try {

        setLoading(true);

        setError("");

        const formData =
          buildFormData();

        formData.append(
        "status",
        "submitted"
        );

        const res =
          await createHealsApplication(
            formData
          );

        setSuccess(
          "Application submitted successfully"
        );

        setTimeout(() => {

          navigate(
            `/heals/application/${res.application.id}`
          );

        }, 1500);

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.message ||
          "Application failed"
        );

      } finally {

        setLoading(false);
      }
    };



  // ======================================================
  // DOCUMENT FIELDS
  // ======================================================

  const documentFields = [
    {
      field: "passport",
      label: "Passport",
    },

    {
      field: "transcript",
      label: "Transcript",
    },

    {
      field: "sop",
      label:
        "Statement of Purpose",
    },

    {
      field: "recommendation",
      label:
        "Recommendation Letter",
    },

    {
      field: "bankStatement",
      label:
        "Bank Statement",
    },

    {
      field: "otherDoc",
      label:
        "Other Document",
    },
  ];



  return (

    <Box
      sx={{
        p: {
          xs: 2,
          md: 4,
        },

        maxWidth: 1200,

        mx: "auto",
      }}
    >

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={1}
      >
        GIEVA HEALS Application
      </Typography>

      <Typography
        color="text.secondary"
        mb={4}
      >
        Begin your international
        admissions journey
      </Typography>



      {error && (

        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}



      {success && (

        <Alert
          severity="success"
          sx={{ mb: 3 }}
        >
          {success}
        </Alert>
      )}



      <Card
        sx={{
          borderRadius: 5,
        }}
      >

        <CardContent>

          <Grid
            container
            spacing={3}
          >

            {/* STUDY */}

            <Grid item xs={12}>
              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Study Preferences
              </Typography>

              <Divider sx={{ mt: 1 }} />
            </Grid>



            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Degree Program"
                name="degreeProgram"
                value={
                  form.degreeProgram
                }
                onChange={
                  handleChange
                }
              />
            </Grid>



            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Desired Country"
                name="desiredCountry"
                value={
                  form.desiredCountry
                }
                onChange={
                  handleChange
                }
              />
            </Grid>



            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Field of Study"
                name="fieldOfStudy"
                value={
                  form.fieldOfStudy
                }
                onChange={
                  handleChange
                }
              />
            </Grid>



            {/* PERSONAL */}

            <Grid item xs={12}>
              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Personal Information
              </Typography>

              <Divider sx={{ mt: 1 }} />
            </Grid>



            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={
                  handleChange
                }
              />
            </Grid>



            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={
                  handleChange
                }
              >
                <MenuItem value="male">
                  Male
                </MenuItem>

                <MenuItem value="female">
                  Female
                </MenuItem>
              </TextField>
            </Grid>



            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={form.email}
                onChange={
                  handleChange
                }
              />
            </Grid>



            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={
                  handleChange
                }
              />
            </Grid>



            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Address"
                name="address"
                value={form.address}
                onChange={
                  handleChange
                }
              />
            </Grid>



            {/* DOCUMENTS */}

            <Grid item xs={12}>
              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Upload Documents
              </Typography>

              <Divider sx={{ mt: 1 }} />
            </Grid>



            {documentFields.map(
              (item) => (

              <Grid
                item
                xs={12}
                md={6}
                key={item.field}
              >

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                  }}
                >

                  <CardContent>

                    <Stack spacing={2}>

                      <Typography
                        fontWeight={700}
                      >
                        {item.label}
                      </Typography>

                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={
                          <CloudUpload />
                        }
                        sx={{
                          py: 1.5,
                          borderRadius: 3,
                        }}
                      >
                        Upload PDF

                        <input
                          hidden
                          type="file"
                          accept=".pdf"
                          name={item.field}
                          onChange={
                            handleFileChange
                          }
                        />
                      </Button>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        PDF only • Max 2MB
                      </Typography>



                      {files[item.field] && (

                        <Box
                          sx={{
                            p: 1.5,
                            bgcolor:
                              "#f5f3ff",
                            borderRadius: 2,
                          }}
                        >

                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="space-between"
                          >

                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >

                              <InsertDriveFile
                                sx={{
                                  color:
                                    BRAND,
                                }}
                              />

                              <Box>

                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                >
                                  {
                                    files[
                                      item.field
                                    ].name
                                  }
                                </Typography>

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {(
                                    files[
                                      item.field
                                    ].size /
                                    1024 /
                                    1024
                                  ).toFixed(2)}
                                  MB
                                </Typography>

                              </Box>

                            </Stack>



                            <IconButton
                              onClick={() =>
                                removeFile(
                                  item.field
                                )
                              }
                            >
                              <Delete />
                            </IconButton>

                          </Stack>

                        </Box>
                      )}

                    </Stack>

                  </CardContent>

                </Card>

              </Grid>
            ))}



            {/* NOTES */}

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Additional Notes"
                name="studentNotes"
                value={
                  form.studentNotes
                }
                onChange={
                  handleChange
                }
              />
            </Grid>

          </Grid>



          {/* ACTIONS */}

          <Stack
            direction="row"
            spacing={2}
            mt={4}
          >

            <Button
              variant="outlined"
              startIcon={
                savingDraft
                ? (
                  <CircularProgress
                    size={18}
                  />
                )
                : (
                  <Save />
                )
              }
              onClick={
                handleSaveDraft
              }
              disabled={
                savingDraft
              }
            >
              {savingDraft
                ? "Saving..."
                : "Save Draft"}
            </Button>



            <Button
              variant="contained"
              startIcon={
                loading
                ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                )
                : (
                  <Send />
                )
              }
              onClick={
                handleSubmit
              }
              disabled={loading}
              sx={{
                bgcolor: BRAND,
                px: 4,

                "&:hover": {
                  bgcolor:
                    "#0B1F3A",
                },
              }}
            >
              {loading
                ? "Submitting..."
                : "Submit Application"}
            </Button>

          </Stack>

        </CardContent>

      </Card>

    </Box>
  );
}