export const EBAY_MAX_WEIGHT_GRAMS = 31298;   // 69 lbs per box
export const STANDARD_ORDER_THRESHOLD = 150;   // orders $150+ get free shipping
export const BASE_SHIPPING_COST = 9.99;
export const EXTRA_BOX_COST = 10.00;           // $10 per extra 69-lb block
export const WARNING_WEIGHT_GRAMS = 27216;     // 60 lbs — show approaching warning

export interface ShippingResult {
  eligible: boolean;
  warning: boolean;
  cost: number;        // total shipping cost in $
  extraBoxes: number;  // number of extra 69-lb blocks beyond the first
  note: string;
  breakdown: string;   // human-readable line e.g. "$9.99 + 1 × $10.00 extra box"
  isFree: boolean;
}

export function calculateShipping(
  totalWeightGrams: number,
  orderTotal: number
): ShippingResult {
  // Orders $150+ — shipping absorbed
  if (orderTotal >= STANDARD_ORDER_THRESHOLD) {
    return {
      eligible: true,
      warning: false,
      cost: 0,
      extraBoxes: 0,
      isFree: true,
      note: "Free shipping on orders over $150",
      breakdown: "FREE",
    };
  }

  // How many 69-lb boxes does this order need?
  const boxes = Math.max(1, Math.ceil(totalWeightGrams / EBAY_MAX_WEIGHT_GRAMS));
  const extraBoxes = boxes - 1;
  const cost = BASE_SHIPPING_COST + extraBoxes * EXTRA_BOX_COST;
  const weightLbs = Math.round(totalWeightGrams / 453.592);
  const weightKg = (totalWeightGrams / 1000).toFixed(1);

  if (extraBoxes > 0) {
    return {
      eligible: true,
      warning: true,
      cost,
      extraBoxes,
      isFree: false,
      note: `Your cart (${weightLbs} lbs / ${weightKg} kg) spans ${boxes} shipping boxes. Orders under $150 are charged $10 per extra 69-lb box.`,
      breakdown:
        extraBoxes === 1
          ? `$${BASE_SHIPPING_COST.toFixed(2)} + $${EXTRA_BOX_COST.toFixed(2)} extra box`
          : `$${BASE_SHIPPING_COST.toFixed(2)} + ${extraBoxes} × $${EXTRA_BOX_COST.toFixed(2)} extra boxes`,
    };
  }

  if (totalWeightGrams > WARNING_WEIGHT_GRAMS) {
    return {
      eligible: true,
      warning: true,
      cost: BASE_SHIPPING_COST,
      extraBoxes: 0,
      isFree: false,
      note: `Cart is ${weightLbs} lbs / ${weightKg} kg — approaching the 69 lb limit. Adding more items may incur an extra $10 shipping charge.`,
      breakdown: `$${BASE_SHIPPING_COST.toFixed(2)} standard shipping`,
    };
  }

  return {
    eligible: true,
    warning: false,
    cost: BASE_SHIPPING_COST,
    extraBoxes: 0,
    isFree: false,
    note: "Standard shipping",
    breakdown: `$${BASE_SHIPPING_COST.toFixed(2)} standard shipping`,
  };
}

// Alias kept for any existing imports
export const checkShippingEligibility = calculateShipping;
