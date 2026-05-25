"use client";

import { motion } from "framer-motion";

const DEMO_ADMINS = [
  {
    id: "1",
    name: "Super Admin",
    email: "admin@kurumkurum.com",
    added: "2024-01-01",
    role: "Owner",
  },
];

export default function AdminAdminsPage() {
  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-playfair text-3xl font-bold text-charcoal">
          Admin Users
        </h1>
        <p className="text-charcoal/50 mt-1">
          Manage who has access to the admin panel
        </p>
      </motion.div>

      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-charcoal/5">
                {["Name", "Email", "Role", "Added"].map((h) => (
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
              {DEMO_ADMINS.map((admin) => (
                <tr
                  key={admin.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-charcoal">
                    {admin.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal/70">
                    {admin.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-saffron/10 text-saffron">
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal/50">
                    {admin.added}
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
