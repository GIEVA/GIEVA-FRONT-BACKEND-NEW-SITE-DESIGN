import PropTypes from "prop-types";

import {
    Box,
    Container,
    Divider,
    Grid,
    Stack,
} from "@mui/material";

import FooterBrand from "./FooterBrand";
import FooterBottom from "./FooterBottom";
import FooterColumn from "./FooterColumn";
import FooterNewsletter from "./FooterNewsletter";
import FooterSocial from "./FooterSocial";

export default function Footer({
    brand,
    navigation = [],
    socialLinks = [],
    newsletter,
    bottom,
    maxWidth = "xl",
    sx = {},
}) {
    return (
        <Box
            component="footer"
            sx={{
                bgcolor: "background.paper",
                borderTop: 1,
                borderColor: "divider",
                mt: "auto",
                ...sx,
            }}
        >
            <Container
                maxWidth={maxWidth}
                sx={{
                    py: {
                        xs: 6,
                        md: 8,
                    },
                }}
            >
                <Grid
                    container
                    spacing={6}
                >
                    {/* Brand */}
                    <Grid
                        size={{
                            xs: 12,
                            md: 4,
                        }}
                    >
                        <Stack spacing={3}>
                            <FooterBrand {...brand} />

                            {socialLinks.length > 0 && (
                                <FooterSocial
                                    items={socialLinks}
                                />
                            )}
                        </Stack>
                    </Grid>

                    {/* Navigation */}
                    <Grid
                        size={{
                            xs: 12,
                            md: 5,
                        }}
                    >
                        <Grid
                            container
                            spacing={4}
                        >
                            {navigation.map(
                                (section) => (
                                    <Grid
                                        key={section.id}
                                        size={{
                                            xs: 6,
                                            sm: 4,
                                        }}
                                    >
                                        <FooterColumn
                                            {...section}
                                        />
                                    </Grid>
                                )
                            )}
                        </Grid>
                    </Grid>

                    {/* Newsletter */}
                    <Grid
                        size={{
                            xs: 12,
                            md: 3,
                        }}
                    >
                        {newsletter && (
                            <FooterNewsletter
                                {...newsletter}
                            />
                        )}
                    </Grid>
                </Grid>

                <Divider
                    sx={{
                        my: 5,
                    }}
                />

                <FooterBottom
                    {...bottom}
                />
            </Container>
        </Box>
    );
}

Footer.propTypes = {
    brand: PropTypes.object,

    navigation: PropTypes.array,

    socialLinks: PropTypes.array,

    newsletter: PropTypes.object,

    bottom: PropTypes.object,

    maxWidth: PropTypes.oneOf([
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        false,
    ]),

    sx: PropTypes.object,
};