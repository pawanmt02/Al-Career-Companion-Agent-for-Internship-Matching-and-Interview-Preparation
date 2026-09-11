import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axiosClient";
import toast from "react-hot-toast";

const GRADE_COLOR = {
  "A+":"text-green-400","A":"text-green-400","B+":"text-emerald-400",
  "B":"text-amber-400","C":"text-orange-400","D":"text-red-400",
};
const SECTION_ICON = {
  contact_info:"📇", skills:"🛠️", experience:"💼", education:"🎓",
  formatting:"📐", ats_keywords:"🔑",
};

function ScoreRing({ score, max, size = 120 }) {
  const pct = Math.round((score / max) * 100);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
  return (
    <svg width={size} height={size} className="mx-auto">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="45%" textAnchor="middle" fill="white" className="text-2xl font-black">{pct}%</text>
      <text x="50%" y="62%" textAnchor="middle" fill="#9ca3af" className="text-xs">Score</text>
    </svg>
  );
}

function SectionCard({ sKey, sec, index }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round((sec.score / sec.max) * 100);
  const barColor = pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="glass rounded-xl p-4 border border-gray-700/60 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{SECTION_ICON[sKey] || "📋"}</span>
          <span className="text-white text-sm font-semibold">{sec.label}</span>
        </div>
        <span className="text-xs font-bold text-gray-400">{sec.score}/{sec.max}</span>
      </div>
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }}
          transition={{ duration:0.8, delay: index * 0.06 }}
          className={`h-full rounded-full ${barColor}`} />
      </div>
      {sec.tips.length > 0 && (
        <>
          <motion.button onClick={() => setOpen(o => !o)}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition mt-1">
            <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration:0.2 }}>›</motion.span>
            {sec.tips.length} improvement tip{sec.tips.length > 1 ? "s" : ""}
          </motion.button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }} className="overflow-hidden">
                <div className="mt-2 space-y-1.5">
                  {sec.tips.map((t, i) => (
                    <p key={i} className="text-xs text-gray-400 pl-3 border-l-2 border-amber-600/40 leading-relaxed">
                      💡 {t}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      {sec.tips.length === 0 && (
        <p className="text-xs text-green-400 mt-1">✅ Looks great!</p>
      )}
    </motion.div>
  );
}

export default function ResumeAnalyzerPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true); setData(null);
    try {
      const res = await api.post("/resume/analyze");
      setData(res.data);
      toast.success("Resume analysis complete! 📊");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload resume from Dashboard first.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-3xl font-black text-white">
          📊 <span className="gradient-text">Resume Analyzer</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Get an ATS compatibility score, section-by-section feedback, and actionable improvement tips.
        </p>
      </motion.div>

      {!data ? (
        <motion.div className="glass rounded-2xl p-12 text-center border border-dashed border-gray-800"
          initial={{ opacity:0 }} animate={{ opacity:1 }}>
          <motion.div className="text-5xl mb-4 opacity-30"
            animate={{ y:[0,-8,0], rotate:[0,5,-5,0] }}
            transition={{ duration:4, repeat:Infinity, ease:"easeInOut" }}>📊</motion.div>
          <p className="text-gray-500 mb-6 text-sm">
            Analyze your uploaded resume for ATS compatibility, content quality, and get improvement tips.
          </p>
          <motion.button onClick={analyze} disabled={loading}
            whileHover={!loading?{scale:1.03}:{}} whileTap={!loading?{scale:0.97}:{}}
            className="relative px-8 py-3.5 rounded-xl font-bold text-white text-sm overflow-hidden disabled:opacity-60">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-brand-600 to-purple-600 hover:from-blue-500 hover:via-brand-500 hover:to-purple-500 transition-all" />
            {!loading && (
              <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:0.5 }} />
            )}
            <span className="relative flex items-center justify-center gap-2">
              {loading
                ? <><motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/>Analyzing…</>
                : <><span>🔍</span> Analyze My Resume</>}
            </span>
          </motion.button>
        </motion.div>
      ) : (
        <motion.div className="space-y-5" initial={{ opacity:0 }} animate={{ opacity:1 }}>

          {/* Score header */}
          <div className="glass rounded-2xl p-6 border border-brand-900/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center">
                <ScoreRing score={data.overall_score} max={data.max_score} />
                <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1 }}
                  className={`text-2xl font-black mt-2 ${GRADE_COLOR[data.grade] || "text-white"}`}>
                  Grade: {data.grade}
                </motion.p>
              </div>
              <div className="md:col-span-2 space-y-2">
                <p className="text-white font-semibold text-sm">Profile Summary</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label:"Name", value: data.profile_summary.name || "—" },
                    { label:"Email", value: data.profile_summary.email || "—" },
                    { label:"Skills", value: data.profile_summary.skills_count },
                    { label:"Experience", value: `${data.profile_summary.experience_count} entries` },
                    { label:"Education", value: `${data.profile_summary.education_count} entries` },
                    { label:"Resume Length", value: `${(data.profile_summary.resume_length/1000).toFixed(1)}k chars` },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-800/50 rounded-lg p-2">
                      <p className="text-gray-500 text-xs">{s.label}</p>
                      <p className="text-white text-sm font-medium">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section breakdown */}
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">Section Breakdown</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(data.sections).map(([key, sec], i) => (
                <SectionCard key={key} sKey={key} sec={sec} index={i} />
              ))}
            </div>
          </div>

          {/* Top tips */}
          {data.top_tips.length > 0 && (
            <div className="glass rounded-xl p-4 border border-amber-900/40">
              <p className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <span>🎯</span> Top Improvement Tips
              </p>
              <div className="space-y-2">
                {data.top_tips.map((tip, i) => (
                  <motion.div key={i} className="flex items-start gap-2"
                    initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: i * 0.06 }}>
                    <span className="text-amber-400 text-xs mt-0.5">→</span>
                    <p className="text-gray-300 text-sm">{tip}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Re-analyze button */}
          <div className="text-center">
            <motion.button onClick={analyze} disabled={loading}
              whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
              className="px-6 py-2.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 rounded-xl transition font-semibold">
              ↻ Re-analyze Resume
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
