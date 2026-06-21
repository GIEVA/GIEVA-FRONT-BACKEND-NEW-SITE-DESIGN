import { Chip } from "@mui/material";

const statusColors = {
  draft: "default",
  submitted: "info",
  under_review: "warning",
  approved_for_payment: "secondary",
  paid: "success",
  processing: "primary",
  completed: "success",
  rejected: "error",
  info_requested: "warning",
};

export default function ApplicationStatusChip({
  status,
}) {

  return (
    <Chip
      label={
        status?.replaceAll(
          "_",
          " "
        ) || "unknown"
      }

      color={
        statusColors[status] ||
        "default"
      }

      sx={{
        textTransform:
          "capitalize",

        fontWeight: 700,
      }}
    />
  );
}