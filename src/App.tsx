/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext.tsx";
import { motion, useScroll, useSpring } from "motion/react";

import Navbar from "./components/Navbar.tsx";
import Hero from "./components/Hero.tsx";
import Portfolio from "./components/Portfolio.tsx";
import Services from "./components/Services.tsx";
import Testimonials from "./components/Testimonials.tsx";
import Pricing from "./components/Pricing.tsx";
import Footer from "./components/Footer.tsx";

import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import ClientDashboard from "./pages/ClientDashboard.tsx";
import Book from "./pages/Book.tsx";
import Gallery from "./pages/Gallery.tsx";
import ServicesPage from "./pages/Services.tsx";
import TestimonialsPage from "./pages/Testimonials.tsx";
import PricingPage from "./pages/Pricing.tsx";
import PaymentCallback from "./pages/PaymentCallback.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

function AppContent() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="relative antialiased selection:bg-luxury-gold/30 selection:text-white">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-luxury-gold origin-left z-[60]"
        style={{ scaleX }}
      />
      <Navbar />
      <Routes>
        <Route path="/" element={
          <main>
            <Hero />
            <Portfolio />
            <Services />
            <Testimonials />
            <Pricing />
            <Footer />
          </main>
        } />
        
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/book" element={<Book />} />
        <Route path="/payment-callback" element={<PaymentCallback />} />

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["client", "admin"]} />}>
          <Route path="/dashboard" element={<ClientDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-luxury-gold/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

