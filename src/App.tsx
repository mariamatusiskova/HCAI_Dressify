import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ThemeProvider from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import ClosetPage from "./pages/ClosetPage";
import OutfitsPage from "./pages/OutfitsPage";
import OutfitDetailPage from "./pages/OutfitDetailPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Tiny helper so the dynamic outfit-detail redirect can read the URL param
// and forward it to the new path. <Navigate to="..." /> doesn't interpolate
// path params on its own.
const RedirectOutfitDetail = () => {
  const { outfitId = "" } = useParams<{ outfitId: string }>();
  return <Navigate to={`/outfits/${outfitId}`} replace />;
};

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
              {/* Three top-level destinations: Board, Closet, Outfits. */}
              <Route path="/" element={<HomePage />} />
              <Route path="/closet" element={<ClosetPage />} />
              <Route path="/outfits" element={<OutfitsPage />} />
              {/* Detail view for a single saved outfit; reached by tapping */}
              {/* one of the cards in /outfits. */}
              <Route path="/outfits/:outfitId" element={<OutfitDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Backwards-compat redirects. The site previously had a
                  /wardrobe page and a /saved hub with /saved/items +
                  /saved/outfits underneath. Testers found the "Saved"
                  wrapper confusing, so we collapsed wardrobe and saved AI
                  items into one /closet, and promoted outfits to /outfits.
                  These redirects keep any existing bookmarks working. */}
              <Route path="/wardrobe" element={<Navigate to="/closet" replace />} />
              <Route path="/saved" element={<Navigate to="/closet" replace />} />
              <Route path="/saved/items" element={<Navigate to="/closet" replace />} />
              <Route path="/saved/outfits" element={<Navigate to="/outfits" replace />} />
              <Route path="/saved/outfits/:outfitId" element={<RedirectOutfitDetail />} />
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
