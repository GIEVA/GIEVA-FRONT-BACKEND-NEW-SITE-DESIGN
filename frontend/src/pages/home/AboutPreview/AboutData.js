import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";

const aboutData = {
    eyebrow: "About Us",

    title: "Empowering Students Through Global Educational Opportunities",

    description:
        "We are committed to helping students unlock international opportunities through admissions support, scholarships, mentorship, career development, and trusted educational partnerships.",

    image: {
        src: "/placeholders/about-preview.png", // TODO: Replace with Figma image
        alt: "Students learning together",
    },

    features: [
        {
            id: 1,
            title: "Global Opportunities",
            description:
                "Connect with universities and organizations across the world.",
            icon: <PublicRoundedIcon />,
        },
        {
            id: 2,
            title: "Scholarship Support",
            description:
                "Personalized guidance for competitive scholarship applications.",
            icon: <EmojiEventsRoundedIcon />,
        },
        {
            id: 3,
            title: "Expert Mentorship",
            description:
                "Learn from experienced mentors and education consultants.",
            icon: <GroupsRoundedIcon />,
        },
        {
            id: 4,
            title: "Trusted Guidance",
            description:
                "Reliable support throughout every stage of your journey.",
            icon: <CheckCircleRoundedIcon />,
        },
    ],

    actions: {
        primary: {
            label: "Learn More",
            href: "/about",
        },

        secondary: {
            label: "Contact Us",
            href: "/contact",
        },
    },
};

export default aboutData;