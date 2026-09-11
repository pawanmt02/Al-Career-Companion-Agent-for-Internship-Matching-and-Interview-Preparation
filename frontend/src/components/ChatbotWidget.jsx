import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

function ChatBubble({ msg, index }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity:0, y:8, scale:0.96 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay: index * 0.02, duration:0.25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
        isUser
          ? "bg-gradient-to-br from-brand-600 to-blue-600 text-white rounded-br-sm"
          : "bg-gray-800/90 border border-gray-700/50 text-gray-200 rounded-bl-sm"
      }`}>
        <div className="whitespace-pre-wrap">
          {msg.text.split("\n").map((line, i) => {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
              <span key={i}>
                {parts.map((part, j) =>
                  j % 2 === 1
                    ? <strong key={j} className="text-white font-semibold">{part}</strong>
                    : <span key={j}>{part}</span>
                )}
                {i < msg.text.split("\n").length - 1 && "\n"}
              </span>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatbotWidget() {
  const { user } = useAuth();
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [suggestions, setSugg]    = useState([]);
  const [unread, setUnread]       = useState(0);
  const chatEnd = useRef(null);
  const inputRef = useRef(null);
  const initialized = useRef(false);

  // Load suggestions when opened for the first time
  useEffect(() => {
    if (!open || initialized.current || !user) return;
    initialized.current = true;
    api.get("/chatbot/suggestions")
      .then(r => {
        setSugg(r.data.suggestions || []);
        setMessages([{ role:"bot", text: r.data.greeting || "Hi! 👋 How can I help you prepare?" }]);
      })
      .catch(() => {
        setMessages([{ role:"bot", text:"Hi! 👋 Ask me anything about interview prep!" }]);
      });
  }, [open, user]);

  // Auto-scroll
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role:"user", text: msg }]);
    setLoading(true);
    try {
      const res = await api.post("/chatbot/message", { message: msg });
      setMessages(prev => [...prev, { role:"bot", text: res.data.response }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, { role:"bot", text:"Sorry, something went wrong. Try again!" }]);
    } finally { setLoading(false); }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Don't render if not logged in
  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale:0, opacity:0 }}
            animate={{ scale:1, opacity:1 }}
            exit={{ scale:0, opacity:0 }}
            whileHover={{ scale:1.1 }}
            whileTap={{ scale:0.9 }}
            onClick={() => { setOpen(true); setUnread(0); }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
              bg-gradient-to-br from-brand-600 to-purple-600
              shadow-lg shadow-brand-600/30 flex items-center justify-center
              hover:shadow-xl hover:shadow-brand-600/40 transition-shadow"
          >
            <span className="text-2xl">🤖</span>
            {unread > 0 && (
              <motion.span initial={{ scale:0 }} animate={{ scale:1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full
                  text-white text-xs font-bold flex items-center justify-center">
                {unread}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:20, scale:0.9 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:20, scale:0.9 }}
            transition={{ type:"spring", stiffness:300, damping:25 }}
            className="fixed bottom-6 right-6 z-50 w-[370px] h-[520px] rounded-2xl
              bg-gray-900 border border-gray-700/60 shadow-2xl shadow-black/50
              flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-800/80
              bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-purple-600
                flex items-center justify-center text-sm">🤖</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold">Interview AI</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
              <motion.button onClick={() => setOpen(false)}
                whileHover={{ scale:1.1, rotate:90 }} whileTap={{ scale:0.9 }}
                className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center
                  justify-center text-gray-400 hover:text-white transition text-sm">
                ✕
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5
              [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-700
              [&::-webkit-scrollbar-thumb]:rounded-full">
              {messages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} index={i} />
              ))}

              {/* Typing dots */}
              {loading && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                  className="flex justify-start">
                  <div className="bg-gray-800/90 border border-gray-700/50 rounded-2xl rounded-bl-sm
                    px-3 py-2 flex items-center gap-1">
                    <motion.span animate={{ y:[0,-3,0] }} transition={{ duration:0.4, repeat:Infinity, delay:0 }}
                      className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    <motion.span animate={{ y:[0,-3,0] }} transition={{ duration:0.4, repeat:Infinity, delay:0.12 }}
                      className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    <motion.span animate={{ y:[0,-3,0] }} transition={{ duration:0.4, repeat:Infinity, delay:0.24 }}
                      className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                  </div>
                </motion.div>
              )}
              <div ref={chatEnd} />
            </div>

            {/* Quick suggestions */}
            {messages.length <= 2 && suggestions.length > 0 && (
              <div className="px-3 pb-2 flex-shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.slice(0, 4).map((s, i) => (
                    <motion.button key={i} onClick={() => sendMessage(s)}
                      initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-800/80
                        hover:bg-gray-700 text-gray-400 hover:text-white
                        border border-gray-700/50 hover:border-brand-600/40
                        transition-all font-medium">
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-2.5 border-t border-gray-800/80 flex-shrink-0">
              <div className="flex gap-2 items-center">
                <input ref={inputRef}
                  value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                  placeholder="Ask about interviews..."
                  className="flex-1 px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-xl
                    text-white text-xs placeholder-gray-500 focus:outline-none
                    focus:border-brand-600/50 transition-all"
                />
                <motion.button onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  whileHover={input.trim() && !loading ? { scale:1.08 } : {}}
                  whileTap={input.trim() && !loading ? { scale:0.92 } : {}}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    disabled:opacity-30 bg-gradient-to-br from-brand-600 to-blue-600 text-white transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
