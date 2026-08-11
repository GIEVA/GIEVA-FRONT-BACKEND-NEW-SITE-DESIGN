import PropTypes from "prop-types";

import {
    Stack,
    Typography,
    Box,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    useTheme,
} from "@mui/material";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";

import GlassCard from "./GlassCard";
import IconCircle from "./IconCircle";

export default function FeatureCard({

    icon,

    image,

    badge,

    category,

    title,

    description,

    features = [],

    footer,

    clickable = false,

    glass = false,

    hover = true,

    sx = {},

}) {

    const theme = useTheme();

    return (

        <GlassCard

            clickable={clickable}

            hover={hover}

            gradient={!glass}

            sx={{

                height:"100%",

                display:"flex",

                flexDirection:"column",

                ...sx,

            }}

        >

            {image && (

                <Box

                    component="img"

                    src={image}

                    alt={title}

                    sx={{

                        width:"100%",

                        height:220,

                        objectFit:"cover",

                        borderRadius:

                            theme.spacingTokens.radius.md,

                        mb:3,

                    }}

                />

            )}

            <Stack

                spacing={2}

                sx={{

                    flex:1,

                }}

            >

                {badge && (

                    <Chip

                        label={badge}

                        color="secondary"

                        sx={{

                            width:"fit-content",

                        }}

                    />

                )}

                {icon && (

                    <IconCircle>

                        {icon}

                    </IconCircle>

                )}

                {category && (

                    <Typography

                        variant="eyebrow"

                        color="secondary.main"

                    >

                        {category}

                    </Typography>

                )}

                <Typography

                    variant="cardTitle"

                >

                    {title}

                </Typography>

                {description && (

                    <Typography

                        variant="body"

                        color="text.secondary"

                    >

                        {description}

                    </Typography>

                )}

                {features.length>0 && (

                    <List

                        dense

                        disablePadding

                    >

                        {features.map((feature)=>(

                            <ListItem

                                key={feature}

                                disablePadding

                                sx={{

                                    py:.4,

                                }}

                            >

                                <ListItemIcon

                                    sx={{

                                        minWidth:34,

                                    }}

                                >

                                    <CheckCircleRounded

                                        color="success"

                                        fontSize="small"

                                    />

                                </ListItemIcon>

                                <ListItemText

                                    primary={feature}

                                />

                            </ListItem>

                        ))}

                    </List>

                )}

            </Stack>

            {footer && (

                <>

                    <Divider

                        sx={{

                            my:3,

                        }}

                    />

                    {footer}
                </>

            )}

        </GlassCard>

    );

}

FeatureCard.propTypes={

    icon:PropTypes.node,

    image:PropTypes.string,

    badge:PropTypes.string,

    category:PropTypes.string,

    title:PropTypes.string.isRequired,

    description:PropTypes.string,

    features:PropTypes.arrayOf(
        PropTypes.string
    ),

    footer:PropTypes.node,

    clickable:PropTypes.bool,

    glass:PropTypes.bool,

    hover:PropTypes.bool,

    sx:PropTypes.object,

};