"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/types";

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Wai Wai Instant Noodles",
    brand: "Wai Wai",
    category_id: "instant-noodles",
    weight_grams: 75,
    weight_label: "75g per pack",
    unit_type: "pack",
    price: 1.99,
    description: "Classic Nepali instant noodles with signature spice mix.",
    image_url: "https://placehold.co/400x400/E8890C/FDF6EC?text=Wai+Wai",
    in_stock: true,
    created_at: "2024-01-01",
    slug: "wai-wai-instant-noodles",
  },
  {
    id: "2",
    name: "Haldiram's Bhujia",
    brand: "Haldiram's",
    category_id: "chips-crisps",
    weight_grams: 400,
    weight_label: "400g",
    unit_type: "bag",
    price: 7.99,
    description:
      "Crispy and flavorful moth bean noodles with authentic spices.",
    image_url: "https://placehold.co/400x400/9B1B30/FDF6EC?text=Bhujia",
    in_stock: true,
    created_at: "2024-01-01",
    slug: "haldirams-bhujia",
  },
  {
    id: "3",
    name: "Aloo Jeera Chips",
    brand: "Himalayan Bites",
    category_id: "chips-crisps",
    weight_grams: 200,
    weight_label: "200g",
    unit_type: "bag",
    price: 4.99,
    description: "Crispy potato chips seasoned with cumin and Himalayan salt.",
    image_url: "https://placehold.co/400x400/E8890C/1A1A2E?text=Chips",
    in_stock: true,
    created_at: "2024-01-01",
    slug: "aloo-jeera-chips",
  },
  {
    id: "4",
    name: "Himalayan Pink Salt",
    brand: "Himalayan Gold",
    category_id: "spices-condiments",
    weight_grams: 1000,
    weight_label: "1kg",
    unit_type: "bag",
    price: 9.99,
    description: "Pure Himalayan pink salt, mineral-rich and full-flavored.",
    image_url: "https://placehold.co/400x400/E8890C/FDF6EC?text=Pink+Salt",
    in_stock: true,
    created_at: "2024-01-01",
    slug: "himalayan-pink-salt",
  },
];

const CATEGORIES = [
  { id: "chips-crisps", name: "Chips & Crisps" },
  { id: "instant-noodles", name: "Instant Noodles" },
  { id: "sweets-mithai", name: "Sweets & Mithai" },
  { id: "spices-condiments", name: "Spices & Condiments" },
];

const EMPTY_FORM: Omit<Product, "id" | "created_at"> = {
  name: "",
  brand: "",
  category_id: "chips-crisps",
  weight_grams: 0,
  weight_label: "",
  unit_type: "bag",
  price: 0,
  description: "",
  image_url: "",
  in_stock: true,
  slug: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      brand: product.brand,
      category_id: product.category_id,
      weight_grams: product.weight_grams,
      weight_label: product.weight_label,
      unit_type: product.unit_type,
      price: product.price,
      description: product.description,
      image_url: product.image_url,
      in_stock: product.in_stock,
      slug: product.slug ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id ? { ...editingProduct, ...form } : p
        )
      );
    } else {
      const newProduct: Product = {
        ...form,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  };

  const toggleStock = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, in_stock: !p.in_stock } : p))
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-charcoal">
            Products
          </h1>
          <p className="text-charcoal/50 mt-1">
            Manage your product catalog
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-saffron text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#d07a0b] transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-charcoal/5">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  In Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                        <Image
                          src={
                            product.image_url ||
                            "https://placehold.co/40x40/E8890C/FDF6EC?text=KK"
                          }
                          alt={product.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <span className="text-sm font-medium text-charcoal line-clamp-2 max-w-[180px]">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal/70">
                    {product.brand}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-saffron/10 text-saffron font-semibold px-2 py-1 rounded-full">
                      {CATEGORIES.find((c) => c.id === product.category_id)
                        ?.name ?? product.category_id}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-charcoal">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal/60">
                    {product.weight_label}
                  </td>
                  <td className="px-6 py-4">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleStock(product.id)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        product.in_stock ? "bg-green-400" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          product.in_stock ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="text-xs font-semibold text-saffron hover:text-[#d07a0b] transition-colors px-2 py-1 rounded-lg hover:bg-saffron/5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="text-xs font-semibold text-crimson hover:text-[#7e1527] transition-colors px-2 py-1 rounded-lg hover:bg-crimson/5"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-charcoal/10 flex items-center justify-between">
                  <h2 className="font-playfair text-xl font-bold text-charcoal">
                    {editingProduct ? "Edit Product" : "Add Product"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-full hover:bg-charcoal/5 transition-colors"
                  >
                    <svg className="w-5 h-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField label="Product Name" required>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        required
                        className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
                        placeholder="e.g. Wai Wai Noodles"
                      />
                    </FormField>

                    <FormField label="Brand" required>
                      <input
                        type="text"
                        value={form.brand}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, brand: e.target.value }))
                        }
                        required
                        className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
                        placeholder="e.g. Wai Wai"
                      />
                    </FormField>

                    <FormField label="Category" required>
                      <select
                        value={form.category_id}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            category_id: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron bg-white"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Unit Type">
                      <input
                        type="text"
                        value={form.unit_type}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            unit_type: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
                        placeholder="e.g. bag, pack, box"
                      />
                    </FormField>

                    <FormField label="Weight (grams)" required>
                      <input
                        type="number"
                        value={form.weight_grams}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            weight_grams: Number(e.target.value),
                          }))
                        }
                        required
                        min={1}
                        className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
                        placeholder="e.g. 400"
                      />
                    </FormField>

                    <FormField label="Weight Label" required>
                      <input
                        type="text"
                        value={form.weight_label}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            weight_label: e.target.value,
                          }))
                        }
                        required
                        className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
                        placeholder="e.g. 400g"
                      />
                    </FormField>

                    <FormField label="Price (USD)" required>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            price: Number(e.target.value),
                          }))
                        }
                        required
                        min={0}
                        step={0.01}
                        className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
                        placeholder="e.g. 4.99"
                      />
                    </FormField>

                    <FormField label="Slug">
                      <input
                        type="text"
                        value={form.slug ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, slug: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
                        placeholder="e.g. wai-wai-noodles"
                      />
                    </FormField>
                  </div>

                  <FormField label="Image URL">
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          image_url: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
                      placeholder="https://..."
                    />
                  </FormField>

                  <FormField label="Description">
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron resize-none"
                      placeholder="Product description..."
                    />
                  </FormField>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.in_stock}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          in_stock: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-saffron"
                    />
                    <span className="text-sm font-medium text-charcoal">
                      In Stock
                    </span>
                  </label>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-5 py-3 border-2 border-charcoal/20 text-charcoal font-semibold rounded-xl hover:border-charcoal/40 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-5 py-3 bg-saffron text-white font-semibold rounded-xl hover:bg-[#d07a0b] transition-colors text-sm"
                    >
                      {editingProduct ? "Save Changes" : "Add Product"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
                <span className="text-4xl mb-4 block">🗑️</span>
                <h3 className="font-playfair text-xl font-bold text-charcoal mb-2">
                  Delete Product?
                </h3>
                <p className="text-charcoal/50 text-sm mb-6">
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-3 border-2 border-charcoal/20 text-charcoal font-semibold rounded-xl hover:border-charcoal/40 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 px-4 py-3 bg-crimson text-white font-semibold rounded-xl hover:bg-[#7e1527] transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-crimson ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
