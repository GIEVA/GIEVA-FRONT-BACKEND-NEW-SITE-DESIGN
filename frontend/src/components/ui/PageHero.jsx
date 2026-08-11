import PropTypes from "prop-types";

import {
    Box,
    Container,
    Stack,
    Typography,
    Grid,
    useTheme,
} from "@mui/material";

import AnimatedContainer from "./AnimatedContainer";

export default function PageHero({

    eyebrow,

    title,

    highlight,

    description,

    background = "hero",

    backgroundImage,

    overlay = true,

    align = "center",

    minHeight = "70vh",

    primaryAction,

    secondaryAction,

    badge,

    stats = [],

    children,

    sx = {},

}) {

    const theme = useTheme();

    //------------------------------------
    // Title
    //------------------------------------

    const renderTitle = () => {

        if (!highlight || !title)

            return title;

        const parts = title.split(highlight);

        return (

            <>

                {parts[0]}

                <Box
                    component="span"
                    sx={{
                        color:
                            theme.palette.secondary.main,
                    }}
                >
                    {highlight}
                </Box>

                {parts[1]}

            </>

        );

    };

    return (

        <Box

            sx={{

                position:"relative",

                display:"flex",

                alignItems:"center",

                overflow:"hidden",

                minHeight,

                background:

                    backgroundImage

                    ? `url(${backgroundImage}) center/cover`

                    : theme.gradients[background] ||

                      background,

                ...sx,

            }}

        >

            {overlay && (

                <Box

                    sx={{

                        position:"absolute",

                        inset:0,

                        bgcolor:"rgba(11,31,58,.60)",

                    }}

                />

            )}

            <Container
                maxWidth="lg"
                sx={{
                    position:"relative",
                    zIndex:2,
                }}
            >

                <Stack

                    spacing={4}

                    alignItems={

                        align==="center"

                        ? "center"

                        : align==="right"

                        ? "flex-end"

                        : "flex-start"

                    }

                    textAlign={align}

                >

                    {badge}

                    {eyebrow && (

                        <AnimatedContainer>

                            <Typography

                                variant="eyebrow"

                                color="secondary.main"

                            >

                                {eyebrow}

                            </Typography>

                        </AnimatedContainer>

                    )}

                    <AnimatedContainer delay={.15}>

                        <Typography

                            variant="hero"

                            color="common.white"

                        >

                            {renderTitle()}

                        </Typography>

                    </AnimatedContainer>

                    {description && (

                        <AnimatedContainer delay={.3}>

                            <Typography

                                variant="sectionSubtitle"

                                color="rgba(255,255,255,.85)"

                                sx={{

                                    maxWidth:720,

                                }}

                            >

                                {description}

                            </Typography>

                        </AnimatedContainer>

                    )}

                    {(primaryAction || secondaryAction) && (

                        <AnimatedContainer delay={.45}>

                            <Stack

                                direction={{

                                    xs:"column",

                                    sm:"row",

                                }}

                                spacing={2}

                            >

                                {primaryAction}

                                {secondaryAction}

                            </Stack>

                        </AnimatedContainer>

                    )}

                    {stats.length>0 && (

                        <AnimatedContainer delay={.6}>

                            <Grid
                                container
                                spacing={4}
                                justifyContent="center"
                            >

                                {stats.map((item)=>(
                                    <Grid
                                        key={item.label}
                                        size={{ xs: 6, md: 3 }}
                                    >

                                        <Stack
                                            spacing={1}
                                            alignItems="center"
                                        >

                                            <Typography
                                                variant="metric"
                                                color="common.white"
                                            >
                                                {item.value}
                                            </Typography>

                                            <Typography
                                                color="rgba(255,255,255,.75)"
                                            >
                                                {item.label}
                                            </Typography>

                                        </Stack>

                                    </Grid>
                                ))}

                            </Grid>

                        </AnimatedContainer>

                    )}

                    {children}

                </Stack>

            </Container>

        </Box>

    );

}

PageHero.propTypes={

    eyebrow:PropTypes.string,

    title:PropTypes.string,

    highlight:PropTypes.string,

    description:PropTypes.string,

    background:PropTypes.string,

    backgroundImage:PropTypes.string,

    overlay:PropTypes.bool,

    align:PropTypes.oneOf([

        "left",

        "center",

        "right",

    ]),

    minHeight:PropTypes.oneOfType([

        PropTypes.number,

        PropTypes.string,

    ]),

    primaryAction:PropTypes.node,

    secondaryAction:PropTypes.node,

    badge:PropTypes.node,

    stats:PropTypes.array,

    children:PropTypes.node,

    sx:PropTypes.object,

};