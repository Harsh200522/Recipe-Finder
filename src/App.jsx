// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firbase.js";
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

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for login/logout state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

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
      <div className="app">
        {user && <Header />}
        <main>
          <Routes>
            {/* Public route */}
            <Route
              path="/auth"
              element={!user ? <Auth /> : <Navigate to="/" />}
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={user ? <Home /> : <Navigate to="/auth" />}
            />
            <Route
              path="/favorites"
              element={user ? <Favorites /> : <Navigate to="/auth" />}
            />
            <Route
              path="/meal-planner"
              element={user ? <MealPlanner /> : <Navigate to="/auth" />}
            />
            <Route
              path="/about"
              element={user ? <About /> : <Navigate to="/auth" />}
            />
            <Route
              path="/community"
              element={user ? <CommunityRecipes /> : <Navigate to="/auth" />}
            />
            <Route
              path="/profile"
              element={user ? <ProfileSettings isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}/>: <Navigate to="/auth" />}
            />

            {/* Catch-all: if route not found, go home or auth */}
            <Route
              path="*"
              element={<Navigate to={user ? "/" : "/auth"} />}
            />
            <Route
              path="/reset"
              element={<ResetPassword />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
