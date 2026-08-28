import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axiosClient";
import toast from "react-hot-toast";

const STEPS = ["Reading file…","Extracting text…","Matching internships…","Finalising…"];

export default function ResumeUploader({ onResult }) {
  const [file,      setFile]      = useState(null);
  const [dragging,  setDragging]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [step,      setStep]      = useState(0);
  const inputRef = useRef();

  const pick = (f) => {
    if (!f) return;
    if (!["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(f.type)) {
      toast.error("PDF or DOCX only."); return;
    }
    setFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    pick(e.dataTransfer.files[0]);
  }, []);

  const handleSubmit = async () => {
    if (!file) return toast.error("Choose a file first.");
    setLoading(true); setStep(0);

    // Cycle through steps
    const timer = setInterval(() => setStep(s => Math.min(s+1, STEPS.length-1)), 900);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/resume/parse", fd, { headers:{ "Content-Type":"multipart/form-data" } });
      onResult(res.data);
      toast.success("Resume parsed successfully! 🎯");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Parse failed — check your file.");
    } finally {
      clearInterval(timer); setLoading(false);
    }
  };

  const sizeMB = file ? (file.size / 1024).toFixed(1) + " KB" : "";

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <motion.div animate={{ rotate:[0,10,-10,0] }} transition={{ duration:3, repeat:Infinity, repeatDelay:2 }}
          className="text-xl">📂</motion.div>
        <div>
          <p className="text-white font-bold text-sm">Upload Your Resume</p>
          <p className="text-gray-500 text-xs">PDF or DOCX · Max 10MB</p>
        </div>
      </div>

      {/* Drop zone */}
      <motion.div
        animate={dragging
          ? { borderColor:"rgba(14,165,233,0.8)", backgroundColor:"rgba(14,165,233,0.06)", scale:1.01 }
          : { borderColor:"rgba(255,255,255,0.08)", backgroundColor:"rgba(255,255,255,0.02)", scale:1 }}
        transition={{ duration:0.2 }}
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true);  }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className="relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer overflow-hidden group"
      >
        {/* Glow when dragging */}
        <AnimatePresence>
          {dragging && (
            <motion.div key="glow" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="absolute inset-0 bg-brand-500/5 pointer-events-none" />
          )}
        </AnimatePresence>

        <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
          onChange={(e) => pick(e.target.files[0])} />

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div key="file"
              initial={{ opacity:0, scale:0.8, y:10 }}
              animate={{ opacity:1, scale:1,   y:0 }}
              exit={{    opacity:0, scale:0.8, y:-10 }}
              transition={{ type:"spring", stiffness:260, damping:20 }}
              className="flex flex-col items-center gap-2">
              <motion.div className="text-4xl"
                animate={{ y:[0,-6,0] }} transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}>
                {file.name.endsWith(".pdf") ? "📄" : "📝"}
              </motion.div>
              <p className="text-white font-semibold text-sm max-w-full truncate px-4">{file.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">{sizeMB}</span>
                <span className="text-gray-600">·</span>
                <motion.span className="text-emerald-400 text-xs font-medium flex items-center gap-1"
                  initial={{ opacity:0 }} animate={{ opacity:1 }}>
                  <motion.span animate={{ scale:[1,1.3,1] }} transition={{ duration:0.5 }}>✓</motion.span> Ready
                </motion.span>
              </div>
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-gray-600 hover:text-red-400 transition mt-1">
                ✕ Remove
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="empty"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex flex-col items-center gap-2">
              <motion.div className="text-4xl opacity-30 group-hover:opacity-60 transition-opacity"
                animate={{ y:[0,-5,0] }} transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }}>⬆️</motion.div>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition">
                Drag & drop or <span className="text-brand-400 underline underline-offset-2">browse</span>
              </p>
              <p className="text-gray-600 text-xs">PDF · DOCX</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Loading progress */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
            className="overflow-hidden space-y-2">
            <div className="flex items-center gap-2">
              <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full flex-shrink-0" />
              <motion.p key={step} initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                className="text-brand-400 text-xs font-medium">{STEPS[step]}</motion.p>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-brand-600 to-purple-600 rounded-full"
                animate={{ width: ["0%","30%","60%","85%","95%"] }}
                transition={{ duration:3.5, ease:"easeOut" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-2">
        <motion.button onClick={handleSubmit} disabled={!file || loading}
          whileHover={file && !loading ? { scale:1.02, y:-1 } : {}}
          whileTap={file && !loading ? { scale:0.97 } : {}}
          className="relative flex-1 py-2.5 rounded-xl font-bold text-sm overflow-hidden
            disabled:opacity-40 disabled:cursor-not-allowed text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-purple-600
            hover:from-brand-500 hover:to-purple-500 transition-all duration-300" />
          {file && !loading && (
            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
              animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:0.5 }} />
          )}
          <span className="relative">
            {loading ? "Parsing…" : "⚡ Parse Resume"}
          </span>
        </motion.button>

        {file && !loading && (
          <motion.button initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
            exit={{ scale:0, opacity:0 }} transition={{ type:"spring", stiffness:300 }}
            whileHover={{ scale:1.06 }} whileTap={{ scale:0.93 }}
            onClick={() => setFile(null)}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl text-sm transition font-medium border border-gray-700">
            Clear
          </motion.button>
        )}
      </div>
    </div>
  );
}