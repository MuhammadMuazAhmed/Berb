import { useCallback, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import StatsSection from "./components/StatsSection";
import AboutSection from "./components/AboutSection";
import ServicesSection from "./components/ServicesSection";
import ProjectsSection from "./components/ProjectsSection";
import ProcessSection from "./components/ProcessSection";
import QualitySection from "./components/QualitySection";
import ReviewsSection from "./components/ReviewsSection";
import EmergencySection from "./components/EmergencySection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import ServiceRequestFlow from "./components/ServiceRequestFlow";

export default function App() {
  const [requestOpen, setRequestOpen] = useState(false);
  const [initialService, setInitialService] = useState("");
  const openRequest = useCallback((service?: string) => {
    setInitialService(service ?? "");
    setRequestOpen(true);
  }, []);
  const closeRequest = useCallback(() => setRequestOpen(false), []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {/* Hero wrapper: topbar + transparent header + full-bleed hero all live here */}
      <div className="hero-shell">
        <Header onRequestService={() => openRequest()} />
        <Hero onRequestService={() => openRequest()} />
      </div>

      <main id="main">
        <StatsSection />
        <ServicesSection onSelectService={openRequest} />
        <AboutSection onRequestService={() => openRequest()} />
        <ProjectsSection onRequestService={() => openRequest()} />
        <ProcessSection />
        <QualitySection />
        <ReviewsSection />
        <EmergencySection />
        <ContactSection />
      </main>
      <Footer />
      <ServiceRequestFlow open={requestOpen} initialService={initialService} onClose={closeRequest} />
    </>
  );
}
