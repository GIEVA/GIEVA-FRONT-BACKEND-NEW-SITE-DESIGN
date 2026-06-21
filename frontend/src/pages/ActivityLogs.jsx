import {
  useEffect,
  useState,
} from "react";

import {

  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Stack,
  Pagination,
  CircularProgress,
  Chip,

} from "@mui/material";

import {
  getActivityLogs,
} from "../services/activityLogService";



export default function
ActivityLogs() {

  const [logs,
    setLogs] =
      useState([]);

  const [loading,
    setLoading] =
      useState(true);

  const [page,
    setPage] =
      useState(1);

  const [pages,
    setPages] =
      useState(1);

  const [search,
    setSearch] =
      useState("");



  // ======================================================
  // FETCH
  // ======================================================

  const fetchLogs =
    async () => {

      try {

        setLoading(true);



        const res =
          await getActivityLogs({

            page,

            search,
          });



        setLogs(
          res.logs || []
        );

        setPages(
          res.pages || 1
        );

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    };



  useEffect(() => {

    fetchLogs();

  }, [page, search]);



  return (

    <Box p={4}>

      {/* HEADER */}

      <Typography

        variant="h4"

        fontWeight="bold"

        mb={1}
      >

        Activity Logs

      </Typography>



      <Typography
        color="text.secondary"
        mb={4}
      >

        Monitor all system
        activities and audit
        trails.

      </Typography>



      {/* FILTERS */}

      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          mb: 4,
        }}
      >

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
        >

          <TextField

            fullWidth

            placeholder="Search action..."

            value={search}

            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </Stack>

      </Paper>



      {/* TABLE */}

      <Paper
        sx={{
          borderRadius: 4,
          overflow: "hidden",
        }}
      >

        {loading ? (

          <Box
            textAlign="center"
            py={8}
          >

            <CircularProgress />

          </Box>

        ) : (

          <>

            <Table>

              <TableHead>

                <TableRow>

                  <TableCell>
                    Action
                  </TableCell>

                  <TableCell>
                    User ID
                  </TableCell>

                  <TableCell>
                    Meta
                  </TableCell>

                  <TableCell>
                    Date
                  </TableCell>

                </TableRow>

              </TableHead>



              <TableBody>

                {logs.map(
                  (log) => (

                    <TableRow
                      key={log.id}
                    >

                      <TableCell>

                        <Chip

                          label={
                            log.action
                          }

                          color="primary"
                        />

                      </TableCell>



                      <TableCell>

                        {
                          log.userId
                        }

                      </TableCell>



                      <TableCell>

                        <Typography
                          variant="body2"
                        >

                          {

                            JSON.stringify(
                              log.meta
                            )
                          }

                        </Typography>

                      </TableCell>



                      <TableCell>

                        {

                          new Date(
                            log.createdAt
                          ).toLocaleString()
                        }

                      </TableCell>

                    </TableRow>
                  )
                )}

              </TableBody>

            </Table>



            {/* PAGINATION */}

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

          </>
        )}

      </Paper>

    </Box>
  );
}