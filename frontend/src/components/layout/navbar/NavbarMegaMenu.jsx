import { useState } from "react";
import PropTypes from "prop-types";

import {
    Box,
    ClickAwayListener,
    Divider,
    Grid,
    Paper,
    Popover,
    Stack,
    Typography,
} from "@mui/material";

import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";

import NavbarItem from "./NavbarItem";
import FeatureCard from "../../ui/FeatureCard";
import PrimaryButton from "../../ui/PrimaryButton";

export default function NavbarMegaMenu({
    item,
}) {
    const [anchorEl, setAnchorEl] = useState(null);

    const open = Boolean(anchorEl);

    return (
        <ClickAwayListener
            onClickAway={() => setAnchorEl(null)}
        >
            <Box>
                <Box
                    onMouseEnter={(e) =>
                        setAnchorEl(e.currentTarget)
                    }
                    onMouseLeave={() =>
                        setAnchorEl(null)
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
                    onClose={() =>
                        setAnchorEl(null)
                    }
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                    }}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "left",
                    }}
                    slotProps={{
                        paper: {
                            sx: {
                                mt: 2,
                                p: 4,
                                width: 900,
                                borderRadius: 4,
                            },
                        },
                    }}
                >
                    <Grid
                        container
                        spacing={4}
                    >
                        <Grid
                            size={{ xs: 12, md: 8 }}
                        >
                            <Grid
                                container
                                spacing={4}
                            >
                                {item.sections?.map(
                                    (
                                        section
                                    ) => (
                                        <Grid
                                            key={
                                                section.title
                                            }
                                            size={{ xs: 12, sm: 6 }}
                                        >
                                            <Stack
                                                spacing={2}
                                            >
                                                <Typography
                                                    variant="eyebrow"
                                                >
                                                    {
                                                        section.title
                                                    }
                                                </Typography>

                                                <Divider />

                                                {section.items.map(
                                                    (
                                                        link
                                                    ) => (
                                                        <NavbarItem
                                                            key={
                                                                link.id
                                                            }
                                                            item={
                                                                link
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
                                        </Grid>
                                    )
                                )}
                            </Grid>
                        </Grid>

                        <Grid
                            size={{ xs: 12, md: 4 }}
                        >
                            {item.featured && (
                                <FeatureCard
                                    title={
                                        item
                                            .featured
                                            .title
                                    }
                                    description={
                                        item
                                            .featured
                                            .description
                                    }
                                    image={
                                        item
                                            .featured
                                            .image
                                    }
                                    footer={
                                        <PrimaryButton
                                            fullWidth
                                        >
                                            {
                                                item
                                                    .featured
                                                    .button
                                            }
                                        </PrimaryButton>
                                    }
                                />
                            )}
                        </Grid>
                    </Grid>
                </Popover>
            </Box>
        </ClickAwayListener>
    );
}

NavbarMegaMenu.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        sections: PropTypes.array,
        featured: PropTypes.object,
    }).isRequired,
};