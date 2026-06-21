import React from "react";

import {
  Chip,
} from "@mui/material";

import {
  CheckCircle,
  Error,
  HourglassEmpty,
} from "@mui/icons-material";

export default function PaymentStatusChip({
  status,
}) {

  const config = {
    pending: {
      label: "Pending",
      color: "warning",
      icon: <HourglassEmpty />,
    },

    success: {
      label: "Paid",
      color: "success",
      icon: <CheckCircle />,
    },

    failed: {
      label: "Failed",
      color: "error",
      icon: <Error />,
    },

    refunded: {
      label: "Refunded",
      color: "default",
      icon: <Error />,
    },
  };

  const item =
    config[status] ||
    config.pending;

  return (
    <Chip
      icon={item.icon}
      label={item.label}
      color={item.color}
      size="small"
    />
  );
}