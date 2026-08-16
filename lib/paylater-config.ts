export interface PayLaterConfig {
  enabled: boolean;
  bannerImage: string;
  productIds: number[];
}

export const DEFAULT_PAYLATER: PayLaterConfig = {
  enabled: false,
  bannerImage: "",
  productIds: [],
};
