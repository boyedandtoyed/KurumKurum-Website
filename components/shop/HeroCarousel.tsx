"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import SearchBar from "@/components/shop/SearchBar";

const SLIDES = [
  {
    id: 1,
    tag: "New This Week",
    headline: "New Arrivals",
    subheadline: "Pahadi Products",
    description:
      "Fresh from the hills — Pahadi Titaura, Wild Honey, and more. Taste authentic Himalayan mountain life.",
    cta: "Shop New Arrivals",
    href: "/shop",
    gradient: "linear-gradient(135deg, #C85A17 0%, #a84512 50%, #7a3010 100%)",
  },
  {
    id: 2,
    tag: "Special Offer",
    headline: "WaiWai Noodle",
    subheadline: "Party Packs",
    description:
      "Stock up on Nepal's #1 noodle brand. Party packs available — perfect for gatherings.",
    cta: "Shop WaiWai",
    href: "/shop?category=instant-noodles",
    gradient: "linear-gradient(135deg, #2B2D2F 0%, #3d3f42 40%, #C85A17 100%)",
  },
  {
    id: 3,
    tag: "Spice Collection",
    headline: "Authentic",
    subheadline: "Himalayan Spices",
    description:
      "Century masala range — hand-ground spices from high-altitude farms. Elevate every dish.",
    cta: "Explore Spices",
    href: "/shop?category=spices-condiments",
    gradient: "linear-gradient(135deg, #9B1B30 0%, #7e1527 50%, #C85A17 100%)",
  },
];

const MOUNTAIN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpolygon points='0,320 200,120 400,220 600,80 800,180 1000,40 1200,160 1440,100 1440,320' fill='%23F7F4EB'/%3E%3C/svg%3E")`;

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const slide = SLIDES[current];

  const bgVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background layer */}
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={`bg-${slide.id}`}
          custom={direction}
          variants={bgVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.55, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{ background: slide.gradient }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: MOUNTAIN_SVG,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "bottom",
              backgroundSize: "cover",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Text content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`text-${slide.id}`}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto w-full"
        >
          <span className="inline-block bg-white/20 text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-5 backdrop-blur-sm">
            {slide.tag}
          </span>

          <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-1">
            {slide.headline}
          </h1>
          <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white/90 leading-tight mb-5">
            {slide.subheadline}
          </h2>

          <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            {slide.description}
          </p>

          <Link href={slide.href}>
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block bg-white text-saffron font-bold text-base px-9 py-3.5 rounded-xl shadow-xl hover:shadow-2xl transition-shadow cursor-pointer mb-8"
            >
              {slide.cta}
            </motion.span>
          </Link>

          {/* Hero search bar */}
          <div className="max-w-xl mx-auto">
            <SearchBar size="lg" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dot navigation */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-7 h-2.5 bg-white"
                : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Prev arrow */}
      <button
        onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/35 backdrop-blur-sm text-white p-2.5 rounded-full transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next arrow */}
      <button
        onClick={() => goTo((current + 1) % SLIDES.length)}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/35 backdrop-blur-sm text-white p-2.5 rounded-full transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </section>
  );
}
