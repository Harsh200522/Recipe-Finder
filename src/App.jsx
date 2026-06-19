// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firbase.js";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./config/firbase.js";
import ResetPassword from "./components/ResetPassword.jsx";
import Home from "./components/Home.jsx";
import Header from "./components/Header.jsx";
import Favorites from "./components/Favorites.jsx";
import MealPlanner from "./components/MealPlanner.jsx";
import Auth from "./components/login.jsx";
import ProfileSettings from "./components/ProfileSettings.jsx";
import "./App.css";
import About from "./components/About.jsx";
import CommunityRecipes from "./components/CommunityRecipes.jsx";
import "./style/darkmode.css";
import PrivacyPolicy from "./components/privacy-policy.jsx";
import Terms from "./components/Terms.jsx";
import ContactUs from "./components/ContactUs.jsx";
import NotFound from "./components/NotFound.jsx";
import Blog from "./components/Blog.jsx";
import BlogDetail from "./components/BlogDetail.jsx";
import RecipeDetail from "./components/RecipeDetail.jsx";
import BlogCategory from "./components/BlogCategory.jsx";
import LandingPage from "./components/LandingPage.jsx";
import Footer from "./components/Footer.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Sitemap from "./components/Sitemap.jsx";
import Disclaimer from "./components/Disclaimer.jsx";
import ChefProfile from "./components/ChefProfile.jsx";
import FAQPage from "./components/FAQPage.jsx";
import NutritionGuide from "./components/NutritionGuide.jsx";
import MealPlanningGuide from "./components/MealPlanningGuide.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAvatar(data?.profile?.avatar || "");
          }
        } catch (err) {
          console.error("Failed to load avatar:", err);
        }
      } else {
        setAvatar("");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <Router>
      <ScrollToTop />
      <div className="app">
        {user && (
          <Header
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            avatar={avatar}
          />
        )}
        <main>
          <Routes>
            {/* ========== PUBLIC ROUTES (No Auth Required) ========== */}
            <Route path="/" element={!user ? <LandingPage /> : <Home />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route path="/category/:name" element={<BlogCategory />} />
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
            <Route path="/reset" element={<ResetPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/chef/:userId" element={<ChefProfile />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/nutrition-guide" element={<NutritionGuide />} />
            <Route path="/meal-planning-guide" element={<MealPlanningGuide />} />

            {/* ========== PROTECTED ROUTES (Auth Required) ========== */}
            <Route
              path="/favorites"
              element={user ? <Favorites /> : <Navigate to="/auth" />}
            />
            <Route
              path="/meal-planner"
              element={user ? <MealPlanner /> : <Navigate to="/auth" />}
            />
            <Route
              path="/community"
              element={user ? <CommunityRecipes /> : <Navigate to="/auth" />}
            />
            <Route
              path="/profile"
              element={
                user ? (
                  <ProfileSettings
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    onAvatarChange={setAvatar}
                  />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />

            {/* ========== CATCH-ALL ROUTE ========== */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;