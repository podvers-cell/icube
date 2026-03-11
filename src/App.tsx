import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { SiteDataProvider } from "./SiteDataContext";
import { ContactModalProvider } from "./ContactModalContext";
import { AppNavigateProvider } from "./AppNavigateContext";
import ProtectedRoute from "./views/ProtectedRoute";
import Login from "./views/Login";
import Signup from "./views/Signup";
import PublicSite from "./PublicSite";

function ViteRouterWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <AppNavigateProvider
      navigate={(path, opts) => navigate(path, { replace: opts?.replace })}
    >
      {children}
    </AppNavigateProvider>
  );
}

// Dashboard layout (eager: small, needed for shell)
const DashboardLayout = lazy(() => import("./views/DashboardLayout"));

// Dashboard pages (lazy: split by route)
const DashboardOverview = lazy(() => import("./views/DashboardOverview"));
const DashboardSettings = lazy(() => import("./views/DashboardSettings"));
const DashboardHero = lazy(() => import("./views/DashboardHero"));
const DashboardServices = lazy(() => import("./views/DashboardServices"));
const DashboardPortfolio = lazy(() => import("./views/DashboardPortfolio"));
const DashboardTestimonials = lazy(() => import("./views/DashboardTestimonials"));
const DashboardPackages = lazy(() => import("./views/DashboardPackages"));
const DashboardBookings = lazy(() => import("./views/DashboardBookings"));
const DashboardMessages = lazy(() => import("./views/DashboardMessages"));
const DashboardWhyUs = lazy(() => import("./views/DashboardWhyUs"));
const DashboardStudio = lazy(() => import("./views/DashboardStudio"));
const DashboardStudios = lazy(() => import("./views/DashboardStudios"));

const PackagesPage = lazy(() => import("./views/PackagesPage"));
const PortfolioPage = lazy(() => import("./views/PortfolioPage"));

function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-icube-dark">
      <div className="w-8 h-8 border-2 border-icube-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ViteRouterWrapper>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/packages"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SiteDataProvider>
                    <ContactModalProvider>
                      <PackagesPage />
                    </ContactModalProvider>
                  </SiteDataProvider>
                </Suspense>
              }
            />
            <Route
              path="/portfolio"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SiteDataProvider>
                    <ContactModalProvider>
                      <PortfolioPage />
                    </ContactModalProvider>
                  </SiteDataProvider>
                </Suspense>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <DashboardLayout />
                  </Suspense>
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
              <Route path="studios" element={<DashboardStudios />} />
            </Route>
            <Route
              path="*"
              element={
                <SiteDataProvider>
                  <ContactModalProvider>
                    <PublicSite />
                  </ContactModalProvider>
                </SiteDataProvider>
              }
            />
          </Routes>
        </ViteRouterWrapper>
      </AuthProvider>
    </BrowserRouter>
  );
}
