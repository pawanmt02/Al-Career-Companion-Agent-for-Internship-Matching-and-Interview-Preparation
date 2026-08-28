import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import ResumeUploader from "../components/ResumeUploader";
import ParsedResumeCard from "../components/ParsedResumeCard";
import RagMatchCard from "../components/RagMatchCard";

/* ── Animated number counter ── */
function Counter({ value, suffix="" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once:true });
  useEffect(() => {
    if (!inView || value === null) return;
    const num = typeof value === "number" ? value : parseInt(value) || 0;
    let start = 0;
    const step = Math.ceil(num / 24);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setDisplay(num); clearInterval(timer); }
      else setDisplay(start);
    }, 40);
    return () => clearInterval(timer);
  }, [value, inView]);
  return <span ref={ref}>{value === null ? "—" : display + suffix}</span>;
}

/* ── Stat card ── */
function StatCard({ icon, label, value, suffix, sub, gradient, delay }) {
  return (
    <motion.div
      initial={{ opacity:0, y:30, scale:0.9 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay, duration:0.5, ease:[0.22,1,0.36,1] }}
      className="relative glass rounded-2xl p-5 overflow-hidden card-shine grad-border group cursor-default"
    >
      {/* Background glow */}
      <div className={"absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 " + gradient}
        style={{ filter:"blur(40px)", transform:"scale(0.6)", borderRadius:"50%" }} />

      <div className="relative">
        <motion.div className="text-3xl mb-3"
          animate={{ rotate:[0,8,-8,0], scale:[1,1.1,1] }}
          transition={{ duration:3, repeat:Infinity, repeatDelay: delay * 3 + 2 }}>
          {icon}
        </motion.div>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mb-1">{label}</p>
        <p className={"text-2xl font-black " + (value === null ? "text-gray-700" : "text-white")}>
          <Counter value={value} suffix={suffix} />
        </p>
        {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ── Step pill ── */
function StepPill({ n, text, delay }) {
  return (
    <motion.div className="flex items-center gap-3"
      initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
      transition={{ delay, duration:0.4 }}>
      <motion.div whileHover={{ scale:1.2, rotate:10 }}
        className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-purple-600
          flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg shadow-brand-500/30">
        {n}
      </motion.div>
      <p className="text-gray-400 text-sm">{text}</p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [result, setResult] = useState(null);

  const matchCount = result?.data?.rag_matches?.length ?? null;
  const skillCount = result?.data?.parsed_resume?.extracted_skills?.length ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      {/* ── Hero greeting ── */}
      <motion.div className="relative"
        initial={{ opacity:0, y:-24 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <motion.p className="text-gray-500 text-sm font-medium mb-1"
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}>
              Welcome back 👋
            </motion.p>
            <h1 className="text-4xl font-black tracking-tight">
              Hello,{" "}
              <span className="gradient-text">{user?.full_name?.split(" ")[0]}</span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm max-w-lg">
              Upload your resume below — AI will extract your skills and match you to the best internship opportunities.
            </p>
          </div>
          {result && (
            <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
              className="flex items-center gap-2 bg-green-950/50 border border-green-800/50 rounded-xl px-4 py-2">
              <motion.div className="w-2 h-2 rounded-full bg-green-400"
                animate={{ scale:[1,1.5,1], opacity:[1,0.4,1] }}
                transition={{ duration:1.5, repeat:Infinity }} />
              <span className="text-green-400 text-xs font-semibold">Resume parsed</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon="📄" label="Resume" delay={0.1}
          value={result ? "✓" : null} suffix=""
          sub={result ? "Saved to database" : "Not uploaded yet"}
          gradient="bg-blue-500" />
        <StatCard icon="🎯" label="RAG Matches" delay={0.18}
          value={matchCount} suffix={matchCount === 1 ? " match" : matchCount !== null ? " matches" : ""}
          sub={matchCount !== null ? "Internships found" : "Upload to see matches"}
          gradient="bg-purple-500" />
        <StatCard icon="⚡" label="Skills Found" delay={0.26}
          value={skillCount} suffix={skillCount !== null ? " skills" : ""}
          sub={skillCount !== null ? "Detected in resume" : "Will appear after parse"}
          gradient="bg-emerald-500" />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Uploader + how-it-works */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }}
            transition={{ delay:0.3, duration:0.5 }}>
            <ResumeUploader onResult={setResult} />
          </motion.div>

          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div key="how"
                className="glass rounded-2xl p-5 space-y-3"
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-8 }} transition={{ delay:0.4 }}>
                <p className="text-white font-semibold text-sm flex items-center gap-2">
                  <span>🗺️</span> How it works
                </p>
                <StepPill n="1" text="Upload your PDF or DOCX resume" delay={0.45} />
                <StepPill n="2" text="AI extracts skills, education & experience" delay={0.52} />
                <StepPill n="3" text="RAG finds your top 5 matching internships" delay={0.59} />
                <StepPill n="4" text="Click any match to generate a cover letter" delay={0.66} />
              </motion.div>
            ) : (
              <motion.div key="summary" className="glass rounded-2xl p-5"
                initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0 }}>
                <p className="text-white font-semibold text-sm mb-3">📊 Parse Summary</p>
                <div className="space-y-2">
                  {[
                    ["Resume ID",  "#" + result.database_resume_id, "text-white"],
                    ["Status",     "✓ Saved",                       "text-green-400"],
                    ["Matches",    matchCount + " found",            "text-purple-400"],
                    ["Skills",     skillCount + " detected",         "text-brand-400"],
                  ].map(([k,v,c]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-gray-500">{k}</span>
                      <span className={"font-semibold " + c}>{v}</span>
                    </div>
                  ))}
                </div>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  onClick={() => setResult(null)}
                  className="mt-4 w-full py-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition">
                  ↑ Upload another resume
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="results" className="space-y-5"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>

                {/* Success banner */}
                <motion.div
                  initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
                  className="relative glass rounded-2xl p-4 border border-green-900/50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-950/40 to-transparent" />
                  <div className="relative flex items-center gap-3">
                    <motion.div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center"
                      animate={{ scale:[1,1.15,1] }} transition={{ duration:2, repeat:Infinity }}>
                      <span className="text-green-400 text-sm">✓</span>
                    </motion.div>
                    <div>
                      <p className="text-white font-semibold text-sm">{result.message}</p>
                      <p className="text-gray-500 text-xs">ID #{result.database_resume_id} · Profile auto-updated</p>
                    </div>
                  </div>
                </motion.div>

                {result.data?.rag_matches?.length > 0 && (
                  <RagMatchCard matches={result.data.rag_matches} />
                )}
                {result.data?.parsed_resume && (
                  <ParsedResumeCard data={result.data} />
                )}
              </motion.div>
            ) : (
              <motion.div key="empty"
                className="glass rounded-2xl flex flex-col items-center justify-center text-center p-16 min-h-72 border border-dashed border-gray-800"
                initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0 }}>
                <motion.div className="text-7xl mb-5 opacity-10 select-none"
                  animate={{ y:[0,-12,0], rotate:[0,6,-6,0] }}
                  transition={{ duration:5, repeat:Infinity, ease:"easeInOut" }}>
                  🎯
                </motion.div>
                <p className="text-gray-600 font-semibold text-lg">No results yet</p>
                <p className="text-gray-700 text-sm mt-1 max-w-xs">
                  Upload your resume and click <span className="text-brand-600 font-medium">Parse Resume</span> to see AI matches here.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}