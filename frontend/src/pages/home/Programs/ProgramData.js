const programData = [
    {
        id: 1,

        slug: "study-abroad",

        title: "Study Abroad Program",

        subtitle: "Global Education Pathways",

        description:
            "Receive end-to-end guidance on university selection, admissions, visa applications, and pre-departure preparation.",

        image: {
            src: "/placeholders/program-study-abroad.png", // TODO: Replace with Figma asset
            alt: "Students studying abroad",
        },

        badge: "Featured",

        category: "Education",

        duration: "Year-round",

        location: "International",

        featured: true,

        tags: [
            "Admissions",
            "Visa",
            "Universities",
        ],

        actions: [
            {
                id: 1,
                label: "Learn More",
                href: "/programs/study-abroad",
                variant: "contained",
            },
        ],

        order: 1,
    },

    {
        id: 2,

        slug: "scholarship-support",

        title: "Scholarship Support",

        subtitle: "Funding Your Education",

        description:
            "Expert assistance in identifying scholarship opportunities and preparing competitive applications.",

        image: {
            src: "/placeholders/program-scholarship.png",
            alt: "Scholarship support",
        },

        badge: "Popular",

        category: "Scholarships",

        duration: "Ongoing",

        location: "Worldwide",

        featured: true,

        tags: [
            "Funding",
            "Mentorship",
        ],

        actions: [
            {
                id: 1,
                label: "Explore",
                href: "/programs/scholarships",
                variant: "contained",
            },
        ],

        order: 2,
    },

    {
        id: 3,

        slug: "test-preparation",

        title: "International Test Preparation",

        subtitle: "Achieve Competitive Scores",

        description:
            "Comprehensive preparation for IELTS, TOEFL, SAT, GRE, GMAT, PTE, and other international examinations.",

        image: {
            src: "/placeholders/program-test-preparation.png",
            alt: "Exam preparation",
        },

        badge: "Training",

        category: "Education",

        duration: "Flexible",

        location: "Online & Physical",

        featured: true,

        tags: [
            "IELTS",
            "TOEFL",
            "GRE",
            "SAT",
        ],

        actions: [
            {
                id: 1,
                label: "View Details",
                href: "/programs/test-preparation",
                variant: "contained",
            },
        ],

        order: 3,
    },
];

export default programData;