import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";

const whyChooseUsData = {
    eyebrow: "Why Choose Us",

    title: "Helping You Succeed at Every Step of Your Educational Journey",

    description:
        "At GIEVA, we combine expert guidance, global partnerships, and personalized support to help students and professionals achieve their international education and career goals with confidence.",

    image: {
        src: "/placeholders/why-choose-us.png", // TODO: Replace with Figma asset
        alt: "Education consultant guiding students",
    },

    features: [
        {
            id: 1,
            title: "Experienced Advisors",
            description:
                "Our experienced education consultants provide personalized guidance tailored to your goals.",

            icon: <SupportAgentRoundedIcon />,
        },

        {
            id: 2,
            title: "Global University Network",
            description:
                "Access opportunities through our growing network of trusted universities and international partners.",

            icon: <PublicRoundedIcon />,
        },

        {
            id: 3,
            title: "Scholarship Expertise",
            description:
                "Receive practical support in identifying and applying for competitive scholarship opportunities.",

            icon: <WorkspacePremiumRoundedIcon />,
        },

        {
            id: 4,
            title: "End-to-End Student Support",
            description:
                "From admission applications to visa preparation and post-arrival guidance, we're with you throughout the journey.",

            icon: <SchoolRoundedIcon />,
        },
    ],

    actions: [
        {
            id: 1,
            label: "Explore Our Services",
            href: "/services",
            variant: "contained",
        },

        {
            id: 2,
            label: "Contact Our Team",
            href: "/contact",
            variant: "outlined",
        },
    ],
};

export default whyChooseUsData;