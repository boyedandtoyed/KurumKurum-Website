"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import AnnouncementBar from "@/components/shop/AnnouncementBar";
import SearchBar from "@/components/shop/SearchBar";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const shadowOpacity = useTransform(scrollY, [0, 50], [0, 1]);

  const { totalItems, openCart } = useCartStore();
  const itemCount = totalItems();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="sticky top-0 z-50">
      <AnnouncementBar />

      <motion.header
        className="bg-white/95 backdrop-blur-sm"
        style={{
          boxShadow: useTransform(
            shadowOpacity,
            (v) => `0 2px 20px rgba(43,45,47,${v * 0.1})`
          ),
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main row: Logo | Search | Actions */}
          <div className="flex items-center gap-4 h-14">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 hover:opacity-85 transition-opacity">
              <img src="/logo.svg" alt="KurumKurum" className="h-10 w-auto" />
            </Link>

            {/* Search — center, hidden on mobile */}
            <div className="flex-1 hidden md:block max-w-lg mx-auto">
              <SearchBar />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto md:ml-0">
              <button
                onClick={openCart}
                className="relative p-2 rounded-full hover:bg-saffron/10 transition-colors"
                aria-label="Open cart"
              >
                <CartIcon />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-saffron text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </button>

              <Link
                href="/login"
                className="hidden sm:flex items-center text-sm font-semibold text-charcoal/80 hover:text-saffron transition-colors border border-charcoal/20 hover:border-saffron px-3.5 py-1.5 rounded-lg"
              >
                Sign In
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-saffron/10 transition-colors"
                aria-label="Toggle menu"
              >
                <HamburgerIcon open={mobileOpen} />
              </button>
            </div>
          </div>

          {/* Secondary nav row — category links, desktop only */}
          <nav className="hidden md:flex items-center gap-6 h-9 border-t border-charcoal/8">
            {[
              { href: "/shop", label: "All Products" },
              { href: "/shop?category=chips-crisps", label: "Chips & Crisps" },
              { href: "/shop?category=instant-noodles", label: "Noodles" },
              { href: "/shop?category=sweets-mithai", label: "Sweets" },
              { href: "/shop?category=spices-condiments", label: "Spices" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs font-medium text-charcoal/60 hover:text-saffron transition-colors whitespace-nowrap"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-charcoal/10 px-4 py-3 space-y-1"
          >
            {/* Mobile search */}
            <div className="mb-3">
              <SearchBar />
            </div>
            {[
              { href: "/shop", label: "All Products" },
              { href: "/shop?category=chips-crisps", label: "Chips & Crisps" },
              { href: "/shop?category=instant-noodles", label: "Instant Noodles" },
              { href: "/shop?category=sweets-mithai", label: "Sweets & Mithai" },
              { href: "/shop?category=spices-condiments", label: "Spices" },
              { href: "/login", label: "Sign In" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-charcoal/80 hover:text-saffron hover:bg-saffron/5 rounded-lg transition-colors"
              >
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </motion.header>
    </div>
  );
}

function CartIcon() {
  return (
    <svg className="w-5 h-5 text-charcoal/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg className="w-5 h-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      )}
    </svg>
  );
}
