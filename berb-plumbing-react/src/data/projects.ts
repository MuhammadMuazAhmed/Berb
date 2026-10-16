import refBathroomImg from "../assets/688f0cc99930d3597c0aaa1b_berb-reference-image.jpg";
import refHeatingImg from "../assets/688f0cc99930d3597c0aaa15_berb-reference-image_1.jpg";
import refSolarImg from "../assets/688f0cc99930d3597c0aaa12_berb-reference-image_2.jpg";
import refBasinImg from "../assets/688f0cc99930d3597c0aaa13_berb-reference-image_3.jpg";
import radiatorImg from "../assets/688f0cc99930d3597c0aaa21_berb-heating-hero.jpg";
import solarArrayImg from "../assets/688f0cc99930d3597c0aaa22_berb-solar-hero.jpg";
import bathroomInteriorImg from "../assets/688f0cc99930d3597c0aaa23_sanitary-hero-image.jpg";

export interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  alt: string;
}

export const projects: Project[] = [
  {
    id: "bathroom",
    title: "Bathroom modernization",
    category: "Sanitary",
    image: refBathroomImg,
    alt: "Modern luxury bathroom with freestanding bathtub and walk-in shower",
  },
  {
    id: "heating-room",
    title: "Heating installation",
    category: "Heating",
    image: refHeatingImg,
    alt: "Professional boiler room, copper manifold and heating system installation",
  },
  {
    id: "shower-renovation",
    title: "Walk-in shower renovation",
    category: "Sanitary",
    image: refSolarImg,
    alt: "Contemporary walk-in shower installation and clean white bathroom styling",
  },
  {
    id: "washbasin",
    title: "Washbasin installation",
    category: "Sanitary",
    image: refBasinImg,
    alt: "Minimalist wall-mounted washbasin installation with designer fixtures",
  },
  {
    id: "radiator-installation",
    title: "Radiator installation",
    category: "Heating",
    image: radiatorImg,
    alt: "White towel radiator fitted against a tiled bathroom wall",
  },
  {
    id: "solar-array",
    title: "Solar panel system",
    category: "Solar",
    image: solarArrayImg,
    alt: "Solar panels installed on a green hillside beneath a bright sky",
  },
  {
    id: "bathroom-interior",
    title: "Contemporary bathroom",
    category: "Sanitary",
    image: bathroomInteriorImg,
    alt: "Contemporary bathroom with a freestanding tub and double vanity",
  },
];
