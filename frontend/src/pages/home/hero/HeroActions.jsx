import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";
import { Stack, Box } from "@mui/material";
import { motion } from "framer-motion";

import PrimaryButton from "../../../components/ui/PrimaryButton";
import SecondaryButton from "../../../components/ui/SecondaryButton";

const buttonContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
};

const buttonItem = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function HeroActions({
    primary,
    secondary,
    tertiary,
    direction = { xs: "column", sm: "row" },
    spacing = 2,
    sx = {},
}) {
    const renderButton = (action, ButtonComponent, defaultColor) => {
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
            color,
            variant = "contained",
        } = action;

        const commonProps = {
            startIcon,
            endIcon,
            disabled,
            loading,
            onClick,
            size: "large",
            color: color || defaultColor,
            variant,
            sx: {
                whiteSpace: "nowrap",
                minWidth: { xs: "100%", sm: "auto" },
            },
        };

        const buttonEl = href ? (
            external ? (
                <ButtonComponent {...commonProps} component="a" href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                </ButtonComponent>
            ) : (
                <ButtonComponent {...commonProps} component={RouterLink} to={href}>
                    {label}
                </ButtonComponent>
            )
        ) : (
            <ButtonComponent {...commonProps}>{label}</ButtonComponent>
        );

        return <motion.div variants={buttonItem}>{buttonEl}</motion.div>;
    };

    return (
        <motion.div variants={buttonContainer} initial="hidden" animate="show">
            <Stack spacing={2} sx={sx}>
                {renderButton(primary, PrimaryButton, "warning")}

                {(secondary || tertiary) && (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: "100%" }}>
                        {renderButton(secondary, SecondaryButton, "secondary")}
                        {renderButton(tertiary, SecondaryButton, "success")}
                    </Stack>
                )}
            </Stack>
        </motion.div>
    );
}

HeroActions.propTypes = {
    primary: PropTypes.object,
    secondary: PropTypes.object,
    tertiary: PropTypes.object,
    direction: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    spacing: PropTypes.number,
    sx: PropTypes.object,
};

// import PropTypes from "prop-types";
// import { Link as RouterLink } from "react-router-dom";
// import { Stack, Box } from "@mui/material";

// import PrimaryButton from "../../../components/ui/PrimaryButton";
// import SecondaryButton from "../../../components/ui/SecondaryButton";

// export default function HeroActions({
//     primary,
//     secondary,
//     tertiary,
//     direction = { xs: "column", sm: "row" },
//     spacing = 2,
//     sx = {},
// }) {
//     const renderButton = (action, ButtonComponent, defaultColor) => {
//         if (!action) return null;

//         const {
//             label,
//             href,
//             external = false,
//             startIcon,
//             endIcon,
//             loading,
//             disabled,
//             onClick,
//             color,
//             variant = "contained",
//         } = action;

//         const commonProps = {
//             startIcon,
//             endIcon,
//             disabled,
//             loading,
//             onClick,
//             size: "large",
//             color: color || defaultColor,
//             variant,
//             sx: {
//                 whiteSpace: "nowrap",
//                 minWidth: { xs: "100%", sm: "auto" },
//             },
//         };

//         if (href) {
//             if (external) {
//                 return (
//                     <ButtonComponent
//                         {...commonProps}
//                         component="a"
//                         href={href}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                     >
//                         {label}
//                     </ButtonComponent>
//                 );
//             }

//             return (
//                 <ButtonComponent
//                     {...commonProps}
//                     component={RouterLink}
//                     to={href}
//                 >
//                     {label}
//                 </ButtonComponent>
//             );
//         }

//         return <ButtonComponent {...commonProps}>{label}</ButtonComponent>;
//     };

//     return (
//         <Stack spacing={2} sx={sx}>
//             {/* Primary button full width on mobile, natural width on desktop */}
//             {renderButton(primary, PrimaryButton, "warning")}

//             {/* Secondary + Tertiary side by side */}
//             {(secondary || tertiary) && (
//                 <Stack
//                     direction={{ xs: "column", sm: "row" }}
//                     spacing={2}
//                     sx={{ width: "100%" }}
//                 >
//                     {renderButton(secondary, SecondaryButton, "secondary")}
//                     {renderButton(tertiary, SecondaryButton, "success")}
//                 </Stack>
//             )}
//         </Stack>
//     );
// }

// HeroActions.propTypes = {
//     primary: PropTypes.object,
//     secondary: PropTypes.object,
//     tertiary: PropTypes.object,
//     direction: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
//     spacing: PropTypes.number,
//     sx: PropTypes.object,
// };