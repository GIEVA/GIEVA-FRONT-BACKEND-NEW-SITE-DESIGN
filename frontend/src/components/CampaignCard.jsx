import {
  useNavigate,
} from "react-router-dom";

import {

  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Stack,

} from "@mui/material";

import {

  ArrowForward,

} from "@mui/icons-material";

import {

  trackCampaignClick,

} from "../services/publicCampaignService";



const CampaignCard =
({ campaign }) => {

  const navigate =
    useNavigate();



  const handleOpen =
    async () => {

      try {

        await trackCampaignClick(
          campaign.id
        );

      } catch (error) {

        console.error(error);
      }



      navigate(

        `/campaigns/${
          campaign.slug ||
          campaign.id
        }`
      );
    };



  return (

    <Card

      sx={{

        borderRadius: 5,

        overflow: "hidden",

        boxShadow:
          "0 10px 30px rgba(0,0,0,0.08)",

        transition:
          "0.3s",

        height: "100%",

        "&:hover": {

          transform:
            "translateY(-8px)",

          boxShadow:
            "0 20px 40px rgba(0,0,0,0.15)",
        },
      }}
    >

      {/* IMAGE */}

      <Box
        sx={{
          position:
            "relative",
        }}
      >

        <CardMedia

          component="img"

          height="260"

          image={
            campaign.imageUrl
          }

          alt={
            campaign.title
          }
        />



        {/* OVERLAY */}

        <Box

          sx={{

            position:
              "absolute",

            inset: 0,

            background:
              "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
          }}
        />



        {/* TYPE */}

        <Chip

          label={
            campaign.type
          }

          sx={{

            position:
              "absolute",

            top: 16,

            left: 16,

            bgcolor:
              "#fff",

            fontWeight:
              700,

            textTransform:
              "capitalize",
          }}
        />

      </Box>



      {/* CONTENT */}

      <CardContent
        sx={{
          p: 3,
        }}
      >

        <Typography

          variant="h5"

          fontWeight="bold"

          mb={2}
        >

          {campaign.title}

        </Typography>



        <Typography

          color="text.secondary"

          sx={{
            mb: 3,
            lineHeight: 1.8,
          }}
        >

          {

            campaign.description
              ?.replace(
                /<[^>]+>/g,
                ""
              )
              ?.slice(0, 130)

          }

          ...

        </Typography>



        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >

          <Typography
            fontWeight="bold"
          >

            {

              new Date(
                campaign.startDate
              ).toLocaleDateString()
            }

          </Typography>



          <Button

            variant="contained"

            endIcon={
              <ArrowForward />
            }

            onClick={
              handleOpen
            }

            sx={{
              borderRadius: 100,
            }}
          >

            Explore

          </Button>

        </Stack>

      </CardContent>

    </Card>
  );
};

export default
CampaignCard;