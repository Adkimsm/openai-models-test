"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Download, Search, CheckSquare, Square } from "lucide-react"
import { getDisabledModels, saveDisabledModels } from "@/lib/db"

export default function ModelSelector({
  selectedSite,
  models,
  setModels,
  enabledModels,
  setEnabledModels,
  loading,
  onFetchModels,
}) {
  const [search, setSearch] = useState("")
  const [disabledModels, setDisabledModels] = useState({})

  useEffect(() => {
    const loadDisabled = async () => {
      const saved = await getDisabledModels(selectedSite?.apiBase)
      if (selectedSite?.apiBase && saved) {
        setDisabledModels((prev) => ({
          ...prev,
          [selectedSite.apiBase]: saved,
        }))
      }
    }
    if (selectedSite) {
      loadDisabled()
    }
  }, [selectedSite])

  function saveDisabled(newDisabled) {
    setDisabledModels(newDisabled)
    if (selectedSite?.apiBase) {
      saveDisabledModels(selectedSite.apiBase, newDisabled[selectedSite.apiBase] || [])
    }
  }

  function toggleModel(model) {
    if (!selectedSite) return

    const siteDisabled = disabledModels[selectedSite.apiBase] || []
    const isDisabled = siteDisabled.includes(model)

    let newSiteDisabled
    if (isDisabled) {
      newSiteDisabled = siteDisabled.filter((m) => m !== model)
    } else {
      newSiteDisabled = [...siteDisabled, model]
    }

    const newDisabled = {
      ...disabledModels,
      [selectedSite.apiBase]: newSiteDisabled,
    }
    saveDisabled(newDisabled)

    const newEnabled = models.filter(
      (m) => !(newDisabled[selectedSite.apiBase] || []).includes(m)
    )
    setEnabledModels(newEnabled)
  }

  function toggleAll() {
    if (!selectedSite) return

    const siteDisabled = disabledModels[selectedSite.apiBase] || []
    const allDisabled = models.every((m) => siteDisabled.includes(m))

    let newSiteDisabled
    if (allDisabled) {
      newSiteDisabled = []
    } else {
      newSiteDisabled = [...models]
    }

    const newDisabled = {
      ...disabledModels,
      [selectedSite.apiBase]: newSiteDisabled,
    }
    saveDisabled(newDisabled)

    if (allDisabled) {
      setEnabledModels([...models])
    } else {
      setEnabledModels([])
    }
  }

  const filteredModels = models.filter((m) =>
    m.toLowerCase().includes(search.toLowerCase())
  )

  const siteDisabled = selectedSite
    ? disabledModels[selectedSite.apiBase] || []
    : []
  const allDisabled = models.length > 0 && models.every((m) => siteDisabled.includes(m))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">模型选择</CardTitle>
            <CardDescription>
              {selectedSite
                ? `${selectedSite.name} - ${models.length} 个模型`
                : "请先选择站点"}
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={onFetchModels}
            disabled={!selectedSite || loading}
          >
            <Download className="h-4 w-4 mr-1" />
            获取模型
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!selectedSite ? (
          <p className="text-sm text-gray-9 text-center py-4">
            请先在左侧选择一个站点
          </p>
        ) : models.length === 0 ? (
          <p className="text-sm text-gray-9 text-center py-4">
            {loading ? "正在获取模型列表..." : "点击上方按钮获取模型列表"}
          </p>
        ) : (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-8" />
                <Input
                  placeholder="搜索模型..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="secondary" size="sm" onClick={toggleAll}>
                {allDisabled ? (
                  <CheckSquare className="h-4 w-4 mr-1" />
                ) : (
                  <Square className="h-4 w-4 mr-1" />
                )}
                {allDisabled ? "全选" : "全不选"}
              </Button>
            </div>

            <div className="text-xs text-gray-9">
              已启用: {models.length - siteDisabled.length} / {models.length}
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {filteredModels.map((model) => {
                const isDisabled = siteDisabled.includes(model)
                return (
                  <div
                    key={model}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-2"
                  >
                    <Label
                      htmlFor={`model-${model}`}
                      className={`text-sm cursor-pointer flex-1 truncate ${
                        isDisabled ? "text-gray-8 line-through" : "text-gray-12"
                      }`}
                    >
                      {model}
                    </Label>
                    <Switch
                      id={`model-${model}`}
                      checked={!isDisabled}
                      onCheckedChange={() => toggleModel(model)}
                    />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
