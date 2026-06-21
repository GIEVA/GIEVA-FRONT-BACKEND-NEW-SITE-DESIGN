import {

  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Stack,
  Chip,
  Divider,
  Button,
  MenuItem,
  Select,

} from "@mui/material";

import {
  useState,
} from "react";

import {

  toggleUserStatus,
  updateUserRole,

} from "../services/adminUserService";



export default function
UserDetailsModal({

  open,
  onClose,
  user,
  refresh,

}) {

  const [role,
    setRole] =
      useState(
        user?.role
      );



  if (!user) return null;



  const handleToggle =
    async () => {

      await toggleUserStatus(
        user.id
      );

      refresh();

      onClose();
    };



  const handleRoleUpdate =
    async () => {

      await updateUserRole(
        user.id,
        role
      );

      refresh();
    };



  return (

    <Dialog

      open={open}

      onClose={onClose}

      maxWidth="sm"

      fullWidth
    >

      <DialogTitle>

        User Details

      </DialogTitle>



      <DialogContent>

        <Stack
          spacing={3}
        >

          <div>

            <Typography
              variant="h6"
            >

              {
                user.fullName
              }

            </Typography>



            <Typography
              color="text.secondary"
            >

              {user.email}

            </Typography>

          </div>



          <Divider />



          <Stack
            direction="row"
            spacing={1}
          >

            <Chip
              label={user.role}
              color="primary"
            />



            <Chip

              label={
                user.isActive
                  ? "Active"
                  : "Inactive"
              }

              color={
                user.isActive
                  ? "success"
                  : "error"
              }
            />



            <Chip

              label={
                user.isVerified
                  ? "Verified"
                  : "Unverified"
              }

              color={
                user.isVerified
                  ? "success"
                  : "warning"
              }
            />

          </Stack>



          <Typography>

            Joined:
            {" "}

            {
              new Date(
                user.createdAt
              ).toLocaleString()
            }

          </Typography>



          {/* ROLE */}

          <div>

            <Typography
              mb={1}
            >

              Update Role

            </Typography>



            <Select

              fullWidth

              value={role}

              onChange={(e) =>
                setRole(
                  e.target.value
                )
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

            </Select>

          </div>



          <Stack
            direction="row"
            spacing={2}
          >

            <Button

              variant="contained"

              onClick={
                handleRoleUpdate
              }
            >

              Save Role

            </Button>



            <Button

              variant="outlined"

              color={
                user.isActive
                  ? "error"
                  : "success"
              }

              onClick={
                handleToggle
              }
            >

              {user.isActive
                ? "Deactivate"
                : "Activate"
              }

            </Button>

          </Stack>

        </Stack>

      </DialogContent>

    </Dialog>
  );
}