export interface MothersDayConfig {
  enabled: boolean;
  bannerImage: string;
  productIds: number[];
}

export const DEFAULT_MOTHERSDAY: MothersDayConfig = {
  enabled: false,
  bannerImage: "",
  productIds: [],
};
