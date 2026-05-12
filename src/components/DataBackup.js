"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Download, Upload, AlertTriangle } from "lucide-react"
import { exportData, parseImportFile, getImportPreview, importData } from "@/lib/backup"

export default function DataBackup() {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [importData_, setImportData_] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  function handleBackup() {
    exportData()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    setStats(null)
    setLoading(true)

    parseImportFile(file)
      .then((parsed) => {
        setImportData_(parsed)
        setPreview(getImportPreview(parsed))
        setOpen(true)
      })
      .catch((err) => {
        alert(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  function handleConfirmImport() {
    if (!importData_) return
    setLoading(true)

    importData(importData_)
      .then((result) => {
        setStats(result)
        setTimeout(() => {
          setOpen(false)
          setPreview(null)
          setImportData_(null)
          setStats(null)
          window.location.reload()
        }, 1500)
      })
      .catch((err) => {
        alert(`导入失败: ${err.message}`)
        setLoading(false)
      })
  }

  function handleClose() {
    setOpen(false)
    setPreview(null)
    setImportData_(null)
    setStats(null)
  }

  const totalPreview = preview
    ? preview.sites + preview.models + preview.conversations + preview.results
    : 0

  return (
    <>
      <Button variant="ghost" size="icon" onClick={handleBackup} title="备份配置">
        <Download className="h-4 w-4" />
      </Button>

      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        title="恢复配置"
      >
        <Upload className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {stats ? (
            <>
              <DialogHeader>
                <DialogTitle>恢复完成</DialogTitle>
                <DialogDescription>数据已成功导入</DialogDescription>
              </DialogHeader>
              <div className="space-y-1 text-sm text-gray-11 py-2">
                {stats.sites && (stats.sites.added > 0 || stats.sites.updated > 0) && (
                  <p>站点配置: 新增 {stats.sites.added} 个，更新 {stats.sites.updated} 个</p>
                )}
                {stats.settings && (stats.settings.added > 0 || stats.settings.updated > 0) && (
                  <p>设置项: 新增 {stats.settings.added} 个，更新 {stats.settings.updated} 个</p>
                )}
                {stats.models && (stats.models.added > 0 || stats.models.updated > 0) && (
                  <p>模型缓存: 新增 {stats.models.added} 个，更新 {stats.models.updated} 个</p>
                )}
                {stats.disabledModels && (stats.disabledModels.added > 0 || stats.disabledModels.updated > 0) && (
                  <p>禁用模型: 新增 {stats.disabledModels.added} 个，更新 {stats.disabledModels.updated} 个</p>
                )}
                {stats.results && (stats.results.added > 0 || stats.results.updated > 0) && (
                  <p>测试结果: 新增 {stats.results.added} 个，更新 {stats.results.updated} 个</p>
                )}
                {stats.conversations && (stats.conversations.added > 0 || stats.conversations.updated > 0) && (
                  <p>聊天记录: 新增 {stats.conversations.added} 条，更新 {stats.conversations.updated} 条</p>
                )}
              </div>
            </>
          ) : preview ? (
            <>
              <DialogHeader>
                <DialogTitle>恢复配置</DialogTitle>
                <DialogDescription>
                  {preview.exportedAt
                    ? `备份导出时间: ${new Date(preview.exportedAt).toLocaleString("zh-CN")}`
                    : "未知导出时间"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="text-sm text-gray-11 space-y-1">
                  {preview.sites > 0 && <p>站点配置: {preview.sites} 个</p>}
                  {preview.models > 0 && <p>模型缓存: {preview.models} 个站点</p>}
                  {preview.disabledModels > 0 && <p>禁用模型: {preview.disabledModels} 个站点</p>}
                  {preview.settings > 0 && <p>设置项: {preview.settings} 个</p>}
                  {preview.results > 0 && <p>测试结果: {preview.results} 个站点</p>}
                  {preview.conversations > 0 && <p>聊天记录: {preview.conversations} 条</p>}
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-3 border border-amber-6 text-amber-12 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">注意</p>
                    <p className="text-amber-11 mt-0.5">
                      备份文件包含 API Key，请注意文件安全。恢复操作将合并现有数据，不会删除已有配置。
                    </p>
                  </div>
                </div>

                {totalPreview === 0 && (
                  <p className="text-sm text-gray-9 text-center py-2">备份文件中没有可导入的数据</p>
                )}
              </div>

              <DialogFooter>
                <Button variant="secondary" onClick={handleClose}>
                  取消
                </Button>
                <Button onClick={handleConfirmImport} disabled={loading || totalPreview === 0}>
                  {loading ? "导入中..." : "确认恢复"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
