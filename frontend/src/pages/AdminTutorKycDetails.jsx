import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Avatar,
  Chip,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  approveTutorProfile,
  getTutorProfileByIdAdmin,
  rejectTutorProfile,
} from "../services/adminTutorKycService";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";

export default function AdminTutorKycDetails() {

  const { id } =
    useParams();

  const [loading,
    setLoading] =
    useState(true);

  const [profile,
    setProfile] =
    useState(null);




  useEffect(() => {
    fetchProfile();
  }, []);




  const fetchProfile =
    async () => {

      try {

        const res =
          await getTutorProfileByIdAdmin(
            id
          );

        setProfile(
          res.profile
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);
      }
    };




  const handleApprove =
    async () => {

      try {

        await approveTutorProfile(
          id
        );

        fetchProfile();

      } catch (err) {

        console.error(err);
      }
    };




  const handleReject =
    async () => {

      const reason =
        prompt(
          "Reason for rejection"
        );

      if (!reason) return;

      try {

        await rejectTutorProfile(
          id,
          {
            verificationNotes:
              reason,
          }
        );

        fetchProfile();

      } catch (err) {

        console.error(err);
      }
    };




  if (loading) {

    return (
      <Box
        display="flex"
        justifyContent="center"
        py={8}
      >
        <CircularProgress />
      </Box>
    );
  }




  if (!profile) return null;




  return (
    <Box p={3}>

      <Paper
        sx={{
          p: 4,
          borderRadius: 5,
        }}
      >

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={4}
        >

          <Avatar
            src={
              profile.profilePicUrl
            }
            sx={{
              width: 140,
              height: 140,
            }}
          />



          <Box flex={1}>

            <Typography
              variant="h4"
              fontWeight="bold"
              color={NAVY}
            >
              {profile.fullName}
            </Typography>

            <Typography
              color="text.secondary"
              mb={2}
            >
              {profile.email}
            </Typography>



            <Stack
              direction="row"
              spacing={1}
              mb={3}
            >

              <Chip
                label={
                  profile.verificationStatus
                }
                sx={{
                  bgcolor:
                    GREEN,
                  color:
                    "#fff",
                }}
              />

              <Chip
                label={
                  profile.availabilityStatus
                }
              />

            </Stack>



            <Grid
              container
              spacing={2}
            >

              <Grid item xs={12} md={6}>
                <Typography>
                  <strong>
                    Phone:
                  </strong>
                  {" "}
                  {profile.phone}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography>
                  <strong>
                    Experience:
                  </strong>
                  {" "}
                  {
                    profile.yearsOfExperience
                  }
                  {" "}
                  years
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography>
                  <strong>
                    Address:
                  </strong>
                  {" "}
                  {profile.address}
                </Typography>
              </Grid>

            </Grid>



            <Divider
              sx={{ my: 3 }}
            />



            <Typography
              variant="h6"
              mb={1}
            >
              Bio
            </Typography>

            <Typography
              color="text.secondary"
            >
              {profile.bio}
            </Typography>



            <Divider
              sx={{ my: 3 }}
            />



            <Stack
              direction="row"
              spacing={2}
            >

              <Button
                variant="contained"
                sx={{
                  bgcolor:
                    GREEN,
                }}
                onClick={
                  handleApprove
                }
              >
                Approve
              </Button>

              <Button
                variant="contained"
                sx={{
                  bgcolor:
                    GOLD,
                }}
                onClick={
                  handleReject
                }
              >
                Reject
              </Button>

            </Stack>

          </Box>

        </Stack>

      </Paper>

    </Box>
  );
}