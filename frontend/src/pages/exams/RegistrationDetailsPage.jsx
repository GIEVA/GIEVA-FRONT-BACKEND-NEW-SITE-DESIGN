import React, {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Button,
} from "@mui/material";

import {
  getRegistrationById,
} from "../../services/examService";



function renderValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  if (
    typeof value === "boolean"
  ) {
    return value
      ? "Yes"
      : "No";
  }

  return String(value);
}



function formatLabel(label) {
  return label
    .replace(
      /([A-Z])/g,
      " $1"
    )
    .replace(/^./, (s) =>
      s.toUpperCase()
    );
}



function RenderObject({
  title,
  data,
}) {
  if (!data) return null;

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        gutterBottom
      >
        {title}
      </Typography>

      <Divider
        sx={{ mb: 2 }}
      />

      <Grid
        container
        spacing={2}
      >
        {Object.entries(
          data
        ).map(
          ([key, value]) => {
            if (
              Array.isArray(
                value
              )
            ) {
              return (
                <Grid
                  item
                  xs={12}
                  key={key}
                >
                  <Typography
                    fontWeight={
                      600
                    }
                  >
                    {formatLabel(
                      key
                    )}
                  </Typography>

                  {value.map(
                    (
                      item,
                      index
                    ) => (
                      <Typography
                        key={
                          index
                        }
                        color="text.secondary"
                      >
                        •{" "}
                        {renderValue(
                          item
                        )}
                      </Typography>
                    )
                  )}
                </Grid>
              );
            }

            if (
              typeof value ===
                "object" &&
              value !== null
            ) {
              return (
                <Grid
                  item
                  xs={12}
                  key={key}
                >
                  <RenderObject
                    title={formatLabel(
                      key
                    )}
                    data={
                      value
                    }
                  />
                </Grid>
              );
            }

            return (
              <Grid
                item
                xs={12}
                md={6}
                key={key}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {formatLabel(
                    key
                  )}
                </Typography>

                <Typography
                  fontWeight={
                    600
                  }
                >
                  {renderValue(
                    value
                  )}
                </Typography>
              </Grid>
            );
          }
        )}
      </Grid>
    </Paper>
  );
}



export default function RegistrationDetailsPage() {

  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [
    registration,
    setRegistration,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");



  useEffect(() => {
    fetchRegistration();
  }, [id]);



  const fetchRegistration =
    async () => {
      try {
        const data =
          await getRegistrationById(
            id
          );

        setRegistration(
          data
        );

      } catch (err) {
        console.error(err);

        setError(
          err?.response?.data
            ?.message ||
            "Failed to load registration"
        );
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



  if (error) {
    return (
      <Box
        maxWidth={900}
        mx="auto"
        mt={5}
      >
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }



  if (!registration) {
    return null;
  }



  return (
    <Box
      maxWidth="lg"
      mx="auto"
      py={4}
    >

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography
          variant="h4"
          fontWeight={700}
        >
          Registration Details
        </Typography>

        <Button
          variant="outlined"
          onClick={() =>
            navigate(
              "/my-exam-registrations"
            )
          }
        >
          Back
        </Button>
      </Stack>



      <Paper
        sx={{
          p: 4,
          mb: 4,
        }}
      >

        <Grid
          container
          spacing={3}
        >

          <Grid
            item
            xs={12}
            md={6}
          >
            <Typography
              color="text.secondary"
            >
              Registration Code
            </Typography>

            <Typography
              variant="h6"
              fontWeight={700}
            >
              {
                registration.registrationCode
              }
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
          >
            <Typography
              color="text.secondary"
            >
              Exam Type
            </Typography>

            <Typography
              variant="h6"
            >
              {
                registration.examType
              }
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
          >
            <Typography
              color="text.secondary"
            >
              Amount
            </Typography>

            <Typography
              variant="h6"
            >
              $
              {Number(
                registration.amount
              ).toLocaleString()}
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
          >
            <Typography
              color="text.secondary"
            >
              Submitted Date
            </Typography>

            <Typography>
              {registration.submittedAt
                ? new Date(
                    registration.submittedAt
                  ).toLocaleString()
                : "Not Submitted"}
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
          >
            <Stack
              direction="row"
              spacing={2}
            >
              <Chip
                label={
                  registration.status
                }
                color="primary"
              />

              <Chip
                label={
                  registration.paymentStatus
                }
                color={
                  registration.paymentStatus ===
                  "success"
                    ? "success"
                    : "warning"
                }
              />
            </Stack>
          </Grid>

        </Grid>
      </Paper>



      {registration.adminNotes && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
          >
            Admin Notes
          </Typography>

          <Typography>
            {
              registration.adminNotes
            }
          </Typography>
        </Paper>
      )}



      {registration.rejectionReason && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
          >
            Rejection Reason
          </Typography>

          <Typography>
            {
              registration.rejectionReason
            }
          </Typography>
        </Paper>
      )}



      {registration.processor && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
          >
            Processing Officer
          </Typography>

          <Typography>
            {
              registration.processor
                .fullName
            }
          </Typography>

          <Typography
            color="text.secondary"
          >
            {
              registration.processor
                .email
            }
          </Typography>
        </Paper>
      )}



      <Typography
        variant="h5"
        fontWeight={700}
        mb={3}
      >
        Submitted Form Data
      </Typography>

      <RenderObject
        title="Application Information"
        data={
          registration.data
        }
      />



      {registration.payments
        ?.length > 0 && (
        <Paper
          sx={{
            p: 3,
            mt: 4,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
          >
            Payment History
          </Typography>

          {registration.payments.map(
            (
              payment
            ) => (
              <Paper
                key={
                  payment.id
                }
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                }}
              >
                <Typography>
                  Reference:
                  {" "}
                  {
                    payment.transactionRef
                  }
                </Typography>

                <Typography>
                  Amount:
                  {" "}
                  ₦
                  {Number(
                    payment.amount
                  ).toLocaleString()}
                </Typography>

                <Typography>
                  Status:
                  {" "}
                  {
                    payment.status
                  }
                </Typography>

                <Typography>
                  Date:
                  {" "}
                  {payment.paidAt
                    ? new Date(
                        payment.paidAt
                      ).toLocaleString()
                    : "N/A"}
                </Typography>
              </Paper>
            )
          )}
        </Paper>
      )}

    </Box>
  );
}