import {
  useEffect,
  useState,
} from "react";

import {

  Box,
  Typography,
  Container,
  CircularProgress,

} from "@mui/material";

import CampaignGrid
from "../components/CampaignGrid";

import {

  getPublicCampaigns,

} from "../services/publicCampaignService";



const PublicCampaigns =
() => {

  const [campaigns,
    setCampaigns] =
      useState([]);

  const [loading,
    setLoading] =
      useState(true);



  useEffect(() => {

    const fetchCampaigns =
      async () => {

        try {

          const res =
            await getPublicCampaigns();

          setCampaigns(
            res.campaigns || []
          );

        } catch (error) {

          console.error(error);

        } finally {

          setLoading(false);
        }
      };



    fetchCampaigns();

  }, []);



  if (loading) {

    return (

      <Box
        textAlign="center"
        py={10}
      >

        <CircularProgress />

      </Box>
    );
  }



  return (

    <Container
      maxWidth="xl"
      sx={{
        py: 8,
      }}
    >

      <Typography

        variant="h3"

        fontWeight="bold"

        mb={2}
      >

        Discover Campaigns

      </Typography>



      <Typography

        color="text.secondary"

        mb={6}
      >

        Explore workshops,
        webinars, tutorials,
        SAT programs, and
        premium learning
        opportunities.

      </Typography>



      <CampaignGrid
        campaigns={campaigns}
      />

    </Container>
  );
};

export default
PublicCampaigns;