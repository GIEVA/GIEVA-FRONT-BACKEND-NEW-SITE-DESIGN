import PropTypes from "prop-types";

import {
    AppBar,
    Box,
    Container,
    IconButton,
    Toolbar,
    useMediaQuery,
    useTheme,
} from "@mui/material";

import MenuRounded from "@mui/icons-material/MenuRounded";

import NavbarBrand from "./NavbarBrand";
import NavbarLinks from "./NavbarLinks";
import NavbarActions from "./NavbarActions";
import NavbarMobile from "./NavbarMobile";

import useNavbar from "../../../hooks/useNavbar";

export default function Navbar({

    navigation,

    brand,

    actions,

    sticky = true,

    transparent = false,

}) {

    const theme = useTheme();

    const mobile = useMediaQuery(
        theme.breakpoints.down("lg")
    );

    const {

        mobileOpen,

        openMobile,

        closeMobile,

        scrolled,

    } = useNavbar();

    return (

        <>

            <AppBar

                position={
                    sticky
                        ? "sticky"
                        : "static"
                }

                elevation={
                    scrolled ? 4 : 0
                }

                color="transparent"

                sx={{

                    backdropFilter:
                        scrolled
                            ? "blur(16px)"
                            : "none",

                    bgcolor:
                        transparent && !scrolled
                            ? "transparent"
                            : "background.paper",

                    transition:
                        theme.transitions.create(
                            [
                                "background-color",
                                "box-shadow",
                                "backdrop-filter",
                            ]
                        ),

                }}

            >

                <Container maxWidth="xl">

                    <Toolbar
                        disableGutters
                        sx={{
                            minHeight: 80,
                        }}
                    >

                        {brand}

                        <Box sx={{ flexGrow: 1 }} />

                        {mobile ? (

                            <IconButton
                                onClick={openMobile}
                            >
                                <MenuRounded />
                            </IconButton>

                        ) : (

                            <>

                                <NavbarLinks
                                    navigation={navigation}
                                />

                                <Box
                                    sx={{
                                        width: 32,
                                    }}
                                />

                                {actions}

                            </>

                        )}

                    </Toolbar>

                </Container>

            </AppBar>

            <NavbarMobile

                open={mobileOpen}

                onClose={closeMobile}

                navigation={navigation}

                brand={brand}

                actions={actions}

            />

        </>

    );

}

Navbar.propTypes = {

    navigation:
        PropTypes.array.isRequired,

    brand:
        PropTypes.node.isRequired,

    actions:
        PropTypes.node,

    sticky:
        PropTypes.bool,

    transparent:
        PropTypes.bool,

};