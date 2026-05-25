"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/components/shop/Navbar";
import { useCartStore } from "@/store/cartStore";
import { calculateShipping } from "@/lib/shipping";

type Step = 1 | 2 | 3;

export default function CheckoutPage() {
  const { items, totalPrice, totalWeightGrams } = useCartStore();
  const [step, setStep] = useState<Step>(1);

  const subtotal = totalPrice();
  const weightGrams = totalWeightGrams();
  const shipping = calculateShipping(weightGrams, subtotal);
  const orderTotal = subtotal + shipping.cost;
  const weightLbs = Math.round(weightGrams / 453.592);
  const weightKg = (weightGrams / 1000).toFixed(1);

  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [address, setAddress] = useState({ street: "", city: "", state: "", zip: "" });

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
          <span className="text-5xl">🛒</span>
          <h2 className="font-playfair text-2xl font-bold text-charcoal">Your cart is empty</h2>
          <Link href="/shop" className="px-6 py-3 bg-saffron text-white font-semibold rounded-xl hover:bg-[#b34f14] transition-colors text-sm">
            Browse Products
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-playfair text-3xl font-bold text-charcoal mb-2">Checkout</h1>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8 text-sm">
            {(["Contact", "Shipping", "Payment"] as const).map((label, i) => {
              const s = (i + 1) as Step;
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? "bg-saffron text-white" : "bg-charcoal/10 text-charcoal/40"}`}>
                    {step > s ? "✓" : s}
                  </span>
                  <span className={step >= s ? "text-charcoal font-medium" : "text-charcoal/40"}>{label}</span>
                  {i < 2 && <span className="text-charcoal/20 mx-1">›</span>}
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — form */}
          <div className="flex-1">

            {/* Step 1 — Contact */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="font-playfair text-xl font-bold text-charcoal">Contact Information</h2>
                <div>
                  <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/15 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="jane@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/15 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/15 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron text-sm"
                  />
                </div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!contact.name || !contact.email || !contact.phone}
                  className="w-full py-3.5 bg-saffron text-white font-bold rounded-xl hover:bg-[#b34f14] disabled:bg-charcoal/20 disabled:text-charcoal/40 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Continue to Shipping →
                </button>
              </motion.div>
            )}

            {/* Step 2 — Shipping Address */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="font-playfair text-xl font-bold text-charcoal">Shipping Address</h2>
                <div>
                  <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">Street Address</label>
                  <input
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="123 Main Street, Apt 4B"
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/15 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">City</label>
                    <input
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="New York"
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/15 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">State</label>
                    <input
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      placeholder="NY"
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/15 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">ZIP Code</label>
                  <input
                    value={address.zip}
                    onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                    placeholder="10001"
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/15 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="px-5 py-3.5 border border-charcoal/20 text-charcoal/70 font-semibold rounded-xl hover:border-charcoal/40 transition-colors text-sm">
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!address.street || !address.city || !address.state || !address.zip}
                    className="flex-1 py-3.5 bg-saffron text-white font-bold rounded-xl hover:bg-[#b34f14] disabled:bg-charcoal/20 disabled:text-charcoal/40 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Payment */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="font-playfair text-xl font-bold text-charcoal">Payment</h2>
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-saffron bg-saffron/5 rounded-xl text-sm font-semibold text-charcoal">
                    <span>💳</span> Credit / Debit Card
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-charcoal/15 rounded-xl text-sm font-semibold text-charcoal/60 hover:border-charcoal/30 transition-colors">
                    <span>G</span> Google Pay
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-charcoal/15 rounded-xl text-sm font-semibold text-charcoal/60 hover:border-charcoal/30 transition-colors">
                    <span></span> Apple Pay
                  </button>
                </div>
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">Card Number</label>
                    <input placeholder="1234 5678 9012 3456" className="w-full px-4 py-3 rounded-xl border border-charcoal/15 focus:outline-none focus:ring-2 focus:ring-saffron/40 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">Expiry</label>
                      <input placeholder="MM / YY" className="w-full px-4 py-3 rounded-xl border border-charcoal/15 focus:outline-none focus:ring-2 focus:ring-saffron/40 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">CVV</label>
                      <input placeholder="123" className="w-full px-4 py-3 rounded-xl border border-charcoal/15 focus:outline-none focus:ring-2 focus:ring-saffron/40 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setStep(2)} className="px-5 py-3.5 border border-charcoal/20 text-charcoal/70 font-semibold rounded-xl hover:border-charcoal/40 transition-colors text-sm">
                    ← Back
                  </button>
                  <button className="flex-1 py-3.5 bg-saffron text-white font-bold rounded-xl hover:bg-[#b34f14] transition-colors text-sm">
                    Pay ${orderTotal.toFixed(2)}
                  </button>
                </div>
                <p className="text-[11px] text-charcoal/40 text-center">🔒 Secured by Stripe. Your payment info is never stored.</p>
              </motion.div>
            )}
          </div>

          {/* Right — Order Summary */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-28">
              <div className="px-5 py-4 border-b border-charcoal/8">
                <h3 className="font-playfair text-lg font-bold text-charcoal">Order Summary</h3>
              </div>

              {/* Items */}
              <div className="px-5 py-4 space-y-3 max-h-56 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                      <Image
                        src={item.product.image_url || "https://placehold.co/48x48/C85A17/F7F4EB?text=KK"}
                        alt={item.product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-charcoal/50">{item.product.brand}</p>
                      <p className="text-sm font-medium text-charcoal truncate">{item.product.name}</p>
                      <p className="text-xs text-charcoal/40">× {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-charcoal flex-shrink-0">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="px-5 py-4 border-t border-charcoal/8 space-y-2.5">

                {/* Weight info */}
                <div className="flex justify-between text-xs text-charcoal/50">
                  <span>Total weight</span>
                  <span>{weightLbs} lbs / {weightKg} kg</span>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal/60">Subtotal</span>
                  <span className="font-semibold text-charcoal">${subtotal.toFixed(2)}</span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal/60">
                    Shipping
                    {shipping.extraBoxes > 0 && (
                      <span className="ml-1 text-xs text-amber-600">({shipping.extraBoxes + 1} boxes)</span>
                    )}
                  </span>
                  <span className={`font-semibold ${shipping.isFree ? "text-green-600" : shipping.extraBoxes > 0 ? "text-amber-700" : "text-charcoal"}`}>
                    {shipping.isFree ? "FREE" : `$${shipping.cost.toFixed(2)}`}
                  </span>
                </div>

                {/* Shipping breakdown */}
                <p className="text-[11px] text-charcoal/40">{shipping.breakdown}</p>

                {/* Warning banner */}
                {shipping.warning && (
                  <div className={`px-3 py-2.5 rounded-xl text-xs leading-relaxed ${
                    shipping.extraBoxes > 0
                      ? "bg-amber-50 border border-amber-200 text-amber-800"
                      : "bg-blue-50 border border-blue-200 text-blue-800"
                  }`}>
                    <p className="font-semibold mb-0.5">
                      {shipping.extraBoxes > 0 ? "⚠️ Extra shipping" : "ℹ️ Near weight limit"}
                    </p>
                    <p>{shipping.note}</p>
                    {subtotal < 150 && (
                      <p className="mt-1 opacity-80">
                        Add ${(150 - subtotal).toFixed(2)} more for <strong>free shipping</strong>.
                      </p>
                    )}
                  </div>
                )}

                {/* Order Total */}
                <div className="flex justify-between items-center pt-2 border-t border-charcoal/10">
                  <span className="font-bold text-charcoal">Order Total</span>
                  <span className="font-bold text-2xl text-saffron">${orderTotal.toFixed(2)}</span>
                </div>

                {/* Shipping policy note */}
                <div className="bg-cream rounded-xl px-3.5 py-3 text-[11px] text-charcoal/50 leading-relaxed space-y-1">
                  <p className="font-semibold text-charcoal/70">📦 Shipping Policy</p>
                  <p>Orders under $150: <strong className="text-charcoal/70">$9.99</strong> for the first 69 lbs (31.3 kg).</p>
                  <p>Each additional 69 lbs / 31.3 kg block: <strong className="text-amber-700">+$10.00</strong>.</p>
                  <p>Orders <strong className="text-green-700">$150+</strong>: Free shipping on us.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
