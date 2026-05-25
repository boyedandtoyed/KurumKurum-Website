"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auth integration in Phase 2
    console.log("Auth submit", { email, password, name, isRegister });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "#FDF6EC" }}
    >
      {/* Background pattern */}
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
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
          {/* Logo */}
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
            {isRegister ? "Create an Account" : "Welcome Back"}
          </h2>

          {/* Google button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-charcoal/15 rounded-xl text-sm font-semibold text-charcoal hover:bg-gray-50 transition-colors shadow-sm mb-5"
          >
            {/* Google SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-charcoal/10" />
            <span className="text-xs text-charcoal/40 font-medium">or</span>
            <div className="flex-1 h-px bg-charcoal/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegister}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 border border-charcoal/15 rounded-xl text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-charcoal/15 rounded-xl text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-saffron"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-charcoal/15 rounded-xl text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-saffron"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-saffron text-white font-bold rounded-xl hover:bg-[#d07a0b] transition-colors mt-2 shadow-sm"
            >
              {isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-charcoal/50 mt-5">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setIsRegister(false)}
                  className="text-saffron font-semibold hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setIsRegister(true)}
                  className="text-saffron font-semibold hover:underline"
                >
                  Register
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-xs text-charcoal/30 mt-6">
          &copy; {new Date().getFullYear()} KurumKurum. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
