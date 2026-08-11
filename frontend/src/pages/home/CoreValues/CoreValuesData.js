import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import NearMeRoundedIcon from "@mui/icons-material/NearMeRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";

const coreValuesData = {
    eyebrow: "WHAT MAKES US GIEVA",
    title: "Our Core Values",
    description:
        "Global Integrated Education Volunteers Association (GIEVA) is a youth-focused NGO that empowers young people through education, innovation, and international engagement.",

    cards: [
        {
            id: 1,
            icon: <VisibilityRoundedIcon sx={{ fontSize: 32 }} />,
            title: "Our Vision",
            description:
                "A world where every youth has the opportunity to lead, innovate, and thrive.",
            href: "/about",
        },
        {
            id: 2,
            icon: <NearMeRoundedIcon sx={{ fontSize: 32 }} />,
            title: "Our Mission",
            description:
                "To inspire, educate, and equip young people with the tools and experiences they need to become transformational leaders in their communities and the world.",
            href: "/about",
        },
        {
            id: 3,
            icon: <SchoolRoundedIcon sx={{ fontSize: 32 }} />,
            title: "Core Values",
            description:
                "Integrity, inclusiveness, innovation, service and empowerment.",
            href: "/about",
        },
    ],
};

export default coreValuesData;