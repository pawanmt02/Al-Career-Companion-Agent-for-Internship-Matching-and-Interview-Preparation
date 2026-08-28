import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SKILL_COLORS = [
  "bg-blue-900/60 text-blue-300 border-blue-700/50",
  "bg-purple-900/60 text-purple-300 border-purple-700/50",
  "bg-emerald-900/60 text-emerald-300 border-emerald-700/50",
  "bg-amber-900/60 text-amber-300 border-amber-700/50",
  "bg-pink-900/60 text-pink-300 border-pink-700/50",
  "bg-cyan-900/60 text-cyan-300 border-cyan-700/50",
  "bg-rose-900/60 text-rose-300 border-rose-700/50",
  "bg-indigo-900/60 text-indigo-300 border-indigo-700/50",
];

function Section({ icon, title, content, delay }) {
  const [open, setOpen] = useState(true);
  if (!content) return null;
  return (
    <motion.div
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      transition={{ delay, duration:0.4 }}
      className="border border-gray-800 rounded-xl overflow-hidden"
    >
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-3 bg-gray-900/60 hover:bg-gray-800/60 transition text-left"
        whileHover={{ backgroundColor:"rgba(255,255,255,0.03)" }}>
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-300">
          <span>{icon}</span>{title}
        </span>
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration:0.2 }}
          className="text-gray-600 text-sm">›</motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{    height:0, opacity:0 }}
            transition={{ duration:0.3, ease:[0.22,1,0.36,1] }}
            className="overflow-hidden">
            <p className="px-4 py-3 text-gray-400 text-xs leading-relaxed whitespace-pre-wrap border-t border-gray-800">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ParsedResumeCard({ data }) {
  const r = data?.parsed_resume;
  if (!r) return null;
  const skills = r.extracted_skills || [];
  const contact = r.contact_info || {};

  return (
    <motion.div className="space-y-4"
      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span>📋</span> Parsed Resume
        </h3>
        <span className="text-xs text-gray-600 bg-gray-900 border border-gray-800 px-2 py-1 rounded-full">
          {skills.length} skills detected
        </span>
      </div>

      {/* Contact info */}
      {(contact.email || contact.phone_number) && (
        <motion.div className="glass rounded-xl p-4 flex flex-wrap gap-3"
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
          {contact.email && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-7 h-7 rounded-lg bg-brand-900/50 flex items-center justify-center text-brand-400 text-base border border-brand-800/50">✉️</span>
              <span className="text-gray-300">{contact.email}</span>
            </div>
          )}
          {contact.phone_number && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-7 h-7 rounded-lg bg-purple-900/50 flex items-center justify-center text-purple-400 text-base border border-purple-800/50">📞</span>
              <span className="text-gray-300">{contact.phone_number}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Skills cloud */}
      {skills.length > 0 && (
        <motion.div className="glass rounded-xl p-4"
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">Skills Detected</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <motion.span key={s}
                initial={{ opacity:0, scale:0.6 }} animate={{ opacity:1, scale:1 }}
                transition={{ delay: 0.25 + i*0.03, type:"spring", stiffness:220 }}
                whileHover={{ scale:1.12, y:-2 }}
                className={"skill-badge border " + SKILL_COLORS[i % SKILL_COLORS.length]}>
                {s}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Collapsible sections */}
      <div className="space-y-2">
        <Section icon="📝" title="Summary"     content={r.summary}         delay={0.3} />
        <Section icon="🎓" title="Education"   content={r.education}       delay={0.35} />
        <Section icon="💼" title="Experience"  content={r.internships}     delay={0.4} />
        <Section icon="🚀" title="Projects"    content={r.projects}        delay={0.45} />
        <Section icon="🏆" title="Certifications" content={r.certifications} delay={0.5} />
      </div>
    </motion.div>
  );
}