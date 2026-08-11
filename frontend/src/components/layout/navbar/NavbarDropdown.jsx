import { useState } from "react";
import PropTypes from "prop-types";

import {
    Box,
    ClickAwayListener,
    Grow,
    Paper,
    Popover,
    Stack,
} from "@mui/material";

import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";

import NavbarItem from "./NavbarItem";

export default function NavbarDropdown({
    item,
}) {
    const [anchorEl, setAnchorEl] =
        useState(null);

    const open =
        Boolean(anchorEl);

    const handleOpen = (event) => {
        setAnchorEl(
            event.currentTarget
        );
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <ClickAwayListener
            onClickAway={handleClose}
        >
            <Box>
                <Box
                    onMouseEnter={
                        handleOpen
                    }
                    onMouseLeave={
                        handleClose
                    }
                >
                    <NavbarItem
                        item={item}
                        endIcon={
                            <KeyboardArrowDownRounded />
                        }
                    />
                </Box>

                <Popover
                    open={open}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    disableRestoreFocus
                    anchorOrigin={{
                        vertical:
                            "bottom",
                        horizontal:
                            "left",
                    }}
                    transformOrigin={{
                        vertical:
                            "top",
                        horizontal:
                            "left",
                    }}
                    slotProps={{
                        paper: {
                            elevation: 0,
                            sx: {
                                mt: 1,
                                overflow:
                                    "visible",
                                borderRadius: 3,
                            },
                        },
                    }}
                >
                    <Grow
                        in={open}
                    >
                        <Paper>
                            <Stack
                                sx={{
                                    minWidth:
                                        260,

                                    py: 1,
                                }}
                            >
                                {item.children?.map(
                                    (
                                        child
                                    ) => (
                                        <NavbarItem
                                            key={
                                                child.id
                                            }
                                            item={
                                                child
                                            }
                                            sx={{
                                                justifyContent:
                                                    "flex-start",
                                                width: "100%",
                                            }}
                                        />
                                    )
                                )}
                            </Stack>
                        </Paper>
                    </Grow>
                </Popover>
            </Box>
        </ClickAwayListener>
    );
}

NavbarDropdown.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.string
            .isRequired,
        label:
            PropTypes.string
                .isRequired,
        children:
            PropTypes.array,
    }).isRequired,
};