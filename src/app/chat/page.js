"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import SiteManager from "@/components/SiteManager"
import ConversationList from "@/components/ConversationList"
import ModelPicker from "@/components/ModelPicker"
import ChatMessage from "@/components/ChatMessage"
import ChatInput from "@/components/ChatInput"
import {
  getConversations,
  getConversation,
  saveConversation,
  deleteConversation,
} from "@/lib/db"

export default function ChatPage() {
  const [selectedSite, setSelectedSite] = useState(null)
  const [selectedModel, setSelectedModel] = useState("")
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const abortRef = useRef(null)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

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
    if (!activeId) {
      setMessages([])
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
  }

  async function handleSelectConversation(id) {
    setActiveId(id)
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
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 */}
        <div className="w-64 border-r border-gray-4 flex flex-col shrink-0">
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden">
              <SiteManager
                selectedSite={selectedSite}
                onSelectSite={(site) => {
                  setSelectedSite(site)
                  setSelectedModel("")
                }}
              />
            </div>
            <div className="border-t border-gray-4 h-[250px] shrink-0">
              <ConversationList
                conversations={conversations}
                activeId={activeId}
                onSelect={handleSelectConversation}
                onDelete={handleDeleteConversation}
                onNew={handleNewConversation}
              />
            </div>
          </div>
        </div>

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
