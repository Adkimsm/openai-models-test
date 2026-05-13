"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import SiteManager from "@/components/SiteManager"
import ConversationList from "@/components/ConversationList"
import ModelPicker from "@/components/ModelPicker"
import ChatMessage from "@/components/ChatMessage"
import ChatInput from "@/components/ChatInput"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import {
  getConversations,
  getConversation,
  saveConversation,
  deleteConversation,
  getSetting,
  setSetting,
  getSite,
  getResults,
} from "@/lib/db"

function SidebarContent({
  selectedSite,
  setSelectedSite,
  setSelectedModel,
  selectedModel,
  conversations,
  activeId,
  handleSelectConversation,
  handleDeleteConversation,
  handleNewConversation,
  testResults,
}) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <SiteManager
          selectedSite={selectedSite}
          onSelectSite={(site) => {
            setSelectedSite(site)
            setSelectedModel("")
            setSetting("selectedSiteId", site?.id || null)
            setSetting("chatModel", null)
          }}
        />
      </div>
      <div className="px-3 py-2 border-t border-gray-4 shrink-0">
        <div className="text-xs text-gray-9 mb-1.5">对话模型</div>
        <ModelPicker
          selectedSite={selectedSite}
          selectedModel={selectedModel}
          results={testResults}
          onSelect={(model) => {
            setSelectedModel(model)
            setSetting("chatModel", model)
          }}
        />
      </div>
      <div className="border-t border-gray-4 h-[220px] shrink-0">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
          onNew={handleNewConversation}
        />
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [selectedSite, setSelectedSite] = useState(null)
  const [selectedModel, setSelectedModel] = useState("")
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [testResults, setTestResults] = useState([])
  const abortRef = useRef(null)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const skipNextLoadRef = useRef(false)

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark")
    setIsDark(dark)
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    getConversations().then(setConversations)
  }, [])

  useEffect(() => {
    Promise.all([getSetting("selectedSiteId"), getSetting("chatModel")]).then(
      async ([siteId, model]) => {
        if (siteId) {
          const site = await getSite(siteId)
          if (site) setSelectedSite(site)
        }
        if (model) setSelectedModel(model)
      }
    )
  }, [])

  useEffect(() => {
    if (!selectedSite) {
      setTestResults([])
      return
    }
    getResults(selectedSite.apiBase).then(setTestResults)
  }, [selectedSite])

  useEffect(() => {
    if (!activeId) {
      setMessages([])
      return
    }
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false
      return
    }
    getConversation(activeId).then((conv) => {
      if (conv) setMessages(conv.messages || [])
    })
  }, [activeId])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const persistConversation = useCallback(
    async (id, msgs) => {
      const conv = await getConversation(id)
      if (!conv) return
      conv.messages = msgs
      conv.updatedAt = Date.now()
      if (msgs.length > 0 && conv.title === "新对话") {
        const firstUserMsg = msgs.find((m) => m.role === "user")
        if (firstUserMsg) {
          const text = typeof firstUserMsg.content === "string"
            ? firstUserMsg.content
            : firstUserMsg.content.find((p) => p.type === "text")?.text || ""
          conv.title = text.slice(0, 30) || "新对话"
        }
      }
      await saveConversation(conv)
      const updated = await getConversations()
      setConversations(updated)
    },
    []
  )

  async function handleNewConversation() {
    const id = crypto.randomUUID()
    const conv = {
      id,
      title: "新对话",
      siteId: selectedSite?.id || "",
      model: selectedModel || "",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await saveConversation(conv)
    const updated = await getConversations()
    setConversations(updated)
    setActiveId(id)
    setMessages([])
    setSidebarOpen(false)
  }

  async function handleSelectConversation(id) {
    setActiveId(id)
    setSidebarOpen(false)
  }

  async function handleDeleteConversation(id) {
    if (!confirm("确定删除此对话？")) return
    await deleteConversation(id)
    const updated = await getConversations()
    setConversations(updated)
    if (activeId === id) {
      setActiveId(null)
      setMessages([])
    }
  }

  async function handleSend({ text, images }) {
    if (!selectedSite || !selectedModel) {
      alert("请先选择站点和模型")
      return
    }

    let convId = activeId
    if (!convId) {
      convId = crypto.randomUUID()
      const conv = {
        id: convId,
        title: "新对话",
        siteId: selectedSite.id,
        model: selectedModel,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await saveConversation(conv)
      skipNextLoadRef.current = true
      setActiveId(convId)
    }

    const userContent = []
    if (images && images.length > 0) {
      for (const img of images) {
        userContent.push({ type: "image_url", image_url: { url: img } })
      }
    }
    if (text) {
      userContent.push({ type: "text", text })
    }
    const userMessage = {
      role: "user",
      content: images && images.length > 0 ? userContent : text,
      timestamp: Date.now(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)

    const assistantMessage = {
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      streaming: true,
    }
    setMessages([...newMessages, assistantMessage])

    const apiMessages = newMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    setStreaming(true)
    abortRef.current = new AbortController()

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiBase: selectedSite.apiBase,
          apiKey: selectedSite.apiKey,
          chatEndpoint: selectedSite.chatEndpoint,
          model: selectedModel,
          messages: apiMessages,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "请求失败" }))
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data: ")) continue
          const data = trimmed.slice(6)
          if (data === "[DONE]") continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              accumulated += parsed.content
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: accumulated,
                }
                return updated
              })
            }
          } catch {
            // skip
          }
        }
      }

      const finalMessages = [...newMessages, { role: "assistant", content: accumulated, timestamp: Date.now() }]
      setMessages(finalMessages)
      await persistConversation(convId, finalMessages)
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: `错误: ${err.message}`,
            streaming: false,
          }
          return updated
        })
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  function handleStop() {
    if (abortRef.current) {
      abortRef.current.abort()
      setStreaming(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-1 overflow-hidden">
      {/* 移动端顶部工具栏 */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-gray-4 shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg hover:bg-gray-3 text-gray-11 hover:text-gray-12 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="text-sm font-medium text-gray-12 truncate">
          {activeId
            ? conversations.find((c) => c.id === activeId)?.title || "新对话"
            : "AI 对话"}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 桌面端左侧边栏 */}
        <div className="hidden md:flex w-64 border-r border-gray-4 flex-col shrink-0">
          <SidebarContent
            selectedSite={selectedSite}
            setSelectedSite={setSelectedSite}
            setSelectedModel={setSelectedModel}
            selectedModel={selectedModel}
            conversations={conversations}
            activeId={activeId}
            handleSelectConversation={handleSelectConversation}
            handleDeleteConversation={handleDeleteConversation}
            handleNewConversation={handleNewConversation}
            testResults={testResults}
          />
        </div>

        {/* 移动端侧边栏 Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <SheetHeader className="px-4 py-3">
              <SheetTitle>菜单</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden flex flex-col">
              <SidebarContent
                selectedSite={selectedSite}
                setSelectedSite={setSelectedSite}
                setSelectedModel={setSelectedModel}
                selectedModel={selectedModel}
                conversations={conversations}
                activeId={activeId}
                handleSelectConversation={handleSelectConversation}
                handleDeleteConversation={handleDeleteConversation}
                handleNewConversation={handleNewConversation}
                testResults={testResults}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* 右侧聊天区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-9 text-sm">选择或创建一个对话开始聊天</p>
                {!selectedSite && (
                  <p className="text-gray-9 text-xs mt-2">请先在左侧选择站点</p>
                )}
                {selectedSite && !selectedModel && (
                  <p className="text-gray-9 text-xs mt-2">请在顶部选择模型</p>
                )}
              </div>
            </div>
          ) : (
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} isDark={isDark} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          <ChatInput
            onSend={handleSend}
            disabled={!selectedSite || !selectedModel}
            streaming={streaming}
            onStop={handleStop}
          />
        </div>
      </div>
    </div>
  )
}
