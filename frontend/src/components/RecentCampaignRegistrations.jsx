import {

  Paper,
  Typography,
  Stack,
  Divider,

} from "@mui/material";



const RecentCampaignRegistrations =
({ registrations }) => {

  return (

    <Paper
      sx={{
        p: 3,
        borderRadius: 5,
      }}
    >

      <Typography

        variant="h6"

        fontWeight="bold"

        mb={3}
      >

        Recent Registrations

      </Typography>



      <Stack
        spacing={2}
      >

        {registrations.map(
          (item) => (

            <div
              key={item.id}
            >

              <Typography
                fontWeight="bold"
              >

                {
                  item.fullName
                }

              </Typography>



              <Typography
                variant="body2"
                color="text.secondary"
              >

                {
                  item.campaign
                    ?.title
                }

              </Typography>



              <Divider
                sx={{
                  mt: 2,
                }}
              />

            </div>
          )
        )}

      </Stack>

    </Paper>
  );
};

export default
RecentCampaignRegistrations;