import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const FEATURES = [
  { icon:"🤖", text:"AI-powered resume parsing" },
  { icon:"🎯", text:"RAG-based internship matching" },
  { icon:"✍️", text:"Instant cover letter generation" },
  { icon:"⬇️", text:"One-click PDF download" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const set = (e) => setForm(f => ({ ...f, [e.target.name]:e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Fill all fields.");
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back! 👋");
      navigate("/");
    } catch { toast.error("Invalid email or password."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-52px)] flex">

      {/* ── Left panel — branding ── */}
      <motion.div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-10 overflow-hidden"
        initial={{ x:-60, opacity:0 }} animate={{ x:0, opacity:1 }} transition={{ duration:0.6 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 via-purple-950/60 to-gray-950" />
        <div className="absolute inset-0"
          style={{ backgroundImage:"radial-gradient(circle at 30% 70%, rgba(14,165,233,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(124,58,237,0.12) 0%, transparent 50%)" }} />

        <div className="relative">
          <motion.div className="flex items-center gap-3 mb-16"
            initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.2 }}>
            <span className="text-4xl">🤖</span>
            <div>
              <p className="text-white font-black text-lg tracking-tight">AI Resume Agent</p>
              <p className="text-brand-400 text-xs">Powered by RAG</p>
            </div>
          </motion.div>

          <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.3 }}>
            <h2 className="text-3xl font-black text-white leading-tight mb-2">
              Land your dream<br/><span className="gradient-text">internship</span>
            </h2>
            <p className="text-gray-400 text-sm mb-8">AI parses your resume and matches you to opportunities in seconds.</p>
            <div className="space-y-3">
              {FEATURES.map(({ icon, text }, i) => (
                <motion.div key={text} className="flex items-center gap-3"
                  initial={{ x:-20, opacity:0 }} animate={{ x:0, opacity:1 }}
                  transition={{ delay: 0.4 + i*0.08 }}>
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-base">{icon}</div>
                  <span className="text-gray-300 text-sm">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Floating badge */}
        <motion.div className="relative flex items-center gap-3 glass rounded-xl p-3"
          initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.7 }}
          animate={{ y:[0,-6,0] }} transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">AI</div>
          <div>
            <p className="text-white text-xs font-semibold">Resume matched in &lt;3 seconds</p>
            <p className="text-gray-500 text-xs">15 live internship opportunities</p>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <motion.div className="w-full max-w-sm"
          initial={{ x:40, opacity:0 }} animate={{ x:0, opacity:1 }}
          transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-white">Sign in</h1>
            <p className="text-gray-500 text-sm mt-1">
              No account?{" "}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition">Create one free →</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Email</label>
              <input type="email" name="email" value={form.email} onChange={set}
                placeholder="you@example.com" autoComplete="email" disabled={loading}
                className="w-full bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                  text-white rounded-xl px-4 py-3 text-sm placeholder-gray-600 outline-none transition-all duration-200 disabled:opacity-50" />
            </motion.div>

            {/* Password */}
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }}>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input type={showPass?"text":"password"} name="password" value={form.password} onChange={set}
                  placeholder="Your password" autoComplete="current-password" disabled={loading}
                  className="w-full bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                    text-white rounded-xl px-4 py-3 pr-16 text-sm placeholder-gray-600 outline-none transition-all duration-200 disabled:opacity-50" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-400 text-xs transition font-medium">
                  {showPass?"Hide":"Show"}
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.button type="submit" disabled={loading}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
              whileHover={!loading ? { scale:1.02, y:-1 } : {}} whileTap={!loading ? { scale:0.97 } : {}}
              className="relative w-full py-3 rounded-xl font-bold text-white text-sm overflow-hidden
                disabled:opacity-60 disabled:cursor-not-allowed">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-blue-600 to-purple-600
                hover:from-brand-500 hover:via-blue-500 hover:to-purple-500 transition-all duration-300" />
              {!loading && (
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                  animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:1 }} />
              )}
              <span className="relative flex items-center justify-center gap-2">
                {loading
                  ? <><motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/>Signing in...</>
                  : "Sign In →"}
              </span>
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}