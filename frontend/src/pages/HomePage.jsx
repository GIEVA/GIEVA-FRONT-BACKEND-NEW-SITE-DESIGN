import { motion } from "framer-motion";
import AnimatedSection from "../components/ui/AnimatedSection";


import {
    Hero,
    Partners,
    Services,
    AboutPreview,
    WhyChooseUs,
    Statistics,
    Programs,
    Testimonials,
    Campaigns,
    News,
    ConsultancyServices,
    CoreValues,
    Staff
} from "./home";

export default function HomePage() {
    return (
        <>
            <Hero />

            <AnimatedSection>
                <Partners />
            </AnimatedSection>

            <AnimatedSection>
                <CoreValues />
            </AnimatedSection>

            <AnimatedSection>
                <Services />
            </AnimatedSection>

            <AnimatedSection>
                <AboutPreview />
            </AnimatedSection>

          <AnimatedSection>
            <ConsultancyServices />
          </AnimatedSection>
            

            <AnimatedSection>
                <WhyChooseUs />
            </AnimatedSection>

            <AnimatedSection>
                <Statistics />
            </AnimatedSection>

            <AnimatedSection>
                <Programs />
            </AnimatedSection>

            <AnimatedSection>
                <Testimonials />
            </AnimatedSection>

            <AnimatedSection>
                <Campaigns />
            </AnimatedSection>

            <AnimatedSection>
                <Staff/>
            </AnimatedSection>

            <AnimatedSection>
                <News />
            </AnimatedSection>
        </>
    );
}