import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axiosClient";
import toast from "react-hot-toast";

const WORK_ICON = { Remote:"🌐", Hybrid:"🏢", "On-site":"📍" };
const TAB_CFG = {
  technical:   { icon:"💻", label:"Technical",   color:"text-brand-400",   bg:"bg-brand-900/40 border-brand-700" },
  hr:          { icon:"🤝", label:"HR / Behavioral", color:"text-purple-400", bg:"bg-purple-900/40 border-purple-700" },
  situational: { icon:"🎯", label:"Situational",  color:"text-amber-400",   bg:"bg-amber-900/40 border-amber-700" },
  roadmap:     { icon:"🗺️", label:"Roadmap",      color:"text-emerald-400", bg:"bg-emerald-900/40 border-emerald-700" },
};

function QuestionCard({ q, index }) {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  return (
    <motion.div
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.04, duration:0.35 }}
      className="border border-gray-700/60 bg-gray-900/60 rounded-xl p-4 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-gray-500 bg-gray-800 rounded-lg w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium leading-relaxed">{q.question}</p>
          {q.skill && (
            <span className={"inline-block mt-2 text-xs px-2 py-0.5 rounded-full border font-medium " +
              (q.matched ? "bg-green-900/40 text-green-400 border-green-800/50" : "bg-gray-800 text-gray-400 border-gray-700")}>
              {q.matched ? "✓ " : ""}{q.skill}
            </span>
          )}
          <div className="mt-3 flex items-center gap-3">
            <motion.button
              onClick={() => setShowHint(h => !h)}
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition"
            >
              <motion.span animate={{ rotate: showHint ? 90 : 0 }} transition={{ duration:0.2 }}>›</motion.span>
              {showHint ? "Hide Hint" : "Show Hint"}
            </motion.button>
            {q.answer && (
              <motion.button
                onClick={() => setShowAnswer(a => !a)}
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
              >
                <motion.span animate={{ rotate: showAnswer ? 90 : 0 }} transition={{ duration:0.2 }}>›</motion.span>
                {showAnswer ? "Hide Answer" : "Show Answer"}
              </motion.button>
            )}
          </div>
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-gray-400 mt-2 pl-3 border-l-2 border-brand-600/50 leading-relaxed">
                  💡 {q.hint}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showAnswer && q.answer && (
              <motion.div
                initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-2 pl-3 border-l-2 border-emerald-600/50">
                  <p className="text-xs text-emerald-400 font-semibold mb-1">✅ Answer</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{q.answer}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function InterviewPrepPage() {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [selected, setSelected]       = useState(null);
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [fetching, setFetching]       = useState(true);
  const [activeTab, setActiveTab]     = useState("technical");

  useEffect(() => {
    api.get("/internships")
      .then(r => setInternships(r.data.internships || r.data || []))
      .catch(() => toast.error("Could not load internships."))
      .finally(() => setFetching(false));
  }, []);

  const generate = async () => {
    if (!selected) return toast.error("Select an internship first.");
    setLoading(true); setData(null);
    try {
      const res = await api.post(`/internships/${selected.id}/interview-questions`);
      setData(res.data);
      setActiveTab("technical");
      toast.success("Interview questions ready! 🎯");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload resume from Dashboard first.");
    } finally { setLoading(false); }
  };

  const questions = data ? {
    technical: data.technical_questions || [],
    hr: data.hr_questions || [],
    situational: data.situational_questions || [],
  } : {};

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
        <div className="flex items-center gap-3 mb-1">
          <motion.button whileHover={{ x:-4 }} onClick={() => navigate("/")}
            className="text-gray-500 hover:text-white transition text-sm">← Back</motion.button>
          <span className="text-gray-700">·</span>
          <span className="text-gray-500 text-sm">Interview Preparation</span>
        </div>
        <h1 className="text-3xl font-black text-white">
          🎓 <span className="gradient-text">Interview Prep</span> Generator
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Select an internship to generate personalized technical, HR & situational questions with a preparation roadmap.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left — Internship picker */}
        <div className="lg:col-span-2 space-y-3">
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }}
            className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
            Select Internship
          </motion.p>

          {fetching ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.08 }}
                  className="h-16 rounded-xl shimmer" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1
              [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {internships.map((job, i) => {
                const isActive = selected?.id === job.id;
                return (
                  <motion.div key={job.id}
                    initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: i*0.04, duration:0.3 }}
                    onClick={() => { setSelected(job); setData(null); }}
                    whileHover={{ x:3 }} whileTap={{ scale:0.98 }}
                    className={"relative rounded-xl border p-3.5 cursor-pointer transition-all duration-200 overflow-hidden card-shine " +
                      (isActive
                        ? "border-brand-600/60 bg-brand-900/20 shadow-lg shadow-brand-500/10"
                        : "border-gray-700/60 bg-gray-900/50 hover:border-gray-600")}
                  >
                    {isActive && (
                      <motion.div layoutId="interview-selector"
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-400" />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={"font-semibold text-xs leading-snug " + (isActive?"text-white":"text-gray-300")}>{job.title}</p>
                        <p className={"text-xs mt-0.5 " + (isActive?"text-brand-400":"text-gray-500")}>{job.company}</p>
                      </div>
                      {isActive && (
                        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:300 }}
                          className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs flex-shrink-0">✓</motion.div>
                      )}
                    </div>
                    {job.work_mode && (
                      <p className="text-xs text-gray-600 mt-1.5">
                        {WORK_ICON[job.work_mode]} {job.work_mode}
                        {job.duration && ` · ⏱ ${job.duration}`}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — Generator */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div key="empty"
                className="glass rounded-2xl flex flex-col items-center justify-center p-16 text-center border border-dashed border-gray-800 min-h-64"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <motion.div className="text-5xl mb-4 opacity-20"
                  animate={{ y:[0,-10,0], rotate:[0,8,-8,0] }}
                  transition={{ duration:4, repeat:Infinity, ease:"easeInOut" }}>🎓</motion.div>
                <p className="text-gray-600 font-semibold">Pick an internship</p>
                <p className="text-gray-700 text-sm mt-1">Interview questions will appear here</p>
              </motion.div>
            ) : !data ? (
              <motion.div key="generate" className="space-y-4"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }} transition={{ duration:0.35 }}>

                {/* Selected job header */}
                <div className="glass rounded-2xl p-4 flex items-center gap-4">
                  <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:250 }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-brand-500/20">
                    🎓
                  </motion.div>
                  <div>
                    <p className="text-white font-semibold text-sm">{selected.title}</p>
                    <p className="text-gray-400 text-xs">{selected.company} · {selected.required_skills?.slice(0,3).join(", ")}</p>
                  </div>
                </div>

                {/* Generate button */}
                <motion.button onClick={generate} disabled={loading}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  whileHover={!loading?{scale:1.02,y:-1}:{}} whileTap={!loading?{scale:0.97}:{}}
                  className="relative w-full py-3.5 rounded-xl font-bold text-white text-sm overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-brand-600 to-purple-600 hover:from-emerald-500 hover:via-brand-500 hover:to-purple-500 transition-all" />
                  {!loading && (
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                      animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:0.5 }} />
                  )}
                  <span className="relative flex items-center justify-center gap-2">
                    {loading
                      ? <><motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/>Generating questions…</>
                      : <><span>🎯</span> Generate Interview Questions</>}
                  </span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="results" className="space-y-4"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>

                {/* Summary stats */}
                <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
                  className="glass rounded-2xl p-4 border border-brand-900/50 overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎓</span>
                      <div>
                        <p className="text-white font-semibold text-sm">{data.internship.title}</p>
                        <p className="text-gray-500 text-xs">{data.internship.company}</p>
                      </div>
                    </div>
                    <motion.button onClick={() => { setData(null); }}
                      whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                      className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition">
                      ↻ Regenerate
                    </motion.button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label:"Technical", value: data.summary.technical_count, color:"text-brand-400" },
                      { label:"HR", value: data.summary.hr_count, color:"text-purple-400" },
                      { label:"Situational", value: data.summary.situational_count, color:"text-amber-400" },
                      { label:"Total", value: data.summary.total_questions, color:"text-white" },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className={"text-lg font-black " + s.color}>{s.value}</p>
                        <p className="text-gray-500 text-xs">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(TAB_CFG).map(([key, cfg]) => (
                    <motion.button key={key} onClick={() => setActiveTab(key)}
                      whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                      className={"px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border " +
                        (activeTab === key
                          ? cfg.bg + " " + cfg.color
                          : "border-gray-700/60 bg-gray-900/50 text-gray-500 hover:text-gray-300 hover:border-gray-600")}>
                      <span>{cfg.icon}</span> {cfg.label}
                      {key !== "roadmap" && questions[key] && (
                        <span className="ml-1 bg-gray-800 px-1.5 py-0.5 rounded-full text-xs">{questions[key].length}</span>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                  {activeTab !== "roadmap" ? (
                    <motion.div key={activeTab} className="space-y-2"
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
                      transition={{ duration:0.25 }}>
                      {(questions[activeTab] || []).map((q, i) => (
                        <QuestionCard key={i} q={q} index={i} />
                      ))}
                      {(questions[activeTab] || []).length === 0 && (
                        <div className="text-center py-10 text-gray-600 text-sm">No questions in this category.</div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="roadmap" className="space-y-4"
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
                      transition={{ duration:0.25 }}>

                      {/* Strong areas */}
                      <div className="glass rounded-xl p-4">
                        <p className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                          <span>✅</span> Your Strong Areas
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {data.roadmap.strong_areas.length > 0 ? data.roadmap.strong_areas.map(s => (
                            <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-green-900/40 text-green-300 border border-green-800/60">
                              ✓ {s}
                            </span>
                          )) : <span className="text-gray-500 text-xs">Upload your resume to see matched skills</span>}
                        </div>
                      </div>

                      {/* Areas to improve */}
                      {data.roadmap.areas_to_improve.length > 0 && (
                        <div className="glass rounded-xl p-4">
                          <p className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                            <span>📚</span> Areas to Improve
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {data.roadmap.areas_to_improve.map(s => (
                              <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-amber-900/40 text-amber-300 border border-amber-800/60">
                                ⚡ {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preparation tips */}
                      <div className="glass rounded-xl p-4">
                        <p className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                          <span>🗺️</span> Preparation Roadmap
                        </p>
                        <div className="space-y-2">
                          {data.roadmap.preparation_tips.map((tip, i) => (
                            <motion.div key={i} className="flex items-start gap-3"
                              initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                              transition={{ delay: i * 0.06 }}>
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
                                {i + 1}
                              </div>
                              <p className="text-gray-300 text-sm">{tip}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Recommended topics */}
                      <div className="glass rounded-xl p-4">
                        <p className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                          <span>📖</span> Topics to Study
                        </p>
                        <div className="space-y-1.5">
                          {data.roadmap.recommended_topics.map((topic, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                              <span className="text-brand-400">→</span> {topic}
                            </div>
                          ))}
                        </div>
                      </div>
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
