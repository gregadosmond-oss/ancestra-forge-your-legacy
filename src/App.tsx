import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Pricing from "./pages/Pricing.tsx";
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
import GiftPage from "./pages/GiftPage.tsx";
import SurnameLookup from "./pages/tools/SurnameLookup.tsx";
import MottoGenerator from "./pages/tools/MottoGenerator.tsx";
import BloodlineQuiz from "./pages/tools/BloodlineQuiz.tsx";
import ToolsHub from "./pages/tools/ToolsHub.tsx";
import About from "./pages/About.tsx";
import GiftOccasionPage from "./pages/gifts/GiftOccasionPage.tsx";
import Shop from "./pages/Shop.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/tools" element={<ToolsHub />} />
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
            <Route path="/shop" element={<Shop />} />
            <Route path="/about" element={<About />} />
            <Route path="/my-legacy" element={<MyLegacy />} />
            <Route path="/gift/:giftId" element={<GiftPage />} />
            <Route path="/gifts/:occasion" element={<GiftOccasionPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
