import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  Chip,
  Divider,
  Button,
  MenuItem,
  Select,
  Alert,
  CircularProgress,
} from "@mui/material";

import {
  useState,
  useEffect,
} from "react";

import {
  toggleUserStatus,
  updateUserRole,
  verifyUser,
  deleteUser,
} from "../services/adminUserService";

import { useAuth } from "../context/AuthContext";

export default function
UserDetailsModal({

  open,
  onClose,
  user,
  refresh,

}) {

  const { user: currentUser } = useAuth();

  const [role,
    setRole] =
      useState(user?.role || "student");

  const [error, setError] = useState("");

  const [savingRole,     setSavingRole]     = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [verifying,      setVerifying]      = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);

  // Keep the role dropdown in sync whenever a different user is
  // selected — otherwise it silently keeps showing the last user's role.
  useEffect(() => {
    setRole(user?.role || "student");
    setError("");
    setConfirmDelete(false);
  }, [user]);

  if (!user) return null;

  const isSuperAdmin = currentUser?.role === "superadmin";
  const isSelf = currentUser?.id === user.id;

  const handleToggle = async () => {
    try {
      setError("");
      setTogglingStatus(true);
      await toggleUserStatus(user.id);
      refresh();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleRoleUpdate = async () => {
    try {
      setError("");
      setSavingRole(true);
      await updateUserRole(user.id, role);
      refresh();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update role");
    } finally {
      setSavingRole(false);
    }
  };

  const handleVerify = async () => {
    try {
      setError("");
      setVerifying(true);
      await verifyUser(user.id);
      refresh();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to verify user");
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    try {
      setError("");
      setDeleting(true);
      await deleteUser(user.id);
      refresh();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user");
      setDeleting(false);
      setConfirmDelete(false);
    }
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

          {error && (
            <Alert severity="error">{error}</Alert>
          )}

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



          {/* VERIFY — only shown for accounts not yet verified */}
          {!user.isVerified && (
            <Button
              variant="contained"
              color="success"
              disabled={verifying}
              onClick={handleVerify}
            >
              {verifying
                ? <CircularProgress size={20} sx={{ color: "#fff" }} />
                : "Verify Account"}
            </Button>
          )}



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

              disabled={savingRole}

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

              disabled={savingRole}

              onClick={
                handleRoleUpdate
              }
            >

              {savingRole
                ? <CircularProgress size={20} sx={{ color: "#fff" }} />
                : "Save Role"}

            </Button>



            <Button

              variant="outlined"

              color={
                user.isActive
                  ? "error"
                  : "success"
              }

              disabled={togglingStatus}

              onClick={
                handleToggle
              }
            >

              {togglingStatus
                ? <CircularProgress size={20} />
                : user.isActive ? "Deactivate" : "Activate"}

            </Button>

          </Stack>



          {/* DELETE — superadmin only, cannot delete yourself */}
          {isSuperAdmin && !isSelf && (
            <>
              <Divider />

              {!confirmDelete ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete User Permanently
                </Button>
              ) : (
                <Stack spacing={1.5}>
                  <Alert severity="warning">
                    This permanently deletes {user.fullName}'s account. This cannot be undone.
                  </Alert>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      disabled={deleting}
                      onClick={handleDelete}
                    >
                      {deleting
                        ? <CircularProgress size={20} sx={{ color: "#fff" }} />
                        : "Yes, Delete Permanently"}
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      disabled={deleting}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              )}
            </>
          )}

        </Stack>

      </DialogContent>

    </Dialog>
  );
}