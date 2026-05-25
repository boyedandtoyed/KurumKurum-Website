"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/shop/Navbar";
import Footer from "@/components/shop/Footer";
import ProductCard from "@/components/shop/ProductCard";
import HeroCarousel from "@/components/shop/HeroCarousel";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/types";

const CATEGORIES = [
  { emoji: "🥨", name: "Chips & Crisps", slug: "chips-crisps", description: "Crunchy Himalayan snacks" },
  { emoji: "🍜", name: "Instant Noodles", slug: "instant-noodles", description: "Quick & authentic noodles" },
  { emoji: "🍬", name: "Sweets & Mithai", slug: "sweets-mithai", description: "Traditional confections" },
  { emoji: "🌶️", name: "Spices & Condiments", slug: "spices-condiments", description: "Bold Himalayan flavors" },
];

const WHY_US = [
  {
    icon: "🏔️",
    title: "Authentic Himalayan",
    description: "Every product is sourced directly from trusted Nepali and Himalayan producers.",
  },
  {
    icon: "🚚",
    title: "Ships Nationwide",
    description: "Fast, reliable shipping to all 50 US states with careful packaging.",
  },
  {
    icon: "✨",
    title: "Freshness Guaranteed",
    description: "We rotate stock frequently so you always receive snacks at peak flavor.",
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("products")
          .select("*, category:categories(id, name, slug)")
          .eq("is_featured", true)
          .limit(8);

        if (error || !data || data.length === 0) {
          // Fallback: just show newest products if no is_featured column or no featured products
          const { data: fallback } = await supabase
            .from("products")
            .select("*, category:categories(id, name, slug)")
            .order("created_at", { ascending: false })
            .limit(8);
          setFeaturedProducts(fallback ?? []);
        } else {
          setFeaturedProducts(data);
        }
      } catch {
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  return (
    <>
      <Navbar />

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Categories */}
      <section className="py-16 px-4 bg-cream">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-charcoal mb-2">
              Shop by Category
            </h2>
            <p className="text-charcoal/50 text-sm">
              Explore our authentic Himalayan product range
            </p>
          </motion.div>

          <div className="flex overflow-x-auto gap-4 pb-3 md:grid md:grid-cols-4 md:overflow-visible">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link href={`/shop?category=${cat.slug}`}>
                  <motion.div
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="min-w-[150px] md:min-w-0 bg-white rounded-2xl p-5 text-center shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-saffron/20 transition-all"
                  >
                    <span className="text-4xl mb-3 block">{cat.emoji}</span>
                    <h3 className="font-playfair font-bold text-charcoal text-sm mb-0.5">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-charcoal/40">{cat.description}</p>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-end justify-between mb-8"
          >
            <div>
              <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-charcoal mb-1">
                Popular Picks
              </h2>
              <p className="text-charcoal/50 text-sm">
                Customer favorites from across the Himalayas
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden sm:inline-flex text-sm font-semibold text-saffron hover:text-[#b34f14] transition-colors"
            >
              View all →
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-square bg-cream" />
                  <div className="p-3 space-y-2">
                    <div className="h-2.5 bg-cream rounded w-1/3" />
                    <div className="h-3 bg-cream rounded w-3/4" />
                    <div className="h-2 bg-cream rounded w-1/2" />
                    <div className="h-8 bg-cream rounded mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl mb-3 block">🏔️</span>
              <p className="text-charcoal/50">Products coming soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link
              href="/shop"
              className="inline-block border-2 border-saffron text-saffron font-bold px-7 py-3 rounded-xl hover:bg-saffron hover:text-white transition-colors text-sm"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Why KurumKurum */}
      <section className="py-16 px-4 bg-cream">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-charcoal">
              Why KurumKurum?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHY_US.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="text-center p-7 bg-white rounded-2xl shadow-sm"
              >
                <span className="text-5xl mb-4 block">{item.icon}</span>
                <h3 className="font-playfair text-lg font-bold text-charcoal mb-2">
                  {item.title}
                </h3>
                <p className="text-charcoal/60 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
