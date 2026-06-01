"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // The reset link routes through /auth/callback, which exchanges the code for
  // a session. If we got here with a valid session, the user may set a new
  // password; otherwise the link was invalid or expired.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(!!user);
      setChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match. Please re-enter them.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Password updated! Redirecting you to sign in…");
        await supabase.auth.signOut();
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "#FDF6EC" }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #E8890C 25%,
            transparent 25%,
            transparent 75%,
            #E8890C 75%,
            #E8890C
          )`,
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="font-playfair text-3xl font-bold text-saffron mb-1">
                KurumKurum
              </h1>
              <p className="text-xs text-charcoal/40 uppercase tracking-widest">
                Premium Himalayan Bites
              </p>
            </Link>
          </div>

          <h2 className="font-playfair text-xl font-bold text-charcoal text-center mb-6">
            Choose a New Password
          </h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
              {message}
            </div>
          )}

          {checking ? (
            <p className="text-center text-sm text-charcoal/40 py-4">Loading…</p>
          ) : !hasSession ? (
            <div className="text-center">
              <p className="text-sm text-charcoal/60 mb-5">
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-saffron text-white font-semibold rounded-xl hover:bg-[#d07a0b] transition-colors text-sm"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-16 border border-charcoal/15 rounded-xl text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-saffron"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-4 flex items-center text-xs font-semibold text-saffron hover:underline"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-charcoal/15 rounded-xl text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-saffron text-white font-bold rounded-xl hover:bg-[#d07a0b] transition-colors mt-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Please wait…" : "Update Password"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-charcoal/30 mt-6">
          &copy; {new Date().getFullYear()} KurumKurum. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
