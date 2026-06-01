"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";

function StarRating({ rating = 4.5 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3 h-3 ${
            star <= Math.floor(rating)
              ? "text-amber-400"
              : star - 0.5 <= rating
              ? "text-amber-300"
              : "text-charcoal/20"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-[11px] text-charcoal/40 ml-1">(24)</span>
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  // Link by real slug when present, otherwise fall back to the id so every
  // product is reachable on its detail page.
  const slug = product.slug || product.id;

  const handleAddToCart = () => {
    if (!product.in_stock) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
    >
      {/* Out of stock badge */}
      {!product.in_stock && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-charcoal/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
          Out of Stock
        </div>
      )}

      {/* Image */}
      <Link href={`/product/${slug}`} className="block relative w-full aspect-square bg-cream overflow-hidden">
        <Image
          src={
            product.image_url ||
            "https://placehold.co/400x400/C85A17/F7F4EB?text=KurumKurum"
          }
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover hover:scale-105 transition-transform duration-500"
          unoptimized={
            !product.image_url ||
            product.image_url.includes("placehold.co")
          }
        />
      </Link>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 gap-1">
        {/* Brand */}
        <p className="text-[11px] font-medium text-charcoal/50 uppercase tracking-wide">
          {product.brand}
        </p>

        {/* Name */}
        <Link href={`/product/${slug}`}>
          <h3 className="text-sm font-semibold text-charcoal leading-snug line-clamp-2 hover:text-saffron transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Weight */}
        <p className="text-[11px] text-charcoal/40">{product.weight_label}</p>

        {/* Stars */}
        <StarRating />

        {/* Price */}
        <p className="text-xl font-bold text-saffron mt-1.5">
          ${product.price.toFixed(2)}
        </p>

        {/* Add to Cart — full width */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAddToCart}
          disabled={!product.in_stock}
          className={`mt-auto w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            added
              ? "bg-green-500 text-white"
              : product.in_stock
              ? "bg-saffron text-white hover:bg-[#b34f14] active:bg-[#9e4612]"
              : "bg-charcoal/10 text-charcoal/40 cursor-not-allowed"
          }`}
        >
          {added ? "✓ Added!" : product.in_stock ? "Add to Cart" : "Out of Stock"}
        </motion.button>
      </div>
    </motion.div>
  );
}
