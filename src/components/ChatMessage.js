"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Copy, Check, User, Bot, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

function CodeBlock({ node, className, children, ...props }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || "")
  const lang = match ? match[1] : ""
  const code = String(children).replace(/\n$/, "")

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (match) {
    return (
      <div className="relative group my-3 rounded-lg overflow-hidden border border-gray-4">
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-3 text-xs text-gray-11">
          <span>{lang}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-gray-12 transition-colors"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "已复制" : "复制"}
          </button>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={lang}
          PreTag="div"
          customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.875rem" }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    )
  }

  return (
    <code className="px-1.5 py-0.5 rounded bg-gray-4 text-gray-12 text-[0.875em] font-mono" {...props}>
      {children}
    </code>
  )
}

function ImagePreview({ src, alt }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <img
        src={src}
        alt={alt || ""}
        className="max-w-[280px] max-h-[200px] rounded-lg border border-gray-4 cursor-pointer hover:opacity-90 transition-opacity my-1"
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-2 bg-transparent border-none shadow-none">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-12/80 text-gray-1 hover:bg-gray-12 transition-colors z-50"
          >
            <X className="h-4 w-4" />
          </button>
          <img
            src={src}
            alt={alt || ""}
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function extractThinkBlocks(content) {
  if (typeof content !== "string") return { thinks: [], cleanContent: content, streamingThink: "" }
  
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g
  const thinks = []
  let match

  while ((match = thinkRegex.exec(content)) !== null) {
    thinks.push(match[1].trim())
  }

  const withoutComplete = content.replace(thinkRegex, "")
  const openTagIndex = withoutComplete.indexOf("<think>")

  let streamingThink = ""
  let cleanContent = withoutComplete.trim()

  if (openTagIndex !== -1) {
    streamingThink = withoutComplete.slice(openTagIndex + 7).trim()
    cleanContent = withoutComplete.slice(0, openTagIndex).trim()
  }

  return { thinks, cleanContent, streamingThink }
}

function ThinkBlock({ content, streaming = false }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="my-2 border border-gray-4 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 text-left text-xs text-gray-11 bg-gray-4 hover:bg-gray-5 flex items-center gap-2"
      >
        <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
        {streaming ? "思考中..." : `思考过程 (${content.length}字)`}
      </button>
      {expanded && (
        <div className="px-3 py-2 text-sm text-gray-11 bg-gray-2 border-t border-gray-4 whitespace-pre-wrap">
          {content}
          {streaming && <span className="animate-pulse">|</span>}
        </div>
      )}
    </div>
  )
}

function renderContent(content, isDark) {
  if (typeof content === "string") {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (part.type === "text") return part.text
        if (part.type === "image_url") return `![](${part.image_url.url})`
        return ""
      })
      .join("\n")
  }

  return ""
}

function extractImages(content) {
  if (!Array.isArray(content)) return []
  return content
    .filter((part) => part.type === "image_url")
    .map((part) => part.image_url.url)
}

export default function ChatMessage({ message, isDark }) {
  const isUser = message.role === "user"
  const images = extractImages(message.content)
  const textContent = renderContent(message.content, isDark)
  const { thinks, cleanContent, streamingThink } = extractThinkBlocks(textContent)

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="shrink-0 size-8 rounded-lg bg-gray-3 flex items-center justify-center">
          <Bot className="h-4 w-4 text-gray-11" />
        </div>
      )}

      <div
        className={`max-w-[75%] rounded-xl px-4 py-3 ${
          isUser
            ? "bg-blue-11 text-white"
            : "bg-gray-3 text-gray-12"
        }`}
      >
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map((src, i) => (
              <ImagePreview key={i} src={src} alt="" />
            ))}
          </div>
        )}

        {textContent && (
          <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert" : ""}`}>
            {!isUser && thinks.length > 0 && (
              <div className="not-prose">
                {thinks.map((think, i) => (
                  <ThinkBlock key={i} content={think} />
                ))}
              </div>
            )}
            {!isUser && streamingThink && (
              <div className="not-prose">
                <ThinkBlock content={streamingThink} streaming={true} />
              </div>
            )}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="border-collapse border border-gray-5 text-sm">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-5 px-3 py-1.5 bg-gray-4 font-medium text-left">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-5 px-3 py-1.5">{children}</td>
                ),
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-11 hover:underline">{children}</a>
                ),
                img: ({ src, alt }) => <ImagePreview src={src} alt={alt} />,
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>
        )}

        {!isUser && message.streaming && (
          <span className="inline-block w-2 h-4 bg-gray-9 ml-0.5 animate-pulse" />
        )}
      </div>

      {isUser && (
        <div className="shrink-0 size-8 rounded-lg bg-blue-11 flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  )
}
