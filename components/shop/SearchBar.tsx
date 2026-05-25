"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SearchResult {
  id: string;
  name: string;
  brand: string;
  slug: string | null;
  image_url: string | null;
  price: number;
}

function getSlug(result: SearchResult) {
  return result.slug || result.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function SearchBar({
  className = "",
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "lg";
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("products")
          .select("id, name, brand, slug, image_url, price")
          .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
          .limit(8);
        setResults(data ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      setOpen(false);
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === "Escape") setOpen(false);
  }

  const inputBase =
    size === "lg"
      ? "w-full px-5 py-3.5 pl-11 text-base rounded-xl"
      : "w-full px-4 py-2 pl-9 text-sm rounded-lg";

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={size === "lg" ? "Search for snacks, brands…" : "Search snacks, brands…"}
          className={`${inputBase} bg-white border border-charcoal/15 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron text-charcoal placeholder:text-charcoal/40 transition-all`}
        />
        <svg
          className={`absolute top-1/2 -translate-y-1/2 text-charcoal/40 pointer-events-none ${size === "lg" ? "left-4 w-4 h-4" : "left-3 w-3.5 h-3.5"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal/60 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-charcoal/8 z-50 overflow-hidden">
          {loading && (
            <div className="p-4 text-sm text-charcoal/50 text-center">Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-4 text-sm text-charcoal/50 text-center">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {!loading && results.length > 0 && (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((result) => (
                <li key={result.id}>
                  <Link
                    href={`/product/${getSlug(result)}`}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-cream flex-shrink-0 border border-charcoal/8">
                      <Image
                        src={result.image_url || "https://placehold.co/40x40/C85A17/F7F4EB?text=KK"}
                        alt={result.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-charcoal/50 uppercase tracking-wide">{result.brand}</p>
                      <p className="text-sm font-medium text-charcoal truncate">{result.name}</p>
                    </div>
                    <span className="text-sm font-bold text-saffron flex-shrink-0">
                      ${result.price.toFixed(2)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-2 bg-cream/60 border-t border-charcoal/8">
            <Link
              href={`/shop?q=${encodeURIComponent(query)}`}
              onClick={() => setOpen(false)}
              className="text-xs text-saffron font-semibold hover:underline"
            >
              See all results for &ldquo;{query}&rdquo; →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
