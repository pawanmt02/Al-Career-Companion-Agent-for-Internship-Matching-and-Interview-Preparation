import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosClient";
import toast from "react-hot-toast";

const ALL_SKILLS = [
  { name:"Python",          cat:"AI/ML"     },
  { name:"PyTorch",         cat:"AI/ML"     },
  { name:"Hugging Face",    cat:"AI/ML"     },
  { name:"LLMs",            cat:"AI/ML"     },
  { name:"RAG",             cat:"AI/ML"     },
  { name:"LangChain",       cat:"AI/ML"     },
  { name:"Scikit-Learn",    cat:"AI/ML"     },
  { name:"FastAPI",         cat:"Backend"   },
  { name:"REST APIs",       cat:"Backend"   },
  { name:"PostgreSQL",      cat:"Backend"   },
  { name:"Node.js",         cat:"Backend"   },
  { name:"Docker",          cat:"DevOps"    },
  { name:"AWS",             cat:"DevOps"    },
  { name:"React.js",        cat:"Frontend"  },
  { name:"JavaScript",      cat:"Frontend"  },
  { name:"TypeScript",      cat:"Frontend"  },
  { name:"HTML",            cat:"Frontend"  },
  { name:"CSS",             cat:"Frontend"  },
  { name:"Pandas",          cat:"Data"      },
  { name:"SQL",             cat:"Data"      },
  { name:"Data Visualization",cat:"Data"   },
  { name:"Streamlit",       cat:"Data"      },
  { name:"Java",            cat:"Other"     },
];

const CAT_COLOR = {
  "AI/ML":    { bg:"bg-purple-900/50",  text:"text-purple-300",  border:"border-purple-700/50",  dot:"bg-purple-400"  },
  "Backend":  { bg:"bg-blue-900/50",    text:"text-blue-300",    border:"border-blue-700/50",    dot:"bg-blue-400"    },
  "DevOps":   { bg:"bg-orange-900/50",  text:"text-orange-300",  border:"border-orange-700/50",  dot:"bg-orange-400"  },
  "Frontend": { bg:"bg-pink-900/50",    text:"text-pink-300",    border:"border-pink-700/50",    dot:"bg-pink-400"    },
  "Data":     { bg:"bg-emerald-900/50", text:"text-emerald-300", border:"border-emerald-700/50", dot:"bg-emerald-400" },
  "Other":    { bg:"bg-gray-800/70",    text:"text-gray-300",    border:"border-gray-600/50",    dot:"bg-gray-400"    },
};

/* Circular progress ring */
function RadialProgress({ pct, size=120, stroke=10 }) {
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (pct / 100) * circ;
  const color = pct >= 60 ? "#10b981" : pct >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - fill }}
        transition={{ duration:1.5, delay:0.3, ease:"easeOut" }} />
    </svg>
  );
}

/* Skill row with animated bar */
function SkillRow({ skill, have, idx }) {
  const c = CAT_COLOR[skill.cat];
  return (
    <motion.div
      initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: 0.05 + idx*0.03, duration:0.35 }}
      className="group flex items-center gap-3 py-1.5"
    >
      <motion.div
        whileHover={{ scale:1.3 }}
        className={"w-2 h-2 rounded-full flex-shrink-0 transition-all " + (have ? c.dot : "bg-gray-700")} />
      <span className={"flex-1 text-xs transition-colors duration-200 " + (have ? "text-gray-300 group-hover:text-white" : "text-gray-600")}>
        {skill.name}
      </span>
      <span className={"text-xs px-1.5 py-0.5 rounded-md border " + (have ? c.bg+" "+c.text+" "+c.border : "bg-gray-900 text-gray-700 border-gray-800")}>
        {skill.cat}
      </span>
      <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden flex-shrink-0">
        <motion.div
          className={"h-full rounded-full " + (have ? c.dot : "bg-gray-800")}
          initial={{ width:0 }}
          animate={{ width: have ? "100%" : "6%" }}
          transition={{ delay: 0.1 + idx*0.03, duration:0.7, ease:"easeOut" }} />
      </div>
      {have
        ? <motion.span initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.2+idx*0.03, type:"spring", stiffness:250 }}
            className="text-emerald-400 text-xs w-4 flex-shrink-0">✓</motion.span>
        : <span className="text-gray-700 text-xs w-4 flex-shrink-0">–</span>}
    </motion.div>
  );
}

