import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import LogoCloud from "@/components/LogoCloud";
import ProjectManagement from "@/components/ProjectManagement";
import BentoGrid from "@/components/BentoGrid";
import CTASection from "@/components/CTASection";
import FeatureSummary from "@/components/FeatureSummary";
import Comparison from "@/components/Comparison";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <LogoCloud />
        <ProjectManagement />
        <BentoGrid />
        <CTASection />
        <FeatureSummary />
        <Comparison />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
