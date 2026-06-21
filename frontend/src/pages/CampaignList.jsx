import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {

  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Avatar,
  Stack,

} from "@mui/material";

import {

  Add,
  Edit,
  Delete,
  Visibility,
  Archive,
  Star,
  Publish,

} from "@mui/icons-material";

import {

  getCampaigns,
  deleteCampaign,
  featureCampaign,
  publishCampaign,
  archiveCampaign,

} from "../services/campaignService";



const CampaignList = () => {

  const navigate =
    useNavigate();



  const [campaigns,
    setCampaigns] =
      useState([]);

  const [loading,
    setLoading] =
      useState(true);

  const [search,
    setSearch] =
      useState("");

  const [status,
    setStatus] =
      useState("");

  const [type,
    setType] =
      useState("");



  // ======================================================
  // FETCH
  // ======================================================

  const fetchCampaigns =
    async () => {

      try {

        setLoading(true);



        const data =
          await getCampaigns({

            search,

            status,

            type,
          });



        setCampaigns(
          data.campaigns || []
        );

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    };



  useEffect(() => {

    fetchCampaigns();

  }, [search, status, type]);



  // ======================================================
  // DELETE
  // ======================================================

  const handleDelete =
    async (id) => {

      const confirmDelete =
        window.confirm(
          "Delete this campaign?"
        );



      if (!confirmDelete)
        return;



      try {

        await deleteCampaign(id);

        fetchCampaigns();

      } catch (error) {

        console.error(error);
      }
    };



  // ======================================================
  // FEATURE
  // ======================================================

  const handleFeature =
    async (id) => {

      try {

        await featureCampaign(id);

        fetchCampaigns();

      } catch (error) {

        console.error(error);
      }
    };



  // ======================================================
  // PUBLISH
  // ======================================================

  const handlePublish =
    async (id) => {

      try {

        await publishCampaign(id);

        fetchCampaigns();

      } catch (error) {

        console.error(error);
      }
    };



  // ======================================================
  // ARCHIVE
  // ======================================================

  const handleArchive =
    async (id) => {

      try {

        await archiveCampaign(id);

        fetchCampaigns();

      } catch (error) {

        console.error(error);
      }
    };



  // ======================================================
  // STATUS COLOR
  // ======================================================

  const getStatusColor =
    (status) => {

      switch (status) {

        case "active":
          return "success";

        case "draft":
          return "warning";

        case "archived":
          return "default";

        case "completed":
          return "info";

        case "cancelled":
          return "error";

        default:
          return "default";
      }
    };



  return (

    <Box p={3}>

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <Box

        display="flex"

        justifyContent="space-between"

        alignItems="center"

        mb={3}
      >

        <Typography
          variant="h4"
          fontWeight="bold"
        >

          Campaign Management

        </Typography>



        <Button

          variant="contained"

          startIcon={<Add />}

          onClick={() =>
            navigate(
              "/admin/campaigns/create"
            )
          }
        >

          Create Campaign

        </Button>

      </Box>



      {/* ====================================================== */}
      {/* FILTERS */}
      {/* ====================================================== */}

      <Paper
        sx={{
          p: 2,
          mb: 3,
        }}
      >

        <Grid
          container
          spacing={2}
        >

          <Grid
            item
            xs={12}
            md={4}
          >

            <TextField

              fullWidth

              label="Search Campaigns"

              value={search}

              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </Grid>



          <Grid
            item
            xs={12}
            md={4}
          >

            <TextField

              select

              fullWidth

              label="Status"

              value={status}

              onChange={(e) =>
                setStatus(
                  e.target.value
                )
              }
            >

              <MenuItem value="">
                All
              </MenuItem>

              <MenuItem value="draft">
                Draft
              </MenuItem>

              <MenuItem value="active">
                Active
              </MenuItem>

              <MenuItem value="completed">
                Completed
              </MenuItem>

              <MenuItem value="archived">
                Archived
              </MenuItem>

            </TextField>

          </Grid>



          <Grid
            item
            xs={12}
            md={4}
          >

            <TextField

              select

              fullWidth

              label="Type"

              value={type}

              onChange={(e) =>
                setType(
                  e.target.value
                )
              }
            >

              <MenuItem value="">
                All
              </MenuItem>

              <MenuItem value="webinar">
                Webinar
              </MenuItem>

              <MenuItem value="sat">
                SAT
              </MenuItem>

              <MenuItem value="tutorial">
                Tutorial
              </MenuItem>

              <MenuItem value="general">
                General
              </MenuItem>

            </TextField>

          </Grid>

        </Grid>

      </Paper>



      {/* ====================================================== */}
      {/* LOADING */}
      {/* ====================================================== */}

      {loading ? (

        <Box textAlign="center">

          <CircularProgress />

        </Box>

      ) : (

        <Grid
          container
          spacing={3}
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

                <Card
                  sx={{
                    borderRadius: 3,
                    height: "100%",
                  }}
                >

                  {/* IMAGE */}

                  <Box
                    sx={{
                      height: 220,
                      overflow: "hidden",
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

                  </Box>



                  <CardContent>

                    {/* TITLE */}

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >

                      <Typography
                        variant="h6"
                        fontWeight="bold"
                      >

                        {campaign.title}

                      </Typography>



                      {campaign.featured && (

                        <Star
                          color="warning"
                        />

                      )}

                    </Stack>



                    {/* STATUS */}

                    <Chip

                      label={
                        campaign.status
                      }

                      color={
                        getStatusColor(
                          campaign.status
                        )
                      }

                      size="small"

                      sx={{
                        mb: 2,
                      }}
                    />



                    {/* META */}

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >

                      Type:
                      {" "}
                      {campaign.type}

                    </Typography>



                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >

                      Views:
                      {" "}
                      {campaign.views || 0}

                    </Typography>



                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >

                      Clicks:
                      {" "}
                      {campaign.clicks || 0}

                    </Typography>



                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >

                      Registrations:
                      {" "}
                      {campaign.registrationCount || 0}

                    </Typography>



                    {/* CREATOR */}

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mt={2}
                    >

                      <Avatar>
                        {
                          campaign.creator
                            ?.fullName?.[0]
                        }
                      </Avatar>

                      <Typography
                        variant="body2"
                      >

                        {
                          campaign.creator
                            ?.fullName
                        }

                      </Typography>

                    </Stack>



                    {/* ACTIONS */}

                    <Stack
                      direction="row"
                      spacing={1}
                      mt={3}
                    >

                      <Tooltip title="View">

                        <IconButton

                          color="primary"

                          onClick={() =>
                            navigate(

                              `/admin/campaigns/${campaign.id}`
                            )
                          }
                        >

                          <Visibility />

                        </IconButton>

                      </Tooltip>



                      <Tooltip title="Edit">

                        <IconButton

                          color="info"

                          onClick={() =>
                            navigate(

                              `/admin/campaigns/${campaign.id}/edit`
                            )
                          }
                        >

                          <Edit />

                        </IconButton>

                      </Tooltip>



                      <Tooltip title="Feature">

                        <IconButton

                          color="warning"

                          onClick={() =>
                            handleFeature(
                              campaign.id
                            )
                          }
                        >

                          <Star />

                        </IconButton>

                      </Tooltip>



                      <Tooltip title="Publish">

                        <IconButton

                          color="success"

                          onClick={() =>
                            handlePublish(
                              campaign.id
                            )
                          }
                        >

                          <Publish />

                        </IconButton>

                      </Tooltip>



                      <Tooltip title="Archive">

                        <IconButton

                          color="secondary"

                          onClick={() =>
                            handleArchive(
                              campaign.id
                            )
                          }
                        >

                          <Archive />

                        </IconButton>

                      </Tooltip>



                      <Tooltip title="Delete">

                        <IconButton

                          color="error"

                          onClick={() =>
                            handleDelete(
                              campaign.id
                            )
                          }
                        >

                          <Delete />

                        </IconButton>

                      </Tooltip>

                    </Stack>

                  </CardContent>

                </Card>

              </Grid>
            )
          )}

        </Grid>
      )}

    </Box>
  );
};

export default CampaignList;