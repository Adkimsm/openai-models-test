"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Globe, Key, Settings2, Eye, EyeOff } from "lucide-react"
import { getSites, saveSite, deleteSite } from "@/lib/db"

export default function SiteManager({ selectedSite, onSelectSite }) {
  const [sites, setSites] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState(null)
  const [formData, setFormData] = useState({ name: "", apiBase: "", apiKey: "", modelsEndpoint: "/v1/models", chatEndpoint: "/v1/chat/completions" })
  const [apiKeyVisible, setApiKeyVisible] = useState(false)

  useEffect(() => {
    getSites().then((saved) => {
      if (saved) setSites(saved)
    })
  }, [])

  function saveSites(newSites) {
    setSites(newSites)
    newSites.forEach((site) => saveSite(site))
  }

  function handleAdd() {
    setEditingSite(null)
    setFormData({ name: "", apiBase: "", apiKey: "", modelsEndpoint: "/v1/models", chatEndpoint: "/v1/chat/completions" })
    setApiKeyVisible(false)
    setDialogOpen(true)
  }

  function handleEdit(site) {
    setEditingSite(site)
    setFormData({
      name: site.name,
      apiBase: site.apiBase,
      apiKey: site.apiKey,
      modelsEndpoint: site.modelsEndpoint || "/v1/models",
      chatEndpoint: site.chatEndpoint || "/v1/chat/completions",
    })
    setApiKeyVisible(false)
    setDialogOpen(true)
  }

  function handleDelete(siteId) {
    const newSites = sites.filter((s) => s.id !== siteId)
    setSites(newSites)
    deleteSite(siteId)
    if (selectedSite?.id === siteId) {
      onSelectSite(null)
    }
  }

  function handleSave() {
    if (!formData.name || !formData.apiBase || !formData.apiKey) return

    if (editingSite) {
      const updated = { ...editingSite, ...formData }
      const newSites = sites.map((s) =>
        s.id === editingSite.id ? updated : s
      )
      setSites(newSites)
      saveSite(updated)
      if (selectedSite?.id === editingSite.id) {
        onSelectSite(updated)
      }
    } else {
      const newSite = { id: crypto.randomUUID(), ...formData }
      const newSites = [...sites, newSite]
      setSites(newSites)
      saveSite(newSite)
    }

    setDialogOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">站点管理</CardTitle>
              <CardDescription>管理 API 站点配置</CardDescription>
            </div>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              添加
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {sites.length === 0 ? (
            <p className="text-sm text-gray-9 text-center py-4">
              暂无站点，请添加
            </p>
          ) : (
            sites.map((site) => (
              <div
                key={site.id}
                className={`p-3 rounded-lg border border-gray-4 cursor-pointer transition-colors ${
                  selectedSite?.id === site.id
                    ? "border-gray-12 bg-gray-12/5"
                    : "hover:bg-gray-2"
                }`}
                onClick={() => onSelectSite(site)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-12 truncate">{site.name}</div>
                    <div className="text-xs text-gray-9 flex items-center gap-1 mt-1">
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="truncate">{site.apiBase}</span>
                    </div>
                    <div className="text-xs text-gray-9 flex items-center gap-1 mt-0.5">
                      <Key className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {"•".repeat(8)}
                        {site.apiKey.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(site)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-11"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(site.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSite ? "编辑站点" : "添加站点"}</DialogTitle>
            <DialogDescription>
              配置 OpenAI 兼容 API 站点信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">站点名称</Label>
              <Input
                id="name"
                placeholder="例如：OpenAI 官方"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiBase">API 地址</Label>
              <Input
                id="apiBase"
                placeholder="例如：https://api.openai.com"
                value={formData.apiBase}
                onChange={(e) =>
                  setFormData({ ...formData, apiBase: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={apiKeyVisible ? "text" : "password"}
                  placeholder="sk-..."
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-9 hover:text-gray-12 transition-colors"
                >
                  {apiKeyVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <details className="group">
              <summary className="flex items-center gap-1.5 text-xs text-gray-9 cursor-pointer select-none hover:text-gray-12 transition-colors">
                <Settings2 className="h-3 w-3" />
                高级设置
                <svg
                  className="h-3 w-3 transition-transform group-open:rotate-90"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </summary>
              <div className="mt-3 space-y-3 pl-4 border-l border-gray-4">
                <div className="space-y-2">
                  <Label htmlFor="modelsEndpoint" className="text-xs text-gray-10">
                    模型列表地址
                  </Label>
                  <Input
                    id="modelsEndpoint"
                    placeholder="/v1/models"
                    value={formData.modelsEndpoint}
                    onChange={(e) =>
                      setFormData({ ...formData, modelsEndpoint: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chatEndpoint" className="text-xs text-gray-10">
                    Chat API 地址
                  </Label>
                  <Input
                    id="chatEndpoint"
                    placeholder="/v1/chat/completions"
                    value={formData.chatEndpoint}
                    onChange={(e) =>
                      setFormData({ ...formData, chatEndpoint: e.target.value })
                    }
                  />
                </div>
              </div>
            </details>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
