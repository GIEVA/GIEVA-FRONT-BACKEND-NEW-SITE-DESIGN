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

} from "@mui/material";

import {
  createUser,
} from "../services/adminUserService";



export default function
CreateUserModal({

  open,
  onClose,
  refresh,

}) {

  const [form,
    setForm] =
      useState({

        fullName: "",

        email: "",

        password: "",

        role: "student",
      });



  const handleSubmit =
    async () => {

      await createUser(
        form
      );

      refresh();

      onClose();
    };



  return (

    <Dialog
      open={open}
      onClose={onClose}
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

          <TextField

            label="Full Name"

            fullWidth

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

            onClick={
              handleSubmit
            }
          >

            Create User

          </Button>

        </Stack>

      </DialogContent>

    </Dialog>
  );
}