import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axiosClient";
import toast from "react-hot-toast";

function ChatBubble({ msg, index }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity:0, y:14, scale:0.96 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay: index * 0.03, duration:0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-gradient-to-br from-brand-600 to-blue-600 text-white rounded-br-sm"
          : "glass border border-gray-700/60 text-gray-200 rounded-bl-sm"
      }`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">🤖</span>
            <span className="text-xs text-brand-400 font-semibold">Interview AI</span>
            {msg.intent && msg.intent !== "fallback" && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-900/40 text-brand-400 border border-brand-800/50 font-medium">
                {msg.intent.replace(/_/g," ")}
              </span>
            )}
          </div>
        )}
        {/* Render markdown-like bold */}
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

function SuggestionChip({ text, onClick }) {
  return (
    <motion.button onClick={onClick}
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:0.97 }}
      className="text-xs px-3 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white
        border border-gray-700/60 hover:border-brand-600/40 transition-all font-medium text-left">
      {text}
    </motion.button>
  );
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [suggestions, setSugg]  = useState([]);
  const [greeting, setGreeting] = useState("");
  const chatEnd = useRef(null);
  const inputRef = useRef(null);

  // Load suggestions on mount
  useEffect(() => {
    api.get("/chatbot/suggestions")
      .then(r => {
        setSugg(r.data.suggestions || []);
        setGreeting(r.data.greeting || "");
        setMessages([{ role:"bot", text: r.data.greeting || "Hi! How can I help you?", intent:"greet" }]);
      })
      .catch(() => {
        setMessages([{ role:"bot", text:"Hi! 👋 I'm your Interview Prep AI. Ask me anything about interviews!", intent:"greet" }]);
      });
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    setMessages(prev => [...prev, { role:"user", text: msg }]);
    setLoading(true);

    try {
      const res = await api.post("/chatbot/message", { message: msg });
      setMessages(prev => [...prev, {
        role:"bot",
        text: res.data.response,
        intent: res.data.intent,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role:"bot",
        text: "Sorry, something went wrong. Please try again!",
        intent: "error",
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 h-[calc(100vh-5rem)] flex flex-col">

      {/* Header */}
      <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
        className="flex items-center gap-3 pb-4 border-b border-gray-800/60 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-lg">
          🤖
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Interview Prep Chatbot</h1>
          <p className="text-xs text-gray-500">Personalized guidance using your resume data</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs text-green-400 font-medium">Online</span>
        </div>
      </motion.div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3
        [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">

        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} index={i} />
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex justify-start">
              <div className="glass border border-gray-700/60 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                <motion.span animate={{ y:[0,-4,0] }} transition={{ duration:0.5, repeat:Infinity, delay:0 }}
                  className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                <motion.span animate={{ y:[0,-4,0] }} transition={{ duration:0.5, repeat:Infinity, delay:0.15 }}
                  className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                <motion.span animate={{ y:[0,-4,0] }} transition={{ duration:0.5, repeat:Infinity, delay:0.3 }}
                  className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={chatEnd} />
      </div>

      {/* Quick suggestions — show when few messages */}
      {messages.length <= 2 && suggestions.length > 0 && (
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          className="flex-shrink-0 pb-3">
          <p className="text-xs text-gray-600 font-medium mb-2">💡 Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <SuggestionChip key={i} text={s} onClick={() => sendMessage(s)} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 pt-2 border-t border-gray-800/60">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea ref={inputRef}
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Ask about interview tips, strengths, STAR method..."
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-gray-800/80 border border-gray-700/60 rounded-xl
                text-white text-sm placeholder-gray-500 resize-none focus:outline-none focus:border-brand-600/60
                focus:ring-1 focus:ring-brand-600/30 transition-all
                [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-600"
              style={{ minHeight:"44px", maxHeight:"120px" }}
              onInput={e => { e.target.style.height="44px"; e.target.style.height = e.target.scrollHeight + "px"; }}
            />
          </div>
          <motion.button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            whileHover={input.trim() && !loading ? { scale:1.05 } : {}}
            whileTap={input.trim() && !loading ? { scale:0.95 } : {}}
            className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              bg-gradient-to-br from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
            </svg>
          </motion.button>
        </div>
        <p className="text-center text-xs text-gray-700 mt-2">
          Powered by your resume data • Try: "How to introduce myself" or "STAR method"
        </p>
      </div>
    </div>
  );
}
