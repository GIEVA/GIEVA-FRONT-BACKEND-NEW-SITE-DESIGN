import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {

  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Avatar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,

} from "@mui/material";

import {

  Search,
  Delete,
  Edit,
  Group,
  Email,
  Phone,
  Download,

} from "@mui/icons-material";

import {

  getAdminCampaignRegistrations,
  deleteAdminCampaignRegistration,

} from "../services/adminCampaignRegistrationService";

import {
  getCampaign,
} from "../services/campaignService";



const CampaignRegistrations =
() => {

  const { id } =
    useParams();



  const [campaign,
    setCampaign] =
      useState(null);

  const [registrations,
    setRegistrations] =
      useState([]);

  const [loading,
    setLoading] =
      useState(true);

  const [search,
    setSearch] =
      useState("");



  const [selected,
    setSelected] =
      useState(null);



  // ======================================================
  // FETCH
  // ======================================================

  const fetchData =
    async () => {

      try {

        const campaignData =
          await getCampaign(id);

        setCampaign(
          campaignData
        );



        const registrationData =
          await getAdminCampaignRegistrations({

            campaignId: id,
          });



        setRegistrations(
          registrationData.registrations || []
        );

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    };



  useEffect(() => {

    fetchData();

  }, [id]);



  // ======================================================
  // FILTERED
  // ======================================================

  const filtered =
    useMemo(() => {

      return registrations.filter(
        (reg) =>

          reg.fullName
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||

          reg.email
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );

    }, [
      registrations,
      search,
    ]);



  // ======================================================
  // DELETE
  // ======================================================

  const handleDelete =
    async () => {

      try {

        await deleteAdminCampaignRegistration(
          selected.id
        );



        setSelected(null);

        fetchData();

      } catch (error) {

        console.error(error);
      }
    };



  // ======================================================
  // EXPORT CSV
  // ======================================================

  const exportCSV =
    () => {

      const headers = [

        "Full Name",
        "Email",
        "Phone Number",
        "DOB",
        "Registered At",

      ];



      const rows =
        filtered.map(
          (reg) => [

            reg.fullName,

            reg.email,

            reg.phoneNumber,

            reg.dob,

            new Date(
              reg.createdAt
            ).toLocaleString(),
          ]
        );



      const csvContent =
        [

          headers.join(","),

          ...rows.map(
            (e) =>
              e.join(",")
          ),
        ].join("\n");



      const blob =
        new Blob(
          [csvContent],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );



      const link =
        document.createElement(
          "a"
        );



      const url =
        URL.createObjectURL(
          blob
        );



      link.setAttribute(
        "href",
        url
      );



      link.setAttribute(

        "download",

        `${campaign?.title}-registrations.csv`
      );



      link.click();
    };



  // ======================================================
  // LOADING
  // ======================================================

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



  return (

    <Box p={3}>

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <Stack

        direction="row"

        justifyContent="space-between"

        alignItems="center"

        mb={4}
      >

        <Box>

          <Typography
            variant="h4"
            fontWeight="bold"
          >

            Campaign Registrations

          </Typography>



          <Typography
            color="text.secondary"
          >

            Manage campaign
            attendees and
            registrations.

          </Typography>

        </Box>



        <Button

          variant="contained"

          startIcon={<Download />}

          onClick={exportCSV}
        >

          Export CSV

        </Button>

      </Stack>



      {/* ====================================================== */}
      {/* STATS */}
      {/* ====================================================== */}

      <Grid
        container
        spacing={3}
        mb={4}
      >

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

                <Group />

              </Avatar>



              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >

                  {
                    registrations.length
                  }

                </Typography>



                <Typography
                  color="text.secondary"
                >

                  Total Registrations

                </Typography>

              </Box>

            </Stack>

          </Paper>

        </Grid>



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

                <Email />

              </Avatar>



              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >

                  {

                    registrations.filter(
                      (r) =>
                        r.email
                    ).length
                  }

                </Typography>



                <Typography
                  color="text.secondary"
                >

                  Email Captured

                </Typography>

              </Box>

            </Stack>

          </Paper>

        </Grid>



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

                <Phone />

              </Avatar>



              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >

                  {

                    registrations.filter(
                      (r) =>
                        r.phoneNumber
                    ).length
                  }

                </Typography>



                <Typography
                  color="text.secondary"
                >

                  Phone Captured

                </Typography>

              </Box>

            </Stack>

          </Paper>

        </Grid>

      </Grid>



      {/* ====================================================== */}
      {/* SEARCH */}
      {/* ====================================================== */}

      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          mb: 3,
        }}
      >

        <TextField

          fullWidth

          placeholder="Search registrations..."

          value={search}

          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }

          InputProps={{

            startAdornment: (

              <InputAdornment
                position="start"
              >

                <Search />

              </InputAdornment>
            ),
          }}
        />

      </Paper>



      {/* ====================================================== */}
      {/* TABLE */}
      {/* ====================================================== */}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
        }}
      >

        <Table>

          <TableHead>

            <TableRow>

              <TableCell>
                Name
              </TableCell>

              <TableCell>
                Email
              </TableCell>

              <TableCell>
                Phone
              </TableCell>

              <TableCell>
                DOB
              </TableCell>

              <TableCell>
                Registered
              </TableCell>

              <TableCell>
                Actions
              </TableCell>

            </TableRow>

          </TableHead>



          <TableBody>

            {filtered.map(
              (reg) => (

                <TableRow
                  key={reg.id}
                >

                  <TableCell>

                    <Typography
                      fontWeight="bold"
                    >

                      {
                        reg.fullName
                      }

                    </Typography>

                  </TableCell>



                  <TableCell>

                    {reg.email}

                  </TableCell>



                  <TableCell>

                    {
                      reg.phoneNumber
                    }

                  </TableCell>



                  <TableCell>

                    {reg.dob
                      ? new Date(
                          reg.dob
                        ).toLocaleDateString()
                      : "-"}

                  </TableCell>



                  <TableCell>

                    <Chip

                      label={
                        new Date(
                          reg.createdAt
                        ).toLocaleDateString()
                      }

                      size="small"
                    />

                  </TableCell>



                  <TableCell>

                    <Stack
                      direction="row"
                      spacing={1}
                    >

                      <IconButton
                        color="primary"
                      >

                        <Edit />

                      </IconButton>



                      <IconButton

                        color="error"

                        onClick={() =>
                          setSelected(
                            reg
                          )
                        }
                      >

                        <Delete />

                      </IconButton>

                    </Stack>

                  </TableCell>

                </TableRow>
              )
            )}

          </TableBody>

        </Table>

      </TableContainer>



      {/* ====================================================== */}
      {/* DELETE DIALOG */}
      {/* ====================================================== */}

      <Dialog

        open={
          Boolean(selected)
        }

        onClose={() =>
          setSelected(null)
        }
      >

        <DialogTitle>

          Delete Registration

        </DialogTitle>



        <DialogContent>

          <Typography>

            Are you sure you want
            to remove this
            registration?

          </Typography>

        </DialogContent>



        <DialogActions>

          <Button
            onClick={() =>
              setSelected(null)
            }
          >

            Cancel

          </Button>



          <Button

            color="error"

            variant="contained"

            onClick={
              handleDelete
            }
          >

            Delete

          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
};

export default
CampaignRegistrations;