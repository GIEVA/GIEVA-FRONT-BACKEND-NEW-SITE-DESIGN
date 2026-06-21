import {
  Menu,
  MenuItem,
} from "@mui/material";

const REACTIONS = [
  "👏",
  "👍",
  "❤️",
  "🔥",
  "🎉",
  "🙌",
];

export default function ReactionMenu({
  anchorEl,
  open,
  onClose,
  onSelect,
}) {

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
    >
      {REACTIONS.map(
        (emoji) => (
          <MenuItem
            key={emoji}
            onClick={() => {
              onSelect(
                emoji
              );
              onClose();
            }}
          >
            {emoji}
          </MenuItem>
        )
      )}
    </Menu>
  );
}