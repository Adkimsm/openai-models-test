"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Play, Square, Settings2 } from "lucide-react"

const SETTINGS_KEY = "ai-test-settings"

export default function TestRunner({
  selectedSite,
  enabledModels,
  onTest,
  testing,
  progress,
  onCancel,
}) {
  const [concurrency, setConcurrency] = useState(50)
  const [timeout, setTimeout_] = useState(20000)
  const [testPrompt, setTestPrompt] = useState("hi")
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        if (settings.concurrency) setConcurrency(settings.concurrency)
        if (settings.timeout) setTimeout_(settings.timeout)
        if (settings.testPrompt) setTestPrompt(settings.testPrompt)
      } catch {
        // use defaults
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ concurrency, timeout, testPrompt })
    )
  }, [concurrency, timeout, testPrompt])

  function handleTest() {
    onTest({ concurrency, timeout, testPrompt })
  }

  const progressPercent =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">测试控制</CardTitle>
            <CardDescription>
              {testing
                ? `测试中... ${progress.completed}/${progress.total}`
                : `已启用 ${enabledModels.length} 个模型`}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSettings && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-2 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="concurrency" className="text-xs">
                并发数
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="concurrency"
                  type="number"
                  min={1}
                  max={200}
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value) || 1)}
                  className="h-8"
                />
                <div className="flex gap-1">
                  {[10, 50, 100].map((v) => (
                    <Button
                      key={v}
                      variant={concurrency === v ? "primary" : "secondary"}
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setConcurrency(v)}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout" className="text-xs">
                超时 (秒)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="timeout"
                  type="number"
                  min={1}
                  max={120}
                  value={timeout / 1000}
                  onChange={(e) =>
                    setTimeout_(Number(e.target.value) * 1000 || 20000)
                  }
                  className="h-8"
                />
                <div className="flex gap-1">
                  {[5, 20, 60].map((v) => (
                    <Button
                      key={v}
                      variant={timeout === v * 1000 ? "primary" : "secondary"}
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setTimeout_(v * 1000)}
                    >
                      {v}s
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="testPrompt" className="text-xs">
                测试提示词
              </Label>
              <Input
                id="testPrompt"
                placeholder="hi"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
        )}

        {testing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-9">进度</span>
              <span className="text-gray-12">
                {progress.completed} / {progress.total}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-xs text-gray-9">
              <span>
                成功: {progress.success} | 失败: {progress.failed}
              </span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {testing ? (
            <Button
              variant="error"
              className="flex-1"
              onClick={onCancel}
            >
              <Square className="h-4 w-4 mr-2" />
              停止测试
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleTest}
              disabled={!selectedSite || enabledModels.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              开始测试 ({enabledModels.length} 个模型)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
