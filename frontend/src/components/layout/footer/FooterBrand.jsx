import PropTypes from "prop-types";
import { Box, Chip, Stack, Typography } from "@mui/material";

export default function FooterBrand({
    logo,
    name,
    description,
    badges = [],
    action,
    align = "left",
    maxWidth = 380,
    sx = {},
}) {
    const isCentered = align === "center";

    return (
        <Stack
            spacing={3}
            alignItems={isCentered ? "center" : "flex-start"}
            textAlign={isCentered ? "center" : "left"}
            sx={{
                maxWidth,
                ...sx,
            }}
        >
            {/* Logo */}
            {logo && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isCentered
                            ? "center"
                            : "flex-start",
                    }}
                >
                    {logo}
                </Box>
            )}

            {/* Brand Name */}
            {name && (
                <Typography
                    variant="h5"
                    component="h2"
                    fontWeight={700}
                >
                    {name}
                </Typography>
            )}

            {/* Description */}
            {description && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        lineHeight: 1.8,
                    }}
                >
                    {description}
                </Typography>
            )}

            {/* Badges */}
            {badges.length > 0 && (
                <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    justifyContent={
                        isCentered
                            ? "center"
                            : "flex-start"
                    }
                >
                    {badges.map((badge, index) => {
                        if (typeof badge === "string") {
                            return (
                                <Chip
                                    key={index}
                                    label={badge}
                                    size="small"
                                    variant="outlined"
                                />
                            );
                        }

                        return (
                            <Box key={index}>
                                {badge}
                            </Box>
                        );
                    })}
                </Stack>
            )}

            {/* CTA */}
            {action && (
                <Box>
                    {action}
                </Box>
            )}
        </Stack>
    );
}

FooterBrand.propTypes = {
    /**
     * Logo component or image
     */
    logo: PropTypes.node,

    /**
     * Brand name
     */
    name: PropTypes.string,

    /**
     * Short company description
     */
    description: PropTypes.string,

    /**
     * Array of badges.
     * Supports strings or React nodes.
     */
    badges: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.node,
        ])
    ),

    /**
     * Optional CTA
     */
    action: PropTypes.node,

    /**
     * Content alignment
     */
    align: PropTypes.oneOf([
        "left",
        "center",
    ]),

    /**
     * Maximum width
     */
    maxWidth: PropTypes.number,

    sx: PropTypes.object,
};