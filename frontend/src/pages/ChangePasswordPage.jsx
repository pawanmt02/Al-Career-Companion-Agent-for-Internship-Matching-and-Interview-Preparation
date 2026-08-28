import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axiosClient";
import toast from "react-hot-toast";

const getStr = (p) => {
  if (!p) return null;
  const checks = { len: p.length>=8, upper: /[A-Z]/.test(p), num: /[0-9]/.test(p), special: /[^A-Za-z0-9]/.test(p) };
  const score  = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    score,
    pct:   [0,25,50,80,100][score],
    label: ["","Weak","Fair","Good","Strong"][score],
    color: ["","bg-red-500","bg-orange-500","bg-yellow-500","bg-emerald-500"][score],
    text:  ["","text-red-400","text-orange-400","text-yellow-400","text-emerald-400"][score],
  };
};

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ old_password:"", new_password:"", confirm:"" });
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [show, setShow]       = useState({});
  const set = (e) => setForm(f => ({ ...f, [e.target.name]:e.target.value }));
  const toggleShow = (field) => setShow(s => ({ ...s, [field]:!s[field] }));

  const s = getStr(form.new_password);
  const mismatch = form.confirm && form.new_password !== form.confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.old_password || !form.new_password) return toast.error("Fill all fields.");
    if (mismatch) return toast.error("Passwords do not match.");
    if (form.new_password.length < 8) return toast.error("Minimum 8 characters.");
    setLoading(true);
    try {
      await api.put("/auth/change-password", { old_password:form.old_password, new_password:form.new_password });
      setDone(true);
      toast.success("Password updated! 🔐");
      setTimeout(() => navigate("/profile"), 2200);
    } catch (err) { toast.error(err.response?.data?.detail || "Failed. Check your current password."); }
    finally { setLoading(false); }
  };

  const CHECKS = [
    { key:"len",     label:"At least 8 characters" },
    { key:"upper",   label:"One uppercase letter"  },
    { key:"num",     label:"One number"             },
    { key:"special", label:"One special character"  },
  ];

  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-4">
      <motion.div className="w-full max-w-md"
        initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}>

        <AnimatePresence mode="wait">

          {/* ── Success state ── */}
          {done ? (
            <motion.div key="done" className="glass rounded-2xl p-10 text-center"
              initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}
              transition={{ type:"spring", stiffness:200, damping:18 }}>
              <motion.div className="text-6xl mb-4"
                animate={{ rotate:[0,15,-15,8,-8,0], scale:[1,1.3,1] }}
                transition={{ duration:0.7 }}>✅</motion.div>
              <h2 className="text-white font-black text-xl mb-1">Password Updated!</h2>
              <p className="text-gray-400 text-sm">Redirecting to profile…</p>
              <motion.div className="mt-5 h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-emerald-500 rounded-full"
                  initial={{ width:0 }} animate={{ width:"100%" }} transition={{ duration:2 }} />
              </motion.div>
            </motion.div>
          ) : (

            /* ── Form state ── */
            <motion.div key="form" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              {/* Header */}
              <motion.div className="text-center mb-8"
                initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
                <motion.div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-brand-500/30"
                  animate={{ rotate:[0,-8,8,-4,4,0] }} transition={{ duration:0.8, delay:0.5 }}>
                  🔐
                </motion.div>
                <h1 className="text-2xl font-black text-white">Change Password</h1>
                <p className="text-gray-500 text-sm mt-1">Keep your account secure</p>
              </motion.div>

              <form onSubmit={handleSubmit} className="glass rounded-2xl p-7 space-y-5">

                {/* Current password */}
                {[{ name:"old_password", label:"Current Password", placeholder:"Your current password" }].map(({ name, label, placeholder }) => (
                  <motion.div key={name} initial={{ opacity:0, x:-14 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15 }}>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</label>
                    <div className="relative">
                      <input type={show[name]?"text":"password"} name={name} value={form[name]} onChange={set}
                        placeholder={placeholder}
                        className="w-full bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-white rounded-xl px-4 py-3 pr-16 text-sm placeholder-gray-600 outline-none transition-all" />
                      <button type="button" onClick={() => toggleShow(name)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-400 text-xs font-medium transition">
                        {show[name]?"Hide":"Show"}
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* New password */}
                <motion.div initial={{ opacity:0, x:-14 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.22 }}>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">New Password</label>
                    {s && <span className={"text-xs font-semibold " + s.text}>{s.label}</span>}
                  </div>
                  <div className="relative">
                    <input type={show.new_password?"text":"password"} name="new_password" value={form.new_password} onChange={set}
                      placeholder="Min 8 characters"
                      className="w-full bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-white rounded-xl px-4 py-3 pr-16 text-sm placeholder-gray-600 outline-none transition-all" />
                    <button type="button" onClick={() => toggleShow("new_password")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-400 text-xs font-medium transition">
                      {show.new_password?"Hide":"Show"}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {s && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <motion.div key={i}
                            className={"flex-1 h-1 rounded-full " + (s.score >= i ? s.color : "bg-gray-800")}
                            initial={{ scaleX:0 }} animate={{ scaleX:1 }}
                            transition={{ duration:0.3, delay:i*0.06 }} style={{ transformOrigin:"left" }} />
                        ))}
                      </div>
                      {/* Check list */}
                      <div className="grid grid-cols-2 gap-1">
                        {CHECKS.map(({ key, label }) => (
                          <motion.div key={key} className="flex items-center gap-1.5"
                            animate={{ opacity: s.checks[key] ? 1 : 0.4 }}>
                            <motion.span animate={{ scale: s.checks[key] ? [1,1.4,1] : 1 }}
                              transition={{ duration:0.3 }}
                              className={"text-xs " + (s.checks[key] ? "text-emerald-400" : "text-gray-600")}>
                              {s.checks[key] ? "✓" : "○"}
                            </motion.span>
                            <span className={"text-xs " + (s.checks[key] ? "text-gray-300" : "text-gray-600")}>{label}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Confirm */}
                <motion.div initial={{ opacity:0, x:-14 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.29 }}>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Confirm Password</label>
                  <input type="password" name="confirm" value={form.confirm} onChange={set}
                    placeholder="Repeat new password"
                    className={"w-full bg-gray-900 border text-white rounded-xl px-4 py-3 text-sm placeholder-gray-600 outline-none transition-all " +
                      (mismatch ? "border-red-700 focus:ring-2 focus:ring-red-500/20" : "border-gray-800 hover:border-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20")} />
                  <AnimatePresence>
                    {mismatch && (
                      <motion.p initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                        className="text-red-400 text-xs mt-1">⚠ Passwords do not match</motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Buttons */}
                <motion.div className="flex gap-3 pt-1" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.36 }}>
                  <motion.button type="button" onClick={() => navigate("/profile")}
                    whileHover={{ x:-3 }}
                    className="px-4 py-2.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition font-medium">
                    ← Back
                  </motion.button>
                  <motion.button type="submit" disabled={loading || !!mismatch}
                    whileHover={!loading ? { scale:1.02, y:-1 } : {}} whileTap={!loading ? { scale:0.97 } : {}}
                    className="relative flex-1 py-2.5 rounded-xl font-bold text-white text-sm overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 transition-all" />
                    {!loading && (
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                        animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:1 }} />
                    )}
                    <span className="relative flex items-center justify-center gap-2">
                      {loading
                        ? <><motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/>Updating…</>
                        : "Update Password 🔐"}
                    </span>
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}