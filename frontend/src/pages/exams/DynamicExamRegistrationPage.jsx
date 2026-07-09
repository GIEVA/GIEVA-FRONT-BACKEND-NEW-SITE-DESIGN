// pages/DynamicExamRegistrationForm.jsx
//
// Route: /exam-register/:examType
// Replaces all the static per-exam form pages (ExamRegistrationForm.jsx
// with its hardcoded SAT/IELTS/ACT etc. switch-cases).
//
// How it works:
//   1. Fetch the exam's fieldSchema from GET /api/exam-types/:examType
//   2. Render each field dynamically based on field.type
//   3. On submit, POST to the existing exam registration endpoint
//      with { examType, formData: {...}, priceVariant?, amount }

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Container, Typography, Paper, Grid, TextField,
  MenuItem, Button, CircularProgress, Alert, Chip,
  Divider, Stepper, Step, StepLabel,
} from "@mui/material";
import { submitExamRegistration } from "../../services/examRegistrationService";
import { getExamType } from "../../services/examTypeService";

const GREEN = "#1E7F4F";
const NAVY  = "#0B1F3A";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 })
    .format(amount);

// ─── Single dynamic field ─────────────────────────────────────
const DynamicField = ({ field, value, onChange, error }) => {
  const common = {
    fullWidth:    true,
    label:        field.label,
    value:        value || "",
    onChange:     (e) => onChange(field.key, e.target.value),
    required:     field.required,
    error:        !!error,
    helperText:   error || field.helperText || "",
    placeholder:  field.placeholder || "",
    sx:           { "& fieldset": { borderColor: "#E6E9F0" } },
  };

  if (field.type === "select") {
    return (
      <TextField {...common} select>
        {(field.options || []).map((opt) => (
          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
        ))}
      </TextField>
    );
  }

  if (field.type === "textarea") {
    return <TextField {...common} multiline rows={3} />;
  }

  const typeMap = {
    text: "text", email: "email", tel: "tel",
    date: "date", number: "number",
  };

  return (
    <TextField
      {...common}
      type={typeMap[field.type] || "text"}
      InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
    />
  );
};

