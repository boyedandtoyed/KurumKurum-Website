"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/components/shop/Navbar";
import Footer from "@/components/shop/Footer";
import ProductCard from "@/components/shop/ProductCard";
import { useCartStore } from "@/store/cartStore";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PRODUCT_SELECT = "*, category:categories(id, name, slug)";

export default function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    async function load() {
      const param = decodeURIComponent(params.slug);
      const supabase = createClient();

      // Resolve by slug first, then by id (covers products without a slug).
      let { data } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", param)
        .maybeSingle();

      if (!data && UUID_RE.test(param)) {
        const byId = await supabase
          .from("products")
          .select(PRODUCT_SELECT)
          .eq("id", param)
          .maybeSingle();
        data = byId.data;
      }

      const found = (data as Product) ?? null;
      setProduct(found);

      if (found) {
        const { data: rel } = await supabase
          .from("products")
          .select(PRODUCT_SELECT)
          .eq("category_id", found.category_id)
          .neq("id", found.id)
          .limit(4);
        setRelated((rel as Product[]) ?? []);
      }

      setLoading(false);
    }
    load();
  }, [params.slug]);

  const handleAddToCart = () => {
    if (!product || !product.in_stock) return;
    for (let i = 0; i < qty; i++) addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="aspect-square bg-cream rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-4 w-24 bg-cream rounded animate-pulse" />
              <div className="h-8 w-3/4 bg-cream rounded animate-pulse" />
              <div className="h-6 w-28 bg-cream rounded animate-pulse" />
              <div className="h-24 bg-cream rounded animate-pulse" />
              <div className="h-12 bg-cream rounded animate-pulse" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
          <span className="text-5xl">🔍</span>
          <h1 className="font-playfair text-2xl font-bold text-charcoal">
            Product not found
          </h1>
          <p className="text-charcoal/50 text-sm">
            The product you&apos;re looking for doesn&apos;t exist or was removed.
          </p>
          <Link
            href="/shop"
            className="px-6 py-3 bg-saffron text-white font-semibold rounded-xl hover:bg-[#b34f14] transition-colors text-sm"
          >
            Browse Products
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-charcoal/40 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-saffron transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-saffron transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-charcoal/70">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative aspect-square bg-cream rounded-2xl overflow-hidden shadow-sm"
          >
            {!product.in_stock && (
              <div className="absolute top-4 left-4 z-10 bg-charcoal/75 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Out of Stock
              </div>
            )}
            <Image
              src={
                product.image_url ||
                "https://placehold.co/600x600/C85A17/F7F4EB?text=KurumKurum"
              }
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              unoptimized={
                !product.image_url || product.image_url.includes("placehold.co")
              }
              priority
            />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col"
          >
            <p className="text-xs font-semibold text-charcoal/50 uppercase tracking-widest mb-2">
              {product.brand}
            </p>
            <h1 className="font-playfair text-3xl font-bold text-charcoal mb-3">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold text-saffron">
                ${product.price.toFixed(2)}
              </span>
              {product.weight_label && (
                <span className="text-sm text-charcoal/50">
                  · {product.weight_label}
                </span>
              )}
            </div>

            {/* Stock status */}
            <p className="text-sm mb-5">
              {product.in_stock ? (
                <span className="inline-flex items-center gap-1.5 text-green-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-500" /> In Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-charcoal/40 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-charcoal/30" /> Out of
                  Stock
                </span>
              )}
            </p>

            {product.description && (
              <p className="text-sm text-charcoal/70 leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            {/* Quantity + Add to cart */}
            {product.in_stock && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center border border-charcoal/15 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-3 text-lg text-charcoal/60 hover:bg-charcoal/5 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="px-4 text-sm font-semibold text-charcoal min-w-[2.5rem] text-center">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="px-3.5 py-3 text-lg text-charcoal/60 hover:bg-charcoal/5 transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              disabled={!product.in_stock}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                added
                  ? "bg-green-500 text-white"
                  : product.in_stock
                  ? "bg-saffron text-white hover:bg-[#b34f14] active:bg-[#9e4612]"
                  : "bg-charcoal/10 text-charcoal/40 cursor-not-allowed"
              }`}
            >
              {added
                ? "✓ Added to Cart"
                : product.in_stock
                ? `Add ${qty} to Cart`
                : "Out of Stock"}
            </motion.button>
          </motion.div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-6">
              You may also like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
