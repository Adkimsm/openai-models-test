"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function ExportButton({ results, siteName }) {
  function handleExport() {
    const headers = ["站点名称", "模型名称", "状态", "延迟(ms)", "响应", "错误信息"]
    const rows = results.map((r) => [
      siteName,
      r.model,
      r.success ? "成功" : "失败",
      r.success ? r.latency : "",
      r.success ? r.response : "",
      r.success ? "" : r.error,
    ])

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join(
        "\n"
      )

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url

    const now = new Date()
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      "_",
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("")

    link.download = `模型测试结果_${timestamp}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function escapeCSV(value) {
    const str = String(value)
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={results.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      导出 CSV
    </Button>
  )
}
