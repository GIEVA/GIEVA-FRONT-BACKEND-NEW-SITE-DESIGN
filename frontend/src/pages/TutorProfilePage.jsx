import {
  useEffect,
  useState,
} from "react";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Chip,
  Stack,
  MenuItem,
} from "@mui/material";

import {
  Save,
  Delete,
  School,
  Verified,
  Work,
} from "@mui/icons-material";

import {
  getMyTutorProfile,
  createTutorProfile,
  updateTutorProfile,
  deleteTutorProfile,
} from "../services/tutorProfileService";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";

export default function TutorProfilePage() {

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [profile, setProfile] =
    useState(null);

  const [preview, setPreview] =
    useState("");

  const [file, setFile] =
    useState(null);

  const [expertiseInput,
    setExpertiseInput] =
    useState("");

  const [form, setForm] =
    useState({

      phone: "",
      bio: "",
      address: "",

      yearsOfExperience: "",

      hourlyRate: "",

      expertise: [],

      linkedinUrl: "",

      websiteUrl: "",

      availabilityStatus:
        "available",
    });



  // ======================================================
  // FETCH PROFILE
  // ======================================================

  useEffect(() => {
    fetchProfile();
  }, []);



const fetchProfile =
  async () => {

    try {

      setLoading(true);

      const res =
        await getMyTutorProfile();

      console.log(
        "PROFILE RESPONSE:",
        res
      );



      // ======================================================
      // NO PROFILE
      // ======================================================

      if (!res?.profile) {

        setProfile(null);

        setPreview("");

        setForm({

          phone: "",
          bio: "",
          address: "",

          yearsOfExperience: "",

          hourlyRate: "",

          expertise: [],

          linkedinUrl: "",

          websiteUrl: "",

          availabilityStatus:
            "available",
        });

        return;
      }



      // ======================================================
      // PROFILE EXISTS
      // ======================================================

      const profileData =
        res.profile;

      setProfile(
        profileData
      );

      setPreview(
        profileData.profilePicUrl || ""
      );

      setForm({

        phone:
          profileData.phone || "",

        bio:
          profileData.bio || "",

        address:
          profileData.address || "",

        yearsOfExperience:
          profileData.yearsOfExperience || "",

        hourlyRate:
          profileData.hourlyRate || "",

        expertise:
          profileData.expertise || [],

        linkedinUrl:
          profileData.linkedinUrl || "",

        websiteUrl:
          profileData.websiteUrl || "",

        availabilityStatus:
          profileData.availabilityStatus || "available",
      });

    } catch (err) {

      console.log(
        err.response?.data ||
        err.message
      );

      setProfile(null);

    } finally {

      setLoading(false);
    }
  };



  // ======================================================
  // INPUT
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
  // IMAGE
  // ======================================================

  const handleImage =
    (e) => {

      const selected =
        e.target.files[0];

      if (!selected)
        return;

      setFile(selected);

      setPreview(
        URL.createObjectURL(selected)
      );
    };



  // ======================================================
  // EXPERTISE
  // ======================================================

  const addExpertise =
    () => {

      if (
        !expertiseInput.trim()
      ) return;

      setForm({

        ...form,

        expertise: [

          ...form.expertise,

          expertiseInput,
        ],
      });

      setExpertiseInput("");
    };



  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        setSaving(true);

        const formData =
          new FormData();

        Object.entries(form)
          .forEach(([key, value]) => {

            if (
              key === "expertise"
            ) {

              formData.append(
                key,
                JSON.stringify(value)
              );

            } else {

              formData.append(
                key,
                value
              );
            }
          });

        if (file) {

          formData.append(
            "profilePic",
            file
          );
        }

        if (profile) {

          await updateTutorProfile(
            formData
          );

        } else {

          await createTutorProfile(
            formData
          );
        }

        fetchProfile();

      } catch (err) {

        console.log(err);

      } finally {

        setSaving(false);
      }
    };



  // ======================================================
  // DELETE
  // ======================================================

  const handleDelete =
    async () => {

      const confirmDelete =
        window.confirm(
          "Delete tutor profile?"
        );

      if (!confirmDelete)
        return;

      try {

        await deleteTutorProfile();

        setProfile(null);

      } catch (err) {

        console.log(err);
      }
    };



  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {

    return (

      <Box
        sx={{
          display: "flex",
          justifyContent:
            "center",
          mt: 10,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }



  return (

    <Box
      sx={{
        maxWidth: 1300,
        mx: "auto",
        py: 4,
        px: 2,
      }}
    >

      <Grid
        container
        spacing={3}
      >

        {/* ====================================================== */}
        {/* MAIN FORM */}
        {/* ====================================================== */}

        <Grid
          item
          xs={12}
          md={8}
        >

          <Paper
            sx={{
              p: 4,
              borderRadius: 5,
            }}
          >

            <Typography
              variant="h4"
              fontWeight="bold"
              mb={1}
            >
              Tutor Profile
            </Typography>

            <Typography
              color="text.secondary"
              mb={4}
            >
              Build your professional tutor identity
            </Typography>



            <Box
              component="form"
              onSubmit={handleSubmit}
            >

              {/* PROFILE HEADER */}

              <Stack
                direction="row"
                spacing={3}
                alignItems="center"
                mb={5}
              >

                <Avatar
                  src={preview}
                  sx={{
                    width: 110,
                    height: 110,
                  }}
                />

                <Box>

                  <Button
                    variant="outlined"
                    component="label"
                  >
                    Upload Photo

                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={
                        handleImage
                      }
                    />
                  </Button>

                  <Typography
                    mt={2}
                    variant="body2"
                    color="text.secondary"
                  >
                    Recommended:
                    square image
                  </Typography>

                </Box>

              </Stack>



              {/* FORM */}

              <Grid
                container
                spacing={3}
              >

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

                <Grid item xs={12} md={6}>

                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={form.address}
                    onChange={
                      handleChange
                    }
                  />

                </Grid>

                <Grid item xs={12}>

                  <TextField
                    fullWidth
                    multiline
                    rows={5}
                    label="Professional Bio"
                    name="bio"
                    value={form.bio}
                    onChange={
                      handleChange
                    }
                  />

                </Grid>

                <Grid item xs={12} md={6}>

                  <TextField
                    fullWidth
                    label="Years of Experience"
                    name="yearsOfExperience"
                    value={
                      form.yearsOfExperience
                    }
                    onChange={
                      handleChange
                    }
                  />

                </Grid>

                <Grid item xs={12} md={6}>

                  <TextField
                    fullWidth
                    label="Hourly Rate"
                    name="hourlyRate"
                    value={
                      form.hourlyRate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </Grid>

                <Grid item xs={12} md={6}>

                  <TextField
                    fullWidth
                    label="LinkedIn URL"
                    name="linkedinUrl"
                    value={
                      form.linkedinUrl
                    }
                    onChange={
                      handleChange
                    }
                  />

                </Grid>

                <Grid item xs={12} md={6}>

                  <TextField
                    fullWidth
                    label="Website URL"
                    name="websiteUrl"
                    value={
                      form.websiteUrl
                    }
                    onChange={
                      handleChange
                    }
                  />

                </Grid>

                <Grid item xs={12}>

                  <TextField
                    fullWidth
                    select
                    label="Availability"
                    name="availabilityStatus"
                    value={
                      form.availabilityStatus
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <MenuItem value="available">
                      Available
                    </MenuItem>

                    <MenuItem value="busy">
                      Busy
                    </MenuItem>

                    <MenuItem value="offline">
                      Offline
                    </MenuItem>

                  </TextField>

                </Grid>

              </Grid>



              {/* EXPERTISE */}

              <Box mt={5}>

                <Typography
                  fontWeight="bold"
                  mb={2}
                >
                  Expertise
                </Typography>

                <Stack
                  direction="row"
                  spacing={2}
                  mb={2}
                >

                  <TextField
                    fullWidth
                    label="Add expertise"

                    value={
                      expertiseInput
                    }

                    onChange={(e) =>
                      setExpertiseInput(
                        e.target.value
                      )
                    }
                  />

                  <Button
                    variant="contained"
                    onClick={
                      addExpertise
                    }
                  >
                    Add
                  </Button>

                </Stack>



                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                >

                  {form.expertise.map(
                    (item, i) => (

                      <Chip
                        key={i}
                        label={item}

                        onDelete={() => {

                          setForm({

                            ...form,

                            expertise:
                              form.expertise.filter(
                                (_, idx) =>
                                  idx !== i
                              ),
                          });
                        }}

                        sx={{
                          mb: 1,
                        }}
                      />
                    )
                  )}

                </Stack>

              </Box>



              {/* ACTIONS */}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mt: 5,
                }}
              >

                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  sx={{
                    bgcolor: GREEN,
                    px: 4,
                  }}
                >

                  {saving ? (

                    <CircularProgress
                      size={22}
                    />

                  ) : profile ? (

                    "Update Profile"

                  ) : (

                    "Create Profile"
                  )}

                </Button>



                {profile && (

                  <Button
                    color="error"
                    variant="outlined"
                    onClick={
                      handleDelete
                    }
                  >
                    Delete
                  </Button>
                )}

              </Box>

            </Box>

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

          <Card
            sx={{
              borderRadius: 5,
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                fontWeight="bold"
                mb={3}
              >
                Tutor Overview
              </Typography>

              <Divider
                sx={{ mb: 3 }}
              />



              <Stack
                spacing={3}
              >

                <Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >

                    <Verified
                      color="success"
                    />

                    <Typography>
                      Verification
                    </Typography>

                  </Stack>

                  <Chip
                    label={
                      profile?.verificationStatus ||
                      "pending"
                    }

                    sx={{
                      mt: 1,
                    }}
                  />

                </Box>



                <Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >

                    <Work />

                    <Typography>
                      Experience
                    </Typography>

                  </Stack>

                  <Typography mt={1}>
                    {
                      form.yearsOfExperience
                    }
                    {" "}
                    years
                  </Typography>

                </Box>



                <Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >

                    <School />

                    <Typography>
                      Expertise Areas
                    </Typography>

                  </Stack>

                  <Typography mt={1}>
                    {
                      form.expertise.length
                    }
                  </Typography>

                </Box>

              </Stack>

            </CardContent>

          </Card>

        </Grid>

      </Grid>

    </Box>
  );
}