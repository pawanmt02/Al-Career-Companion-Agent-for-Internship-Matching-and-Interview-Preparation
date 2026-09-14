import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-6">
      <motion.div className="text-center"
        initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}>
        <motion.div className="text-7xl mb-4 inline-block"
          animate={{ y:[0,-10,0] }} transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}>
          🔍
        </motion.div>
        <h1 className="text-5xl font-black text-white mb-2">404</h1>
        <p className="text-gray-400 text-lg mb-6">Page not found</p>
        <Link to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
            bg-gradient-to-r from-brand-600 to-blue-600 text-white font-bold text-sm
            hover:from-brand-500 hover:to-blue-500 transition-all">
          ← Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
