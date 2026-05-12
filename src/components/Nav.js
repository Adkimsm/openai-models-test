"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TestTube, MessageSquare } from "lucide-react"

export default function Nav() {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "模型测试", icon: TestTube },
    { href: "/chat", label: "AI 对话", icon: MessageSquare },
  ]

  return (
    <nav className="flex items-center gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-gray-3 text-gray-12"
                : "text-gray-9 hover:text-gray-12 hover:bg-gray-2"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
