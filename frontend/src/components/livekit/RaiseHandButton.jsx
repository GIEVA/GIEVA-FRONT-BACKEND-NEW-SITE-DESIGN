import {
  Button,
} from "@mui/material";

export default function RaiseHandButton({
  room,
}) {

  const raiseHand =
    async () => {

      await room.localParticipant.setAttributes(
        {
          raisedHand:
            "true",
        }
      );
    };

  return (
    <Button
      variant="contained"
      onClick={raiseHand}
    >
      ✋ Raise Hand
    </Button>
  );
}