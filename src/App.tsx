import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/contexts/CartContext";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Pricing from "./pages/Pricing.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CheckoutPage from "./pages/CheckoutPage.tsx";
import LegacyBookOrderPage from "./pages/LegacyBookOrderPage.tsx";
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
import Cart from "./pages/Cart.tsx";
import Confirmation from "./pages/Confirmation.tsx";
import MeetYourAncestor from "./pages/tools/MeetYourAncestor.tsx";
import The1700sYou from "./pages/tools/The1700sYou.tsx";
import AncestorChat from "./pages/tools/AncestorChat.tsx";
import FamilySharePage from "./pages/FamilySharePage.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import Terms from "./pages/Terms.tsx";
import FamilySearchCallback from "./pages/auth/FamilySearchCallback.tsx";
import FamilySearchDemo from "./pages/FamilySearchDemo.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import TikTokLanding from "./pages/TikTokLanding.tsx";
import Signup from "./pages/Signup.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ForgeCrest from "./pages/tools/ForgeCrest.tsx";
import Novel from "./pages/Novel.tsx";
import OrderBook from "./pages/OrderBook.tsx";
import FamilyStory from "./pages/tools/FamilyStory.tsx";
import FamilyTree from "./pages/tools/FamilyTree.tsx";
import CollectHistory from "./pages/tools/CollectHistory.tsx";
import Upgrade from "./pages/Upgrade.tsx";
import LegacyGuard from "./components/LegacyGuard";
import NovelGuard from "./components/NovelGuard";

const queryClient = new QueryClient();

const App = () => (
  <CartProvider>
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
              <Route path="/tools/ancestor" element={<MeetYourAncestor />} />
              <Route path="/tools/1700s" element={<The1700sYou />} />
              <Route path="/tools/chat" element={<LegacyGuard><AncestorChat /></LegacyGuard>} />
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
              <Route path="/heirloom-order" element={<Navigate to="/shop" replace />} />
              <Route path="/product-order" element={<Navigate to="/shop" replace />} />
              <Route path="/legacy-book" element={<LegacyBookOrderPage />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/confirmation" element={<Confirmation />} />
              <Route path="/about" element={<About />} />
              <Route path="/my-legacy" element={<MyLegacy />} />
              <Route path="/f/:surname" element={<FamilySharePage />} />
              <Route path="/gift/:giftId" element={<GiftPage />} />
              <Route path="/gifts/:occasion" element={<GiftOccasionPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              {/* Deep Legacy routes removed during digital-first revamp — only Legacy Pack + Legacy Book remain */}
              <Route path="/auth/familysearch/callback" element={<FamilySearchCallback />} />
              <Route path="/demo/familysearch" element={<FamilySearchDemo />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/tiktok" element={<TikTokLanding />} />
              <Route path="/auth/familysearch/callback" element={<FamilySearchCallback />} />
              <Route path="/demo/familysearch" element={<FamilySearchDemo />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tools/crest" element={<LegacyGuard><ForgeCrest /></LegacyGuard>} />
              <Route path="/tools/story" element={<LegacyGuard><FamilyStory /></LegacyGuard>} />
              <Route path="/tools/tree" element={<LegacyGuard><FamilyTree /></LegacyGuard>} />
              <Route path="/tools/collect" element={<LegacyGuard><CollectHistory /></LegacyGuard>} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/novel" element={<NovelGuard><Novel /></NovelGuard>} />
              <Route path="/order-book" element={<OrderBook />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </CartProvider>
);

export default App;
