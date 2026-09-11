import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axiosClient";
import toast from "react-hot-toast";

const TYPE_BADGE = {
  content: { label:"Content", color:"text-brand-400 bg-brand-900/40 border-brand-800/50" },
  summary: { label:"Summary", color:"text-purple-400 bg-purple-900/40 border-purple-800/50" },
  detail:  { label:"Detail",  color:"text-amber-400 bg-amber-900/40 border-amber-800/50" },
};

const CONFIDENCE_BADGE = {
  high:   { label:"High Confidence",   color:"text-green-400 bg-green-900/40 border-green-800/50" },
  medium: { label:"Medium Confidence", color:"text-amber-400 bg-amber-900/40 border-amber-800/50" },
  low:    { label:"Low Confidence",    color:"text-red-400 bg-red-900/40 border-red-800/50" },
};

function ChatMessage({ msg, index }) {
  return (
    <motion.div
      initial={{ opacity:0, y:12, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:index*0.05, duration:0.3 }}
      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        msg.role === "user"
          ? "bg-gradient-to-br from-brand-600 to-blue-600 text-white rounded-br-sm"
          : "glass border border-gray-700/60 text-gray-200 rounded-bl-sm"
      }`}>
        {msg.role === "bot" && (
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-xs text-brand-400 font-semibold">🤖 AI Answer</p>
            {msg.confidence && CONFIDENCE_BADGE[msg.confidence] && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${CONFIDENCE_BADGE[msg.confidence].color}`}>
                {CONFIDENCE_BADGE[msg.confidence].label}
              </span>
            )}
          </div>
        )}
        <p className="whitespace-pre-wrap">{msg.text}</p>
        {msg.chunks && msg.chunks.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-700/40 space-y-1.5">
            <p className="text-xs text-gray-500 font-medium">📎 Sources ({msg.chunks.length} relevant sections)</p>
            {msg.chunks.map((c, i) => (
              <div key={i} className="text-xs text-gray-400 bg-gray-900/60 rounded-lg p-2 border border-gray-800/40">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-brand-400 font-medium">Relevance: {(c.relevance_score * 100).toFixed(0)}%</span>
                  {c.semantic_score !== undefined && (
                    <span className="text-gray-600">Semantic: {(c.semantic_score * 100).toFixed(0)}% · Keyword: {(c.keyword_score * 100).toFixed(0)}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function QAPairCard({ qa, index }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const badge = TYPE_BADGE[qa.type] || TYPE_BADGE.content;
  return (
    <motion.div
      initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:index*0.04, duration:0.3 }}
      className="border border-gray-700/60 bg-gray-900/60 rounded-xl p-4 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-gray-500 bg-gray-800 rounded-lg w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-white text-sm font-medium leading-relaxed">{qa.question}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <motion.button
            onClick={() => setShowAnswer(a => !a)}
            whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition"
          >
            <motion.span animate={{ rotate: showAnswer ? 90 : 0 }} transition={{ duration:0.2 }}>›</motion.span>
            {showAnswer ? "Hide Answer" : "Show Answer"}
          </motion.button>
          <AnimatePresence>
            {showAnswer && (
              <motion.div
                initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-gray-300 mt-2 pl-3 border-l-2 border-brand-600/50 leading-relaxed whitespace-pre-wrap">
                  {qa.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function DocumentQAPage() {
  const [documents, setDocuments]     = useState([]);
  const [selected, setSelected]       = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [fetching, setFetching]       = useState(true);
  const [activeTab, setActiveTab]     = useState("chat");

  // Chat state
  const [messages, setMessages]       = useState([]);
  const [question, setQuestion]       = useState("");
  const [asking, setAsking]           = useState(false);

  // Auto Q&A state
  const [qaPairs, setQaPairs]         = useState([]);
  const [generatingQA, setGeneratingQA] = useState(false);

  const fileRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get("/documents")
      .then(r => setDocuments(r.data.documents || []))
      .catch(() => toast.error("Could not load documents."))
      .finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const newDoc = {
        id: res.data.document_id,
        filename: res.data.filename,
        text_length: res.data.text_length,
        chunk_count: res.data.chunk_count,
        uploaded_at: new Date().toISOString(),
        preview: res.data.preview
      };
      setDocuments(prev => [newDoc, ...prev]);
      setSelected(newDoc);
      setMessages([]);
      setQaPairs([]);
      toast.success(`"${file.name}" uploaded! 📄`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const selectDoc = (doc) => {
    setSelected(doc);
    setMessages([]);
    setQaPairs([]);
    setActiveTab("chat");
  };

  const deleteDoc = async (docId) => {
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (selected?.id === docId) { setSelected(null); setMessages([]); setQaPairs([]); }
      toast.success("Document deleted.");
    } catch { toast.error("Failed to delete."); }
  };

  const askQuestion = async () => {
    if (!question.trim() || !selected) return;
    const q = question.trim();
    setQuestion("");
    setMessages(prev => [...prev, { role:"user", text:q }]);
    setAsking(true);
    try {
      const res = await api.post(`/documents/${selected.id}/ask`, { question: q });
      setMessages(prev => [...prev, {
        role:"bot",
        text: res.data.answer,
        confidence: res.data.confidence,
        chunks: res.data.relevant_chunks
      }]);
    } catch {
      setMessages(prev => [...prev, { role:"bot", text:"Sorry, something went wrong. Try again." }]);
    } finally { setAsking(false); }
  };

  const generateQA = async () => {
    if (!selected) return;
    setGeneratingQA(true);
    try {
      const res = await api.post(`/documents/${selected.id}/generate-qa`);
      setQaPairs(res.data.qa_pairs || []);
      toast.success(`Generated ${res.data.total_generated} Q&A pairs! ✨`);
    } catch {
      toast.error("Failed to generate Q&A.");
    } finally { setGeneratingQA(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
        <h1 className="text-3xl font-black text-white">
          📄 <span className="gradient-text">Document Q&A</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Upload a PDF, DOCX or TXT — ask questions and auto-generate Q&A from its content.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left — Documents list */}
        <div className="lg:col-span-2 space-y-3">

          {/* Upload button */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }}>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleUpload} className="hidden" />
            <motion.button
              onClick={() => fileRef.current?.click()} disabled={uploading}
              whileHover={!uploading?{scale:1.02}:{}} whileTap={!uploading?{scale:0.97}:{}}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white relative overflow-hidden disabled:opacity-60">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 transition-all" />
              <span className="relative flex items-center justify-center gap-2">
                {uploading
                  ? <><motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/>Uploading…</>
                  : <><span>📤</span> Upload Document</>}
              </span>
            </motion.button>
          </motion.div>

          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
            Your Documents ({documents.length})
          </p>

          {fetching ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl shimmer" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center border border-dashed border-gray-800">
              <p className="text-3xl mb-2 opacity-20">📄</p>
              <p className="text-gray-600 text-sm">No documents yet</p>
              <p className="text-gray-700 text-xs mt-1">Upload a PDF, DOCX or TXT to get started</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1
              [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {documents.map((doc, i) => {
                const isActive = selected?.id === doc.id;
                return (
                  <motion.div key={doc.id}
                    initial={{ opacity:0, x:-14 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay:i*0.04, duration:0.3 }}
                    onClick={() => selectDoc(doc)}
                    className={"relative rounded-xl border p-3.5 cursor-pointer transition-all duration-200 card-shine " +
                      (isActive
                        ? "border-brand-600/60 bg-brand-900/20 shadow-lg shadow-brand-500/10"
                        : "border-gray-700/60 bg-gray-900/50 hover:border-gray-600")}
                  >
                    {isActive && (
                      <motion.div layoutId="doc-selector"
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-400" />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={"font-semibold text-xs truncate " + (isActive?"text-white":"text-gray-300")}>
                          📄 {doc.filename}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {doc.chunk_count} chunks · {(doc.text_length/1000).toFixed(1)}k chars
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{doc.preview}</p>
                      </div>
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                        whileHover={{ scale:1.2 }} whileTap={{ scale:0.9 }}
                        className="text-gray-600 hover:text-red-400 text-xs transition flex-shrink-0 p-1"
                        title="Delete">🗑</motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — Chat / Q&A */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div key="empty"
                className="glass rounded-2xl flex flex-col items-center justify-center p-16 text-center border border-dashed border-gray-800 min-h-[400px]"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <motion.div className="text-5xl mb-4 opacity-20"
                  animate={{ y:[0,-10,0] }}
                  transition={{ duration:4, repeat:Infinity, ease:"easeInOut" }}>📄</motion.div>
                <p className="text-gray-600 font-semibold">Upload or select a document</p>
                <p className="text-gray-700 text-sm mt-1">Ask questions and generate Q&A</p>
              </motion.div>
            ) : (
              <motion.div key={selected.id} className="space-y-3"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }} transition={{ duration:0.35 }}>

                {/* Doc header */}
                <div className="glass rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-brand-500/20">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{selected.filename}</p>
                    <p className="text-gray-500 text-xs">{selected.chunk_count} chunks · {(selected.text_length/1000).toFixed(1)}k characters</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5">
                  {[
                    { key:"chat", icon:"💬", label:"Ask Questions" },
                    { key:"qa",   icon:"✨", label:"Auto Q&A" },
                  ].map(tab => (
                    <motion.button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                      className={"px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border " +
                        (activeTab === tab.key
                          ? "bg-brand-900/40 border-brand-700 text-brand-400"
                          : "border-gray-700/60 bg-gray-900/50 text-gray-500 hover:text-gray-300 hover:border-gray-600")}>
                      <span>{tab.icon}</span> {tab.label}
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === "chat" ? (
                    <motion.div key="chat" className="space-y-3"
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>

                      {/* Chat messages */}
                      <div className="glass rounded-2xl p-4 min-h-[300px] max-h-[450px] overflow-y-auto space-y-3
                        [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {messages.length === 0 ? (
                          <div className="flex items-center justify-center h-60 text-center">
                            <div>
                              <p className="text-3xl mb-2 opacity-20">💬</p>
                              <p className="text-gray-600 text-sm">Ask anything about the document</p>
                              <p className="text-gray-700 text-xs mt-1">AI will find relevant sections to answer</p>
                            </div>
                          </div>
                        ) : (
                          messages.map((msg, i) => <ChatMessage key={i} msg={msg} index={i} />)
                        )}
                        {asking && (
                          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                            className="flex justify-start">
                            <div className="glass border border-gray-700/60 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                              <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}
                                className="w-3.5 h-3.5 border-2 border-brand-400/30 border-t-brand-400 rounded-full" />
                              <span className="text-xs text-gray-400">Searching document…</span>
                            </div>
                          </motion.div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Input */}
                      <form onSubmit={(e) => { e.preventDefault(); askQuestion(); }}
                        className="flex gap-2">
                        <input
                          type="text" value={question} onChange={e => setQuestion(e.target.value)}
                          placeholder="Ask a question about the document…"
                          disabled={asking}
                          className="flex-1 bg-gray-900 border border-gray-700 hover:border-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                            text-white rounded-xl px-4 py-3 text-sm placeholder-gray-600 outline-none transition-all disabled:opacity-50"
                        />
                        <motion.button type="submit" disabled={asking || !question.trim()}
                          whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 text-white text-sm font-bold
                            disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                          {asking ? "…" : "Ask →"}
                        </motion.button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div key="qa" className="space-y-3"
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>

                      {/* Generate button */}
                      {qaPairs.length === 0 && (
                        <motion.button onClick={generateQA} disabled={generatingQA}
                          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                          whileHover={!generatingQA?{scale:1.02,y:-1}:{}} whileTap={!generatingQA?{scale:0.97}:{}}
                          className="relative w-full py-3.5 rounded-xl font-bold text-white text-sm overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-brand-600 to-emerald-600 hover:from-purple-500 hover:via-brand-500 hover:to-emerald-500 transition-all" />
                          {!generatingQA && (
                            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                              animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:0.5 }} />
                          )}
                          <span className="relative flex items-center justify-center gap-2">
                            {generatingQA
                              ? <><motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/>Generating…</>
                              : <><span>✨</span> Auto-Generate Q&A from Document</>}
                          </span>
                        </motion.button>
                      )}

                      {/* Q&A pairs */}
                      {qaPairs.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
                              Generated Q&A ({qaPairs.length})
                            </p>
                            <motion.button onClick={generateQA} disabled={generatingQA}
                              whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition">
                              ↻ Regenerate
                            </motion.button>
                          </div>
                          {qaPairs.map((qa, i) => (
                            <QAPairCard key={qa.id} qa={qa} index={i} />
                          ))}
                        </div>
                      )}

                      {qaPairs.length === 0 && !generatingQA && (
                        <div className="glass rounded-xl p-10 text-center border border-dashed border-gray-800">
                          <p className="text-3xl mb-2 opacity-20">✨</p>
                          <p className="text-gray-600 text-sm">Click the button above to auto-generate Q&A</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
