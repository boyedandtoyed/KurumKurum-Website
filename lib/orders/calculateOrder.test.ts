import { describe, it, expect } from "vitest";
import { calculateOrderTotals } from "./calculateOrder";

describe("calculateOrderTotals", () => {
  it("sums line subtotals from price * quantity", () => {
    const totals = calculateOrderTotals([
      { price: 4.99, weight_grams: 200, quantity: 2 },
      { price: 1.99, weight_grams: 75, quantity: 1 },
    ]);
    expect(totals.subtotal).toBe(11.97);
  });

  it("sums total weight in grams", () => {
    const totals = calculateOrderTotals([
      { price: 4.99, weight_grams: 200, quantity: 2 },
      { price: 1.99, weight_grams: 75, quantity: 1 },
    ]);
    expect(totals.totalWeightGrams).toBe(475);
  });

  it("adds shipping for light orders under $150 (base $9.99)", () => {
    const totals = calculateOrderTotals([
      { price: 4.99, weight_grams: 200, quantity: 1 },
    ]);
    expect(totals.shippingCost).toBe(9.99);
    expect(totals.totalAmount).toBe(14.98);
  });

  it("gives free shipping at $150+ subtotal", () => {
    const totals = calculateOrderTotals([
      { price: 75, weight_grams: 500, quantity: 2 },
    ]);
    expect(totals.shippingCost).toBe(0);
    expect(totals.totalAmount).toBe(150);
  });

  it("rounds money to 2 decimals", () => {
    const totals = calculateOrderTotals([
      { price: 0.1, weight_grams: 10, quantity: 3 },
    ]);
    expect(totals.subtotal).toBe(0.3);
  });
});
