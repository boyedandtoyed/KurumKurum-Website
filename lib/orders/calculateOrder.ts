import { calculateShipping } from "@/lib/shipping";

export interface OrderLineInput {
  price: number;
  weight_grams: number;
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  totalWeightGrams: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateOrderTotals(lines: OrderLineInput[]): OrderTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const totalWeightGrams = lines.reduce(
    (sum, l) => sum + l.weight_grams * l.quantity,
    0
  );
  const shipping = calculateShipping(totalWeightGrams, subtotal);
  return {
    subtotal: round2(subtotal),
    shippingCost: round2(shipping.cost),
    totalAmount: round2(subtotal + shipping.cost),
    totalWeightGrams,
  };
}
