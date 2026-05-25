"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { calculateShipping } from "@/lib/shipping";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalPrice,
    totalWeightGrams,
    totalItems,
  } = useCartStore();

  const subtotal = totalPrice();
  const weightGrams = totalWeightGrams();
  const itemCount = totalItems();
  const shipping = calculateShipping(weightGrams, subtotal);
  const orderTotal = subtotal + shipping.cost;
  const weightLbs = Math.round(weightGrams / 453.592);
  const weightKg = (weightGrams / 1000).toFixed(1);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-cream z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal/10">
              <div className="flex items-center gap-2">
                <h2 className="font-playfair text-xl font-bold text-charcoal">Your Cart</h2>
                {itemCount > 0 && (
                  <span className="bg-saffron text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-full hover:bg-charcoal/5 transition-colors"
                aria-label="Close cart"
              >
                <svg className="w-5 h-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <span className="text-6xl">🛒</span>
                  <h3 className="font-playfair text-xl font-bold text-charcoal">Your cart is empty</h3>
                  <p className="text-charcoal/50 text-sm">Add some delicious Himalayan snacks to get started!</p>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="mt-2 px-6 py-3 bg-saffron text-white font-semibold rounded-xl hover:bg-[#b34f14] transition-colors text-sm"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.product.id} className="flex gap-3 bg-white rounded-xl p-3 shadow-sm">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                      <Image
                        src={item.product.image_url || "https://placehold.co/64x64/C85A17/F7F4EB?text=KK"}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-saffron uppercase tracking-wide">{item.product.brand}</p>
                      <h4 className="font-playfair text-sm font-bold text-charcoal leading-snug line-clamp-1">{item.product.name}</h4>
                      <p className="text-[11px] text-charcoal/40">{item.product.weight_label}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-charcoal/10 hover:bg-charcoal/20 flex items-center justify-center text-charcoal font-bold text-sm transition-colors"
                          >−</button>
                          <span className="text-sm font-semibold text-charcoal w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-charcoal/10 hover:bg-charcoal/20 flex items-center justify-center text-charcoal font-bold text-sm transition-colors"
                          >+</button>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-bold text-saffron">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-charcoal/30 hover:text-crimson transition-colors"
                            aria-label="Remove item"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-charcoal/10 px-5 py-4 space-y-3 bg-white">

                {/* Weight indicator */}
                <div className="flex items-center justify-between text-xs text-charcoal/50">
                  <span>Cart weight</span>
                  <span className="font-medium">{weightLbs} lbs / {weightKg} kg</span>
                </div>

                {/* Shipping warning banner */}
                {shipping.warning && (
                  <div className={`px-3.5 py-3 rounded-xl text-xs leading-relaxed ${
                    shipping.extraBoxes > 0
                      ? "bg-amber-50 border border-amber-200 text-amber-800"
                      : "bg-blue-50 border border-blue-200 text-blue-800"
                  }`}>
                    <p className="font-semibold mb-0.5">
                      {shipping.extraBoxes > 0 ? "⚠️ Extra shipping applies" : "ℹ️ Approaching weight limit"}
                    </p>
                    <p>{shipping.note}</p>
                    {subtotal < 150 && (
                      <p className="mt-1 opacity-80">
                        Spend ${(150 - subtotal).toFixed(2)} more to get <strong>free shipping</strong>.
                      </p>
                    )}
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-charcoal/60">Subtotal</span>
                  <span className="font-semibold text-charcoal">${subtotal.toFixed(2)}</span>
                </div>

                {/* Shipping line */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-charcoal/60">
                    Shipping
                    {shipping.extraBoxes > 0 && (
                      <span className="ml-1 text-amber-600 font-medium">
                        ({shipping.extraBoxes + 1} boxes)
                      </span>
                    )}
                  </span>
                  <span className={`font-semibold ${shipping.isFree ? "text-green-600" : shipping.extraBoxes > 0 ? "text-amber-700" : "text-charcoal"}`}>
                    {shipping.isFree ? "FREE" : `$${shipping.cost.toFixed(2)}`}
                  </span>
                </div>

                {/* Breakdown note */}
                <p className="text-[11px] text-charcoal/40 -mt-1">{shipping.breakdown}</p>

                {/* Divider + Order Total */}
                <div className="flex items-center justify-between pt-2 border-t border-charcoal/10">
                  <span className="font-bold text-charcoal">Order Total</span>
                  <span className="font-bold text-xl text-saffron">${orderTotal.toFixed(2)}</span>
                </div>

                {/* Extra shipping rule note */}
                {!shipping.isFree && (
                  <p className="text-[11px] text-charcoal/40 text-center leading-relaxed">
                    Orders under $150: $9.99 base shipping + $10 per extra 69 lbs / 31.3 kg.
                    Orders $150+ ship free.
                  </p>
                )}

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full text-center py-3.5 rounded-xl font-bold text-white bg-saffron hover:bg-[#b34f14] transition-colors text-sm"
                >
                  Proceed to Checkout →
                </Link>

                <button
                  onClick={closeCart}
                  className="block w-full text-center text-xs text-charcoal/50 hover:text-charcoal transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