// ─── Variant price selector (for ACT, SEVIS, etc.) ────────────
const VariantPriceSelector = ({ variants, selected, onSelect }) => (
  <Box mb={3}>
    <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1.5, color: NAVY }}>
      Select Package
    </Typography>
    <Grid container spacing={1.5}>
      {variants.map((v) => (
        <Grid item xs={12} sm={6} key={v.key}>
          <Paper
            onClick={() => onSelect(v)}
            variant="outlined"
            sx={{
              p: 2, cursor: "pointer", borderRadius: 2.5, transition: "all 0.15s",
              borderColor:  selected?.key === v.key ? GREEN : "#E6E9F0",
              bgcolor:      selected?.key === v.key ? `${GREEN}0f` : "#fff",
              "&:hover": { borderColor: GREEN },
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{v.label}</Typography>
            <Typography sx={{ color: GREEN, fontWeight: 800, fontSize: 15 }}>
              {formatPrice(v.price)}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </Box>
);

// ─── Main Form ────────────────────────────────────────────────
export default function DynamicExamRegistrationForm() {
  const { examType } = useParams();
  const navigate      = useNavigate();

  const [exam,         setExam]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [formData,     setFormData]     = useState({});
  const [fieldErrors,  setFieldErrors]  = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState("");

  useEffect(() => {
    getExamType(examType)
      .then(({ exam }) => {
        setExam(exam);
        // Auto-select first variant if applicable
        if (exam.pricingType === "variants" && exam.priceVariants?.length > 0)
          setSelectedVariant(exam.priceVariants[0]);
      })
      .catch(() => setError("Exam not found or no longer available."))
      .finally(() => setLoading(false));
  }, [examType]);

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));

    // Live price update for variant-linked select fields (e.g. ACT's testVariant)
    if (exam?.pricingType === "variants") {
      const variantField = exam.fieldSchema.find(
        (f) => f.type === "select" && f.key === key
      );
      if (variantField) {
        const match = exam.priceVariants.find((v) => v.key === value);
        if (match) setSelectedVariant(match);
      }
    }
  };

  const validate = () => {
    const errors = {};
    for (const field of exam.fieldSchema) {
      if (field.required && !formData[field.key]?.toString().trim()) {
        errors[field.key] = `${field.label} is required`;
      }
    }
    if (exam.pricingType === "variants" && !selectedVariant) {
      errors._variant = "Please select a package";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const amount = exam.pricingType === "flat"
      ? Number(exam.flatPrice)
      : selectedVariant.price;

    try {
      setSubmitting(true);
      setSubmitError("");

      const res = await submitExamRegistration({
        examType:     exam.examType,
        examTypeId:   exam.id,
        formData,
        priceVariant: selectedVariant?.key || null,
        amount,
      });

      navigate(`/exam-register/payment/${res.registration.id}`, {
        state: { registration: res.registration, amount },
      });
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: GREEN }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        <Button onClick={() => navigate("/exam-register")} sx={{ mt: 2, color: GREEN }}>
          ← Back to catalog
        </Button>
      </Container>
    );
  }

  // Group fields by section
  const sections = exam.fieldSchema.reduce((acc, field) => {
    const sec = field.section || "Details";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(field);
    return acc;
  }, {});

  const displayPrice = exam.pricingType === "flat"
    ? formatPrice(exam.flatPrice)
    : selectedVariant
      ? formatPrice(selectedVariant.price)
      : `From ${formatPrice(Math.min(...exam.priceVariants.map((v) => v.price)))}`;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Header */}
      <Box mb={4}>
        <Button onClick={() => navigate("/exam-register")}
          sx={{ mb: 2, color: NAVY, textTransform: "none", pl: 0 }}>
          ← Back to catalog
        </Button>
        <Typography variant="h4" fontWeight={800}>{exam.title} Registration</Typography>
        <Typography color="text.secondary" mt={0.5}>{exam.description}</Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Form */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0}
            component="form" onSubmit={handleSubmit}
            sx={{ border: "1px solid #E6E9F0", borderRadius: 3, p: 3 }}>

            {/* Variant selector (ACT, SEVIS etc.) */}
            {exam.pricingType === "variants" && (
              <>
                <VariantPriceSelector
                  variants={exam.priceVariants}
                  selected={selectedVariant}
                  onSelect={setSelectedVariant}
                />
                {fieldErrors._variant && (
                  <Typography sx={{ color: "#ef4444", fontSize: 12, mt: -2, mb: 2 }}>
                    {fieldErrors._variant}
                  </Typography>
                )}
                <Divider sx={{ mb: 3 }} />
              </>
            )}

            {/* Dynamic sections */}
            {Object.entries(sections).map(([sectionName, fields]) => (
              <Box key={sectionName} mb={3}>
                <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#64748B",
                                   textTransform: "uppercase", letterSpacing: 0.8, mb: 2 }}>
                  {sectionName}
                </Typography>
                <Grid container spacing={2}>
                  {fields.map((field) => (
                    <Grid item xs={12} sm={field.type === "textarea" ? 12 : 6} key={field.key}>
                      <DynamicField
                        field={field}
                        value={formData[field.key]}
                        onChange={setField}
                        error={fieldErrors[field.key]}
                      />
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ mt: 3 }} />
              </Box>
            ))}

            {submitError && (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{submitError}</Alert>
            )}

            <Button type="submit" fullWidth variant="contained" disabled={submitting}
              sx={{ bgcolor: NAVY, color: "#fff", textTransform: "none", fontWeight: 700,
                    borderRadius: 2.5, py: 1.5, mt: 1,
                    "&:hover": { bgcolor: GREEN } }}>
              {submitting
                ? <CircularProgress size={20} color="inherit" />
                : `Proceed to Payment — ${displayPrice}`}
            </Button>
          </Paper>
        </Grid>

        {/* Price summary sidebar */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0}
            sx={{ border: "1px solid #E6E9F0", borderRadius: 3, p: 3, position: "sticky", top: 24 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 16, mb: 2 }}>Order Summary</Typography>

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography sx={{ color: "#64748B" }}>Exam</Typography>
              <Typography sx={{ fontWeight: 700 }}>{exam.title}</Typography>
            </Box>

            {selectedVariant && (
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography sx={{ color: "#64748B" }}>Package</Typography>
                <Typography sx={{ fontWeight: 700 }}>{selectedVariant.label}</Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontWeight: 700 }}>Total</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: 18, color: GREEN }}>
                {displayPrice}
              </Typography>
            </Box>

            <Typography sx={{ fontSize: 12, color: "#64748B", mt: 2, lineHeight: 1.6 }}>
              You will be redirected to our secure payment gateway after submitting your details.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}


// import React, { useState, useMemo } from "react";
// import { useParams } from "react-router-dom";

// import {
//   Box,
//   Paper,
//   Stack,
//   Typography,
//   TextField,
//   Button,
//   MenuItem,
//   Alert,
// } from "@mui/material";

// import {
//   EXAM_FORMS,
// } from "../../constants/examForms";

// import {
//   EXAM_PRICES,
// } from "../../constants/examPrices";

// import {
//   createRegistration,
//   initializeExamPayment,
// } from "../../services/examService";

// const setNestedValue = (obj, path, value) => {
//   const keys = path.split(".");
//   const clone = JSON.parse(JSON.stringify(obj));

//   let current = clone;

//   for (let i = 0; i < keys.length - 1; i++) {
//     if (!current[keys[i]]) {
//       current[keys[i]] = {};
//     }

//     current = current[keys[i]];
//   }

//   current[keys[keys.length - 1]] = value;

//   return clone;
// };

