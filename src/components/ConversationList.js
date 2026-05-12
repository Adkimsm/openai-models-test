"use client"

import { Button } from "@/components/ui/button"
import { Plus, Trash2, MessageSquare } from "lucide-react"

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNew,
}) {
  function formatTime(ts) {
    const d = new Date(ts)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return "刚刚"
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-4">
        <Button size="sm" className="w-full" onClick={onNew}>
          <Plus className="h-4 w-4 mr-1" />
          新建对话
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-9">
            暂无对话记录
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-gray-4 transition-colors ${
                activeId === conv.id
                  ? "bg-gray-3"
                  : "hover:bg-gray-2"
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-gray-9" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-12 truncate">
                  {conv.title || "新对话"}
                </div>
                <div className="text-xs text-gray-9 mt-0.5 truncate">
                  {conv.model} · {formatTime(conv.updatedAt)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(conv.id)
                }}
                className="p-1 rounded hover:bg-gray-4 text-gray-9 hover:text-red-11 transition-colors md:opacity-0 md:group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
