import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import InterviewPreview from "@/components/InterviewPreview";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <InterviewPreview />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
