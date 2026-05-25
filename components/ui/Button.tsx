"use client";

import React from "react";

type Variant = "primary" | "secondary" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-saffron text-white hover:bg-[#d07a0b] active:bg-[#b86a09] shadow-sm",
  secondary:
    "bg-transparent border-2 border-saffron text-saffron hover:bg-saffron hover:text-white active:bg-[#d07a0b]",
  danger:
    "bg-crimson text-white hover:bg-[#7e1527] active:bg-[#6b1221] shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-5 py-2.5 text-base rounded-lg",
  lg: "px-8 py-3.5 text-lg rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-saffron focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
