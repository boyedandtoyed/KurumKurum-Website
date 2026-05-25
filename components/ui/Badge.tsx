"use client";

import React from "react";

type BadgeColor = "saffron" | "crimson" | "green" | "gray";

interface BadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
  className?: string;
}

const colorClasses: Record<BadgeColor, string> = {
  saffron: "bg-saffron/15 text-saffron border border-saffron/30",
  crimson: "bg-crimson/15 text-crimson border border-crimson/30",
  green: "bg-green-100 text-green-700 border border-green-300",
  gray: "bg-gray-100 text-gray-600 border border-gray-300",
};

export default function Badge({
  color = "saffron",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
        ${colorClasses[color]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