// const getNestedValue = (obj, path) => {
//   return path.split(".").reduce((acc, key) => acc?.[key], obj);
// };

// export default function DynamicExamRegistrationPage() {
//   const { examType } = useParams();

//   const [formData, setFormData] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const config = EXAM_FORMS[examType];

//   const amount = useMemo(() => {
//     return typeof EXAM_PRICES[examType] === "number"
//       ? EXAM_PRICES[examType]
//       : 0;
//   }, [examType]);

//   if (!config) {
//     return (
//       <Alert severity="error">
//         Invalid Exam Type
//       </Alert>
//     );
//   }

//   const handleChange = (path, value) => {
//     setFormData((prev) =>
//       setNestedValue(prev, path, value)
//     );
//   };

//   const validateForm = () => {
//     const requiredFields = config.sections.flatMap((section) =>
//       section.fields.filter((field) => field.required)
//     );

//     for (const field of requiredFields) {
//       const value = getNestedValue(formData, field.name);

//       if (
//         value === undefined ||
//         value === null ||
//         value === ""
//       ) {
//         return `${field.label} is required`;
//       }
//     }

//     return null;
//   };

//   const handleSubmit = async () => {
//     try {
//       setError("");

//       const validationError = validateForm();

//       if (validationError) {
//         setError(validationError);
//         return;
//       }

//       setLoading(true);

//       const registration = await createRegistration(
//         examType,
//         formData
//       );

//       const payment = await initializeExamPayment(
//         registration.registration.id
//       );

//       if (payment?.authorization_url) {
//         window.location.href =
//           payment.authorization_url;
//       } else {
//         setError(
//           "Unable to initialize payment."
//         );
//       }
//     } catch (error) {
//       console.error(error);

//       setError(
//         error?.response?.data?.message ||
//           "Registration failed"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Box
//       sx={{
//         maxWidth: 1000,
//         mx: "auto",
//         py: 4,
//         px: 2,
//       }}
//     >
//       <Typography
//         variant="h4"
//         fontWeight={700}
//         gutterBottom
//       >
//         {config.title}
//       </Typography>

//       <Typography
//         color="text.secondary"
//         mb={4}
//       >
//         Complete your registration form.
//       </Typography>

//       {error && (
//         <Alert
//           severity="error"
//           sx={{ mb: 3 }}
//         >
//           {error}
//         </Alert>
//       )}

//       <Paper
//         sx={{
//           p: 3,
//           mb: 4,
//         }}
//       >
//         <Typography variant="h6">
//           Registration Fee
//         </Typography>

//         <Typography
//           variant="h4"
//           color="primary"
//         >
//           ₦{amount.toLocaleString()}
//         </Typography>
//       </Paper>

//       {config.sections.map((section) => (
//         <Paper
//           key={section.title}
//           sx={{
//             p: 3,
//             mb: 3,
//           }}
//         >
//           <Typography
//             variant="h6"
//             gutterBottom
//           >
//             {section.title}
//           </Typography>

//           <Stack spacing={2}>
//             {section.fields.map((field) => {
//               const value =
//                 getNestedValue(
//                   formData,
//                   field.name
//                 ) || "";

//               if (
//                 field.type === "select"
//               ) {
//                 return (
//                   <TextField
//                     key={field.name}
//                     select
//                     label={field.label}
//                     value={value}
//                     onChange={(e) =>
//                       handleChange(
//                         field.name,
//                         e.target.value
//                       )
//                     }
//                     required={
//                       field.required
//                     }
//                     fullWidth
//                   >
//                     {field.options?.map(
//                       (option) => (
//                         <MenuItem
//                           key={option}
//                           value={option}
//                         >
//                           {option}
//                         </MenuItem>
//                       )
//                     )}
//                   </TextField>
//                 );
//               }

//               if (
//                 field.type ===
//                 "textarea"
//               ) {
//                 return (
//                   <TextField
//                     key={field.name}
//                     label={field.label}
//                     value={value}
//                     onChange={(e) =>
//                       handleChange(
//                         field.name,
//                         e.target.value
//                       )
//                     }
//                     required={
//                       field.required
//                     }
//                     multiline
//                     rows={4}
//                     fullWidth
//                   />
//                 );
//               }

//               return (
//                 <TextField
//                   key={field.name}
//                   label={field.label}
//                   type={
//                     field.type ||
//                     "text"
//                   }
//                   value={value}
//                   onChange={(e) =>
//                     handleChange(
//                       field.name,
//                       e.target.value
//                     )
//                   }
//                   required={
//                     field.required
//                   }
//                   fullWidth
//                 />
//               );
//             })}
//           </Stack>
//         </Paper>
//       ))}

//       <Button
//         variant="contained"
//         size="large"
//         fullWidth
//         disabled={loading}
//         onClick={handleSubmit}
//       >
//         {loading
//           ? "Processing..."
//           : "Proceed To Payment"}
//       </Button>
//     </Box>
//   );
// }