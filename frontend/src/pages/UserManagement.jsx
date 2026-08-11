import {
  useEffect,
  useState,
} from "react";

import {

  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Stack,
  TextField,
  MenuItem,
  Pagination,
  Chip,
  Button,

} from "@mui/material";

import {

  getUsers,

} from "../services/adminUserService";

import UserDetailsModal
from "../components/UserDetailsModal";

import CreateUserModal
from "../components/CreateUserModal";


const NAVY = "#0B1F3A";

export default function
UserManagement() {

  const [users,
    setUsers] =
      useState([]);

  const [selectedUser,
    setSelectedUser] =
      useState(null);

  const [openModal,
    setOpenModal] =
      useState(false);

  const [openCreate,
    setOpenCreate] =
      useState(false);

  const [page,
    setPage] =
      useState(1);

  const [pages,
    setPages] =
      useState(1);

  const [search,
    setSearch] =
      useState("");

  const [role,
    setRole] =
      useState("");



  const fetchUsers =
    async () => {

      const res =
        await getUsers({

          page,
          search,
          role,
        });



      setUsers(
        res.users || []
      );

      setPages(
        res.pages || 1
      );
    };



  useEffect(() => {

    fetchUsers();

  }, [page, search, role]);



  return (

    <Box p={4}>

      <Stack

        direction="row"

        justifyContent="space-between"

        alignItems="center"

        mb={4}
      >

        <div>

          <Typography
            variant="h4"
            fontWeight="bold"
          >

            User Management

          </Typography>



          <Typography
            color="text.secondary"
          >

            Manage platform users

          </Typography>

        </div>



        <Button

          variant="contained"
          sx={{
                bgcolor: NAVY,
            }}

          onClick={() =>
            setOpenCreate(true)
          }
        >

          Create User

        </Button>

      </Stack>



      {/* FILTERS */}

      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          mb: 4,
        }}
      >

        <Stack
          direction="row"
          spacing={2}
        >

          <TextField

            fullWidth

            placeholder="Search users..."

            value={search}

            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />



          <TextField

            select

            value={role}

            onChange={(e) =>
              setRole(
                e.target.value
              )
            }

            sx={{
              width: 220,
            }}
          >

            <MenuItem value="">
              All Roles
            </MenuItem>

            <MenuItem value="student">
              Student
            </MenuItem>

            <MenuItem value="tutor">
              Tutor
            </MenuItem>

            <MenuItem value="operational_admin">
              Operational Admin
            </MenuItem>

            <MenuItem value="reviewer">
              Reviewer
            </MenuItem>

            <MenuItem value="superadmin">
              Super Admin
            </MenuItem>

          </TextField>

        </Stack>

      </Paper>



      {/* TABLE */}

      <Paper
        sx={{
          borderRadius: 4,
          overflow: "hidden",
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
                Role
              </TableCell>

              <TableCell>
                Status
              </TableCell>

              <TableCell>
                Verified
              </TableCell>

            </TableRow>

          </TableHead>



          <TableBody>

            {users.map(
              (user) => (

                <TableRow

                  key={user.id}

                  hover

                  sx={{
                    cursor: "pointer",
                  }}

                  onClick={() => {

                    setSelectedUser(
                      user
                    );

                    setOpenModal(
                      true
                    );
                  }}
                >

                  <TableCell>

                    {
                      user.fullName
                    }

                  </TableCell>



                  <TableCell>

                    {user.email}

                  </TableCell>



                  <TableCell>

                    <Chip
                      label={user.role}
                    />

                  </TableCell>



                  <TableCell>

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

                  </TableCell>



                  <TableCell>

                    <Chip

                      label={
                        user.isVerified
                          ? "Verified"
                          : "Pending"
                      }

                      color={
                        user.isVerified
                          ? "success"
                          : "warning"
                      }
                    />

                  </TableCell>

                </TableRow>
              )
            )}

          </TableBody>

        </Table>



        <Box
          p={3}
          display="flex"
          justifyContent="center"
        >

          <Pagination

            count={pages}

            page={page}

            onChange={(
              _,
              value
            ) =>
              setPage(value)
            }
          />

        </Box>

      </Paper>



      {/* MODALS */}

      <UserDetailsModal

        open={openModal}

        onClose={() =>
          setOpenModal(false)
        }

        user={selectedUser}

        refresh={fetchUsers}
      />



      <CreateUserModal

        open={openCreate}

        onClose={() =>
          setOpenCreate(false)
        }

        refresh={fetchUsers}
      />

    </Box>
  );
}