import seats from "../../../assets/images/seats.png"

const aboutData = {
    eyebrow: "WHO WE ARE",

    title: "Global Integrated Education Volunteers Association (GIEVA)",

    description:
        "Global Integrated Education Volunteers Association (GIEVA) was registered in 2006 as a nonprofit organization to improve access to quality education and global learning opportunities among young Nigerians. Over the years, GIEVA has grown to serve over 1,000 young Nigerians annually, with a strong focus on inclusive education, digital empowerment, and youth development.",

    image: {
        src: seats, // ← replace with your real image
        alt: "Lecture hall filled with students",
    },

    stats: [
        { value: "10,000+", label: "Lives Changed" },
        { value: "30+", label: "Global Partners" },
        { value: "12+", label: "Years Active" },
        { value: "98%", label: "Success Rate" },
    ],

    actions: {
        primary: {
            label: "Learn more about us",
            href: "/about",
            color: "warning",
            variant: "outlined",
        },
    },
};

export default aboutData;

// import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
// import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
// import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
// import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";

// const aboutData = {
//     eyebrow: "About Us",

//     title: "Empowering Students Through Global Educational Opportunities",

//     description:
//         "We are committed to helping students unlock international opportunities through admissions support, scholarships, mentorship, career development, and trusted educational partnerships.",

//     image: {
//         src: "/placeholders/about-preview.png", // TODO: Replace with Figma image
//         alt: "Students learning together",
//     },

//     features: [
//         {
//             id: 1,
//             title: "Global Opportunities",
//             description:
//                 "Connect with universities and organizations across the world.",
//             icon: <PublicRoundedIcon />,
//         },
//         {
//             id: 2,
//             title: "Scholarship Support",
//             description:
//                 "Personalized guidance for competitive scholarship applications.",
//             icon: <EmojiEventsRoundedIcon />,
//         },
//         {
//             id: 3,
//             title: "Expert Mentorship",
//             description:
//                 "Learn from experienced mentors and education consultants.",
//             icon: <GroupsRoundedIcon />,
//         },
//         {
//             id: 4,
//             title: "Trusted Guidance",
//             description:
//                 "Reliable support throughout every stage of your journey.",
//             icon: <CheckCircleRoundedIcon />,
//         },
//     ],

//     actions: {
//         primary: {
//             label: "Learn More",
//             href: "/about",
//         },

//         secondary: {
//             label: "Contact Us",
//             href: "/contact",
//         },
//     },
// };

// export default aboutData;