import { Stack } from "@mui/material";

import PrimaryButton from "../../ui/PrimaryButton";
import SecondaryButton from "../../ui/SecondaryButton";

export default function ActionGroup({
    actions = [],
    direction = {
        xs: "column",
        sm: "row",
    },
    spacing = 2,
}) {
    return (
        <Stack
            direction={direction}
            spacing={spacing}
        >
            {actions.map(action => {
                const Button =
                    action.variant === "outlined"
                        ? SecondaryButton
                        : PrimaryButton;

                return (
                    <Button
                        key={action.id}
                        href={action.href}
                        startIcon={action.icon}
                    >
                        {action.label}
                    </Button>
                );
            })}
        </Stack>
    );
}