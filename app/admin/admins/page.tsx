"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/admins");
    const json = await res.json();
    if (res.ok) setAdmins(json.admins);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const promote = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not add admin");
      toast.success("Admin added");
      setEmail("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add admin");
    } finally {
      setAdding(false);
    }
  };

  const revoke = async (id: string) => {
    const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Could not remove admin");
      return;
    }
    toast.success("Admin removed");
    setAdmins((prev) => prev.filter((a) => a.id !== id));
  };

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

      <form onSubmit={promote} className="flex gap-3 mb-6 max-w-md">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="user@email.com"
          className="flex-1 px-4 py-2.5 border border-charcoal/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
        />
        <button
          type="submit"
          disabled={adding}
          className="px-5 py-2.5 bg-saffron text-white font-semibold rounded-xl hover:bg-[#d07a0b] transition-colors text-sm disabled:opacity-60"
        >
          {adding ? "Adding…" : "Add Admin"}
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-charcoal/5">
                {["Name", "Email", "Added", ""].map((h) => (
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
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-charcoal/40">
                    Loading…
                  </td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">
                      {a.full_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal/70">
                      {a.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal/50">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => revoke(a.id)}
                        className="text-xs font-semibold text-crimson hover:text-[#7e1527] transition-colors px-2 py-1 rounded-lg hover:bg-crimson/5"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
