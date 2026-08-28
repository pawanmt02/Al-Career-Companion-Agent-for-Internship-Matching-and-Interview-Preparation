import { motion } from "framer-motion";

export const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22,1,0.36,1] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.25 } }
};

export const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.22,1,0.36,1] }
  })
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } }
};

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}