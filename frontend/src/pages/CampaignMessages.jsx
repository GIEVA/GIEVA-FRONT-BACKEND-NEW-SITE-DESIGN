import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {

  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,

} from "@mui/material";

import {

  Send,
  Save,
  Schedule,

} from "@mui/icons-material";

import TiptapEditor
from "../components/TiptapEditor";

import {

  getCampaign,

} from "../services/campaignService";

import {

  createCampaignMessage,
  getCampaignMessages,
  sendCampaignMessage,

} from "../services/campaignMessageService";



const CampaignMessages =
() => {

  const { id } =
    useParams();



  const [campaign,
    setCampaign] =
      useState(null);

  const [messages,
    setMessages] =
      useState([]);

  const [loading,
    setLoading] =
      useState(true);

  const [sending,
    setSending] =
      useState(false);



  const [form,
    setForm] =
      useState({

        subject: "",

        message: "",

        status: "draft",

        scheduledAt: "",
        template: "general",
      });



  // ======================================================
  // FETCH
  // ======================================================

  const fetchData =
    async () => {

      try {

        const campaignData =
          await getCampaign(id);

        setCampaign(
          campaignData.campaign
        );



        const messagesData =
          await getCampaignMessages(
            id
          );



        setMessages(
          messagesData.messages || []
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
  // CREATE MESSAGE
  // ======================================================

  const handleCreate =
    async (
      status = "draft"
    ) => {

      try {

        setSending(true);



        await createCampaignMessage({

          ...form,

          status,

          campaignId: id,
        });



        setForm({

          subject: "",

          message: "",

          status: "draft",

          scheduledAt: "",
        });



        fetchData();

      } catch (error) {

        console.error(error);

      } finally {

        setSending(false);
      }
    };



  // ======================================================
  // SEND NOW
  // ======================================================

  const handleSendNow =
    async (messageId) => {

      try {

        await sendCampaignMessage(
          messageId
        );



        fetchData();

      } catch (error) {

        console.error(error);
      }
    };



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

      <Box mb={4}>

        <Typography
          variant="h4"
          fontWeight="bold"
        >

          Campaign Messages

        </Typography>



        <Typography
          color="text.secondary"
        >

          Manage email broadcasts,
          reminders and scheduled
          campaign messages.

        </Typography>

      </Box>



      <Grid
        container
        spacing={3}
      >

        {/* ====================================================== */}
        {/* CREATE */}
        {/* ====================================================== */}

        <Grid
          item
          xs={12}
          md={7}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={3}
            >

              Create Message

            </Typography>



            {/* SUBJECT */}

            <TextField

              fullWidth

              label="Subject"

              value={form.subject}

              onChange={(e) =>
                setForm({

                  ...form,

                  subject:
                    e.target.value,
                })
              }

              sx={{
                mb: 3,
              }}
            />



            {/* TEMPLATE */}

            <TextField

              select

              fullWidth

              label="Email Template"
              value={form.template}
              onChange={(e) =>
              setForm({
                ...form,
                template: e.target.value,
              })
            }

              sx={{
                mb: 3,
              }}
            >

              <MenuItem value="general">
                General Broadcast
              </MenuItem>

              <MenuItem value="webinar">
                Webinar Template
              </MenuItem>

              <MenuItem value="sat">
                SAT Template
              </MenuItem>

              <MenuItem value="reminder">
                Reminder Template
              </MenuItem>

              <MenuItem value="thankyou">
                Thank You Template
              </MenuItem>

            </TextField>



            {/* MESSAGE */}

            <Typography
              mb={1}
              fontWeight="bold"
            >

              Message

            </Typography>



            <TiptapEditor

              value={
                form.message
              }

              onChange={(
                value
              ) =>
                setForm({

                  ...form,

                  message:
                    value,
                })
              }
            />



            {/* SCHEDULE */}

            <TextField

              fullWidth

              type="datetime-local"

              label="Schedule Message"

              InputLabelProps={{
                shrink: true,
              }}

              sx={{
                mt: 3,
              }}

              value={
                form.scheduledAt
              }

              onChange={(e) =>
                setForm({

                  ...form,

                  scheduledAt:
                    e.target.value,
                })
              }
            />



            {/* BUTTONS */}

            <Stack
              direction="row"
              spacing={2}
              mt={4}
            >

              <Button

                variant="outlined"

                startIcon={<Save />}

                disabled={sending}

                onClick={() =>
                  handleCreate(
                    "draft"
                  )
                }
              >

                Save Draft

              </Button>



              <Button

                variant="contained"

                startIcon={<Schedule />}

                disabled={sending}

                onClick={() =>
                  handleCreate(
                    "scheduled"
                  )
                }
              >

                Schedule

              </Button>



              <Button

                variant="contained"

                color="success"

                startIcon={<Send />}

                disabled={sending}

                onClick={() =>
                  handleCreate(
                    "sent"
                  )
                }
              >

                {sending
                  ? (
                    <CircularProgress
                      size={24}
                      sx={{
                        color:
                          "#fff",
                      }}
                    />
                  )
                  : "Send Now"
                }

              </Button>

            </Stack>

          </Paper>

        </Grid>



        {/* ====================================================== */}
        {/* HISTORY */}
        {/* ====================================================== */}

        <Grid
          item
          xs={12}
          md={5}
        >

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              maxHeight: 800,
              overflow: "auto",
            }}
          >

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={3}
            >

              Message History

            </Typography>



            <Stack
              spacing={3}
            >

              {messages.map(
                (msg) => (

                  <Card
                    key={msg.id}
                    sx={{
                      borderRadius: 3,
                    }}
                  >

                    <CardContent>

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >

                        <Typography
                          fontWeight="bold"
                        >

                          {msg.subject}

                        </Typography>



                        <Chip

                          label={
                            msg.status
                          }

                          color={

                            msg.status ===
                            "sent"

                              ? "success"

                              : msg.status ===
                                "scheduled"

                              ? "warning"

                              : "default"
                          }
                        />

                      </Stack>



                      <Divider
                        sx={{
                          mb: 2,
                        }}
                      />



                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mb={1}
                      >

                        Recipients:
                        {" "}
                        {
                          msg.totalRecipients || 0
                        }

                      </Typography>



                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mb={1}
                      >

                        Success:
                        {" "}
                        {
                          msg.successCount || 0
                        }

                      </Typography>



                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mb={2}
                      >

                        Failed:
                        {" "}
                        {
                          msg.failedCount || 0
                        }

                      </Typography>



                      {msg.status !==
                        "sent" && (

                        <Button

                          fullWidth

                          variant="contained"

                          color="success"

                          startIcon={<Send />}

                          onClick={() =>
                            handleSendNow(
                              msg.id
                            )
                          }
                        >

                          Send Now

                        </Button>
                      )}

                    </CardContent>

                  </Card>
                )
              )}

            </Stack>

          </Paper>

        </Grid>

      </Grid>

    </Box>
  );
};

export default CampaignMessages;