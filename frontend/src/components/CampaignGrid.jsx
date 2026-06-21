import {
  Grid,
} from "@mui/material";

import CampaignCard
from "./CampaignCard";



const CampaignGrid =
({ campaigns }) => {

  return (

    <Grid
      container
      spacing={4}
    >

      {campaigns.map(
        (campaign) => (

          <Grid

            item

            xs={12}

            md={6}

            lg={4}

            key={campaign.id}
          >

            <CampaignCard
              campaign={campaign}
            />

          </Grid>
        )
      )}

    </Grid>
  );
};

export default
CampaignGrid;