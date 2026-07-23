import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";

import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Stack,
    Typography,
} from "@mui/material";

import MenuRounded from "@mui/icons-material/MenuRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";

export default function NavbarMobile({
    open,
    onClose,
    navigation = [],
    brand,
    actions,
}) {
    return (
        <Drawer
            anchor="left"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: 320,
                },
            }}
        >
            {/* Header */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ p: 2 }}
            >
                {brand}

                <IconButton
                    onClick={onClose}
                >
                    <CloseRounded />
                </IconButton>
            </Stack>

            <Divider />

            {/* Navigation */}

            <List disablePadding>
                {navigation.map((item) => {
                    if (
                        item.children?.length
                    ) {
                        return (
                            <Accordion
                                key={item.id}
                                disableGutters
                                elevation={0}
                            >
                                <AccordionSummary
                                    expandIcon={
                                        <ExpandMoreRounded />
                                    }
                                >
                                    <Typography>
                                        {item.label}
                                    </Typography>
                                </AccordionSummary>

                                <AccordionDetails>
                                    <List
                                        disablePadding
                                    >
                                        {item.children.map(
                                            (
                                                child
                                            ) => (
                                                <ListItemButton
                                                    key={
                                                        child.id
                                                    }
                                                    component={
                                                        RouterLink
                                                    }
                                                    to={
                                                        child.path
                                                    }
                                                    onClick={
                                                        onClose
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={
                                                            child.label
                                                        }
                                                    />
                                                </ListItemButton>
                                            )
                                        )}
                                    </List>
                                </AccordionDetails>
                            </Accordion>
                        );
                    }

                    return (
                        <ListItemButton
                            key={item.id}
                            component={
                                RouterLink
                            }
                            to={item.path}
                            onClick={
                                onClose
                            }
                        >
                            <ListItemText
                                primary={
                                    item.label
                                }
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            <Box sx={{ flexGrow: 1 }} />

            <Divider />

            <Box sx={{ p: 2 }}>
                {actions}
            </Box>
        </Drawer>
    );
}

NavbarMobile.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    navigation: PropTypes.array,
    brand: PropTypes.node,
    actions: PropTypes.node,
};