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
import { Plus, Pencil, Trash2, Globe, Key } from "lucide-react"

const STORAGE_KEY = "ai-test-sites"

function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

export default function SiteManager({ selectedSite, onSelectSite }) {
  const [sites, setSites] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState(null)
  const [formData, setFormData] = useState({ name: "", apiBase: "", apiKey: "" })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setSites(JSON.parse(saved))
      } catch {
        setSites([])
      }
    }
  }, [])

  function saveSites(newSites) {
    setSites(newSites)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSites))
  }

  function handleAdd() {
    setEditingSite(null)
    setFormData({ name: "", apiBase: "", apiKey: "" })
    setDialogOpen(true)
  }

  function handleEdit(site) {
    setEditingSite(site)
    setFormData({ name: site.name, apiBase: site.apiBase, apiKey: site.apiKey })
    setDialogOpen(true)
  }

  function handleDelete(siteId) {
    const newSites = sites.filter((s) => s.id !== siteId)
    saveSites(newSites)
    if (selectedSite?.id === siteId) {
      onSelectSite(null)
    }
  }

  function handleSave() {
    if (!formData.name || !formData.apiBase || !formData.apiKey) return

    if (editingSite) {
      const newSites = sites.map((s) =>
        s.id === editingSite.id ? { ...s, ...formData } : s
      )
      saveSites(newSites)
      if (selectedSite?.id === editingSite.id) {
        onSelectSite({ ...selectedSite, ...formData })
      }
    } else {
      const newSite = { id: generateId(), ...formData }
      const newSites = [...sites, newSite]
      saveSites(newSites)
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
            <p className="text-sm text-muted-foreground text-center py-4">
              暂无站点，请添加
            </p>
          ) : (
            sites.map((site) => (
              <div
                key={site.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedSite?.id === site.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelectSite(site)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{site.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="truncate">{site.apiBase}</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
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
                      className="h-8 w-8 text-destructive"
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
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
