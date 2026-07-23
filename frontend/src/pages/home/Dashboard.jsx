import PublicLayout from "../../layouts/PublicLayout";

import HeroSection from "../../components/public/HeroSection";
import PartnersSection from "../../components/public/PartnersSection";
import AboutSection from "../../components/public/AboutSection";
import ServicesSection from "../../components/public/ServicesSection";
import TeamSection from "../../components/public/TeamSection";
import TestimonialsSection from "../../components/public/TestimonialsSection";
import FAQSection from "../../components/public/FAQSection";
import CTASection from "../../components/public/CTASection";

export default function Dashboard() {
  return (
    <PublicLayout>

      <HeroSection />

      <PartnersSection />

      <AboutSection />

      <ServicesSection />

      <TeamSection />

      <TestimonialsSection />

      <FAQSection />

      <CTASection />

    </PublicLayout>
  );
}