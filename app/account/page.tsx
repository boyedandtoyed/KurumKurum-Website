"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Navbar from "@/components/shop/Navbar";
import Footer from "@/components/shop/Footer";
import { createClient } from "@/lib/supabase/client";
import { Order, ProfileAddress } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
};

const EMPTY_ADDRESS: ProfileAddress = {
  street: "",
  city: "",
  state: "",
  zip: "",
};

export default function AccountPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<ProfileAddress>(EMPTY_ADDRESS);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?redirect=/account");
        return;
      }

      setEmail(user.email ?? "");

      const [{ data: profile }, { data: orderRows }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, phone, address")
          .eq("id", user.id)
          .single(),
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      setFullName(profile?.full_name ?? "");
      setPhone(profile?.phone ?? "");
      setAddress({ ...EMPTY_ADDRESS, ...(profile?.address ?? {}) });
      setOrders((orderRows as Order[]) ?? []);
      setChecking(false);
    }
    load();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?redirect=/account");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, address })
        .eq("id", user.id);
      if (error) throw new Error(error.message);

      // Keep the auth metadata name in sync so the navbar greeting updates.
      await supabase.auth.updateUser({ data: { full_name: fullName } });

      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center text-charcoal/40">
          Loading your account…
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="font-playfair text-3xl font-bold text-charcoal mb-1">
            My Account
          </h1>
          <p className="text-charcoal/50 text-sm">{email}</p>
        </motion.div>

        {/* Profile details */}
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6 sm:p-8 mb-10"
        >
          <h2 className="font-playfair text-xl font-bold text-charcoal mb-5">
            Profile Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="input"
              />
            </Field>

            <Field label="Phone">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="input"
              />
            </Field>

            <Field label="Street Address" full>
              <input
                type="text"
                value={address.street}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, street: e.target.value }))
                }
                placeholder="123 Main Street, Apt 4B"
                className="input"
              />
            </Field>

            <Field label="City">
              <input
                type="text"
                value={address.city}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, city: e.target.value }))
                }
                placeholder="New York"
                className="input"
              />
            </Field>

            <Field label="State">
              <input
                type="text"
                value={address.state}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, state: e.target.value }))
                }
                placeholder="NY"
                className="input"
              />
            </Field>

            <Field label="ZIP Code">
              <input
                type="text"
                value={address.zip}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, zip: e.target.value }))
                }
                placeholder="10001"
                className="input"
              />
            </Field>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-saffron text-white font-semibold rounded-xl hover:bg-[#d07a0b] transition-colors text-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Order history */}
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
          <div className="px-6 py-5 border-b border-charcoal/5">
            <h2 className="font-playfair text-xl font-bold text-charcoal">
              Order History
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="text-4xl mb-3 block">🧾</span>
              <p className="text-charcoal/50 text-sm mb-4">
                You haven&apos;t placed any orders yet.
              </p>
              <Link
                href="/shop"
                className="inline-block px-5 py-2.5 bg-saffron text-white font-semibold rounded-xl hover:bg-[#d07a0b] transition-colors text-sm"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-charcoal/5">
                    {["Order", "Total", "Status", "Date"].map((h) => (
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
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-saffron">
                        #{order.id.slice(0, 8)}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
