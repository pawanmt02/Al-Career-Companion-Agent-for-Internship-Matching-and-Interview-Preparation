import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

const LoginPage          = lazy(() => import("./pages/LoginPage"));
const RegisterPage       = lazy(() => import("./pages/RegisterPage"));
const DashboardPage      = lazy(() => import("./pages/DashboardPage"));
const ProfilePage        = lazy(() => import("./pages/ProfilePage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const CoverLetterPage    = lazy(() => import("./pages/CoverLetterPage"));

/* ── Page skeleton loader ── */
function PageLoader() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-5">
      {[220, 80, 160].map((h, i) => (
        <motion.div key={i} className="shimmer rounded-2xl" style={{ height: h }}
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.08 }} />
      ))}
    </div>
  );
}

/* ── Page transition variants ── */
const pageVariants = {
  initial: { opacity:0, y:18, filter:"blur(6px)" },
  enter:   { opacity:1, y:0,  filter:"blur(0px)", transition:{ duration:0.4, ease:[0.22,1,0.36,1] } },
  exit:    { opacity:0, y:-10, filter:"blur(4px)", transition:{ duration:0.22, ease:"easeIn" } },
};

function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit">
      {children}
    </motion.div>
  );
}

/* ── Animated routes ── */
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login"    element={<PageWrapper><Suspense fallback={<PageLoader/>}><LoginPage/></Suspense></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Suspense fallback={<PageLoader/>}><RegisterPage/></Suspense></PageWrapper>} />
        <Route path="/" element={
          <ProtectedRoute>
            <PageWrapper><Suspense fallback={<PageLoader/>}><DashboardPage/></Suspense></PageWrapper>
          </ProtectedRoute>
        }/>
        <Route path="/profile" element={
          <ProtectedRoute>
            <PageWrapper><Suspense fallback={<PageLoader/>}><ProfilePage/></Suspense></PageWrapper>
          </ProtectedRoute>
        }/>
        <Route path="/change-password" element={
          <ProtectedRoute>
            <PageWrapper><Suspense fallback={<PageLoader/>}><ChangePasswordPage/></Suspense></PageWrapper>
          </ProtectedRoute>
        }/>
        <Route path="/cover-letter" element={
          <ProtectedRoute>
            <PageWrapper><Suspense fallback={<PageLoader/>}><CoverLetterPage/></Suspense></PageWrapper>
          </ProtectedRoute>
        }/>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen">
          <Navbar />
          <AnimatedRoutes />
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background:"#111827",
              color:"#f9fafb",
              border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:"12px",
              fontSize:"13px",
              fontWeight:500,
              backdropFilter:"blur(12px)",
              boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
            },
            success: { iconTheme:{ primary:"#10b981", secondary:"#111827" } },
            error:   { iconTheme:{ primary:"#ef4444", secondary:"#111827" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}