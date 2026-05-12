"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Check } from "lucide-react"
import { getModels } from "@/lib/db"

export default function ModelPicker({ selectedSite, selectedModel, onSelect }) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!selectedSite) return
    setLoading(true)
    getModels(selectedSite.apiBase).then((cached) => {
      if (cached && cached.length > 0) {
        setModels(cached)
      } else {
        fetchModels()
      }
      setLoading(false)
    })
  }, [selectedSite])

  async function fetchModels() {
    if (!selectedSite) return
    setLoading(true)
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiBase: selectedSite.apiBase,
          apiKey: selectedSite.apiKey,
          modelsEndpoint: selectedSite.modelsEndpoint,
        }),
      })
      const data = await res.json()
      if (res.ok && data.models) {
        setModels(data.models)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const filtered = models.filter((m) =>
    m.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={!selectedSite || loading}
        className="max-w-[200px] truncate"
      >
        <span className="truncate">
          {loading ? "加载中..." : selectedModel || "选择模型"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 ml-1 shrink-0" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 w-72 bg-gray-1 border border-gray-4 rounded-xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-4">
              <Input
                placeholder="搜索模型..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-3 text-sm text-gray-9 text-center">
                  {models.length === 0 ? "暂无模型，请先获取" : "无匹配结果"}
                </div>
              ) : (
                filtered.map((model) => (
                  <button
                    key={model}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-3 transition-colors ${
                      selectedModel === model ? "bg-gray-3 text-gray-12" : "text-gray-11"
                    }`}
                    onClick={() => {
                      onSelect(model)
                      setOpen(false)
                      setSearch("")
                    }}
                  >
                    <span className="truncate flex-1">{model}</span>
                    {selectedModel === model && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-blue-11" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
