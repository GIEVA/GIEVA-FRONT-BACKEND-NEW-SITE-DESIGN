import {
  Drawer,
  Typography,
} from "@mui/material";

export default function WhiteboardDrawer({
  open,
  onClose,
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
    >
      <Typography p={3}>
        Whiteboard Coming Soon
      </Typography>
    </Drawer>
  );
}