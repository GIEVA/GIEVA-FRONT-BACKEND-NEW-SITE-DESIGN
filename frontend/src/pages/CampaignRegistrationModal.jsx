import {
  useState,
} from "react";

import {

  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  CircularProgress,
  Alert,

} from "@mui/material";

import {

  createCampaignRegistration,

} from "../services/campaignRegistrationService";



const CampaignRegistrationModal =
({

  open,
  onClose,
  campaign,

}) => {

  const [loading,
    setLoading] =
      useState(false);

  const [success,
    setSuccess] =
      useState("");

  const [error,
    setError] =
      useState("");



  const [form,
    setForm] =
      useState({

        fullName: "",

        email: "",

        phoneNumber: "",

        dob: "",
      });



  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit =
    async () => {

      try {

        setLoading(true);

        setError("");



        const payload = {

          ...form,

          campaignId:
            campaign.id,
        };



        const res =
          await createCampaignRegistration(
            payload
          );



        setSuccess(
          res.message
        );



        setTimeout(() => {

          onClose();

        }, 2000);

      } catch (err) {

        setError(

          err.response?.data
            ?.message ||

          "Registration failed"
        );

      } finally {

        setLoading(false);
      }
    };



  return (

    <Dialog

      open={open}

      onClose={onClose}

      fullWidth

      maxWidth="sm"
    >

      <DialogTitle>

        Register for
        {" "}
        {campaign?.title}

      </DialogTitle>



      <DialogContent>

        <Typography
          color="text.secondary"
          mb={3}
        >

          Complete the form below
          to reserve your spot.

        </Typography>



        {success && (

          <Alert
            severity="success"
            sx={{
              mb: 2,
            }}
          >

            {success}

          </Alert>
        )}



        {error && (

          <Alert
            severity="error"
            sx={{
              mb: 2,
            }}
          >

            {error}

          </Alert>
        )}



        <Grid
          container
          spacing={2}
        >

          {/* NAME */}

          <Grid
            item
            xs={12}
          >

            <TextField

              fullWidth

              label="Full Name"

              value={
                form.fullName
              }

              onChange={(e) =>
                setForm({

                  ...form,

                  fullName:
                    e.target.value,
                })
              }
            />

          </Grid>



          {/* EMAIL */}

          <Grid
            item
            xs={12}
            md={6}
          >

            <TextField

              fullWidth

              type="email"

              label="Email Address"

              value={
                form.email
              }

              onChange={(e) =>
                setForm({

                  ...form,

                  email:
                    e.target.value,
                })
              }
            />

          </Grid>



          {/* PHONE */}

          <Grid
            item
            xs={12}
            md={6}
          >

            <TextField

              fullWidth

              label="Phone Number"

              value={
                form.phoneNumber
              }

              onChange={(e) =>
                setForm({

                  ...form,

                  phoneNumber:
                    e.target.value,
                })
              }
            />

          </Grid>



          {/* DOB */}

          <Grid
            item
            xs={12}
          >

            <TextField

              fullWidth

              type="date"

              label="Date of Birth"

              InputLabelProps={{
                shrink: true,
              }}

              value={
                form.dob
              }

              onChange={(e) =>
                setForm({

                  ...form,

                  dob:
                    e.target.value,
                })
              }
            />

          </Grid>

        </Grid>

      </DialogContent>



      <DialogActions>

        <Button
          onClick={onClose}
        >

          Cancel

        </Button>



        <Button

          variant="contained"

          disabled={loading}

          onClick={
            handleSubmit
          }
        >

          {loading
            ? (
              <CircularProgress
                size={24}
                sx={{
                  color:
                    "#fff",
                }}
              />
            )
            : "Register"
          }

        </Button>

      </DialogActions>

    </Dialog>
  );
};

export default
CampaignRegistrationModal;