import React from "react";

import {
  Chip,
} from "@mui/material";

import {
  CheckCircle,
  Cancel,
  PendingActions,
  ManageAccounts,
  Autorenew,
} from "@mui/icons-material";

export default function RegistrationStatusChip({
  status,
}) {

  const config = {

    draft: {
      label: "Draft",
      color: "default",
      icon: <PendingActions />,
    },

    payment_pending: {
      label: "Payment Pending",
      color: "warning",
      icon: <PendingActions />,
    },

    submitted: {
      label: "Submitted",
      color: "success",
      icon: <CheckCircle />,
    },

    under_review: {
      label: "Under Review",
      color: "warning",
      icon: <ManageAccounts />,
    },

    processing: {
      label: "Processing",
      color: "info",
      icon: <Autorenew />,
    },

    completed: {
      label: "Completed",
      color: "success",
      icon: <CheckCircle />,
    },

    rejected: {
      label: "Rejected",
      color: "error",
      icon: <Cancel />,
    },

    cancelled: {
      label: "Cancelled",
      color: "default",
      icon: <Cancel />,
    },
  };

  const item =
    config[status] ||
    config.draft;

  return (
    <Chip
      icon={item.icon}
      label={item.label}
      color={item.color}
      size="small"
    />
  );
}