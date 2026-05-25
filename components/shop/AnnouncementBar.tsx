"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-[#C85A17] text-white overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex-1" />
            <p className="text-xs sm:text-sm font-medium text-center leading-snug">
              🔥 New Arrivals: Pahadi Titaura &amp; WaiWai Party Mix — Free shipping on orders over $50!
            </p>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setDismissed(true)}
                className="text-white/70 hover:text-white transition-colors p-1 rounded"
                aria-label="Dismiss announcement"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
