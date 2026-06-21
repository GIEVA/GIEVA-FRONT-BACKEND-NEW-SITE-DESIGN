import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {

  Box,
  Typography,
  Container,
  Grid,
  Chip,
  Stack,
  Button,
  CircularProgress,
  Paper,
  Divider,
  Avatar,

} from "@mui/material";

import {

  CalendarMonth,
  Visibility,
  AdsClick,
  ArrowForward,
  AccessTime,

} from "@mui/icons-material";

import {

  getPublicCampaignDetails,
  trackCampaignClick,

} from "../services/publicCampaignService";

import CampaignRegistrationModal
from "../pages/CampaignRegistrationModal";



const PublicCampaignDetails =
() => {

  const { id } =
    useParams();



  const [campaign,
    setCampaign] =
      useState(null);

  const [loading,
    setLoading] =
      useState(true);

  const [openRegister,
    setOpenRegister] =
      useState(false);



  // ======================================================
  // FETCH
  // ======================================================

  useEffect(() => {

    const fetchCampaign =
      async () => {

        try {

          const res =
            await getPublicCampaignDetails(
              id
            );



          setCampaign(
            res.campaign
          );

        } catch (error) {

          console.error(error);

        } finally {

          setLoading(false);
        }
      };



    fetchCampaign();

  }, [id]);



  // ======================================================
  // COUNTDOWN
  // ======================================================

  const getRemainingTime =
    () => {

      if (!campaign?.startDate)
        return null;



      const now =
        new Date();

      const target =
        new Date(
          campaign.startDate
        );



      const diff =
        target - now;



      if (diff <= 0)
        return "Campaign Started";



      const days =
        Math.floor(
          diff /
          (1000 * 60 * 60 * 24)
        );



      const hours =
        Math.floor(
          (
            diff %
            (1000 * 60 * 60 * 24)
          ) /
          (1000 * 60 * 60)
        );



      return `${days}d ${hours}h remaining`;
    };



  // ======================================================
  // CTA
  // ======================================================

  const handleRegister =
    async () => {

      try {

        await trackCampaignClick(
          campaign.id
        );

      } catch (error) {

        console.error(error);
      }



      setOpenRegister(true);
    };



  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {

    return (

      <Box
        textAlign="center"
        py={12}
      >

        <CircularProgress />

      </Box>
    );
  }



  // ======================================================
  // EMPTY
  // ======================================================

  if (!campaign) {

    return (

      <Box
        textAlign="center"
        py={10}
      >

        <Typography
          variant="h5"
        >

          Campaign not found

        </Typography>

      </Box>
    );
  }



  return (

    <Box>

      {/* ======================================================
          HERO
      ====================================================== */}

      <Box

        sx={{

          position:
            "relative",

          minHeight: {
            xs: 500,
            md: 720,
          },

          display: "flex",

          alignItems:
            "center",

          overflow:
            "hidden",

          backgroundImage:
            `url(${campaign.imageUrl})`,

          backgroundSize:
            "cover",

          backgroundPosition:
            "center",
        }}
      >

        {/* OVERLAY */}

        <Box

          sx={{

            position:
              "absolute",

            inset: 0,

            background:
              `
                linear-gradient(
                  90deg,
                  rgba(0,0,0,0.88) 0%,
                  rgba(0,0,0,0.65) 45%,
                  rgba(0,0,0,0.3) 100%
                )
              `,
          }}
        />



        {/* CONTENT */}

        <Container
          maxWidth="xl"
        >

          <Box

            sx={{

              position:
                "relative",

              zIndex: 2,

              maxWidth: 760,
            }}
          >

            {/* TYPE */}

            <Chip

              label={
                campaign.type
              }

              sx={{

                mb: 3,

                bgcolor:
                  "rgba(255,255,255,0.15)",

                color:
                  "#fff",

                backdropFilter:
                  "blur(12px)",

                textTransform:
                  "capitalize",

                fontWeight:
                  700,
              }}
            />



            {/* TITLE */}

            <Typography

              variant="h1"

              fontWeight="bold"

              sx={{

                color: "#fff",

                mb: 3,

                lineHeight: 1.05,

                fontSize: {

                  xs: "2.7rem",

                  md: "5rem",
                },
              }}
            >

              {campaign.title}

            </Typography>



            {/* DESCRIPTION */}

            <Typography

              sx={{

                color:
                  "rgba(255,255,255,0.9)",

                fontSize: {

                  xs: "1rem",

                  md: "1.25rem",
                },

                lineHeight: 1.9,

                mb: 4,
              }}
            >

              {

                campaign.description
                  ?.replace(
                    /<[^>]+>/g,
                    ""
                  )
              }

            </Typography>



            {/* STATS */}

            <Stack

              direction="row"

              spacing={2}

              flexWrap="wrap"

              mb={5}
            >

              <Chip

                icon={
                  <CalendarMonth />
                }

                label={
                  new Date(
                    campaign.startDate
                  ).toLocaleDateString()
                }

                sx={{
                  bgcolor:
                    "rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
              />



              <Chip

                icon={
                  <AccessTime />
                }

                label={
                  getRemainingTime()
                }

                sx={{
                  bgcolor:
                    "rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
              />



              <Chip

                icon={
                  <Visibility />
                }

                label={`${campaign.views || 0} views`}

                sx={{
                  bgcolor:
                    "rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
              />



              <Chip

                icon={
                  <AdsClick />
                }

                label={`${campaign.clicks || 0} clicks`}

                sx={{
                  bgcolor:
                    "rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
              />

            </Stack>



            {/* CTA */}

            <Stack
              direction="row"
              spacing={2}
            >

              <Button

                size="large"

                variant="contained"

                endIcon={
                  <ArrowForward />
                }

                onClick={
                  handleRegister
                }

                sx={{

                  px: 5,

                  py: 1.8,

                  borderRadius:
                    100,

                  fontWeight:
                    700,

                  fontSize:
                    "1rem",

                  textTransform:
                    "none",

                  bgcolor:
                    "#fff",

                  color:
                    "#111",

                  "&:hover": {

                    bgcolor:
                      "#f5f5f5",
                  },
                }}
              >

                Register Now

              </Button>

            </Stack>

          </Box>

        </Container>

      </Box>



      {/* ======================================================
          CONTENT SECTION
      ====================================================== */}

      <Container
        maxWidth="lg"
        sx={{
          py: 8,
        }}
      >

        <Grid
          container
          spacing={5}
        >

          {/* MAIN */}

          <Grid
            item
            xs={12}
            md={8}
          >

            <Paper

              sx={{

                p: 5,

                borderRadius: 5,

                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.05)",
              }}
            >

              <Typography

                variant="h4"

                fontWeight="bold"

                mb={4}
              >

                About This Campaign

              </Typography>



              <Divider
                sx={{
                  mb: 4,
                }}
              />



              <Box

                sx={{

                  lineHeight: 2,

                  fontSize:
                    "1.05rem",

                  color:
                    "text.secondary",
                }}

                dangerouslySetInnerHTML={{
                  __html:
                    campaign.description,
                }}
              />

            </Paper>

          </Grid>



          {/* SIDEBAR */}

          <Grid
            item
            xs={12}
            md={4}
          >

            <Paper

              sx={{

                p: 4,

                borderRadius: 5,

                position:
                  "sticky",

                top: 120,

                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >

              <Typography

                variant="h5"

                fontWeight="bold"

                mb={3}
              >

                Campaign Details

              </Typography>



              <Stack
                spacing={3}
              >

                <Box>

                  <Typography
                    fontWeight="bold"
                  >

                    Start Date

                  </Typography>



                  <Typography
                    color="text.secondary"
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
                    fontWeight="bold"
                  >

                    Campaign Type

                  </Typography>



                  <Typography
                    color="text.secondary"
                    textTransform="capitalize"
                  >

                    {campaign.type}

                  </Typography>

                </Box>



                <Box>

                  <Typography
                    fontWeight="bold"
                  >

                    Availability

                  </Typography>



                  <Typography
                    color="success.main"
                  >

                    Active Registration

                  </Typography>

                </Box>



                <Button

                  fullWidth

                  size="large"

                  variant="contained"

                  onClick={
                    handleRegister
                  }

                  sx={{

                    py: 1.5,

                    borderRadius: 100,

                    fontWeight:
                      700,
                  }}
                >

                  Register For Campaign

                </Button>

              </Stack>

            </Paper>

          </Grid>

        </Grid>

      </Container>



      {/* ======================================================
          REGISTER MODAL
      ====================================================== */}

      <CampaignRegistrationModal

        open={openRegister}

        onClose={() =>
          setOpenRegister(false)
        }

        campaign={campaign}
      />

    </Box>
  );
};

export default
PublicCampaignDetails;