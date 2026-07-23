import { useEffect, useState } from "react";

import PropTypes from "prop-types";

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
    Box,
    Chip,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";

import { getCampaign } from "../../../services/campaignService";

export default function CampaignModal({
    open,
    campaignId,
    onClose,
}) {
    const [campaign, setCampaign] = useState(null);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !campaignId) return;

        const fetchCampaign = async () => {
            try {
                setLoading(true);

                const data =
                    await getCampaign(campaignId);

                setCampaign(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaign();
    }, [open, campaignId]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            {loading ? (
                <Box
                    py={10}
                    textAlign="center"
                >
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <DialogTitle>
                        {campaign?.title}
                    </DialogTitle>

                    <DialogContent dividers>
                        {campaign && (
                            <Stack spacing={3}>
                                <Box
                                    component="img"
                                    src={campaign.imageUrl}
                                    alt={campaign.title}
                                    sx={{
                                        width: "100%",
                                        borderRadius: 3,
                                    }}
                                />

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                >
                                    {campaign.type && (
                                        <Chip
                                            label={campaign.type}
                                            color="primary"
                                        />
                                    )}

                                    {campaign.featured && (
                                        <Chip
                                            label="Featured"
                                            color="warning"
                                        />
                                    )}
                                </Stack>

                                <Typography
                                    variant="body1"
                                >
                                    {campaign.description}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Start:
                                    {" "}
                                    {new Date(
                                        campaign.startDate
                                    ).toLocaleString()}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    End:
                                    {" "}
                                    {new Date(
                                        campaign.endDate
                                    ).toLocaleString()}
                                </Typography>

                                <Typography
                                    variant="body2"
                                >
                                    Registration Required:
                                    {" "}
                                    {campaign.requiresRegistration
                                        ? "Yes"
                                        : "No"}
                                </Typography>
                            </Stack>
                        )}
                    </DialogContent>

                    <DialogActions>
                        <Button
                            onClick={onClose}
                        >
                            Close
                        </Button>

                        {campaign?.registrationLink && (
                            <Button
                                variant="contained"
                                href={
                                    campaign.registrationLink
                                }
                                target="_blank"
                            >
                                Register
                            </Button>
                        )}
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}