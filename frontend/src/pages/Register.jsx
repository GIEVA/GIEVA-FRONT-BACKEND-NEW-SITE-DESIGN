import { useState } from "react";

import {
  useNavigate,
  Link,
} from "react-router-dom";

import {
  registerUser,
} from "../services/auth";

import {

  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  MenuItem,
  InputAdornment,

} from "@mui/material";

import {
  Person,
  Email,
  Lock,
  Badge,
} from "@mui/icons-material";

import {
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";



const Register = () => {

  const [form,
    setForm] = useState({

      fullName: "",

      email: "",

      password: "",

      confirmPassword: "",

      role: "student",
    });



  const [loading,
    setLoading] =
    useState(false);

  const [error,
    setError] =
    useState("");

  const [message,
    setMessage] =
    useState("");

    const [showPassword,
  setShowPassword] =
  useState(false);



  const navigate =
    useNavigate();



  // ======================================================
  // HANDLE CHANGE
  // ======================================================

  const handleChange =
    (e) => {

      setForm({

        ...form,

        [e.target.name]:
          e.target.value,
      });
    };



  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setError("");

      setMessage("");



      // ======================================================
      // VALIDATION
      // ======================================================

      if (

        !form.fullName ||

        !form.email ||

        !form.password ||

        !form.role
      ) {

        return setError(
          "All fields are required"
        );
      }



      if (
        !/\S+@\S+\.\S+/.test(
          form.email
        )
      ) {

        return setError(
          "Enter a valid email address"
        );
      }



      if (
        form.password.length < 6
      ) {

        return setError(
          "Password must be at least 6 characters"
        );
      }



      if (
        form.password !==
        form.confirmPassword
      ) {

        return setError(
          "Passwords do not match"
        );
      }



      try {

        setLoading(true);



        const payload = {

          fullName:
            form.fullName,

          email:
            form.email,

          password:
            form.password,

          role:
            form.role,
        };



        const res =
          await registerUser(
            payload
          );



        setMessage(

          res.message ||

          "Account created successfully"
        );



        setTimeout(() => {

          navigate("/login");

        }, 2000);

      } catch (err) {

        setError(

          err.response?.data?.message ||

          "Something went wrong"
        );

      } finally {

        setLoading(false);
      }
    };



  return (

    <Box
      sx={{

        minHeight: "100vh",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        bgcolor: "#F5F7FA",

        px: 2,
      }}
    >

      <Paper
        elevation={4}

        sx={{

          width: "100%",

          maxWidth: 460,

          p: 4,

          borderRadius: 4,
        }}
      >

        {/* HEADER */}

        <Box
          textAlign="center"
          mb={4}
        >

          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
          >
            Create Account
          </Typography>

          <Typography
            color="text.secondary"
          >
            Join the GIEVA learning platform
          </Typography>

        </Box>



        {/* ALERTS */}

        {error && (

          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}



        {message && (

          <Alert
            severity="success"
            sx={{ mb: 2 }}
          >
            {message}
          </Alert>
        )}



        {/* FORM */}

        <Box
          component="form"
          onSubmit={
            handleSubmit
          }
        >

          {/* FULL NAME */}

          <TextField

            fullWidth

            margin="normal"

            label="Full Name"

            name="fullName"

            value={form.fullName}

            onChange={handleChange}

            InputProps={{

              startAdornment: (

                <InputAdornment
                  position="start"
                >
                  <Person />
                </InputAdornment>
              ),
            }}
          />



          {/* EMAIL */}

          <TextField

            fullWidth

            margin="normal"

            label="Email Address"

            type="email"

            name="email"

            value={form.email}

            onChange={handleChange}

            InputProps={{

              startAdornment: (

                <InputAdornment
                  position="start"
                >
                  <Email />
                </InputAdornment>
              ),
            }}
          />



          {/* ROLE */}

          <TextField

            select

            fullWidth

            margin="normal"

            label="Register As"

            name="role"

            value={form.role}

            onChange={handleChange}

            InputProps={{

              startAdornment: (

                <InputAdornment
                  position="start"
                >
                  <Badge />
                </InputAdornment>
              ),
            }}
          >

            <MenuItem
              value="student"
            >
              Student
            </MenuItem>

            <MenuItem
              value="tutor"
            >
              Tutor
            </MenuItem>

            <MenuItem
              value="applicant"
            >
              Applicant
            </MenuItem>

          </TextField>



          {/* PASSWORD */}

         <TextField

            fullWidth

            margin="normal"

            label="Password"

            type={
              showPassword
                ? "text"
                : "password"
            }

            name="password"

            value={form.password}

            onChange={handleChange}

            InputProps={{

              startAdornment: (

                <InputAdornment
                  position="start"
                >
                  <Lock />
                </InputAdornment>
              ),



              endAdornment: (

                <InputAdornment
                  position="end"
                >

                  <Button

                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }

                    sx={{

                      minWidth: "auto",

                      p: 0,

                      color:
                        "text.secondary",
                    }}
                  >

                    {showPassword
                      ? <VisibilityOff />
                      : <Visibility />
                    }

                  </Button>

                </InputAdornment>
              ),
            }}
          />



          {/* CONFIRM PASSWORD */}

          <TextField

            fullWidth

            margin="normal"

            label="Confirm Password"

            type="password"

            name="confirmPassword"

            value={
              form.confirmPassword
            }

            onChange={handleChange}

            InputProps={{

              startAdornment: (

                <InputAdornment
                  position="start"
                >
                  <Lock />
                </InputAdornment>
              ),
            }}
          />



          {/* SUBMIT */}

          <Button

            fullWidth

            variant="contained"

            type="submit"

            disabled={loading}

            sx={{

              mt: 4,

              py: 1.5,

              borderRadius: 3,

              fontWeight: "bold",

              fontSize: "1rem",

              bgcolor: "#1E7F4F",

              "&:hover": {

                bgcolor: "#145A32",
              },
            }}
          >

            {loading ? (

              <CircularProgress
                size={24}
                sx={{
                  color: "#fff",
                }}
              />

            ) : (

              "Create Account"
            )}

          </Button>

        </Box>



        {/* FOOTER */}

        <Typography

          variant="body2"

          textAlign="center"

          mt={3}

          color="text.secondary"
        >

          Already have an account?{" "}

          <Link
            to="/login"

            style={{

              color: "#1E7F4F",

              fontWeight: 600,

              textDecoration:
                "none",
            }}
          >
            Sign in
          </Link>

        </Typography>

      </Paper>

    </Box>
  );
};

export default Register;