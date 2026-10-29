// components/live/ScheduleWebinarDialog.jsx  (dialog wrapper around the inline form)
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { WebinarScheduleForm } from "./WebinarScheduleForm";

export default function ScheduleWebinarDialog({ open, onClose, onCreated }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, color: "#0B1F3A" }}>Schedule a webinar</DialogTitle>
      <DialogContent>
        <WebinarScheduleForm resetKey={open} onCancel={onClose} onCreated={(r) => { onCreated?.(r); onClose(); }} />
      </DialogContent>
    </Dialog>
  );
}
