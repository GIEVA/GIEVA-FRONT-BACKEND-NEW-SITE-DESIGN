import { useState } from "react";
import { loginUser } from "../services/auth";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  //const [loading, setLoading] = useState(false);

  const { login } = useAuth();

const [loading,
  setLoading] =
  useState(false);

const [showPassword,
  setShowPassword] =
  useState(false);

const navigate =
  useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      

      

      const res = await loginUser(form);


   login(res.user);

alert("Login successful");

const role =
  res.user?.role;

if (
  role === "admin" ||
  role === "superadmin"
) {

  navigate("/admin/dashboard");

} else if (
  role === "tutor"
) {

  navigate("/tutor/dashboard");

} else {

  navigate("/student/dashboard");
}
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
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
        bgcolor: "#f9fafb",
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 4,
          borderRadius: 3,
        }}
      >
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h5" fontWeight="bold">
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Login to continue your learning journey
          </Typography>
        </Box>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            margin="normal"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <TextField

            fullWidth

            label="Password"

            type={
              showPassword
                ? "text"
                : "password"
            }

            margin="normal"

            value={form.password}

            onChange={(e) =>
              setForm({
                ...form,
                password:
                  e.target.value,
              })
            }

            InputProps={{

              endAdornment: (

                <InputAdornment
                  position="end"
                >

                  <IconButton

                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }

                    edge="end"
                  >

                    {showPassword
                      ? <VisibilityOff />
                      : <Visibility />
                    }

                  </IconButton>

                </InputAdornment>
              ),
            }}
          />

          {/* Forgot Password */}
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              mb: 2,
              cursor: "pointer",
              color: "#1E7F4F",
              textAlign: "right",
            }}
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </Typography>

          {/* Button */}
          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
            sx={{
              py: 1.5,
              bgcolor: "#1E7F4F",
              "&:hover": {
                bgcolor: "#145A32",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : (
              "Login"
            )}
          </Button>
        </Box>

        {/* Footer */}
        <Typography
          variant="body2"
          textAlign="center"
          mt={3}
          color="text.secondary"
        >
          Don’t have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#1E7F4F",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Create one
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;