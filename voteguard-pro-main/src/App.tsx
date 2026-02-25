import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import CreateElection from "./pages/CreateElection";
import CompanyDashboard from "./pages/CompanyDashboard";
import VoterElections from "./pages/VoterElections";
import VotingPage from "./pages/VotingPage";
import VoteSuccess from "./pages/VoteSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/:role" element={<AuthPage />} />
            <Route path="/company/create-election" element={
              <ProtectedRoute role="company"><CreateElection /></ProtectedRoute>
            } />
            <Route path="/company/dashboard" element={
              <ProtectedRoute role="company"><CompanyDashboard /></ProtectedRoute>
            } />
            <Route path="/voter/elections" element={
              <ProtectedRoute role="voter"><VoterElections /></ProtectedRoute>
            } />
            <Route path="/voter/vote/:electionId" element={
              <ProtectedRoute role="voter"><VotingPage /></ProtectedRoute>
            } />
            <Route path="/voter/success" element={
              <ProtectedRoute role="voter"><VoteSuccess /></ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
