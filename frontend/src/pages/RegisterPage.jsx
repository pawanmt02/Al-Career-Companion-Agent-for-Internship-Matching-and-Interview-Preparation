import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const strength = (p) => {
  if (!p) return null;
  if (p.length < 6)  return { pct:20, label:"Weak",   color:"bg-red-500",    text:"text-red-400"    };
  if (p.length < 10) return { pct:55, label:"Medium",  color:"bg-amber-500",  text:"text-amber-400"  };
                     return { pct:100,label:"Strong",  color:"bg-emerald-500",text:"text-emerald-400" };
};

const inputBase = "w-full bg-gray-900 border text-white rounded-xl px-4 py-3 text-sm placeholder-gray-600 outline-none transition-all duration-200";
const inputNormal = "border-gray-800 hover:border-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";
const inputError  = "border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name:"", email:"", password:"", confirm:"" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const set = (e) => setForm(f => ({ ...f, [e.target.name]:e.target.value }));
  const s = strength(form.password);
  const mismatch = form.confirm && form.password !== form.confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) return toast.error("Fill all fields.");
    if (mismatch) return toast.error("Passwords do not match.");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await api.post("/auth/register", { full_name:form.full_name, email:form.email, password:form.password });
      await login(form.email, form.password);
      toast.success("Welcome! Account created 🎉");
      navigate("/");
    } catch (err) { toast.error(err.response?.data?.detail || "Registration failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-6 py-10">
      <motion.div className="w-full max-w-md"
        initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}>

        {/* Logo */}
        <motion.div className="text-center mb-8"
          initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.05, type:"spring", stiffness:200 }}>
          <motion.div className="text-5xl mb-3 inline-block"
            animate={{ y:[0,-8,0] }} transition={{ duration:2.5, repeat:Infinity, ease:"easeInOut" }}>✨</motion.div>
          <h1 className="text-2xl font-black text-white">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">
            Already have one?{" "}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition">Sign in</Link>
          </p>
        </motion.div>

        {/* Card */}
        <motion.div className="glass rounded-2xl p-7 shadow-2xl"
          initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.1 }}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
              <input type="text" name="full_name" value={form.full_name} onChange={set}
                placeholder="Pawan Kumar" autoComplete="name"
                className={`${inputBase} ${inputNormal}`} />
            </motion.div>

            {/* Email */}
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.17 }}>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Email</label>
              <input type="email" name="email" value={form.email} onChange={set}
                placeholder="you@example.com" autoComplete="email"
                className={`${inputBase} ${inputNormal}`} />
            </motion.div>

            {/* Password with strength bar */}
            <div className="space-y-1.5">
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.24 }}>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Password{s && <span className={"ml-2 font-normal normal-case " + s.text}>{s.label}</span>}
                </label>
                <div className="relative">
                  <input type={showPass?"text":"password"} name="password" value={form.password} onChange={set}
                    placeholder="Min 8 characters" autoComplete="new-password"
                    className={`${inputBase} ${inputNormal} pr-16`} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-400 text-xs transition font-medium">
                    {showPass?"Hide":"Show"}
                  </button>
                </div>
              </motion.div>
              {s && (
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div className={"h-full rounded-full " + s.color}
                    initial={{ width:0 }} animate={{ width: s.pct+"%" }} transition={{ duration:0.4 }} />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.31 }}>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Confirm Password</label>
                <input type="password" name="confirm" value={form.confirm} onChange={set}
                  placeholder="Repeat password" autoComplete="new-password"
                  className={`${inputBase} ${mismatch ? inputError : inputNormal}`} />
              </motion.div>
              <AnimatePresence>
                {mismatch && (
                  <motion.p initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                    className="text-red-400 text-xs">⚠ Passwords do not match</motion.p>
                )}
              </AnimatePresence>
            </div>

            <motion.button type="submit" disabled={loading || mismatch}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
              whileHover={!loading ? { scale:1.02, y:-1 } : {}} whileTap={!loading ? { scale:0.97 } : {}}
              className="relative w-full py-3 rounded-xl font-bold text-white text-sm overflow-hidden
                disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-brand-600 to-blue-600
                hover:from-purple-500 hover:via-brand-500 hover:to-blue-500 transition-all duration-300" />
              {!loading && (
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                  animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:1 }} />
              )}
              <span className="relative flex items-center justify-center gap-2">
                {loading
                  ? <><motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/>Creating account...</>
                  : "Create Account →"}
              </span>
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}