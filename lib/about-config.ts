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
  // Whether the "About Us" nav dropdown shows up for customers — lets an
  // admin fill in content over time without linking to it until they're
  // ready. The /about/* pages themselves stay reachable by direct URL
  // regardless, so an admin can preview a page while this is off.
  enabled: boolean;
  owner: AboutSection;
  concept: AboutSection;
  location: AboutLocationSection;
  appointment: AboutAppointmentSection;
}

// The 4 content-page keys of AboutConfig — deliberately narrower than
// `keyof AboutConfig` (which also includes "enabled") so admin code can
// safely index/spread `config[activeTab]` without TypeScript widening that
// value to include the `enabled: boolean` member.
export type AboutPageSlug = "owner" | "concept" | "location" | "appointment";

export const ABOUT_PAGES: { slug: AboutPageSlug; label: string }[] = [
  { slug: "owner", label: "Get to know the owner" },
  { slug: "concept", label: "Concept ร้าน" },
  { slug: "location", label: "Our Location" },
  { slug: "appointment", label: "Make Appointment" },
];

export const DEFAULT_ABOUT: AboutConfig = {
  enabled: false,
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
