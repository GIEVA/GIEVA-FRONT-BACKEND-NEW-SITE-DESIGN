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
  Typography,
  Grid,
  Paper,
  Stack,
  Chip,
  Avatar,
  CircularProgress,
  Button,
  Divider,

} from "@mui/material";

import {

  Visibility,
  Mouse,
  Group,
  Star,
  Edit,
  Publish,
  Archive,
  Mail,
  Analytics,

} from "@mui/icons-material";

import {

  getCampaign,
  publishCampaign,
  archiveCampaign,
  featureCampaign,

} from "../services/campaignService";



const CampaignDetails = () => {

  const { id } =
    useParams();

  const navigate =
    useNavigate();



  const [campaign,
    setCampaign] =
      useState(null);

  const [loading,
    setLoading] =
      useState(true);



  // ======================================================
  // FETCH
  // ======================================================

  const fetchCampaign =
    async () => {

      try {

        const data =
          await getCampaign(id);

        setCampaign(data);

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
  // ANALYTICS
  // ======================================================

  const conversionRate =

    campaign?.views > 0

      ? (

          (
            campaign.registrationCount /
            campaign.views
          ) * 100

        ).toFixed(2)

      : 0;



  // ======================================================
  // ACTIONS
  // ======================================================

  const handlePublish =
    async () => {

      await publishCampaign(id);

      fetchCampaign();
    };



  const handleArchive =
    async () => {

      await archiveCampaign(id);

      fetchCampaign();
    };



  const handleFeature =
    async () => {

      await featureCampaign(id);

      fetchCampaign();
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



  if (!campaign) {

    return (

      <Box p={4}>

        <Typography>
          Campaign not found
        </Typography>

      </Box>
    );
  }



  return (

    <Box p={3}>

      {/* ====================================================== */}
      {/* HERO */}
      {/* ====================================================== */}

      <Paper
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          mb: 4,
        }}
      >

        {/* IMAGE */}

        <Box
          sx={{
            height: 350,
            position: "relative",
          }}
        >

          <img

            src={
              campaign.imageUrl
            }

            alt={
              campaign.title
            }

            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />



          {/* OVERLAY */}

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
              display: "flex",
              alignItems: "flex-end",
              p: 4,
            }}
          >

            <Box>

              <Stack
                direction="row"
                spacing={1}
                mb={2}
              >

                <Chip

                  label={
                    campaign.status
                  }

                  color="primary"
                />



                <Chip

                  label={
                    campaign.type
                  }

                  color="secondary"
                />



                {campaign.featured && (

                  <Chip

                    icon={<Star />}

                    label="Featured"

                    color="warning"
                  />
                )}

              </Stack>



              <Typography
                variant="h3"
                fontWeight="bold"
                color="#fff"
              >

                {campaign.title}

              </Typography>



              <Typography
                color="#ddd"
                mt={1}
              >

                Created by{" "}

                {
                  campaign.creator
                    ?.fullName
                }

              </Typography>

            </Box>

          </Box>

        </Box>

      </Paper>



      {/* ====================================================== */}
      {/* STATS */}
      {/* ====================================================== */}

      <Grid
        container
        spacing={3}
        mb={4}
      >

        {/* VIEWS */}

        <Grid
          item
          xs={12}
          md={3}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >

              <Avatar
                sx={{
                  bgcolor:
                    "#1976d2",
                }}
              >

                <Visibility />

              </Avatar>



              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >

                  {campaign.views || 0}

                </Typography>



                <Typography
                  color="text.secondary"
                >

                  Total Views

                </Typography>

              </Box>

            </Stack>

          </Paper>

        </Grid>



        {/* CLICKS */}

        <Grid
          item
          xs={12}
          md={3}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >

              <Avatar
                sx={{
                  bgcolor:
                    "#9c27b0",
                }}
              >

                <Mouse />

              </Avatar>



              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >

                  {campaign.clicks || 0}

                </Typography>



                <Typography
                  color="text.secondary"
                >

                  Total Clicks

                </Typography>

              </Box>

            </Stack>

          </Paper>

        </Grid>



        {/* REGISTRATIONS */}

        <Grid
          item
          xs={12}
          md={3}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >

              <Avatar
                sx={{
                  bgcolor:
                    "#2e7d32",
                }}
              >

                <Group />

              </Avatar>



              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >

                  {
                    campaign.registrationCount
                  }

                </Typography>



                <Typography
                  color="text.secondary"
                >

                  Registrations

                </Typography>

              </Box>

            </Stack>

          </Paper>

        </Grid>



        {/* CONVERSION */}

        <Grid
          item
          xs={12}
          md={3}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >

              <Avatar
                sx={{
                  bgcolor:
                    "#ed6c02",
                }}
              >

                %

              </Avatar>



              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >

                  {conversionRate}%

                </Typography>



                <Typography
                  color="text.secondary"
                >

                  Conversion

                </Typography>

              </Box>

            </Stack>

          </Paper>

        </Grid>

      </Grid>



      {/* ====================================================== */}
      {/* CONTENT */}
      {/* ====================================================== */}

      <Grid
        container
        spacing={3}
      >

        {/* LEFT */}

        <Grid
          item
          xs={12}
          md={8}
        >

          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
            }}
          >

            <Typography
              variant="h5"
              fontWeight="bold"
              mb={3}
            >

              Campaign Overview

            </Typography>



            <Box

              dangerouslySetInnerHTML={{
                __html:
                  campaign.description,
              }}
            />

          </Paper>

        </Grid>



        {/* RIGHT */}

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

              Campaign Information

            </Typography>



            <Divider
              sx={{
                mb: 3,
              }}
            />



            <Stack
              spacing={2}
            >

              <Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >

                  Start Date

                </Typography>



                <Typography
                  fontWeight="bold"
                >

                  {
                    new Date(
                      campaign.startDate
                    ).toLocaleString()
                  }

                </Typography>

              </Box>



              <Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >

                  End Date

                </Typography>



                <Typography
                  fontWeight="bold"
                >

                  {
                    new Date(
                      campaign.endDate
                    ).toLocaleString()
                  }

                </Typography>

              </Box>



              <Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >

                  Slug

                </Typography>



                <Typography
                  fontWeight="bold"
                >

                  {campaign.slug}

                </Typography>

              </Box>



              <Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >

                  Requires Registration

                </Typography>



                <Typography
                  fontWeight="bold"
                >

                  {
                    campaign.requiresRegistration
                      ? "Yes"
                      : "No"
                  }

                </Typography>

              </Box>

            </Stack>



            {/* ACTIONS */}

           {/* ACTIONS */}

