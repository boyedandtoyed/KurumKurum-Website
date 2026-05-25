"use client";

import { motion } from "framer-motion";

const DEMO_STATS = [
  { label: "Total Orders", value: "142", icon: "📦", color: "saffron" },
  { label: "Revenue", value: "$4,823", icon: "💰", color: "green" },
  { label: "Products", value: "38", icon: "🛍️", color: "crimson" },
  { label: "Pending Orders", value: "7", icon: "⏳", color: "amber" },
];

const DEMO_ORDERS = [
  {
    id: "ORD-001",
    customer: "Priya Sharma",
    items: 3,
    total: 24.97,
    status: "delivered" as const,
    date: "2024-12-20",
  },
  {
    id: "ORD-002",
    customer: "Rajesh Kumar",
    items: 5,
    total: 41.45,
    status: "shipped" as const,
    date: "2024-12-19",
  },
  {
    id: "ORD-003",
    customer: "Anita Patel",
    items: 2,
    total: 13.98,
    status: "processing" as const,
    date: "2024-12-19",
  },
  {
    id: "ORD-004",
    customer: "Ravi Thapa",
    items: 8,
    total: 62.32,
    status: "pending" as const,
    date: "2024-12-18",
  },
  {
    id: "ORD-005",
    customer: "Sita Gurung",
    items: 1,
    total: 7.99,
    status: "pending" as const,
    date: "2024-12-18",
  },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
};

export default function AdminDashboard() {
  return (
    <div className="p-8">
      {/* Header */}
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {DEMO_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/5"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{stat.icon}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-saffron/10 text-saffron">
                Active
              </span>
            </div>
            <p className="text-3xl font-bold text-charcoal mb-1">
              {stat.value}
            </p>
            <p className="text-sm text-charcoal/50">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
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
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                  Date
                </th>
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
                  <td className="px-6 py-4 text-sm text-charcoal font-medium">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal/60">
                    {order.items} item{order.items !== 1 ? "s" : ""}
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
                  <td className="px-6 py-4 text-sm text-charcoal/50">
                    {order.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
