import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import JourneyLayout from "./pages/journey/JourneyLayout.tsx";
import Stop1EnterName from "./pages/journey/Stop1EnterName.tsx";
import Stop2NameMeaning from "./pages/journey/Stop2NameMeaning.tsx";
import Stop3Bloodline from "./pages/journey/Stop3Bloodline.tsx";
import Stop4CrestForge from "./pages/journey/Stop4CrestForge.tsx";
import Stop5Story from "./pages/journey/Stop5Story.tsx";
import Stop6PassItOn from "./pages/journey/Stop6PassItOn.tsx";
import CheckoutPage from "./pages/CheckoutPage.tsx";
import CheckoutReturn from "./pages/CheckoutReturn.tsx";
import MyLegacy from "./pages/MyLegacy.tsx";
import SurnameLookup from "./pages/tools/SurnameLookup.tsx";
import MottoGenerator from "./pages/tools/MottoGenerator.tsx";
import BloodlineQuiz from "./pages/tools/BloodlineQuiz.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tools/surname" element={<SurnameLookup />} />
          <Route path="/tools/motto" element={<MottoGenerator />} />
          <Route path="/tools/quiz" element={<BloodlineQuiz />} />
          <Route path="/journey" element={<JourneyLayout />}>
            <Route index element={<Navigate to="/journey/1" replace />} />
            <Route path="1" element={<Stop1EnterName />} />
            <Route path="2" element={<Stop2NameMeaning />} />
            <Route path="3" element={<Stop3Bloodline />} />
            <Route path="4" element={<Stop4CrestForge />} />
            <Route path="5" element={<Stop5Story />} />
            <Route path="6" element={<Stop6PassItOn />} />
          </Route>
          <Route path="/checkout" element={<JourneyLayout />}>
            <Route index element={<CheckoutPage />} />
            <Route path="return" element={<CheckoutReturn />} />
          </Route>
          <Route path="/my-legacy" element={<MyLegacy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
