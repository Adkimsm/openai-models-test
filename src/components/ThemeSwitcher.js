"use client"

import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved) {
      setTheme(saved)
      document.documentElement.classList.toggle("dark", saved === "dark")
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(prefersDark ? "dark" : "light")
      document.documentElement.classList.toggle("dark", prefersDark)
    }
  }, [])

  function toggle() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem("theme", next)
    document.documentElement.classList.toggle("dark", next === "dark")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}
