import {
  Button,
} from "@mui/material";

import {
  startRecording,
  stopRecording,
} from "../../services/classSessionService";

import {
  useState,
} from "react";

export default function RecordingButton({
  sessionId,
}) {

  const [recording,
    setRecording] =
    useState(false);

  const toggleRecording =
    async () => {

      if (
        recording
      ) {

        await stopRecording(
          sessionId
        );

      } else {

        await startRecording(
          sessionId
        );
      }

      setRecording(
        !recording
      );
    };

  return (
    <Button
      color={
        recording
          ? "error"
          : "primary"
      }
      variant="contained"
      onClick={
        toggleRecording
      }
    >
      {recording
        ? "Stop Recording"
        : "Start Recording"}
    </Button>
  );
}