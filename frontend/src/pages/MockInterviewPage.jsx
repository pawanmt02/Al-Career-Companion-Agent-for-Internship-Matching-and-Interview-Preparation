import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axiosClient";
import toast from "react-hot-toast";

const PHASE = { SETUP:"setup", RUNNING:"running", REVIEW:"review" };

function Timer({ seconds, onTimeUp }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { setLeft(seconds); }, [seconds]);
  useEffect(() => {
    if (left <= 0) { onTimeUp(); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onTimeUp]);
  const pct = (left / seconds) * 100;
  const color = pct > 50 ? "text-green-400" : pct > 20 ? "text-amber-400" : "text-red-400";
  const m = Math.floor(left / 60);
  const s = left % 60;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div animate={{ width:`${pct}%` }} transition={{ duration:0.5 }}
          className={`h-full rounded-full ${pct > 50 ? "bg-green-500" : pct > 20 ? "bg-amber-500" : "bg-red-500"}`} />
      </div>
      <span className={`text-sm font-mono font-bold ${color}`}>
        {m}:{s.toString().padStart(2,"0")}
      </span>
    </div>
  );
}

export default function MockInterviewPage() {
  const [phase, setPhase]         = useState(PHASE.SETUP);
  const [internships, setInterns] = useState([]);
  const [selectedJob, setJob]     = useState(null);
  const [qCount, setQCount]       = useState(10);
  const [session, setSession]     = useState(null);
  const [currentIdx, setIdx]      = useState(0);
  const [showAnswer, setShowAns]  = useState(false);
  const [showHint, setShowHint]   = useState(false);
  const [scores, setScores]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);

  useEffect(() => {
    api.get("/internships")
      .then(r => setInterns(r.data.internships || r.data || []))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const startInterview = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ count: qCount });
      if (selectedJob) params.set("internship_id", selectedJob.id);
      const res = await api.post(`/mock-interview/start?${params}`);
      setSession(res.data.session);
      setIdx(0);
      setScores([]);
      setShowAns(false);
      setShowHint(false);
      setPhase(PHASE.RUNNING);
      toast.success("Mock interview started! Good luck! 🎤");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to start.");
    } finally { setLoading(false); }
  };

  const handleTimeUp = useCallback(() => {
    if (!showAnswer) setShowAns(true);
  }, [showAnswer]);

  const scoreQuestion = (score) => {
    setScores(prev => [...prev, { idx: currentIdx, score, question: session.questions[currentIdx] }]);
    if (currentIdx + 1 < session.questions.length) {
      setIdx(i => i + 1);
      setShowAns(false);
      setShowHint(false);
    } else {
      setPhase(PHASE.REVIEW);
    }
  };

  const currentQ = session?.questions?.[currentIdx];
  const totalScore = scores.reduce((a, s) => a + s.score, 0);
  const maxScore = scores.length * 5;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-3xl font-black text-white">
          ⏱️ <span className="gradient-text">Mock Interview</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Practice with timed questions, reveal answers, and rate your performance.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── SETUP ── */}
        {phase === PHASE.SETUP && (
          <motion.div key="setup" className="glass rounded-2xl p-6 space-y-5"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>

            <div>
              <p className="text-white font-semibold text-sm mb-2">Select Internship (optional)</p>
              <p className="text-gray-500 text-xs mb-3">Questions will be tailored to the required skills.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1
                [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                <motion.div
                  onClick={() => setJob(null)} whileTap={{ scale:0.97 }}
                  className={`rounded-xl border p-3 cursor-pointer text-center text-xs transition-all ${
                    !selectedJob ? "border-brand-600/60 bg-brand-900/20 text-brand-400" : "border-gray-700/60 bg-gray-900/50 text-gray-400 hover:border-gray-600"
                  }`}>
                  🎲 Random Mix
                </motion.div>
                {internships.map(job => (
                  <motion.div key={job.id} onClick={() => setJob(job)} whileTap={{ scale:0.97 }}
                    className={`rounded-xl border p-3 cursor-pointer text-xs transition-all ${
                      selectedJob?.id === job.id ? "border-brand-600/60 bg-brand-900/20 text-white" : "border-gray-700/60 bg-gray-900/50 text-gray-400 hover:border-gray-600"
                    }`}>
                    <p className="font-semibold truncate">{job.title}</p>
                    <p className="text-gray-500 truncate">{job.company}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-white font-semibold text-sm mb-2">Number of Questions</p>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(n => (
                  <motion.button key={n} onClick={() => setQCount(n)} whileTap={{ scale:0.95 }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      qCount === n ? "border-brand-600/60 bg-brand-900/30 text-brand-400" : "border-gray-700/60 bg-gray-900/50 text-gray-400 hover:border-gray-600"
                    }`}>{n}</motion.button>
                ))}
              </div>
            </div>

            <motion.button onClick={startInterview} disabled={loading}
              whileHover={!loading?{scale:1.02,y:-1}:{}} whileTap={!loading?{scale:0.97}:{}}
              className="relative w-full py-3.5 rounded-xl font-bold text-white text-sm overflow-hidden disabled:opacity-60">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-brand-600 to-purple-600 transition-all" />
              {!loading && (
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                  animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:0.5 }} />
              )}
              <span className="relative flex items-center justify-center gap-2">
                {loading ? "Starting…" : <><span>🎤</span> Start Mock Interview</>}
              </span>
            </motion.button>
          </motion.div>
        )}

        {/* ── RUNNING ── */}
        {phase === PHASE.RUNNING && currentQ && (
          <motion.div key="running" className="space-y-4"
            initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>

            {/* Progress */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Question {currentIdx + 1} of {session.total_questions}</span>
              <span className={`px-2 py-0.5 rounded-full border font-medium ${
                currentQ.category === "technical" ? "text-brand-400 bg-brand-900/40 border-brand-800/50" : "text-purple-400 bg-purple-900/40 border-purple-800/50"
              }`}>{currentQ.category === "technical" ? `💻 ${currentQ.skill}` : "🤝 HR"}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${((currentIdx + 1) / session.total_questions) * 100}%` }}
                className="h-full bg-gradient-to-r from-brand-600 to-purple-600 rounded-full" />
            </div>

            {/* Timer */}
            <Timer key={currentIdx} seconds={currentQ.time_limit} onTimeUp={handleTimeUp} />

            {/* Question card */}
            <motion.div key={currentIdx}
              initial={{ opacity:0, y:20, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
              className="glass rounded-2xl p-6 border border-gray-700/60">
              <p className="text-white text-lg font-semibold leading-relaxed">{currentQ.question}</p>

              <div className="mt-4 flex gap-2">
                <motion.button onClick={() => setShowHint(h => !h)}
                  whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-brand-400 hover:bg-gray-700 border border-gray-700 transition font-medium">
                  💡 {showHint ? "Hide Hint" : "Show Hint"}
                </motion.button>
                {!showAnswer && (
                  <motion.button onClick={() => setShowAns(true)}
                    whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-emerald-400 hover:bg-gray-700 border border-gray-700 transition font-medium">
                    ✅ Reveal Answer
                  </motion.button>
                )}
              </div>

              <AnimatePresence>
                {showHint && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                    exit={{ height:0, opacity:0 }} className="overflow-hidden">
                    <p className="text-sm text-gray-400 mt-3 pl-3 border-l-2 border-brand-600/50">💡 {currentQ.hint}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showAnswer && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                    exit={{ height:0, opacity:0 }} className="overflow-hidden">
                    <div className="mt-4 pl-3 border-l-2 border-emerald-600/50">
                      <p className="text-xs text-emerald-400 font-semibold mb-1">✅ Model Answer</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{currentQ.answer}</p>
                    </div>

                    {/* Self-rating */}
                    <div className="mt-4 pt-3 border-t border-gray-700/50">
                      <p className="text-xs text-gray-500 font-semibold mb-2">Rate your answer:</p>
                      <div className="flex gap-2">
                        {[
                          { score:1, label:"😟 Poor", color:"border-red-700 text-red-400 hover:bg-red-900/30" },
                          { score:2, label:"😐 Okay", color:"border-orange-700 text-orange-400 hover:bg-orange-900/30" },
                          { score:3, label:"🙂 Good", color:"border-amber-700 text-amber-400 hover:bg-amber-900/30" },
                          { score:4, label:"😊 Great", color:"border-green-700 text-green-400 hover:bg-green-900/30" },
                          { score:5, label:"🌟 Perfect", color:"border-emerald-700 text-emerald-400 hover:bg-emerald-900/30" },
                        ].map(r => (
                          <motion.button key={r.score} onClick={() => scoreQuestion(r.score)}
                            whileHover={{ scale:1.06, y:-2 }} whileTap={{ scale:0.95 }}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${r.color}`}>
                            {r.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Skip button */}
            {!showAnswer && (
              <div className="text-center">
                <motion.button onClick={() => { setShowAns(true); }}
                  whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  className="text-xs text-gray-500 hover:text-gray-400 transition">
                  Skip question →
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── REVIEW ── */}
        {phase === PHASE.REVIEW && (
          <motion.div key="review" className="space-y-5"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>

            {/* Score summary */}
            <div className="glass rounded-2xl p-6 text-center border border-brand-900/50">
              <p className="text-4xl mb-2">
                {totalScore / maxScore >= 0.8 ? "🏆" : totalScore / maxScore >= 0.6 ? "👏" : totalScore / maxScore >= 0.4 ? "💪" : "📚"}
              </p>
              <p className="text-3xl font-black text-white">{totalScore} / {maxScore}</p>
              <p className="text-gray-400 text-sm mt-1">
                {Math.round((totalScore / maxScore) * 100)}% — {
                  totalScore / maxScore >= 0.8 ? "Excellent! You're interview-ready!" :
                  totalScore / maxScore >= 0.6 ? "Good job! Keep practicing a few more." :
                  totalScore / maxScore >= 0.4 ? "Not bad! Focus on weaker areas." :
                  "Keep practicing! Review the answers below."
                }
              </p>
              <div className="flex justify-center gap-4 mt-4 text-xs">
                <div className="bg-gray-800 rounded-lg px-3 py-2">
                  <p className="text-gray-500">Questions</p>
                  <p className="text-white font-bold">{scores.length}</p>
                </div>
                <div className="bg-gray-800 rounded-lg px-3 py-2">
                  <p className="text-gray-500">Avg Score</p>
                  <p className="text-white font-bold">{(totalScore / scores.length).toFixed(1)}/5</p>
                </div>
                <div className="bg-gray-800 rounded-lg px-3 py-2">
                  <p className="text-gray-500">Perfect</p>
                  <p className="text-white font-bold">{scores.filter(s => s.score === 5).length}</p>
                </div>
              </div>
            </div>

            {/* Question review */}
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Question Review</p>
            <div className="space-y-2">
              {scores.map((s, i) => {
                const scoreColors = ["","text-red-400","text-orange-400","text-amber-400","text-green-400","text-emerald-400"];
                return (
                  <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl p-3 border border-gray-700/60 flex items-start gap-3">
                    <span className={`text-sm font-black mt-0.5 ${scoreColors[s.score]}`}>{s.score}/5</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{s.question.question}</p>
                      {s.question.skill && (
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full mt-1 inline-block">{s.question.skill}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Restart */}
            <div className="flex gap-3 justify-center">
              <motion.button onClick={() => { setPhase(PHASE.SETUP); setSession(null); }}
                whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                className="px-6 py-2.5 text-sm bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl transition font-semibold">
                🔄 New Interview
              </motion.button>
              <motion.button onClick={startInterview}
                whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                className="px-6 py-2.5 text-sm bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition font-semibold">
                🔁 Retry Same Setup
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
