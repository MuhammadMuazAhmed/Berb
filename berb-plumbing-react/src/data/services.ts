import sanitaryImg from "../assets/688f0cc99930d3597c0aaa1c_berb-badezimmer-services.jpg";
import heatingImg from "../assets/688f0cc99930d3597c0aaa0c_berb-heating-services.jpg";
import solarImg from "../assets/688f0cc99930d3597c0aaa0e_berb-solar-services.jpg";

export interface Service {
  id: "sanitary" | "heating" | "solar";
  /** Value used to preselect a matching live catalog service in the request flow. */
  formValue: string;
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  image: string;
  imageAlt: string;
}

export const services: Service[] = [
  {
    id: "sanitary",
    formValue: "Sanitary & plumbing",
    eyebrow: "01 — Sanitary",
    title: "Plumbing & Sanitary",
    description:
      "From a brand-new bathroom to a long-overdue modernization: we install sanitary fixtures, renew pipework and repair leaks, so water simply works.",
    highlights: ["Bathroom modernization", "Sanitary installations", "Pipe repairs"],
    image: sanitaryImg,
    imageAlt: "Modern luxury bathroom with freestanding bathtub and sanitary fixtures",
  },
  {
    id: "heating",
    formValue: "Heating",
    eyebrow: "02 — Heating",
    title: "Heating Systems",
    description:
      "We plan and fit heating systems, service existing boilers and radiators, and repair faults, so your home stays warm and runs efficiently.",
    highlights: ["Heating installation", "Maintenance & servicing", "Fault repair"],
    image: heatingImg,
    imageAlt: "Professional heating installation and boiler system maintenance",
  },
  {
    id: "solar",
    formValue: "Solar",
    eyebrow: "03 — Solar",
    title: "Solar Energy",
    description:
      "Put your roof to work. We install solar systems and help you move towards energy-efficient living with clean power from the sun.",
    highlights: ["Rooftop solar installation", "Energy-efficient solutions", "Planning advice"],
    image: solarImg,
    imageAlt: "Solar energy installation on rooftop providing sustainable power",
  },
];
