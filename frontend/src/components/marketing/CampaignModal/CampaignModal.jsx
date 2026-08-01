import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
    Dialog, DialogContent, DialogTitle, DialogActions, Button, Box, Chip,
    CircularProgress, Stack, Typography, IconButton,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { getCampaign } from "../../../services/campaignService";
import CampaignRegistrationModal from "../../../pages/CampaignRegistrationModal"; // adjust path to match your file location

export default function CampaignModal({ open, campaignId, onClose }) {
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(false);
    const [registrationOpen, setRegistrationOpen] = useState(false);

    useEffect(() => {
        if (!open || !campaignId) return;

        const fetchCampaign = async () => {
            try {
                setLoading(true);
                const data = await getCampaign(campaignId);
                setCampaign(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaign();
    }, [open, campaignId]);

    useEffect(() => {
        if (!open) setRegistrationOpen(false);
    }, [open]);

    const hasExternalLink = !!campaign?.registrationLink;
    const needsInternalRegistration = campaign?.requiresRegistration && !hasExternalLink;

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                {loading ? (
                    <Box py={10} textAlign="center">
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                            {campaign?.title}
                            <IconButton size="small" onClick={onClose}><CloseRoundedIcon /></IconButton>
                        </DialogTitle>

                        <DialogContent dividers>
                            {campaign && (
                                <Stack spacing={3}>
                                    <Box
                                        component="img"
                                        src={campaign.imageUrl}
                                        alt={campaign.title}
                                        sx={{ width: "100%", borderRadius: 3 }}
                                    />

                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {campaign.type && <Chip label={campaign.type} color="primary" />}
                                        {campaign.featured && <Chip label="Featured" color="warning" />}
                                    </Stack>

                                    <Typography variant="body1">{campaign.description}</Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        Start: {new Date(campaign.startDate).toLocaleString()}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        End: {new Date(campaign.endDate).toLocaleString()}
                                    </Typography>

                                    <Typography variant="body2">
                                        Registration Required: {campaign.requiresRegistration ? "Yes" : "No"}
                                    </Typography>
                                </Stack>
                            )}
                        </DialogContent>

                        <DialogActions>
                            <Button onClick={onClose}>Close</Button>

                            {hasExternalLink && (
                                <Button variant="contained" href={campaign.registrationLink} target="_blank" rel="noopener noreferrer">
                                    Register
                                </Button>
                            )}

                            {needsInternalRegistration && (
                                <Button variant="contained" onClick={() => setRegistrationOpen(true)}>
                                    Register
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>

            <CampaignRegistrationModal
                open={registrationOpen}
                onClose={() => setRegistrationOpen(false)}
                campaign={campaign}
            />
        </>
    );
}

CampaignModal.propTypes = {
    open: PropTypes.bool.isRequired,
    campaignId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onClose: PropTypes.func.isRequired,
};