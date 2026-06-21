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
} from "@mui/material";

import {
  getMyStudentProfile,
  createStudentProfile,
  updateStudentProfile,
  deleteStudentProfile,
} from "../services/studentProfile";

const StudentProfile = () => {
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

  const [form, setForm] = useState({
    phone: "",
    bio: "",
    dob: "",
    level: "",
    school: "",
    address: "",
    guardianName: "",
    guardianPhone: "",
  });

  //
  // LOAD PROFILE
  //
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data =
        await getMyStudentProfile();

      setProfile(data);

      setPreview(data.profilePicUrl);

      setForm({
        phone: data.phone || "",
        bio: data.bio || "",
        dob: data.dob
          ? data.dob.split("T")[0]
          : "",
        level: data.level || "",
        school: data.school || "",
        address: data.address || "",
        guardianName:
          data.guardianName || "",
        guardianPhone:
          data.guardianPhone || "",
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  //
  // HANDLE INPUT
  //
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  //
  // IMAGE
  //
  const handleImage = (e) => {
    const selected =
      e.target.files[0];

    if (!selected) return;

    setFile(selected);

    setPreview(
      URL.createObjectURL(selected)
    );
  };

  //
  // SAVE
  //
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const formData =
        new FormData();

      Object.entries(form).forEach(
        ([key, value]) => {
          formData.append(key, value);
        }
      );

      if (file) {
        formData.append(
          "profilePic",
          file
        );
      }

      if (profile) {
        await updateStudentProfile(
          formData
        );
      } else {
        await createStudentProfile(
          formData
        );
      }

      alert(
        profile
          ? "Profile updated"
          : "Profile created"
      );

      fetchProfile();
    } catch (err) {
      alert(
        err.response?.data
          ?.message ||
          "Operation failed"
      );
    } finally {
      setSaving(false);
    }
  };

  //
  // DELETE
  //
  const handleDelete =
    async () => {
      const confirmDelete =
        window.confirm(
          "Delete your profile?"
        );

      if (!confirmDelete) return;

      try {
        await deleteStudentProfile();

        alert("Profile deleted");

        setProfile(null);

        setForm({
          phone: "",
          bio: "",
          dob: "",
          level: "",
          school: "",
          address: "",
          guardianName: "",
          guardianPhone: "",
        });

        setPreview("");
      } catch (err) {
        alert("Delete failed");
      }
    };

  //
  // LOADING
  //
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
        maxWidth: 1200,
        mx: "auto",
        py: 4,
        px: 2,
      }}
    >
      <Grid container spacing={3}>
        {/* PROFILE FORM */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 4,
              borderRadius: 4,
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              mb={3}
            >
              Student Profile
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 3,
                  mb: 4,
                }}
              >
                <Avatar
                  src={preview}
                  sx={{
                    width: 90,
                    height: 90,
                  }}
                />

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
              </Box>

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
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={form.phone}
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
                    type="date"
                    label="DOB"
                    name="dob"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    value={form.dob}
                    onChange={
                      handleChange
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Bio"
                    name="bio"
                    value={form.bio}
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
                    label="Level"
                    name="level"
                    value={form.level}
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
                    label="School"
                    name="school"
                    value={form.school}
                    onChange={
                      handleChange
                    }
                  />
                </Grid>

                <Grid item xs={12}>
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

                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <TextField
                    fullWidth
                    label="Guardian Name"
                    name="guardianName"
                    value={
                      form.guardianName
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
                    label="Guardian Phone"
                    name="guardianPhone"
                    value={
                      form.guardianPhone
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mt: 4,
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
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

        {/* SIDEBAR */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 4,
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                fontWeight="bold"
                mb={2}
              >
                Learning Overview
              </Typography>

              <Divider
                sx={{ mb: 2 }}
              />

              <Typography mb={1}>
                Active Courses:
              </Typography>

              <Chip
                label={
                  profile?.enrollments
                    ?.length || 0
                }
              />

              <Typography
                mt={3}
                mb={1}
              >
                Payments:
              </Typography>

              <Chip
                color="success"
                label={
                  profile?.payments
                    ?.length || 0
                }
              />

              <Typography
                mt={3}
                variant="body2"
                color="text.secondary"
              >
                Joined:
              </Typography>

              <Typography>
                {profile?.createdAt
                  ? new Date(
                      profile.createdAt
                    ).toLocaleDateString()
                  : "-"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentProfile;