import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { SiteDataProvider } from "./SiteDataContext";
import ProtectedRoute from "./pages/ProtectedRoute";
import DashboardLayout from "./pages/DashboardLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PublicSite from "./PublicSite";
import DashboardOverview from "./pages/DashboardOverview";
import DashboardSettings from "./pages/DashboardSettings";
import DashboardServices from "./pages/DashboardServices";
import DashboardPortfolio from "./pages/DashboardPortfolio";
import DashboardTestimonials from "./pages/DashboardTestimonials";
import DashboardPackages from "./pages/DashboardPackages";
import DashboardBookings from "./pages/DashboardBookings";
import DashboardMessages from "./pages/DashboardMessages";
import DashboardWhyUs from "./pages/DashboardWhyUs";
import DashboardStudio from "./pages/DashboardStudio";
import DashboardHero from "./pages/DashboardHero";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="settings" element={<DashboardSettings />} />
            <Route path="hero" element={<DashboardHero />} />
            <Route path="services" element={<DashboardServices />} />
            <Route path="portfolio" element={<DashboardPortfolio />} />
            <Route path="testimonials" element={<DashboardTestimonials />} />
            <Route path="packages" element={<DashboardPackages />} />
            <Route path="bookings" element={<DashboardBookings />} />
            <Route path="messages" element={<DashboardMessages />} />
            <Route path="why-us" element={<DashboardWhyUs />} />
            <Route path="studio" element={<DashboardStudio />} />
          </Route>
          <Route
            path="*"
            element={
              <SiteDataProvider>
                <PublicSite />
              </SiteDataProvider>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
