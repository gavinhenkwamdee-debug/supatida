export interface AboutSection {
  title: string;
  body: string;
  image: string;
}

export interface AboutLocationSection extends AboutSection {
  address: string;
  hours: string;
  mapEmbedUrl: string;
}

export interface AboutAppointmentSection extends AboutSection {
  lineUrl: string;
}

export interface AboutConfig {
  owner: AboutSection;
  concept: AboutSection;
  location: AboutLocationSection;
  appointment: AboutAppointmentSection;
}

export const ABOUT_PAGES: { slug: keyof AboutConfig; label: string }[] = [
  { slug: "owner", label: "Get to know the owner" },
  { slug: "concept", label: "Concept ร้าน" },
  { slug: "location", label: "Our Location" },
  { slug: "appointment", label: "Make Appointment" },
];

export const DEFAULT_ABOUT: AboutConfig = {
  owner: { title: "Get to Know the Owner", body: "", image: "" },
  concept: { title: "Concept ร้าน", body: "", image: "" },
  location: { title: "Our Location", body: "", image: "", address: "", hours: "", mapEmbedUrl: "" },
  appointment: {
    title: "Make Appointment",
    body: "",
    image: "",
    lineUrl: "https://lin.ee/U9D2iyG",
  },
};
