import PropTypes from "prop-types";

import {
    Avatar,
    Box,
    Chip,
    Stack,
    Typography,
    alpha,
    useTheme,
} from "@mui/material";

import AnimatedContainer from "./AnimatedContainer";
import GlassCard from "./GlassCard";
import IconCircle from "./IconCircle";

export default function FloatingBadge({

    icon,

    avatar,

    title,

    subtitle,

    value,

    status,

    variant = "glass",

    animation = "fadeUp",

    clickable = false,

    sx = {},

}) {

    const theme = useTheme();

    return (

        <AnimatedContainer
            animation={animation}
        >

            <GlassCard

                clickable={clickable}

                glass={variant === "glass"}

                gradient={variant === "gradient"}

                sx={{

                    px:3,

                    py:2,

                    minWidth:220,

                    ...sx,

                }}

            >

                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                >

                    {icon && (
                        <IconCircle
                            variant="soft"
                            color="secondary"
                        >
                            {icon}
                        </IconCircle>
                    )}

                    {avatar && (
                        <Avatar
                            src={avatar}
                            sx={{
                                width:56,
                                height:56,
                            }}
                        />
                    )}

                    <Box flex={1}>

                        {value && (

                            <Typography
                                variant="metric"
                            >

                                {value}

                            </Typography>

                        )}

                        {title && (

                            <Typography
                                variant="cardTitle"
                            >

                                {title}

                            </Typography>

                        )}

                        {subtitle && (

                            <Typography
                                variant="bodySmall"
                                color="text.secondary"
                            >

                                {subtitle}

                            </Typography>

                        )}

                    </Box>

                    {status && (

                        <Chip

                            size="small"

                            label={status}

                            sx={{

                                bgcolor:

                                    status==="online"

                                    ? alpha(
                                        theme.palette.success.main,
                                        .15
                                      )

                                    : alpha(
                                        theme.palette.grey[600],
                                        .15
                                      ),

                                color:

                                    status==="online"

                                    ? "success.main"

                                    : "text.secondary",

                            }}

                        />

                    )}

                </Stack>

            </GlassCard>

        </AnimatedContainer>

    );

}

FloatingBadge.propTypes = {

    icon:PropTypes.node,

    avatar:PropTypes.string,

    title:PropTypes.string,

    subtitle:PropTypes.string,

    value:PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),

    status:PropTypes.string,

    variant:PropTypes.oneOf([
        "glass",
        "gradient",
        "solid",
    ]),

    animation:PropTypes.string,

    clickable:PropTypes.bool,

    sx:PropTypes.object,

};