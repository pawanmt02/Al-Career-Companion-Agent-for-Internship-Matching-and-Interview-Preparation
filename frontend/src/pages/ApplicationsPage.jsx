import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axiosClient";
import toast from "react-hot-toast";

const WORK_ICON = { Remote:"🌐", Hybrid:"🏢", "On-site":"📍" };

const STATUS_CFG = {
  Applied:   { dot:"bg-green-400",  badge:"bg-green-900/60 text-green-300 border-green-700",  label:"Applied" },
  Withdrawn: { dot:"bg-gray-500",   badge:"bg-gray-800 text-gray-400 border-gray-600",        label:"Withdrawn" },
};

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [withdrawing, setWithdrawing]   = useState(null);

  const fetchApplications = async () => {
    try {
      const res = await api.get("/applications");
      setApplications(res.data.applications || []);
    } catch {
      toast.error("Failed to load applications.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleWithdraw = async (appId, title) => {
    setWithdrawing(appId);
    try {
      await api.delete(`/applications/${appId}`);
      setApplications(prev => prev.filter(a => a.id !== appId));
      toast.success(`Withdrew application for ${title}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to withdraw.");
    } finally { setWithdrawing(null); }
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
    } catch { return iso; }
  };

  const activeCount = applications.filter(a => a.status === "Applied").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
        <div className="flex items-center gap-3 mb-1">
          <motion.button whileHover={{ x:-4 }} onClick={() => navigate("/")}
            className="text-gray-500 hover:text-white transition text-sm">← Back</motion.button>
          <span className="text-gray-700">·</span>
          <span className="text-gray-500 text-sm">My Applications</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">
              📋 <span className="gradient-text">My Applications</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Track all the internships you've applied to.
            </p>
          </div>
          {applications.length > 0 && (
            <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
              className="flex items-center gap-2 bg-brand-950/50 border border-brand-800/50 rounded-xl px-4 py-2">
              <motion.div className="w-2 h-2 rounded-full bg-brand-400"
                animate={{ scale:[1,1.5,1], opacity:[1,0.4,1] }}
                transition={{ duration:1.5, repeat:Infinity }} />
              <span className="text-brand-400 text-xs font-semibold">{activeCount} Active</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="grid grid-cols-3 gap-4">
        {[
          { icon:"📋", label:"Total Applied",  value: applications.length,  gradient:"bg-blue-500" },
          { icon:"✅", label:"Active",          value: activeCount,          gradient:"bg-green-500" },
          { icon:"📅", label:"Latest",          value: applications.length > 0 ? formatDate(applications[0].applied_at) : "—", gradient:"bg-purple-500" },
        ].map(({ icon, label, value, gradient }, i) => (
          <motion.div key={label}
            initial={{ opacity:0, y:20, scale:0.9 }}
            animate={{ opacity:1, y:0, scale:1 }}
            transition={{ delay: 0.1 + i*0.08, duration:0.5, ease:[0.22,1,0.36,1] }}
            className="relative glass rounded-2xl p-5 overflow-hidden card-shine grad-border group cursor-default">
            <div className={"absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 " + gradient}
              style={{ filter:"blur(40px)", transform:"scale(0.6)", borderRadius:"50%" }} />
            <div className="relative">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mb-1">{label}</p>
              <p className="text-xl font-black text-white">{value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Applications list */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" className="space-y-3"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            {[...Array(3)].map((_, i) => (
              <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.08 }}
                className="h-24 rounded-2xl shimmer" />
            ))}
          </motion.div>
        ) : applications.length === 0 ? (
          <motion.div key="empty"
            className="glass rounded-2xl flex flex-col items-center justify-center text-center p-16 min-h-72 border border-dashed border-gray-800"
            initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}>
            <motion.div className="text-7xl mb-5 opacity-10 select-none"
              animate={{ y:[0,-12,0], rotate:[0,6,-6,0] }}
              transition={{ duration:5, repeat:Infinity, ease:"easeInOut" }}>
              📋
            </motion.div>
            <p className="text-gray-600 font-semibold text-lg">No applications yet</p>
            <p className="text-gray-700 text-sm mt-1 max-w-xs">
              Upload your resume on the <span className="text-brand-600 font-medium">Dashboard</span> and apply to internships to see them here.
            </p>
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
              onClick={() => navigate("/")}
              className="mt-5 px-5 py-2 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-500/20 btn-glow">
              Go to Dashboard →
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="list" className="space-y-3"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            {applications.map((app, idx) => {
              const cfg = STATUS_CFG[app.status] || STATUS_CFG.Applied;
              return (
                <motion.div key={app.id}
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: idx * 0.06, duration:0.4, ease:[0.22,1,0.36,1] }}
                  className="border border-gray-700/60 bg-gray-900/60 hover:border-gray-600 hover:bg-gray-900/80 rounded-2xl overflow-hidden transition-colors duration-300"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <motion.div
                        whileHover={{ rotate:[0,8,-8,0], scale:1.1 }}
                        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white bg-gradient-to-br from-brand-600 to-purple-600 shadow-lg text-sm">
                        🏢
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-white text-sm leading-snug truncate">{app.internship_title}</h4>
                            <p className="text-gray-400 text-xs mt-0.5">
                              {app.company}
                              {app.work_mode && <span className="ml-2 text-gray-600">· {WORK_ICON[app.work_mode]} {app.work_mode}</span>}
                              {app.duration && <span className="ml-2 text-gray-600">· ⏱ {app.duration}</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <motion.div className={"w-2 h-2 rounded-full flex-shrink-0 " + cfg.dot}
                              animate={{ scale:[1,1.4,1], opacity:[1,0.5,1] }}
                              transition={{ duration:1.8, repeat:Infinity, delay:idx*0.2 }} />
                            <span className={"text-xs px-2 py-0.5 rounded-full border font-medium " + cfg.badge}>{cfg.label}</span>
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>📅 Applied: {formatDate(app.applied_at)}</span>
                            {app.location && <span>📍 {app.location}</span>}
                          </div>

                          {/* Withdraw button */}
                          {app.status === "Applied" && (
                            <motion.button
                              onClick={() => handleWithdraw(app.id, app.internship_title)}
                              disabled={withdrawing === app.id}
                              whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                              className="px-3 py-1.5 text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 border border-red-800/50 hover:border-red-700 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {withdrawing === app.id ? (
                                <span className="flex items-center gap-1">
                                  <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                                    className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full"/>
                                  Withdrawing…
                                </span>
                              ) : "Withdraw"}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
