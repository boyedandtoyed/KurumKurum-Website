"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderItem } from "@/types";

const STATUSES = ["pending", "processing", "shipped", "delivered"] as const;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const openOrder = async (order: Order) => {
    setSelected(order);
    setTracking(order.tracking_number ?? "");
    const supabase = createClient();
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    setItems((data as OrderItem[]) ?? []);
  };

  const patchOrder = async (id: string, update: Partial<Order>) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Update failed");
      return;
    }
    const saved = json.order as Order;
    setOrders((prev) => prev.map((o) => (o.id === saved.id ? saved : o)));
    setSelected((cur) => (cur && cur.id === saved.id ? saved : cur));
    toast.success("Order updated");
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-playfair text-3xl font-bold text-charcoal">Orders</h1>
        <p className="text-charcoal/50 mt-1">
          Manage and track all customer orders
        </p>
      </motion.div>

      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-charcoal/5">
                {["Order", "Customer", "Total", "Status", "Tracking", "Date"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-charcoal/40">
                    Loading orders…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-charcoal/40">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openOrder(order)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-saffron">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-charcoal">
                        {order.guest_name ?? "—"}
                      </p>
                      <p className="text-xs text-charcoal/40">
                        {order.guest_email ?? ""}
                      </p>
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
                    <td className="px-6 py-4 text-sm text-charcoal/60">
                      {order.tracking_number ?? (
                        <span className="text-charcoal/30 italic">None</span>
                      )}
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
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-playfair text-xl font-bold text-charcoal">
                  Order #{selected.id.slice(0, 8)}
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-full hover:bg-charcoal/5"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1 mb-6 text-sm">
                <p className="font-medium text-charcoal">{selected.guest_name}</p>
                <p className="text-charcoal/60">{selected.guest_email}</p>
                <p className="text-charcoal/60">{selected.guest_phone}</p>
              </div>

              <div className="bg-cream rounded-xl p-4 mb-6 text-sm text-charcoal/70">
                <p className="font-semibold text-charcoal/80 mb-1">Ship to</p>
                <p>{selected.shipping_address?.street}</p>
                <p>
                  {selected.shipping_address?.city},{" "}
                  {selected.shipping_address?.state}{" "}
                  {selected.shipping_address?.zip}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/40 mb-2">
                  Items
                </p>
                <div className="space-y-2">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="flex justify-between text-sm text-charcoal/70"
                    >
                      <span>
                        {(it.product_snapshot?.name ?? "Product")} × {it.quantity}
                      </span>
                      <span className="font-semibold">
                        ${(it.price_at_purchase * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-charcoal/10 font-bold text-charcoal">
                  <span>Total</span>
                  <span>${selected.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/40 mb-1.5">
                  Status
                </label>
                <select
                  value={selected.status}
                  onChange={(e) =>
                    patchOrder(selected.id, {
                      status: e.target.value as Order["status"],
                    })
                  }
                  className="w-full px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm bg-white capitalize"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/40 mb-1.5">
                  Tracking Number
                </label>
                <div className="flex gap-2">
                  <input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="e.g. USPS123…"
                    className="flex-1 px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm"
                  />
                  <button
                    onClick={() =>
                      patchOrder(selected.id, { tracking_number: tracking })
                    }
                    className="px-4 py-2.5 bg-saffron text-white font-semibold rounded-xl text-sm hover:bg-[#d07a0b]"
                  >
                    Save
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
