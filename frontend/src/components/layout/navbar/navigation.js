const navigation = [
    {
        id: "home",
        label: "Home",
        path: "/",
    },

    {
        id: "about",
        label: "About",
        path: "/about",
    },

    {
        id: "services",

        label: "Services",

        children: [
            {
                id: "study-abroad",
                label: "Study Abroad",
                description:
                    "Admissions and application guidance.",

                path: "/services/study-abroad",
            },

            {
                id: "visa",

                label: "Visa Assistance",

                description:
                    "Professional visa support.",

                path: "/services/visa",
            },

            {
                id: "scholarships",

                label: "Scholarships",

                description:
                    "Find fully funded opportunities.",

                path: "/services/scholarships",
            },
        ],
    },

    {
        id: "programs",

        label: "Programs",

        path: "/programs",
    },

    {
        id: "resources",

        label: "Resources",

        path: "/resources",
    },

    {
        id: "contact",

        label: "Contact",

        path: "/contact",
    },
];

export default navigation;