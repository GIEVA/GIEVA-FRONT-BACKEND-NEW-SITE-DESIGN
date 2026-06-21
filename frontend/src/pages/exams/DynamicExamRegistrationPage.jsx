import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";

import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
} from "@mui/material";

import {
  EXAM_FORMS,
} from "../../constants/examForms";

import {
  EXAM_PRICES,
} from "../../constants/examPrices";

import {
  createRegistration,
  initializeExamPayment,
} from "../../services/examService";

const setNestedValue = (obj, path, value) => {
  const keys = path.split(".");
  const clone = JSON.parse(JSON.stringify(obj));

  let current = clone;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }

    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;

  return clone;
};

const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
};

export default function DynamicExamRegistrationPage() {
  const { examType } = useParams();

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config = EXAM_FORMS[examType];

  const amount = useMemo(() => {
    return typeof EXAM_PRICES[examType] === "number"
      ? EXAM_PRICES[examType]
      : 0;
  }, [examType]);

  if (!config) {
    return (
      <Alert severity="error">
        Invalid Exam Type
      </Alert>
    );
  }

  const handleChange = (path, value) => {
    setFormData((prev) =>
      setNestedValue(prev, path, value)
    );
  };

  const validateForm = () => {
    const requiredFields = config.sections.flatMap((section) =>
      section.fields.filter((field) => field.required)
    );

    for (const field of requiredFields) {
      const value = getNestedValue(formData, field.name);

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return `${field.label} is required`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    try {
      setError("");

      const validationError = validateForm();

      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);

      const registration = await createRegistration(
        examType,
        formData
      );

      const payment = await initializeExamPayment(
        registration.registration.id
      );

      if (payment?.authorization_url) {
        window.location.href =
          payment.authorization_url;
      } else {
        setError(
          "Unable to initialize payment."
        );
      }
    } catch (error) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 1000,
        mx: "auto",
        py: 4,
        px: 2,
      }}
    >
      <Typography
        variant="h4"
        fontWeight={700}
        gutterBottom
      >
        {config.title}
      </Typography>

      <Typography
        color="text.secondary"
        mb={4}
      >
        Complete your registration form.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          p: 3,
          mb: 4,
        }}
      >
        <Typography variant="h6">
          Registration Fee
        </Typography>

        <Typography
          variant="h4"
          color="primary"
        >
          ₦{amount.toLocaleString()}
        </Typography>
      </Paper>

      {config.sections.map((section) => (
        <Paper
          key={section.title}
          sx={{
            p: 3,
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
          >
            {section.title}
          </Typography>

          <Stack spacing={2}>
            {section.fields.map((field) => {
              const value =
                getNestedValue(
                  formData,
                  field.name
                ) || "";

              if (
                field.type === "select"
              ) {
                return (
                  <TextField
                    key={field.name}
                    select
                    label={field.label}
                    value={value}
                    onChange={(e) =>
                      handleChange(
                        field.name,
                        e.target.value
                      )
                    }
                    required={
                      field.required
                    }
                    fullWidth
                  >
                    {field.options?.map(
                      (option) => (
                        <MenuItem
                          key={option}
                          value={option}
                        >
                          {option}
                        </MenuItem>
                      )
                    )}
                  </TextField>
                );
              }

              if (
                field.type ===
                "textarea"
              ) {
                return (
                  <TextField
                    key={field.name}
                    label={field.label}
                    value={value}
                    onChange={(e) =>
                      handleChange(
                        field.name,
                        e.target.value
                      )
                    }
                    required={
                      field.required
                    }
                    multiline
                    rows={4}
                    fullWidth
                  />
                );
              }

              return (
                <TextField
                  key={field.name}
                  label={field.label}
                  type={
                    field.type ||
                    "text"
                  }
                  value={value}
                  onChange={(e) =>
                    handleChange(
                      field.name,
                      e.target.value
                    )
                  }
                  required={
                    field.required
                  }
                  fullWidth
                />
              );
            })}
          </Stack>
        </Paper>
      ))}

      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading
          ? "Processing..."
          : "Proceed To Payment"}
      </Button>
    </Box>
  );
}