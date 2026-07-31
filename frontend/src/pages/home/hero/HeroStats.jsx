import PropTypes from "prop-types";
import { Grid } from "@mui/material";
import { motion } from "framer-motion";

import StatCard from "../../../components/ui/StatCard";

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export default function HeroStats({
    stats = [],
    columns = { xs: 1, sm: 2, md: 3 },
    spacing = 3,
    variant = "glass",
    sx = {},
}) {
    if (!stats.length) return null;

    return (
        <motion.div variants={container} initial="hidden" animate="show" style={{ width: "100%" }}>
            <Grid container spacing={spacing} sx={sx}>
                {stats.map((stat, index) => (
                    <Grid key={stat.id ?? index} size={{ xs: 12, sm: 6, md: 12 / columns.md }}>
                        <motion.div variants={item}>
                            <StatCard
                                value={stat.value}
                                label={stat.label}
                                description={stat.description}
                                icon={stat.icon}
                                variant={variant}
                            />
                        </motion.div>
                    </Grid>
                ))}
            </Grid>
        </motion.div>
    );
}

HeroStats.propTypes = {
    stats: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            label: PropTypes.string.isRequired,
            description: PropTypes.string,
            icon: PropTypes.node,
        })
    ),
    columns: PropTypes.shape({ xs: PropTypes.number, sm: PropTypes.number, md: PropTypes.number }),
    spacing: PropTypes.number,
    variant: PropTypes.oneOf(["default", "glass", "outlined", "filled"]),
    sx: PropTypes.object,
};


// import PropTypes from "prop-types";

// import {
//     Grid,
// } from "@mui/material";


// import StatCard from "../../../components/ui/StatCard";

// export default function HeroStats({
//     stats = [],
//     columns = {
//         xs: 1,
//         sm: 2,
//         md: 3,
//     },
//     spacing = 3,
//     variant = "glass",
//     sx = {},
// }) {
//     if (!stats.length) return null;

//     return (
//         <Grid
//             container
//             spacing={spacing}
//             sx={sx}
//         >
//             {stats.map((stat, index) => (
//                 <Grid
//                     key={stat.id ?? index}
//                     size={{
//                         xs: 12,
//                         sm: 6,
//                         md: 12 / columns.md,
//                     }}
//                 >
//                     <StatCard
//                         value={stat.value}
//                         label={stat.label}
//                         description={stat.description}
//                         icon={stat.icon}
//                         variant={variant}
//                     />
//                 </Grid>
//             ))}
//         </Grid>
//     );
// }

// HeroStats.propTypes = {
//     stats: PropTypes.arrayOf(
//         PropTypes.shape({
//             id: PropTypes.oneOfType([
//                 PropTypes.string,
//                 PropTypes.number,
//             ]),

//             value: PropTypes.oneOfType([
//                 PropTypes.string,
//                 PropTypes.number,
//             ]).isRequired,

//             label: PropTypes.string.isRequired,

//             description: PropTypes.string,

//             icon: PropTypes.node,
//         })
//     ),

//     columns: PropTypes.shape({
//         xs: PropTypes.number,
//         sm: PropTypes.number,
//         md: PropTypes.number,
//     }),

//     spacing: PropTypes.number,

//     variant: PropTypes.oneOf([
//         "default",
//         "glass",
//         "outlined",
//         "filled",
//     ]),

//     sx: PropTypes.object,
// };