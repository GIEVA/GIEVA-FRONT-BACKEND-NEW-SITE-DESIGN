import {
  useState,
} from "react";

import {

  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,

} from "@mui/material";

import {
  createUser,
} from "../services/adminUserService";

const NAVY = "#0B1F3A";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  role: "student",
};

export default function
CreateUserModal({

  open,
  onClose,
  refresh,

}) {

  const [form,
    setForm] =
      useState(initialForm);

  const [submitting,
    setSubmitting] =
      useState(false);

  const [error,
    setError] =
      useState("");



  const handleClose = () => {

    // Don't let the user dismiss mid-submit and lose track
    // of whether the create actually went through.
    if (submitting) return;

    setForm(initialForm);
    setError("");
    onClose();
  };



  const handleSubmit =
    async () => {

      setError("");

      if (

        !form.fullName ||

        !form.email ||

        !form.password
      ) {

        return setError(
          "Full name, email, and password are required"
        );
      }

      try {

        setSubmitting(true);

        await createUser(
          form
        );

        setForm(initialForm);

        refresh();

        onClose();

      } catch (err) {

        setError(

          err.response?.data?.message ||

          "Failed to create user"
        );

      } finally {

        setSubmitting(false);
      }
    };



  return (

    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >

      <DialogTitle>

        Create User

      </DialogTitle>



      <DialogContent>

        <Stack
          spacing={3}
          mt={1}
        >

          {error && (

            <Alert
              severity="error"
            >
              {error}
            </Alert>
          )}



          <TextField

            label="Full Name"

            fullWidth

            disabled={submitting}

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



          <TextField

            label="Email"

            fullWidth

            disabled={submitting}

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



          <TextField

            label="Password"

            type="password"

            fullWidth

            disabled={submitting}

            value={
              form.password
            }

            onChange={(e) =>
              setForm({

                ...form,

                password:
                  e.target.value,
              })
            }
          />



          <TextField

            select

            label="Role"

            fullWidth

            disabled={submitting}

            value={form.role}

            onChange={(e) =>
              setForm({

                ...form,

                role:
                  e.target.value,
              })
            }
          >

            <MenuItem value="student">
              Student
            </MenuItem>

            <MenuItem value="tutor">
              Tutor
            </MenuItem>

            <MenuItem value="admin">
              Admin
            </MenuItem>

            <MenuItem value="superadmin">
              Super Admin
            </MenuItem>

          </TextField>



          <Button

            variant="contained"

            disabled={submitting}

            sx={{
              bgcolor: NAVY,
              py: 1.2,
            }}

            onClick={
              handleSubmit
            }
          >

            {submitting ? (

              <CircularProgress
                size={22}
                sx={{
                  color: "#fff",
                }}
              />

            ) : (

              "Create User"
            )}

          </Button>

        </Stack>

      </DialogContent>

    </Dialog>
  );
}