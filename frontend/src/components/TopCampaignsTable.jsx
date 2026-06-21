import {

  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,

} from "@mui/material";



const TopCampaignsTable =
({ campaigns }) => {

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

        Top Campaigns

      </Typography>



      <Table>

        <TableHead>

          <TableRow>

            <TableCell>
              Campaign
            </TableCell>

            <TableCell>
              Views
            </TableCell>

            <TableCell>
              Clicks
            </TableCell>

            <TableCell>
              Featured
            </TableCell>

          </TableRow>

        </TableHead>



        <TableBody>

          {campaigns.map(
            (campaign) => (

              <TableRow
                key={campaign.id}
              >

                <TableCell>

                  {
                    campaign.title
                  }

                </TableCell>



                <TableCell>

                  {
                    campaign.views
                  }

                </TableCell>



                <TableCell>

                  {
                    campaign.clicks
                  }

                </TableCell>



                <TableCell>

                  {campaign.featured ? (

                    <Chip
                      label="Featured"
                      color="success"
                    />

                  ) : (

                    "-"
                  )}

                </TableCell>

              </TableRow>
            )
          )}

        </TableBody>

      </Table>

    </Paper>
  );
};

export default
TopCampaignsTable;