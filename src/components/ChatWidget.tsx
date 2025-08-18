"use client"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageSquare, X, Send, Minimize2, Maximize2, Wifi } from "lucide-react"
import { useCsrfContext } from "@/contexts/CsrfContext"
import Image from "next/image"

type ChatMessage = {
  id: string
  user: string
  avatar?: string | null
  message: string
  ts: number
  isOnline?: boolean
}

export default function ChatWidget({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { csrfToken, refreshToken } = useCsrfContext() as unknown as { csrfToken: string; isLoading: boolean; refreshToken: () => Promise<void> }
  const [chatMinimized, setChatMinimized] = useState(false)
  const [chatMessage, setChatMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [onlineCount, setOnlineCount] = useState<number>(0)

  const endRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const esChatRef = useRef<EventSource | null>(null)
  const esOnlineRef = useRef<EventSource | null>(null)

  const scrollToBottom = (smooth = true) => {
    const el = listRef.current
    if (!el) return
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" })
    } catch {
      endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
    }
  }

  useEffect(() => {
    if (!isOpen) {
      try {
        esChatRef.current?.close()
      } catch {}
      try {
        esOnlineRef.current?.close()
      } catch {}
      esChatRef.current = null
      esOnlineRef.current = null
      return
    }

    // Stream mesaje chat
    const es = new EventSource("/api/chat/stream")
    esChatRef.current = es
    es.onmessage = (e) => {
      if (!e.data) return
      try {
        const data = JSON.parse(e.data)
        if (data?.type === "chat") {
          const userName = typeof data.user === 'string' ? data.user : (data.user?.name || 'Anonim')
          const avatar = typeof data.user === 'object' ? (data.user?.avatar || null) : null
          setChatMessages((prev) => [
            ...prev.slice(-99),
            { id: String(data.ts), user: userName, avatar, message: String(data.message ?? ''), ts: Number(data.ts) || Date.now() },
          ])
        }
      } catch {}
    }
    es.onerror = () => {
      try {
        es.close()
      } catch {}
      esChatRef.current = null
    }

    // Stream utilizatori online
    const es2 = new EventSource("/api/user/recent/stream?limit=24")
    esOnlineRef.current = es2
    es2.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (Array.isArray(data)) {
          const count = data.filter((u: { online?: boolean }) => Boolean(u?.online)).length
          setOnlineCount(count)
        }
      } catch {}
    }
    es2.onerror = () => {
      try {
        es2.close()
      } catch {}
      esOnlineRef.current = null
    }

    return () => {
      try {
        es.close()
      } catch {}
      try {
        es2.close()
      } catch {}
      esChatRef.current = null
      esOnlineRef.current = null
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom(true)
  }, [chatMessages])
  useEffect(() => {
    if (isOpen && !chatMinimized) scrollToBottom(false)
  }, [isOpen, chatMinimized])

  const handleSendMessage = async () => {
    const msg = chatMessage.trim()
    if (!msg) return
    setChatMessage("")
    try {
      let cookieToken = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(c => c.startsWith('csrf='))?.split('=')[1]
        : undefined
      let token = csrfToken || (cookieToken ? decodeURIComponent(cookieToken) : '')
      if (!token) {
        try {
          await refreshToken()
        } catch {}
        cookieToken = typeof document !== 'undefined'
          ? document.cookie.split('; ').find(c => c.startsWith('csrf='))?.split('=')[1]
          : undefined
        token = csrfToken || (cookieToken ? decodeURIComponent(cookieToken) : '')
      }
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["X-CSRF-Token"] = token
      let res = await fetch("/api/chat/send", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ message: msg }),
      })
      if (res.status === 403) {
        try { await refreshToken() } catch {}
        cookieToken = typeof document !== 'undefined'
          ? document.cookie.split('; ').find(c => c.startsWith('csrf='))?.split('=')[1]
          : undefined
        token = csrfToken || (cookieToken ? decodeURIComponent(cookieToken) : '')
        const headers2: Record<string, string> = { "Content-Type": "application/json" }
        if (token) headers2["X-CSRF-Token"] = token
        res = await fetch("/api/chat/send", {
          method: "POST",
          headers: headers2,
          credentials: "include",
          body: JSON.stringify({ message: msg }),
        })
      }
    } catch {}
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-[100000] pointer-events-auto w-96"
      style={{
        height: chatMinimized ? "5rem" : "24rem",
        overflow: chatMinimized ? "visible" : "hidden",
      }}
    >
      <Card
        className="bg-gray-900/95 border-cyan-500/50 backdrop-blur-xl h-full shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 overflow-hidden relative"
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* HEADER CENTRAT */}
        <div className="h-20 border-b border-cyan-500/30 z-10 flex items-center">
          <div className="w-full flex items-center justify-between px-4">
            {/* Stânga - Chat info */}
            <div className="flex items-center text-sm text-cyan-400 min-w-0 flex-1 whitespace-nowrap overflow-hidden">
              <MessageSquare className="w-4 h-4 mr-2 animate-pulse flex-shrink-0" />
              <span className="font-medium">Live Chat</span>
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-ping flex-shrink-0" />
              <span className="ml-2 text-xs text-gray-400 font-mono flex-shrink-0 truncate">{onlineCount} online</span>
            </div>

            {/* Dreapta - Control buttons */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setChatMinimized((v) => !v)}
                className="w-8 h-8 hover:bg-gray-800/50 rounded text-white hover:text-cyan-400 transition-all duration-300 transform hover:scale-110 border border-gray-600/50 flex items-center justify-center"
                title={chatMinimized ? "Maximizează" : "Minimizează"}
              >
                {chatMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 hover:bg-gray-800/50 rounded text-white hover:text-red-400 transition-all duration-300 transform hover:scale-110 border border-gray-600/50 flex items-center justify-center"
                title="Închide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* CONȚINUT */}
        {!chatMinimized && (
          <>
            <div
              ref={listRef}
              className="min-h-0 overflow-y-auto p-3 space-y-3"
              style={{ maxHeight: "100%", height: "100%" }}
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={msg.id}
                  className="flex items-start space-x-2 animate-in slide-in-from-bottom duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-shrink-0">
                    {msg.avatar ? (
                      <Image
                        src={msg.avatar}
                        alt={msg.user}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover border border-cyan-500/40"
                        unoptimized
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center relative">
                        <span className="text-xs font-bold text-black">{msg.user?.[0]?.toUpperCase() || "U"}</span>
                        {msg.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 animate-ping" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-semibold text-cyan-400">{msg.user}</span>
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {msg.isOnline && <Wifi className="w-3 h-3 text-green-400" />}
                    </div>
                    <p className="text-sm text-gray-300 break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* INPUT MESAJ */}
            <div className="border-t border-cyan-500/30 mt-auto pb-4">
              <div className="px-3 pt-3">
                <div className="flex items-center justify-center space-x-3">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        void handleSendMessage()
                      }
                    }}
                    placeholder="Scrie un mesaj..."
                    className="flex-1 bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all duration-300"
                  />
                  <Button
                    onClick={() => void handleSendMessage()}
                    size="sm"
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-black transition-all duration-300 transform hover:scale-105 px-4 py-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>,
    document.body,
  )
}
