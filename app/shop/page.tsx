"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/shop/Navbar";
import Footer from "@/components/shop/Footer";
import ProductCard from "@/components/shop/ProductCard";
import { createClient } from "@/lib/supabase/client";
import { Product, Category } from "@/types";

type SortOption = "price-asc" | "price-desc" | "newest";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(50);
  const [sort, setSort] = useState<SortOption>("newest");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase
          .from("products")
          .select("*, category:categories(id, name, slug)")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);
      setProducts(prods ?? []);
      setCategories(cats ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategories.length > 0)
      result = result.filter((p) => selectedCategories.includes(p.category_id));
    if (selectedBrands.length > 0)
      result = result.filter((p) => selectedBrands.includes(p.brand));
    result = result.filter((p) => p.price <= maxPrice);
    if (sort === "price-asc") result.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
    return result;
  }, [products, selectedCategories, selectedBrands, maxPrice, sort]);

  const toggleCategory = (id: string) =>
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const toggleBrand = (brand: string) =>
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );

  const activeFilters = [
    ...selectedCategories.map((id) => ({
      key: `cat-${id}`,
      label: categories.find((c) => c.id === id)?.name ?? id,
      remove: () => toggleCategory(id),
    })),
    ...selectedBrands.map((brand) => ({
      key: `brand-${brand}`,
      label: brand,
      remove: () => toggleBrand(brand),
    })),
  ];

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="font-playfair text-4xl font-bold text-charcoal mb-1">
            All Products
          </h1>
          <p className="text-charcoal/50 text-sm">
            Authentic Himalayan snacks, sourced with care
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-28">
              <h3 className="font-playfair text-base font-bold text-charcoal mb-4">
                Filters
              </h3>

              {/* Categories */}
              <div className="mb-5">
                <h4 className="text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 mb-2.5">
                  Category
                </h4>
                <div className="space-y-1.5">
                  {loading
                    ? [1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-4 bg-cream rounded animate-pulse" />
                      ))
                    : categories.map((cat) => (
                        <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat.id)}
                            onChange={() => toggleCategory(cat.id)}
                            className="w-3.5 h-3.5 accent-saffron rounded"
                          />
                          <span className="text-sm text-charcoal/70 group-hover:text-charcoal transition-colors">
                            {cat.name}
                          </span>
                        </label>
                      ))}
                </div>
              </div>

              {/* Brands */}
              {brands.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 mb-2.5">
                    Brand
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {brands.map((brand) => (
                      <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="w-3.5 h-3.5 accent-saffron rounded"
                        />
                        <span className="text-sm text-charcoal/70 group-hover:text-charcoal transition-colors truncate">
                          {brand}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price range */}
              <div className="mb-5">
                <h4 className="text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 mb-2.5">
                  Max Price: ${maxPrice}
                </h4>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-saffron"
                />
                <div className="flex justify-between text-[10px] text-charcoal/40 mt-1">
                  <span>$1</span>
                  <span>$50</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedBrands([]);
                  setMaxPrice(50);
                }}
                className="text-xs text-saffron hover:text-[#b34f14] font-semibold transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <p className="text-sm text-charcoal/60">
                {loading ? (
                  <span className="inline-block w-20 h-4 bg-cream rounded animate-pulse" />
                ) : (
                  <>
                    <span className="font-semibold text-charcoal">{filteredProducts.length}</span>{" "}
                    products found
                  </>
                )}
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="px-3.5 py-2 bg-white border border-charcoal/15 rounded-xl text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-saffron/40"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={f.remove}
                    className="flex items-center gap-1.5 bg-saffron/10 text-saffron text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-saffron/20 transition-colors"
                  >
                    {f.label}
                    <span className="text-base leading-none">&times;</span>
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
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
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-5xl mb-4 block">🔍</span>
                <h3 className="font-playfair text-xl font-bold text-charcoal mb-2">
                  No products found
                </h3>
                <p className="text-charcoal/50 text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
