import { useState } from "react";
import PropTypes from "prop-types";

import {
    Alert,
    Box,
    CircularProgress,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import PrimaryButton from "../../ui/PrimaryButton";

export default function FooterNewsletter({
    title = "Stay Updated",
    description = "Subscribe to receive updates, scholarship opportunities and important announcements.",
    placeholder = "Enter your email",
    buttonText = "Subscribe",
    privacyText = "We respect your privacy. Unsubscribe at any time.",
    onSubmit,
    sx = {},
}) {
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);

    const [success, setSuccess] = useState("");

    const [error, setError] = useState("");

    const validateEmail = (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSuccess("");
        setError("");

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setLoading(true);

            if (onSubmit) {
                await onSubmit(email);
            }

            setSuccess(
                "Thank you! You've successfully subscribed."
            );

            setEmail("");
        } catch (err) {
            setError(
                err?.message ||
                    "Subscription failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack
            spacing={3}
            component="form"
            onSubmit={handleSubmit}
            sx={{
                maxWidth: 420,
                ...sx,
            }}
        >
            <Box>
                <Typography
                    variant="h5"
                    fontWeight={700}
                    gutterBottom
                >
                    {title}
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {description}
                </Typography>
            </Box>

            <TextField
                fullWidth
                type="email"
                value={email}
                placeholder={placeholder}
                onChange={(e) =>
                    setEmail(e.target.value)
                }
            />

            <PrimaryButton
                fullWidth
                type="submit"
                disabled={loading}
            >
                {loading ? (
                    <CircularProgress
                        size={22}
                    />
                ) : (
                    buttonText
                )}
            </PrimaryButton>

            {success && (
                <Alert severity="success">
                    {success}
                </Alert>
            )}

            {error && (
                <Alert severity="error">
                    {error}
                </Alert>
            )}

            <Typography
                variant="caption"
                color="text.secondary"
            >
                {privacyText}
            </Typography>
        </Stack>
    );
}

FooterNewsletter.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    placeholder: PropTypes.string,
    buttonText: PropTypes.string,
    privacyText: PropTypes.string,
    onSubmit: PropTypes.func,
    sx: PropTypes.object,
};