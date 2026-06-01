"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/shop/Navbar";

export default function ConfirmationPage() {
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get("order"));
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="text-6xl">🎉</span>
        <h1 className="font-playfair text-3xl font-bold text-charcoal">
          Order placed!
        </h1>
        <p className="text-charcoal/60 max-w-md">
          Thank you for your order. We&apos;ve received it and will start
          processing it shortly.
        </p>
        {orderId && (
          <p className="text-sm text-charcoal/50">
            Order reference:{" "}
            <span className="font-mono font-semibold text-charcoal">
              {orderId}
            </span>
          </p>
        )}
        <Link
          href="/shop"
          className="mt-2 px-6 py-3 bg-saffron text-white font-semibold rounded-xl hover:bg-[#b34f14] transition-colors text-sm"
        >
          Continue Shopping
        </Link>
      </div>
    </>
  );
}
