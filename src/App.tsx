import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ThemeProvider from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import WardrobePage from "./pages/WardrobePage";
import SavedPage from "./pages/SavedPage";
import ItemPage from "./pages/ItemPage";
import OutfitsPage from "./pages/OutfitsPage";
import OutfitDetailPage from "./pages/OutfitDetailPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* ThemeProvider must wrap the app before Sonner/router so both UI and toast theme can react to light/dark mode. */}
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          basename={import.meta.env.BASE_URL}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Index is the shared shell for the main app workspace. */}
            <Route element={<Index />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/wardrobe" element={<WardrobePage />} />
              <Route path="/saved" element={<SavedPage />}>
                <Route index element={<Navigate to="items" replace />} />
                <Route path="items" element={<ItemPage />} />
                <Route path="outfits" element={<OutfitsPage />} />
                {/* Detail view for a single saved outfit; reached by tapping */}
                {/* one of the cards in /saved/outfits. */}
                <Route path="outfits/:outfitId" element={<OutfitDetailPage />} />
              </Route>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Auth pages stay outside the shared shell so they can have their own standalone layout. */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
