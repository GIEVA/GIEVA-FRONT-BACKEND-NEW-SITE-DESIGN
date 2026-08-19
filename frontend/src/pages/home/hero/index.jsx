import Hero from "./Hero";

export default function HomeHero() {
    return (
        <Hero
            eyebrow="EDUCATIONAL CONSULTANCY"
            title={
                <>
                    Empowering Minds.
                    <br />
                    <span style={{ color: "#F97316", fontStyle: "italic" }}>
                        Transforming Futures.
                    </span>
                </>
            }
            description="A versatile organization, committed to growth, collaboration, transformative education and leadership-development on a global scale."
            actions={{
                primary: {
                    label: "Book Consultancy",
                    href: "/consultations",
                    color: "warning",        // Orange
                },
                secondary: {
                    label: "Take Test",
                    href: "/exam-catalog",
                    color: "secondary",      // Purple
                },
                tertiary: {                    // ← New Explore NGO button
                    label: "Explore NGO",
                    href: "/ngo",              // change to your real NGO route
                    color: "success",          // Green
                    variant: "outlined",       // outlined look like the screenshot
                },
            }}
            image={{
                src: "../../../assets/hero.png",
                alt: "Global Impact",
            }}
            minHeight="90vh"
            contentWidth={5}
            imageWidth={7}
        />
    );
}