import PropTypes from "prop-types";
import CountUp from "react-countup";

import {
    Stack,
    Typography,
    Chip,
    Box,
    useTheme,
} from "@mui/material";

import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRounded from "@mui/icons-material/TrendingDownRounded";

import GlassCard from "./GlassCard";

export default function StatCard({
    icon,

    value,

    prefix = "",

    suffix = "",

    label,

    description,

    trend,

    percentage,

    glass = false,

    clickable = false,

    loading = false,

    sx = {},
}) {
    const theme = useTheme();

    return (
        <GlassCard
            clickable={clickable}
            gradient={!glass}
            sx={{
                height: "100%",
                ...sx,
            }}
        >
            <Stack spacing={2}>
                {icon && (
                    <Box
                        sx={{
                            width: 60,
                            height: 60,

                            display: "flex",

                            alignItems: "center",

                            justifyContent: "center",

                            borderRadius:
                                theme.spacingTokens.radius.round,

                            bgcolor:
                                theme.palette.secondary.main,

                            color:
                                theme.palette.common.white,
                        }}
                    >
                        {icon}
                    </Box>
                )}

                <Typography
                    variant="metric"
                >
                    {loading ? (
                        "..."
                    ) : (
                        <>
                            {prefix}

                            <CountUp
                                end={value}
                                duration={2}
                            />

                            {suffix}
                        </>
                    )}
                </Typography>

                <Typography
                    variant="cardTitle"
                >
                    {label}
                </Typography>

                {description && (
                    <Typography
                        variant="bodySmall"
                        color="text.secondary"
                    >
                        {description}
                    </Typography>
                )}

                {trend && percentage && (
                    <Chip
                        size="small"
                        icon={
                            trend === "up"
                                ? (
                                      <TrendingUpRounded />
                                  )
                                : (
                                      <TrendingDownRounded />
                                  )
                        }
                        color={
                            trend === "up"
                                ? "success"
                                : "error"
                        }
                        label={`${percentage}%`}
                        sx={{
                            width: "fit-content",
                        }}
                    />
                )}
            </Stack>
        </GlassCard>
    );
}

StatCard.propTypes = {
    icon: PropTypes.node,

    value: PropTypes.number.isRequired,

    prefix: PropTypes.string,

    suffix: PropTypes.string,

    label: PropTypes.string.isRequired,

    description: PropTypes.string,

    trend: PropTypes.oneOf([
        "up",
        "down",
    ]),

    percentage: PropTypes.number,

    glass: PropTypes.bool,

    clickable: PropTypes.bool,

    loading: PropTypes.bool,

    sx: PropTypes.object,
};