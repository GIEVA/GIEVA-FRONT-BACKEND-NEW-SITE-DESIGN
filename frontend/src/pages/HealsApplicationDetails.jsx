import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";

import {
  Download,
} from "@mui/icons-material";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  getHealsApplicationById,
} from "../services/healsApplicationService";

import ApplicationStatusChip
from "../components/ApplicationStatusChip";

const BRAND = "#0B1F3A";

export default function HealsApplicationDetails() {

  const { id } =
    useParams();

  const [application,
    setApplication] =
    useState(null);

  const [loading,
    setLoading] =
    useState(true);

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication =
    async () => {

      try {

        const res =
          await getHealsApplicationById(
            id
          );

        setApplication(
          res.application || res
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);
      }
    };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        mt={10}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <Box p={4}>

      <Stack
        direction="row"
        justifyContent="space-between"
        mb={4}
      >

        <Box>

          <Typography
            variant="h4"
            fontWeight="bold"
          >
            Application Details
          </Typography>

          <Typography
            color="text.secondary"
          >
            {application.applicationCode}
          </Typography>

        </Box>

        <ApplicationStatusChip
          status={
            application.status
          }
        />

      </Stack>

      <Grid
        container
        spacing={3}
      >

        <Grid item xs={12} md={6}>

          <Card
            sx={{
              borderRadius: 4,
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                fontWeight="bold"
                mb={2}
              >
                Personal Information
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>

                <Typography>
                  <strong>Name:</strong>
                  {" "}
                  {application.fullName}
                </Typography>

                <Typography>
                  <strong>Email:</strong>
                  {" "}
                  {application.email}
                </Typography>

                <Typography>
                  <strong>Phone:</strong>
                  {" "}
                  {application.phone}
                </Typography>

                <Typography>
                  <strong>Country:</strong>
                  {" "}
                  {application.desiredCountry}
                </Typography>

              </Stack>

            </CardContent>

          </Card>

        </Grid>

        <Grid item xs={12} md={6}>

          <Card
            sx={{
              borderRadius: 4,
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                fontWeight="bold"
                mb={2}
              >
                Documents
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>

                {[
                  {
                    label: "Passport",
                    url:
                      application.passportUrl,
                  },

                  {
                    label: "Transcript",
                    url:
                      application.transcriptUrl,
                  },

                  {
                    label: "SOP",
                    url:
                      application.sopUrl,
                  },
                ].map((doc) => (

                  doc.url && (

                    <Button
                      key={doc.label}
                      variant="outlined"
                      startIcon={
                        <Download />
                      }
                      href={doc.url}
                      target="_blank"
                    >
                      {doc.label}
                    </Button>
                  )
                ))}

              </Stack>

            </CardContent>

          </Card>

        </Grid>

      </Grid>

    </Box>
  );
}