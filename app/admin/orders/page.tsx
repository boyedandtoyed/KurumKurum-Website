"use client";

import { motion } from "framer-motion";

const DEMO_ORDERS = [
  {
    id: "ORD-001",
    customer: "Priya Sharma",
    email: "priya@example.com",
    items: 3,
    total: 24.97,
    status: "delivered" as const,
    date: "2024-12-20",
    tracking: "USPS12345678",
  },
  {
    id: "ORD-002",
    customer: "Rajesh Kumar",
    email: "rajesh@example.com",
    items: 5,
    total: 41.45,
    status: "shipped" as const,
    date: "2024-12-19",
    tracking: "USPS87654321",
  },
  {
    id: "ORD-003",
    customer: "Anita Patel",
    email: "anita@example.com",
    items: 2,
    total: 13.98,
    status: "processing" as const,
    date: "2024-12-19",
    tracking: null,
  },
  {
    id: "ORD-004",
    customer: "Ravi Thapa",
    email: "ravi@example.com",
    items: 8,
    total: 62.32,
    status: "pending" as const,
    date: "2024-12-18",
    tracking: null,
  },
  {
    id: "ORD-005",
    customer: "Sita Gurung",
    email: "sita@example.com",
    items: 1,
    total: 7.99,
    status: "pending" as const,
    date: "2024-12-18",
    tracking: null,
  },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
};

export default function AdminOrdersPage() {
  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-playfair text-3xl font-bold text-charcoal">
          Orders
        </h1>
        <p className="text-charcoal/50 mt-1">
          Manage and track all customer orders
        </p>
      </motion.div>

      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-charcoal/5">
                {["Order ID", "Customer", "Items", "Total", "Status", "Tracking", "Date"].map(
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
              {DEMO_ORDERS.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-saffron">
                    {order.id}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-charcoal">
                      {order.customer}
                    </p>
                    <p className="text-xs text-charcoal/40">{order.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal/60">
                    {order.items}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-charcoal">
                    ${order.total.toFixed(2)}
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
                    {order.tracking ?? (
                      <span className="text-charcoal/30 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal/50">
                    {order.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
