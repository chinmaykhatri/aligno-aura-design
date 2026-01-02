import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Activity from "./pages/Activity";
import Calendar from "./pages/Calendar";
import Gantt from "./pages/Gantt";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import Reports from "./pages/Reports";
import ClientPortal from "./pages/ClientPortal";
import TeamPerformance from "./pages/TeamPerformance";
import MyMetrics from "./pages/MyMetrics";
import Portfolio from "./pages/Portfolio";
import JoinProject from "./pages/JoinProject";
import NotFound from "./pages/NotFound";

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/gantt" element={<Gantt />} />
        <Route path="/executive" element={<ExecutiveDashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/portal/:token" element={<ClientPortal />} />
        <Route path="/team-performance" element={<TeamPerformance />} />
        <Route path="/my-metrics" element={<MyMetrics />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/join" element={<JoinProject />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineIndicator />
        <BrowserRouter>
          <AnalyticsProvider>
            <AnimatedRoutes />
          </AnalyticsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
