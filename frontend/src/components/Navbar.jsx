import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const NAV_LINKS = [
  { to:"/",                label:"Dashboard",       icon:"🏠" },
  { to:"/applications",    label:"Applications",    icon:"📋" },
  { to:"/interview-prep",  label:"Interview Prep",  icon:"🎓" },
  { to:"/mock-interview",  label:"Mock Interview",  icon:"⏱️" },
  { to:"/document-qa",     label:"Document Q&A",    icon:"📄" },
  { to:"/resume-analyzer", label:"Resume Score",    icon:"📊" },
  { to:"/profile",         label:"Profile",         icon:"👤" },
  { to:"/change-password", label:"Security",        icon:"🔐" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <motion.nav
      initial={{ y:-60, opacity:0 }} animate={{ y:0, opacity:1 }}
      transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
      className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/80 sticky top-0 z-50"
    >
      {/* Top gradient line */}
      <div className="h-0.5 bg-gradient-to-r from-brand-600 via-purple-500 to-pink-500" />

      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ rotate:[0,10,-10,0], scale:1.1 }}
            transition={{ duration:0.4 }}
            className="text-2xl"
          >🤖</motion.div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-sm tracking-tight gradient-text">AI Resume Agent</span>
            <span className="text-gray-600 text-xs">Powered by RAG</span>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-1">
            {/* Nav links */}
            {NAV_LINKS.map(({ to, label, icon }) => {
              const active = pathname === to;
              return (
                <Link key={to} to={to}>
                  <motion.div
                    whileHover={{ y:-1 }} whileTap={{ scale:0.95 }}
                    className={"relative px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 " +
                      (active ? "text-white bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800/60")}
                  >
                    <span className="text-base">{icon}</span>
                    <span className="hidden sm:inline">{label}</span>
                    {active && (
                      <motion.div layoutId="activeNav"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-500 to-purple-500 rounded-full"
                        transition={{ type:"spring", stiffness:400, damping:30 }} />
                    )}
                  </motion.div>
                </Link>
              );
            })}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-700 mx-2" />

            {/* User chip */}
            <motion.div whileHover={{ scale:1.02 }}
              className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-1.5 border border-gray-700">
              <motion.div
                animate={{ boxShadow:["0 0 0 0 rgba(14,165,233,0.4)", "0 0 0 6px rgba(14,165,233,0)", "0 0 0 0 rgba(14,165,233,0)"] }}
                transition={{ duration:2, repeat:Infinity, repeatDelay:3 }}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {user.full_name?.[0]?.toUpperCase() || "U"}
              </motion.div>
              <span className="text-white text-xs font-medium hidden md:inline max-w-24 truncate">{user.full_name}</span>
            </motion.div>

            {/* Logout */}
            <motion.button onClick={handleLogout}
              whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              className="ml-1 px-3 py-1.5 text-xs bg-red-900/60 hover:bg-red-700 text-red-300 hover:text-white border border-red-800 hover:border-red-600 rounded-lg transition-all duration-200 font-medium">
              Logout
            </motion.button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition rounded-lg hover:bg-gray-800">
                Login
              </motion.div>
            </Link>
            <Link to="/register">
              <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                className="px-4 py-1.5 text-sm bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white rounded-lg font-semibold shadow-lg shadow-brand-500/20 btn-glow transition-all">
                Get Started →
              </motion.div>
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
}