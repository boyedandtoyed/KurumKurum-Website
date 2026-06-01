export interface StockCheckItem {
  product_id: string;
  name: string;
  requested: number;
  available: number;
}

export function findInsufficientStock(
  items: StockCheckItem[]
): StockCheckItem[] {
  return items.filter((i) => i.requested > i.available);
}

export function nextStock(available: number, requested: number): number {
  return Math.max(0, available - requested);
}

export function deriveInStock(
  stockQuantity: number,
  explicit?: boolean
): boolean {
  if (stockQuantity <= 0) return false;
  return explicit ?? true;
}
