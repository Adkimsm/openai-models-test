"use client"

import { useState, useRef } from "react"
import SiteManager from "@/components/SiteManager"
import ModelSelector from "@/components/ModelSelector"
import TestRunner from "@/components/TestRunner"
import ResultsTable from "@/components/ResultsTable"
import ExportButton from "@/components/ExportButton"
import Footer from "@/components/Footer"

export default function Home() {
  const [selectedSite, setSelectedSite] = useState(null)
  const [models, setModels] = useState([])
  const [enabledModels, setEnabledModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState([])
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    success: 0,
    failed: 0,
  })
  const abortRef = useRef(false)

  async function handleFetchModels() {
    if (!selectedSite) return

    setLoading(true)
    setModels([])
    setEnabledModels([])
    setResults([])

    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiBase: selectedSite.apiBase,
          apiKey: selectedSite.apiKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "获取模型列表失败")
        return
      }

      setModels(data.models)
      setEnabledModels(data.models)
    } catch (error) {
      alert(`网络错误: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleTest({ concurrency, timeout }) {
    if (!selectedSite || enabledModels.length === 0) return

    setTesting(true)
    setResults([])
    abortRef.current = false

    setProgress({
      total: enabledModels.length,
      completed: 0,
      success: 0,
      failed: 0,
    })

    const batchSize = concurrency
    const batches = []
    for (let i = 0; i < enabledModels.length; i += batchSize) {
      batches.push(enabledModels.slice(i, i + batchSize))
    }

    const allResults = []

    for (const batch of batches) {
      if (abortRef.current) break

      try {
        const response = await fetch("/api/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiBase: selectedSite.apiBase,
            apiKey: selectedSite.apiKey,
            models: batch,
            timeout,
            concurrency: batch.length,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          alert(data.error || "测试失败")
          break
        }

        allResults.push(...data.results)
        setResults([...allResults])

        setProgress((prev) => ({
          total: prev.total,
          completed: prev.completed + batch.length,
          success:
            prev.success + data.results.filter((r) => r.success).length,
          failed:
            prev.failed + data.results.filter((r) => !r.success).length,
        }))
      } catch (error) {
        alert(`网络错误: ${error.message}`)
        break
      }
    }

    setTesting(false)
  }

  function handleCancel() {
    abortRef.current = true
    setTesting(false)
  }

  return (
    <div className="min-h-screen bg-gray-1">
      <header className="border-b border-gray-4">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-heading-24 font-bold text-gray-12">AI 模型可用性测试</h1>
          <p className="text-sm text-gray-9 mt-1">
            测试 OpenAI 兼容 API 的模型可用性和响应速度
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧 - 站点管理 */}
          <div className="lg:col-span-3">
            <SiteManager
              selectedSite={selectedSite}
              onSelectSite={(site) => {
                setSelectedSite(site)
                setModels([])
                setEnabledModels([])
                setResults([])
              }}
            />
          </div>

          {/* 右侧 - 模型选择 + 测试控制 + 结果 */}
          <div className="lg:col-span-9 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModelSelector
                selectedSite={selectedSite}
                models={models}
                setModels={setModels}
                enabledModels={enabledModels}
                setEnabledModels={setEnabledModels}
                loading={loading}
                onFetchModels={handleFetchModels}
              />

              <TestRunner
                selectedSite={selectedSite}
                enabledModels={enabledModels}
                onTest={handleTest}
                testing={testing}
                progress={progress}
                onCancel={handleCancel}
              />
            </div>

            <div className="flex justify-end">
              <ExportButton
                results={results}
                siteName={selectedSite?.name || ""}
              />
            </div>

            <ResultsTable results={results} siteName={selectedSite?.name || ""} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