/* Collapsible section */
function Section({ icon, title, children, delay=0, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.4 }}
      className="glass rounded-2xl overflow-hidden">
      <motion.button onClick={() => setOpen(o => !o)} whileHover={{ backgroundColor:"rgba(255,255,255,0.02)" }}
        className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="flex items-center gap-2 font-semibold text-white text-sm">
          <span className="text-base">{icon}</span>{title}
        </span>
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration:0.25 }}
          className="text-gray-600">›</motion.span>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.35, ease:[0.22,1,0.36,1] }}
            className="overflow-hidden border-t border-gray-800/60">
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resumeData, setResumeData]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDel, setConfirmDel]   = useState(false);
  const [activeTab, setActiveTab]     = useState("skills");
  const [hoveredSkill, setHoveredSkill] = useState(null);

  useEffect(() => {
    api.get("/users/profile/resume-data")
      .then(r => setResumeData(r.data))
      .catch(() => setResumeData(null))
      .finally(() => setLoading(false));
  }, []);

  const userSet   = new Set((resumeData?.skills || []).map(s => s.toLowerCase()));
  const matched   = ALL_SKILLS.filter(s => userSet.has(s.name.toLowerCase()));
  const missing   = ALL_SKILLS.filter(s => !userSet.has(s.name.toLowerCase()));
  const pct       = ALL_SKILLS.length ? Math.round(matched.length / ALL_SKILLS.length * 100) : 0;
  const readyLabel = pct >= 60 ? { text:"Interview Ready", color:"text-emerald-400" }
                   : pct >= 30 ? { text:"Building Up",    color:"text-amber-400"   }
                   :             { text:"Just Starting",   color:"text-red-400"     };

  const TABS = ["skills","resume","account"];

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try {
      await api.delete("/users/profile");
      logout(); toast.success("Account deleted."); navigate("/register");
    } catch (err) { toast.error(err.response?.data?.detail || "Failed."); }
    finally { setDeleting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

      {/* ── Hero card ── */}
      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
        className="relative glass rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 via-purple-900/20 to-transparent" />
        {/* Shimmer line */}
        <motion.div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500"
          animate={{ scaleX:[0.3,1,0.3], x:["-30%","0%","30%"] }}
          transition={{ duration:4, repeat:Infinity, ease:"easeInOut" }} />

        <div className="relative px-6 py-5 flex items-center gap-5">
          {/* Avatar with ring animation */}
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ boxShadow:["0 0 0 0 rgba(14,165,233,0.4)","0 0 0 10px rgba(14,165,233,0)","0 0 0 0 rgba(14,165,233,0)"] }}
              transition={{ duration:2.5, repeat:Infinity }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 via-purple-500 to-pink-500
                flex items-center justify-center text-2xl font-black text-white">
              {user?.full_name?.[0]?.toUpperCase()}
            </motion.div>
            <motion.div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-gray-950"
              animate={{ scale:[1,1.3,1] }} transition={{ duration:2, repeat:Infinity }} />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-black text-white">{user?.full_name}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            {resumeData?.phone && <p className="text-gray-500 text-xs mt-0.5">📞 {resumeData.phone}</p>}
          </div>

          {/* Readiness pill */}
          {!loading && (
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:200, delay:0.4 }}
              className="text-right flex-shrink-0">
              <p className={"text-xl font-black " + readyLabel.color}>{pct}%</p>
              <p className={"text-xs font-semibold " + readyLabel.color}>{readyLabel.text}</p>
              <p className="text-gray-600 text-xs">{matched.length}/{ALL_SKILLS.length} skills</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div className="flex gap-1 p-1 glass rounded-xl" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={"flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 " +
              (activeTab===tab ? "bg-gray-800 text-white shadow-lg" : "text-gray-500 hover:text-gray-300")}>
            {tab==="skills"?"⚡ Skills":tab==="resume"?"📋 Resume":"⚙️ Account"}
          </button>
        ))}
      </motion.div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">

        {/* SKILLS TAB */}
        {activeTab === "skills" && (
          <motion.div key="skills" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="space-y-4">

            {/* Readiness meter card */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-6">
                {/* Radial */}
                <div className="relative flex-shrink-0">
                  <RadialProgress pct={pct} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span className={"text-2xl font-black " + readyLabel.color}
                      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}>
                      {pct}%
                    </motion.span>
                    <span className="text-gray-600 text-xs">ready</span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-white font-bold text-base">{readyLabel.text}</p>
                    <p className="text-gray-500 text-xs mt-0.5">Based on {ALL_SKILLS.length} key internship skills</p>
                  </div>
                  {/* Mini stat pills */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-800/50 font-medium">
                      ✓ {matched.length} matched
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700 font-medium">
                      📚 {missing.length} to learn
                    </span>
                  </div>
                  {/* Category breakdown */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(CAT_COLOR).map(([cat, c]) => {
                      const total = ALL_SKILLS.filter(s=>s.cat===cat).length;
                      const have  = matched.filter(s=>s.cat===cat).length;
                      return (
                        <motion.div key={cat} whileHover={{ scale:1.06 }}
                          className={"text-xs px-2 py-0.5 rounded-lg border font-medium " + c.bg+" "+c.text+" "+c.border}>
                          {cat} {have}/{total}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Skill list */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-semibold text-sm">All Skills Breakdown</p>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>Have</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-700 inline-block"/>Missing</span>
                </div>
              </div>
              <div className="divide-y divide-gray-800/50">
                {ALL_SKILLS.map((s, i) => (
                  <SkillRow key={s.name} skill={s} have={userSet.has(s.name.toLowerCase())} idx={i} />
                ))}
              </div>
            </div>

            {/* Missing skills to learn */}
            {missing.length > 0 && (
              <div className="glass rounded-2xl p-5 border border-amber-900/30">
                <p className="text-amber-400 font-semibold text-sm mb-3">📚 Recommended to Learn</p>
                <div className="flex flex-wrap gap-2">
                  {missing.map((s, i) => (
                    <motion.span key={s.name}
                      initial={{ opacity:0, scale:0.7 }} animate={{ opacity:1, scale:1 }}
                      transition={{ delay: 0.05+i*0.04, type:"spring", stiffness:220 }}
                      whileHover={{ scale:1.1, y:-2 }}
                      className={"skill-badge border " + CAT_COLOR[s.cat].bg+" "+CAT_COLOR[s.cat].text+" "+CAT_COLOR[s.cat].border}>
                      {s.name}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Cover letter CTA */}
            <motion.div className="relative glass rounded-2xl p-5 overflow-hidden cursor-pointer group"
              onClick={() => navigate("/")}
              whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
              <div className="absolute inset-0 bg-gradient-to-r from-brand-900/40 to-purple-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <motion.div className="absolute -inset-1 bg-gradient-to-r from-brand-600/20 to-purple-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-4">
                <motion.div animate={{ rotate:[0,12,-12,0] }} transition={{ duration:3, repeat:Infinity, repeatDelay:2 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-xl shadow-lg">
                  🎯
                </motion.div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">Generate a Cover Letter</p>
                  <p className="text-gray-400 text-xs mt-0.5">Upload resume → click any internship match → generate instantly</p>
                </div>
                <motion.span className="text-brand-400 text-lg" animate={{ x:[0,4,0] }} transition={{ duration:1.5, repeat:Infinity }}>→</motion.span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* RESUME TAB */}
        {activeTab === "resume" && (
          <motion.div key="resume" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="space-y-3">
            {loading ? (
              <div className="glass rounded-2xl p-10 text-center">
                <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}
                  className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading resume data…</p>
              </div>
            ) : resumeData ? (
              <>
                {/* Your skills from resume */}
                {resumeData.skills?.length > 0 && (
                  <Section icon="⚡" title="Your Skills (from resume)" delay={0.05}>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.skills.map((s, i) => {
                        const cat  = ALL_SKILLS.find(a => a.name.toLowerCase()===s.toLowerCase())?.cat || "Other";
                        const c    = CAT_COLOR[cat];
                        return (
                          <motion.span key={s}
                            initial={{ opacity:0, scale:0.7 }} animate={{ opacity:1, scale:1 }}
                            transition={{ delay: i*0.03, type:"spring", stiffness:200 }}
                            whileHover={{ scale:1.1, y:-2 }}
                            className={"skill-badge border " + c.bg+" "+c.text+" "+c.border}>
                            {s}
                          </motion.span>
                        );
                      })}
                    </div>
                  </Section>
                )}
                <Section icon="📝" title="Summary"        delay={0.1}  ><p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{resumeData.summary || "Not found in resume."}</p></Section>
                <Section icon="🎓" title="Education"      delay={0.15} ><p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{resumeData.education || "Not found."}</p></Section>
                <Section icon="💼" title="Experience"     delay={0.2}  defaultOpen={false}><p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{resumeData.experience || "Not found."}</p></Section>
                <Section icon="🚀" title="Projects"       delay={0.25} defaultOpen={false}><p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{resumeData.projects || "Not found."}</p></Section>
                <Section icon="🏆" title="Certifications" delay={0.3}  defaultOpen={false}><p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{resumeData.certifications || "Not found."}</p></Section>
              </>
            ) : (
              <motion.div className="glass rounded-2xl p-12 text-center border border-dashed border-gray-800"
                initial={{ opacity:0 }} animate={{ opacity:1 }}>
                <motion.div className="text-5xl mb-4 opacity-20" animate={{ y:[0,-8,0] }} transition={{ duration:2, repeat:Infinity }}>📄</motion.div>
                <p className="text-gray-500 font-semibold">No resume data yet</p>
                <p className="text-gray-600 text-sm mt-1 mb-4">Upload a resume from the Dashboard to auto-fill this section.</p>
                <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                  onClick={() => navigate("/")}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition btn-glow">
                  Go to Dashboard →
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === "account" && (
          <motion.div key="account" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="space-y-4">
            {/* Account info */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Account Info</p>
              {[
                { label:"Full Name", value:user?.full_name },
                { label:"Email",     value:user?.email     },
                { label:"User ID",   value:"#" + user?.id  },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                  <span className="text-gray-500 text-sm">{label}</span>
                  <span className="text-white text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>

            {/* Change password */}
            <motion.div whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
              onClick={() => navigate("/change-password")}
              className="glass rounded-2xl p-5 flex items-center gap-4 cursor-pointer group hover:border-brand-700/50 transition border border-transparent">
              <div className="w-10 h-10 rounded-xl bg-brand-900/50 border border-brand-800/50 flex items-center justify-center text-xl">🔐</div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Change Password</p>
                <p className="text-gray-500 text-xs">Update your account security</p>
              </div>
              <motion.span className="text-gray-600 group-hover:text-brand-400 text-lg transition" animate={{ x:[0,3,0] }} transition={{ duration:1.5, repeat:Infinity }}>→</motion.span>
            </motion.div>

            {/* Danger zone */}
            <div className="glass rounded-2xl p-5 border border-red-900/40">
              <p className="text-red-400 font-semibold text-sm mb-1">⚠️ Danger Zone</p>
              <p className="text-gray-500 text-xs mb-4">Permanently deletes your account and all data. Cannot be undone.</p>
              <AnimatePresence>
                {confirmDel && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                    className="mb-3 p-3 bg-red-950/40 border border-red-800/50 rounded-lg">
                    <p className="text-red-300 text-xs">⚠️ Click the button again to permanently delete your account.</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.96 }}
                onClick={handleDelete} disabled={deleting}
                className="px-5 py-2.5 bg-red-800 hover:bg-red-700 disabled:bg-gray-700 text-white text-sm font-semibold rounded-xl transition">
                {deleting ? "Deleting…" : confirmDel ? "⚠️ Yes, Delete Everything" : "Delete Account"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}