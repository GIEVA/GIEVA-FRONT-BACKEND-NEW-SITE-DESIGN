const consultancyData = {
    eyebrow: "CONSULTANCY SERVICES",
    title: (
        <>
            We don't just register you.
            <br />
            We guide you{" "}
            <span style={{ color: "#F97316", fontStyle: "italic" }}>
                all the way to acceptance.
            </span>
        </>
    ),
    description:
        "GIEVA handles your entire registration process — from account setup to score reporting — with certified guidance at every step.",

    cards: [
        {
            id: 1,
            number: "01",
            title: "TEST REGISTRATION",
            description:
                "We handle your entire test registration process — from account setup to score reporting — with certified guidance at every step.",
            href: "/consultancy/test-registration",
        },
        {
            id: 2,
            number: "02",
            title: "STUDY ABROAD",
            description:
                "Complete admission support for undergraduate and postgraduate studies in leading universities worldwide.",
            href: "/consultancy/study-abroad",
        },
        {
            id: 3,
            number: "03",
            title: "SCHOLARSHIP",
            description:
                "Expert guidance on identifying, preparing and applying for fully funded scholarship opportunities.",
            href: "/consultancy/scholarship",
        },
        {
            id: 4,
            number: "04",
            title: "PROFESSIONAL DEVELOPMENT",
            description:
                "Career coaching, CV reviews, interview preparation and professional development for global opportunities.",
            href: "/consultancy/professional-development",
        },
    ],
};

export default consultancyData;