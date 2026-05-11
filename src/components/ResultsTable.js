"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

export default function ResultsTable({ results, siteName }) {
  const [sortField, setSortField] = useState("latency")
  const [sortDir, setSortDir] = useState("asc")
  const [filter, setFilter] = useState("all")

  const sortedResults = useMemo(() => {
    let filtered = [...results]

    if (filter === "success") {
      filtered = filtered.filter((r) => r.success)
    } else if (filter === "failed") {
      filtered = filtered.filter((r) => !r.success)
    }

    filtered.sort((a, b) => {
      if (sortField === "latency") {
        const aVal = a.success ? a.latency : Infinity
        const bVal = b.success ? b.latency : Infinity
        return sortDir === "asc" ? aVal - bVal : bVal - aVal
      }
      if (sortField === "model") {
        return sortDir === "asc"
          ? a.model.localeCompare(b.model)
          : b.model.localeCompare(a.model)
      }
      if (sortField === "status") {
        const aVal = a.success ? 0 : 1
        const bVal = b.success ? 0 : 1
        return sortDir === "asc" ? aVal - bVal : bVal - aVal
      }
      return 0
    })

    return filtered
  }, [results, sortField, sortDir, filter])

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  function SortIcon({ field }) {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    )
  }

  if (results.length === 0) return null

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg">测试结果</CardTitle>
            <CardDescription>
              {siteName} - {results.length} 个模型测试完成
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              全部 ({results.length})
            </Button>
            <Button
              variant={filter === "success" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilter("success")}
            >
              成功 ({successCount})
            </Button>
            <Button
              variant={filter === "failed" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilter("failed")}
            >
              失败 ({failCount})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("model")}
                >
                  模型名称
                  <SortIcon field="model" />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("status")}
                >
                  状态
                  <SortIcon field="status" />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("latency")}
                >
                  延迟 (ms)
                  <SortIcon field="latency" />
                </TableHead>
                <TableHead>响应</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResults.map((result) => (
                <TableRow key={result.model}>
                  <TableCell className="font-mono text-sm text-gray-12">
                    {result.model}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={result.success ? "default" : "destructive"}
                    >
                      {result.success ? "成功" : "失败"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-12">
                    {result.success ? (
                      <span className="font-mono">{result.latency}</span>
                    ) : (
                      <span className="text-gray-8">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-gray-9">
                    {result.success
                      ? result.response
                      : result.error}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-2">
          {sortedResults.map((result) => (
            <div
              key={result.model}
              className="p-3 rounded-lg border border-gray-4 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-gray-12 truncate flex-1">
                  {result.model}
                </span>
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "成功" : "失败"}
                </Badge>
              </div>
              {result.success && (
                <div className="text-xs text-gray-9">
                  延迟: <span className="font-mono">{result.latency}ms</span>
                </div>
              )}
              <div className="text-xs text-gray-9 truncate">
                {result.success ? result.response : result.error}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
