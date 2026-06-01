"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [ordersJson, { count }] = await Promise.all([
        fetch("/api/admin/orders").then((r) => r.json()),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true }),
      ]);
      setOrders((ordersJson.orders as Order[]) ?? []);
      setProductCount(count ?? 0);
      setLoading(false);
    }
    load();
  }, []);

  const revenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const pending = orders.filter((o) => o.status === "pending").length;

  const stats = [
    { label: "Total Orders", value: String(orders.length), icon: "📦" },
    { label: "Revenue", value: `$${revenue.toFixed(2)}`, icon: "💰" },
    { label: "Products", value: String(productCount), icon: "🛍️" },
    { label: "Pending Orders", value: String(pending), icon: "⏳" },
  ];

  const recent = orders.slice(0, 5);

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-playfair text-3xl font-bold text-charcoal">
          Dashboard
        </h1>
        <p className="text-charcoal/50 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with KurumKurum.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/5"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-charcoal mb-1">
              {loading ? "…" : stat.value}
            </p>
            <p className="text-sm text-charcoal/50">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-charcoal/5">
          <h2 className="font-playfair text-xl font-bold text-charcoal">
            Recent Orders
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {["Order", "Customer", "Total", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-charcoal/40">
                    {loading ? "Loading…" : "No orders yet."}
                  </td>
                </tr>
              ) : (
                recent.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-saffron">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal font-medium">
                      {order.guest_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-charcoal">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          STATUS_STYLES[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal/50">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
