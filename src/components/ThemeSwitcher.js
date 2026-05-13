"use client"

import { useState, useEffect, useCallback } from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"

const STORAGE_KEY = "theme"

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(mode) {
  const dark = mode === "dark" || (mode === "system" && getSystemTheme() === "dark")
  document.documentElement.classList.toggle("dark", dark)
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState("system")
  const [mounted, setMounted] = useState(false)

  const handleChange = useCallback((mode) => {
    setTheme(mode)
    if (mode === "system") {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, mode)
    }
    applyTheme(mode)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const initial = saved === "light" || saved === "dark" ? saved : "system"
    setTheme(initial)
    applyTheme(initial)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const listener = () => applyTheme("system")
    mq.addEventListener("change", listener)
    return () => mq.removeEventListener("change", listener)
  }, [theme])

  const icons = {
    system: <Monitor className="h-4 w-4" />,
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="切换主题" />}
      >
        {mounted ? icons[theme] : <Monitor className="h-4 w-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={handleChange}
        >
          <DropdownMenuRadioItem value="system">
            <Monitor className="h-4 w-4" />
            跟随系统
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">
            <Sun className="h-4 w-4" />
            浅色
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="h-4 w-4" />
            深色
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