<Stack
  spacing={2}
  mt={4}
>

  {/* ====================================================== */}
  {/* PRIMARY ACTIONS */}
  {/* ====================================================== */}

  <Button

    fullWidth

    variant="contained"

    startIcon={<Edit />}

    onClick={() =>
      navigate(

        `/admin/campaigns/${campaign.id}/edit`
      )
    }
  >

    Edit Campaign

  </Button>



  <Button

    fullWidth

    variant="outlined"

    startIcon={<Group />}

    onClick={() =>
      navigate(

        `/admin/campaigns/${campaign.id}/registrations`
      )
    }
  >

    View Registrations

  </Button>



  <Button

    fullWidth

    variant="outlined"

    startIcon={<Mail />}
    
    onClick={() =>
      navigate(

        `/admin/campaigns/${campaign.id}/messages`
      )
    }
  >

    Campaign Messages

  </Button>



  <Button

    fullWidth

    variant="outlined"

    startIcon={<Analytics />}

    onClick={() =>
      navigate(

        `/admin/campaigns/${campaign.id}/registration-analytics`
      )
    }
  >

    Analytics Dashboard

  </Button>



  <Divider sx={{ my: 1 }} />



  {/* ====================================================== */}
  {/* STATUS ACTIONS */}
  {/* ====================================================== */}

  <Button

    fullWidth

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

    fullWidth

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

    fullWidth

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

export default CampaignDetails;