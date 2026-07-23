import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import FlightTakeoffRoundedIcon from "@mui/icons-material/FlightTakeoffRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";

const serviceData = [
    {
        id: 1,
        title: "Study Abroad",
        description:
            "Comprehensive admission support for undergraduate and postgraduate studies in leading universities worldwide.",

        icon: <SchoolRoundedIcon />,

        image: "/placeholders/service-study-abroad.png", // TODO: Replace with Figma asset

        href: "/services/study-abroad",

        featured: true,

        category: "Education",

        order: 1,
    },

    {
        id: 2,
        title: "Scholarship Guidance",
        description:
            "Receive expert guidance on identifying, preparing, and applying for fully funded scholarship opportunities.",

        icon: <WorkspacePremiumRoundedIcon />,

        image: "/placeholders/service-scholarship.png", // TODO

        href: "/services/scholarships",

        featured: true,

        category: "Scholarships",

        order: 2,
    },

    {
        id: 3,
        title: "Visa Assistance",
        description:
            "Professional support through visa documentation, interview preparation, and travel processes.",

        icon: <FlightTakeoffRoundedIcon />,

        image: "/placeholders/service-visa.png", // TODO

        href: "/services/visa",

        featured: true,

        category: "Travel",

        order: 3,
    },

    {
        id: 4,
        title: "Exam Preparation",
        description:
            "Preparation classes and resources for IELTS, TOEFL, GRE, GMAT, SAT, PTE, and other international examinations.",

        icon: <MenuBookRoundedIcon />,

        image: "/placeholders/service-exams.png", // TODO

        href: "/services/exams",

        featured: false,

        category: "Training",

        order: 4,
    },

    {
        id: 5,
        title: "Career Development",
        description:
            "Career coaching, CV reviews, interview preparation, and professional development for global opportunities.",

        icon: <PsychologyRoundedIcon />,

        image: "/placeholders/service-career.png", // TODO

        href: "/services/career",

        featured: false,

        category: "Career",

        order: 5,
    },

    {
        id: 6,
        title: "Student Support",
        description:
            "Ongoing mentoring and personalized support before departure and throughout your academic journey.",

        icon: <SupportAgentRoundedIcon />,

        image: "/placeholders/service-support.png", // TODO

        href: "/services/support",

        featured: false,

        category: "Support",

        order: 6,
    },
];

export default serviceData;