const DISCOUNTS = [0.05, 0.10, 0.15];

function roundNice(price: number): number {
  if (price >= 100000) return Math.round(price / 10000) * 10000;
  if (price >= 10000)  return Math.round(price / 1000)  * 1000;
  if (price >= 1000)   return Math.round(price / 500)   * 500;
  return                      Math.round(price / 100)   * 100;
}

export function getOriginalPrice(productId: number, currentPrice: number): number {
  const discount = DISCOUNTS[productId % 3];
  const raw = currentPrice / (1 - discount);
  return roundNice(raw);
}

export function getDiscountPercent(productId: number): number {
  return DISCOUNTS[productId % 3] * 100;
}
