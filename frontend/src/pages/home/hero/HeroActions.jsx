import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";

import {
    Stack,
} from "@mui/material";

import PrimaryButton from "../../../components/ui/PrimaryButton";
import SecondaryButton from "../../../components/ui/SecondaryButton";


export default function HeroActions({
    primary,
    secondary,
    tertiary,
    direction = {
        xs: "column",
        sm: "row",
    },
    spacing = 2,
    sx = {},
}) {
    const renderButton = (
        action,
        ButtonComponent
    ) => {
        if (!action) return null;

        const {
            label,
            href,
            external = false,
            startIcon,
            endIcon,
            loading,
            disabled,
            onClick,
        } = action;

        const commonProps = {
            startIcon,
            endIcon,
            disabled,
            loading,
            onClick,
            size: "large",
        };

        if (href) {
            if (external) {
                return (
                    <ButtonComponent
                        {...commonProps}
                        component="a"
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {label}
                    </ButtonComponent>
                );
            }

            return (
                <ButtonComponent
                    {...commonProps}
                    component={RouterLink}
                    to={href}
                >
                    {label}
                </ButtonComponent>
            );
        }

        return (
            <ButtonComponent
                {...commonProps}
            >
                {label}
            </ButtonComponent>
        );
    };

    return (
        <Stack
            direction={direction}
            spacing={spacing}
            sx={sx}
        >
            {renderButton(
                primary,
                PrimaryButton
            )}

            {renderButton(
                secondary,
                SecondaryButton
            )}

            {tertiary &&
                renderButton(
                    tertiary,
                    SecondaryButton
                )}
        </Stack>
    );
}

HeroActions.propTypes = {
    primary: PropTypes.object,

    secondary: PropTypes.object,

    tertiary: PropTypes.object,

    direction: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
    ]),

    spacing: PropTypes.number,

    sx: PropTypes.object,
};