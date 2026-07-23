import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";

const statisticsData = {
    eyebrow: "Our Impact",

    title: "Transforming Lives Through Education",

    description:
        "Our commitment to educational excellence is reflected in the students we have supported, the opportunities we've created, and the partnerships we've built across the globe.",

    metrics: [
        {
            id: 1,

            value: "2,500+",

            label: "Students Supported",

            description:
                "Students guided through admissions, scholarships, and study abroad opportunities.",

            icon: <GroupsRoundedIcon />,

            color: "primary",

            order: 1,
        },

        {
            id: 2,

            value: "500+",

            label: "Scholarships Secured",

            description:
                "Successful scholarship applications facilitated for deserving students.",

            icon: <WorkspacePremiumRoundedIcon />,

            color: "success",

            order: 2,
        },

        {
            id: 3,

            value: "50+",

            label: "Partner Institutions",

            description:
                "Collaborations with universities and educational organizations worldwide.",

            icon: <SchoolRoundedIcon />,

            color: "secondary",

            order: 3,
        },

        {
            id: 4,

            value: "20+",

            label: "Countries Reached",

            description:
                "Helping students pursue education and career opportunities across multiple countries.",

            icon: <PublicRoundedIcon />,

            color: "warning",

            order: 4,
        },
    ],
};

export default statisticsData;