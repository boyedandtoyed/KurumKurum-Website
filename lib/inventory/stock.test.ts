import { describe, it, expect } from "vitest";
import { findInsufficientStock, nextStock, deriveInStock } from "./stock";

describe("findInsufficientStock", () => {
  it("returns lines where requested exceeds available", () => {
    const short = findInsufficientStock([
      { product_id: "a", name: "A", requested: 2, available: 5 },
      { product_id: "b", name: "B", requested: 3, available: 1 },
    ]);
    expect(short).toHaveLength(1);
    expect(short[0].product_id).toBe("b");
  });

  it("returns empty when all lines have enough stock", () => {
    const short = findInsufficientStock([
      { product_id: "a", name: "A", requested: 5, available: 5 },
    ]);
    expect(short).toEqual([]);
  });
});

describe("nextStock", () => {
  it("subtracts requested from available", () => {
    expect(nextStock(10, 3)).toBe(7);
  });
  it("floors at zero", () => {
    expect(nextStock(2, 5)).toBe(0);
  });
});

describe("deriveInStock", () => {
  it("is false when stock is zero regardless of explicit flag", () => {
    expect(deriveInStock(0, true)).toBe(false);
  });
  it("defaults to true when stock is positive and no explicit flag", () => {
    expect(deriveInStock(5)).toBe(true);
  });
  it("honors an explicit false even when stock is positive", () => {
    expect(deriveInStock(5, false)).toBe(false);
  });
});
