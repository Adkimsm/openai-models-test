"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Square, ImagePlus, X } from "lucide-react"

export default function ChatInput({ onSend, disabled, streaming, onStop }) {
  const [text, setText] = useState("")
  const [images, setImages] = useState([])
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px"
    }
  }, [text])

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed && images.length === 0) return
    if (disabled) return

    onSend({
      text: trimmed,
      images: images.map((img) => img.dataUrl),
    })

    setText("")
    setImages([])
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (streaming) return
      handleSubmit()
    }
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) addImage(file)
        break
      }
    }
  }

  function handleFileChange(e) {
    const files = e.target.files
    if (!files) return
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        addImage(file)
      }
    }
    e.target.value = ""
  }

  function addImage(file) {
    const reader = new FileReader()
    reader.onload = () => {
      setImages((prev) => [...prev, { name: file.name, dataUrl: reader.result }])
    }
    reader.readAsDataURL(file)
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="border-t border-gray-4 bg-gray-1 p-4">
      {images.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img.dataUrl}
                alt={img.name}
                className="h-16 w-16 object-cover rounded-lg border border-gray-4"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-gray-12 text-gray-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="上传图片"
        >
          <ImagePlus className="h-4 w-4" />
        </Button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={streaming ? "AI 正在回复中..." : "输入消息... (Enter 发送, Shift+Enter 换行, 支持粘贴图片)"}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-4 bg-gray-1 px-4 py-2.5 text-sm text-gray-12 placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-gray-8/20 disabled:opacity-50 min-h-[40px] max-h-[160px]"
        />

        {streaming ? (
          <Button variant="error" size="icon-sm" onClick={onStop} title="停止回复">
            <Square className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="icon-sm"
            onClick={handleSubmit}
            disabled={disabled || (!text.trim() && images.length === 0)}
            title="发送"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
