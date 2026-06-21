import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider,
  Chip,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Paper,
} from "@mui/material";

import {
  Verified,
  Payments,
  CheckCircle,
  Description,
  Launch,
  School,
} from "@mui/icons-material";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  getHealsAdminApplicationById,
  verifyApplicationDocuments,
  updateHealsApplicationStatus,
  sendHealsPaymentRequest,
  startHealsProcessing,
  completeHealsApplication,
  getHealsApplicationPayments,
} from "../services/healsAdminService";



const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";
const BORDER = "#E5E7EB";
const BG = "#F8FAFC";



export default function AdminHealsApplicationDetails() {

  const { id } =
    useParams();

  const [loading,
    setLoading] =
    useState(true);

  const [application,
    setApplication] =
    useState(null);

  const [payments,
    setPayments] =
    useState([]);

  const [verifyData,
    setVerifyData] =
    useState({
      passportVerified: false,
      transcriptVerified: false,
      bankStatementVerified: false,
      internalNotes: "",
    });

  const [statusData,
    setStatusData] =
    useState({
      status: "",
      note: "",
    });

  const [paymentDialog,
    setPaymentDialog] =
    useState(false);

  const [paymentData,
    setPaymentData] =
    useState({
      amount: "",
      title: "",
      description: "",
    });



  useEffect(() => {

    fetchApplication();

    fetchPayments();

  }, []);




  // =====================================================
  // FETCH APPLICATION
  // =====================================================

  const fetchApplication =
    async () => {

      try {

        const res =
          await getHealsAdminApplicationById(id);

        setApplication(res);

        setVerifyData({
          passportVerified:
            res.passportVerified,

          transcriptVerified:
            res.transcriptVerified,

          bankStatementVerified:
            res.bankStatementVerified,

          internalNotes:
            res.internalNotes || "",
        });

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);
      }
    };




  // =====================================================
  // FETCH PAYMENTS
  // =====================================================

  const fetchPayments =
    async () => {

      try {

        const res =
          await getHealsApplicationPayments(id);

        setPayments(res || []);

      } catch (err) {

        console.error(err);
      }
    };




  // =====================================================
  // VERIFY DOCUMENTS
  // =====================================================

  const handleVerify =
    async () => {

      try {

        await verifyApplicationDocuments(
          id,
          verifyData
        );

        alert(
          "Documents verified successfully"
        );

        fetchApplication();

      } catch (err) {

        alert(
          err.response?.data?.message ||
          "Verification failed"
        );
      }
    };




  // =====================================================
  // UPDATE STATUS
  // =====================================================

  const handleStatusUpdate =
    async () => {

      try {

        await updateHealsApplicationStatus(
          id,
          statusData
        );

        alert(
          "Status updated"
        );

        fetchApplication();

      } catch (err) {

        alert(
          err.response?.data?.message ||
          "Status update failed"
        );
      }
    };




  // =====================================================
  // SEND PAYMENT REQUEST
  // =====================================================

  const handleSendPaymentRequest =
    async () => {

      try {

        await sendHealsPaymentRequest(
          id,
          paymentData
        );

        alert(
          "Payment request sent"
        );

        setPaymentDialog(false);

        fetchApplication();

        fetchPayments();

      } catch (err) {

        alert(
          err.response?.data?.message ||
          "Failed to send payment request"
        );
      }
    };




  // =====================================================
  // START PROCESSING
  // =====================================================

  const handleStartProcessing =
    async () => {

      try {

        await startHealsProcessing(id);

        alert(
          "Processing started"
        );

        fetchApplication();

      } catch (err) {

        alert(
          err.response?.data?.message ||
          "Failed"
        );
      }
    };




  // =====================================================
  // COMPLETE APPLICATION
  // =====================================================

  const handleComplete =
    async () => {

      try {

        await completeHealsApplication(id);

        alert(
          "Application completed"
        );

        fetchApplication();

      } catch (err) {

        alert(
          err.response?.data?.message ||
          "Failed"
        );
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




  return (

    <Box
      p={{
        xs: 2,
        md: 4,
      }}

      sx={{
        background: BG,
        minHeight: "100vh",
      }}
    >

      {/* HERO */}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 5,
          mb: 4,

          background:
            "linear-gradient(135deg, #0B1F3A, #1E7F4F)",

          color: "#fff",
        }}
      >

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}

          justifyContent="space-between"
          spacing={3}
        >

          <Box>

            <Typography
              variant="h4"
              fontWeight={800}
            >
              {application.fullName}
            </Typography>

            <Typography sx={{ opacity: 0.9 }}>
              {application.applicationCode}
            </Typography>

          </Box>

          <Chip
            label={application.status}

            sx={{
              bgcolor: "#fff",
              color: NAVY,
              fontWeight: 700,
            }}
          />

        </Stack>

      </Paper>




      <Grid
        container
        spacing={4}
      >

        {/* LEFT */}

        <Grid item xs={12} lg={8}>

          {/* PERSONAL */}

          <Card
            elevation={0}
            sx={{
              borderRadius: 5,
              border: `1px solid ${BORDER}`,
              mb: 4,
            }}
          >

            <CardContent sx={{ p: 4 }}>

              <Typography
                variant="h6"
                fontWeight={800}
                mb={3}
              >
                Applicant Information
              </Typography>

              <Grid container spacing={3}>

                <Grid item xs={12} md={6}>
                  <Typography fontWeight={700}>
                    Email
                  </Typography>

                  <Typography color="text.secondary">
                    {application.email}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography fontWeight={700}>
                    Phone
                  </Typography>

                  <Typography color="text.secondary">
                    {application.phone}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography fontWeight={700}>
                    Country
                  </Typography>

                  <Typography color="text.secondary">
                    {application.desiredCountry}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography fontWeight={700}>
                    Field
                  </Typography>

                  <Typography color="text.secondary">
                    {application.fieldOfStudy}
                  </Typography>
                </Grid>

              </Grid>

            </CardContent>

          </Card>




          {/* DOCUMENTS */}

          <Card
            elevation={0}
            sx={{
              borderRadius: 5,
              border: `1px solid ${BORDER}`,
              mb: 4,
            }}
          >

            <CardContent sx={{ p: 4 }}>

              <Typography
                variant="h6"
                fontWeight={800}
                mb={3}
              >
                Documents
              </Typography>

              <Grid container spacing={2}>

                {[
                  {
                    title: "Passport",
                    url: application.passportUrl,
                  },

                  {
                    title: "Transcript",
                    url: application.transcriptUrl,
                  },

                  {
                    title: "SOP",
                    url: application.sopUrl,
                  },

                  {
                    title: "Recommendation",
                    url: application.recommendationUrl,
                  },

                  {
                    title: "Bank Statement",
                    url: application.bankStatementUrl,
                  },
                ].map((doc) => (

                  doc.url && (

                    <Grid
                      item
                      xs={12}
                      md={6}
                      key={doc.title}
                    >

                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 3,
                        }}
                      >

                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >

                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                          >

                            <Avatar
                              sx={{
                                bgcolor: "#EEF2FF",
                                color: NAVY,
                              }}
                            >
                              <Description />
                            </Avatar>

                            <Typography fontWeight={700}>
                              {doc.title}
                            </Typography>

                          </Stack>

                          <Button
                            href={doc.url}
                            target="_blank"
                            endIcon={<Launch />}
                          >
                            Open
                          </Button>

                        </Stack>

                      </Paper>

                    </Grid>
                  )
                ))}

              </Grid>

            </CardContent>

          </Card>




          {/* PAYMENTS */}

          <Card
            elevation={0}
            sx={{
              borderRadius: 5,
              border: `1px solid ${BORDER}`,
            }}
          >

            <CardContent sx={{ p: 4 }}>

              <Typography
                variant="h6"
                fontWeight={800}
                mb={3}
              >
                Payment History
              </Typography>

              <Stack spacing={2}>

                {payments.map((payment) => (

                  <Paper
                    key={payment.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 3,
                    }}
                  >

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                    >

                      <Box>

                        <Typography fontWeight={700}>
                          {payment.title}
                        </Typography>

                        <Typography
                          color="text.secondary"
                        >
                          ₦{payment.amount}
                        </Typography>

                      </Box>

                      <Chip
                        label={payment.status}
                        color={
                          payment.status === "success"
                            ? "success"
                            : "warning"
                        }
                      />

                    </Stack>

                  </Paper>

                ))}

              </Stack>

            </CardContent>

          </Card>

        </Grid>




        {/* RIGHT */}

        <Grid item xs={12} lg={4}>

          {/* VERIFY */}

          <Card
            elevation={0}
            sx={{
              borderRadius: 5,
              border: `1px solid ${BORDER}`,
              mb: 4,
            }}
          >

            <CardContent sx={{ p: 4 }}>

              <Typography
                variant="h6"
                fontWeight={800}
                mb={3}
              >
                Verify Documents
              </Typography>

              <Stack spacing={2}>

                <TextField
                  select
                  label="Passport"
                  value={
                    verifyData.passportVerified
                  }
                  onChange={(e) =>
                    setVerifyData({
                      ...verifyData,
                      passportVerified:
                        e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">
                    Verified
                  </MenuItem>

                  <MenuItem value="false">
                    Rejected
                  </MenuItem>
                </TextField>



                <TextField
                  select
                  label="Transcript"
                  value={
                    verifyData.transcriptVerified
                  }
                  onChange={(e) =>
                    setVerifyData({
                      ...verifyData,
                      transcriptVerified:
                        e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">
                    Verified
                  </MenuItem>

                  <MenuItem value="false">
                    Rejected
                  </MenuItem>
                </TextField>



                <TextField
                  select
                  label="Bank Statement"
                  value={
                    verifyData.bankStatementVerified
                  }
                  onChange={(e) =>
                    setVerifyData({
                      ...verifyData,
                      bankStatementVerified:
                        e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">
                    Verified
                  </MenuItem>

                  <MenuItem value="false">
                    Rejected
                  </MenuItem>
                </TextField>



                <TextField
                  multiline
                  rows={4}
                  label="Internal Notes"
                  value={
                    verifyData.internalNotes
                  }
                  onChange={(e) =>
                    setVerifyData({
                      ...verifyData,
                      internalNotes:
                        e.target.value,
                    })
                  }
                />



                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Verified />}
                  onClick={handleVerify}
                  sx={{
                    bgcolor: NAVY,
                  }}
                >
                  Verify Documents
                </Button>

              </Stack>

            </CardContent>

          </Card>




          {/* STATUS */}

          <Card
            elevation={0}
            sx={{
              borderRadius: 5,
              border: `1px solid ${BORDER}`,
              mb: 4,
            }}
          >

            <CardContent sx={{ p: 4 }}>

              <Typography
                variant="h6"
                fontWeight={800}
                mb={3}
              >
                Update Status
              </Typography>

              <Stack spacing={2}>

                <TextField
                  select
                  label="Status"
                  value={
                    statusData.status
                  }
                  onChange={(e) =>
                    setStatusData({
                      ...statusData,
                      status:
                        e.target.value,
                    })
                  }
                >

                  <MenuItem value="under_review">
                    Under Review
                  </MenuItem>

                  <MenuItem value="info_requested">
                    Info Requested
                  </MenuItem>

                  <MenuItem value="approved">
                    Approved
                  </MenuItem>

                  <MenuItem value="rejected">
                    Rejected
                  </MenuItem>

                  <MenuItem value="processing">
                    Processing
                  </MenuItem>

                  <MenuItem value="completed">
                    Completed
                  </MenuItem>

                </TextField>



                <TextField
                  multiline
                  rows={4}
                  label="Admin Note"
                  value={
                    statusData.note
                  }
                  onChange={(e) =>
                    setStatusData({
                      ...statusData,
                      note:
                        e.target.value,
                    })
                  }
                />



                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={handleStatusUpdate}
                >
                  Update Status
                </Button>

              </Stack>

            </CardContent>

          </Card>




          {/* ACTIONS */}

          <Card
            elevation={0}
            sx={{
              borderRadius: 5,
              border: `1px solid ${BORDER}`,
            }}
          >

            <CardContent sx={{ p: 4 }}>

              <Typography
                variant="h6"
                fontWeight={800}
                mb={3}
              >
                Workflow Actions
              </Typography>

              <Stack spacing={2}>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Payments />}
                  sx={{
                    bgcolor: GOLD,
                    color: "#000",
                  }}
                  onClick={() =>
                    setPaymentDialog(true)
                  }
                >
                  Send Payment Request
                </Button>



                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<School />}
                  sx={{
                    bgcolor: GREEN,
                  }}
                  onClick={handleStartProcessing}
                >
                  Start Processing
                </Button>



                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<CheckCircle />}
                  sx={{
                    bgcolor: NAVY,
                  }}
                  onClick={handleComplete}
                >
                  Mark Completed
                </Button>

              </Stack>

            </CardContent>

          </Card>

        </Grid>

      </Grid>




      {/* PAYMENT DIALOG */}

      <Dialog
        open={paymentDialog}
        onClose={() =>
          setPaymentDialog(false)
        }
        fullWidth
        maxWidth="sm"
      >

        <DialogTitle>
          Send Payment Request
        </DialogTitle>

        <DialogContent>

          <Stack spacing={3} mt={2}>

            <TextField
              label="Amount"
              type="number"
              fullWidth
              value={paymentData.amount}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  amount:
                    e.target.value,
                })
              }
            />



            <TextField
              label="Title"
              fullWidth
              value={paymentData.title}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  title:
                    e.target.value,
                })
              }
            />



            <TextField
              multiline
              rows={4}
              label="Description"
              fullWidth
              value={paymentData.description}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  description:
                    e.target.value,
                })
              }
            />

          </Stack>

        </DialogContent>

        <DialogActions>

          <Button
            onClick={() =>
              setPaymentDialog(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSendPaymentRequest}
            sx={{
              bgcolor: NAVY,
            }}
          >
            Send Request
          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
}