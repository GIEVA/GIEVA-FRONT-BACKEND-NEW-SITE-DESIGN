import Hero from "../../components/common/Hero";

import AboutSection from "../../components/public/AboutSection";
import MissionVisionSection from "../../components/public/MissionVisionSection";
import ValuesSection from "../../components/public/ValuesSection";
import TimelineSection from "../../components/public/TimelineSection";
import WhyChooseUsSection from "../../components/public/WhyChooseUsSection";
import StatsSection from "../../components/public/StatsSection";
import TeamSection from "../../components/public/TeamSection";
import CTASection from "../../components/public/CTASection";

import heroImage from "../../assets/images/about/about-hero.jpg";

export default function About() {
  return (
    <>
      <Hero
        image={heroImage}
        subtitle="ABOUT GIEVA"
        title="Transforming Lives Through Education"
        description="Empowering students, professionals and institutions through innovation, mentorship and global educational opportunities."
      />

      <AboutSection />

      <MissionVisionSection />

      <ValuesSection />

      <TimelineSection />

      <WhyChooseUsSection />

      <StatsSection />

      <TeamSection />

      <CTASection />
    </>
  );
}