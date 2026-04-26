"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * Provides chart-compatible color values that adapt to the current theme.
 * Resolves CSS HSL variables into hex strings for Recharts.
 */
export function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const [colors, setColors] = useState(getDefaultColors("light"))

  useEffect(() => {
    // Resolve actual computed colors from CSS variables
    const root = document.documentElement
    const computedStyle = getComputedStyle(root)

    const resolveHSL = (varName: string): string => {
      const hsl = computedStyle.getPropertyValue(varName).trim()
      if (!hsl) return "#8B4513"
      return `hsl(${hsl})`
    }

    setColors({
      primary: resolveHSL("--primary"),
      accent: resolveHSL("--accent"),
      info: resolveHSL("--info"),
      success: resolveHSL("--success"),
      warning: resolveHSL("--warning"),
      destructive: resolveHSL("--destructive"),
      foreground: resolveHSL("--foreground"),
      muted: resolveHSL("--muted-foreground"),
      card: resolveHSL("--card"),
      border: resolveHSL("--border"),
      grid: resolvedTheme === "dark" ? "#374151" : "#E5E7EB",
      tooltip: {
        bg: resolveHSL("--card"),
        border: resolveHSL("--border"),
        text: resolveHSL("--foreground"),
      },
    })
  }, [resolvedTheme])

  return colors
}

function getDefaultColors(theme: string) {
  const isDark = theme === "dark"
  return {
    primary: isDark ? "hsl(28 47% 65%)" : "hsl(25 75% 31%)",
    accent: isDark ? "hsl(43 80% 50%)" : "hsl(43 90% 38%)",
    info: "hsl(217 91% 60%)",
    success: "hsl(142 71% 45%)",
    warning: "hsl(48 96% 47%)",
    destructive: "hsl(0 84% 60%)",
    foreground: isDark ? "hsl(40 20% 97%)" : "hsl(20 14% 9%)",
    muted: isDark ? "hsl(25 6% 45%)" : "hsl(28 7% 51%)",
    card: isDark ? "hsl(20 14% 9%)" : "hsl(0 0% 100%)",
    border: isDark ? "hsl(20 6% 15%)" : "hsl(32 20% 88%)",
    grid: isDark ? "#374151" : "#E5E7EB",
    tooltip: {
      bg: isDark ? "hsl(20 14% 9%)" : "hsl(0 0% 100%)",
      border: isDark ? "hsl(20 6% 15%)" : "hsl(32 20% 88%)",
      text: isDark ? "hsl(40 20% 97%)" : "hsl(20 14% 9%)",
    },
  }
}
