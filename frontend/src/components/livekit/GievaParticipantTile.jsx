import {
  useRoomContext,
} from "@livekit/components-react";

import {
  Avatar,
  Box,
  Typography,
  Stack,
} from "@mui/material";

export default function GievaParticipantTile() {

  const room =
    useRoomContext();

  const participants =
    Array.from(
      room.remoteParticipants.values()
    );

  const localParticipant =
    room.localParticipant;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        p: 3,
      }}
    >
      {/* Local User */}

      <Box
        sx={{
          width: 300,
          height: 220,
          bgcolor: "#1e293b",
          borderRadius: 3,
          p: 2,
          color: "#fff",
        }}
      >
        <Stack
          alignItems="center"
          spacing={2}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
            }}
          />

          <Typography
            fontWeight="bold"
          >
            {localParticipant.name ||
              localParticipant.identity}
          </Typography>

          <Typography
            variant="body2"
          >
            You
          </Typography>
        </Stack>
      </Box>

      {/* Remote Participants */}

      {participants.map(
        (participant) => {

          let metadata = {};

          try {
            metadata =
              participant.metadata
                ? JSON.parse(
                    participant.metadata
                  )
                : {};
          } catch {
            metadata = {};
          }

          return (
            <Box
              key={
                participant.sid
              }
              sx={{
                width: 300,
                height: 220,
                bgcolor:
                  "#1e293b",
                borderRadius: 3,
                p: 2,
                color: "#fff",
              }}
            >
              <Stack
                alignItems="center"
                spacing={2}
              >
                <Avatar
                  src={
                    metadata.avatar
                  }
                  sx={{
                    width: 80,
                    height: 80,
                  }}
                />

                <Typography
                  fontWeight="bold"
                >
                  {participant.name ||
                    participant.identity}
                </Typography>

                <Typography
                  variant="body2"
                >
                  {metadata.role ||
                    "Participant"}
                </Typography>
              </Stack>
            </Box>
          );
        }
      )}
    </Box>
  );
}