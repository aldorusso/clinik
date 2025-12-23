"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "light" | "dark"
}

export function Logo({ className, size = "md", variant = "default" }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-[28px]",
    lg: "text-4xl",
  }

  const variantClasses = {
    default: "text-foreground",
    light: "text-sidebar-foreground",
    dark: "text-[#0E0E0F]",
  }

  return (
    <span
      className={cn(
        "font-bold tracking-tight",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      style={{ fontFamily: 'var(--font-logo)' }}
    >
      ClinicManager
    </span>
  )
}
