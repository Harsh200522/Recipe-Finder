// src/components/Header.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firbase.js";
import "../style/header.css"; // Keep your original CSS

export default function Header() {
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  const handleLogout = (e) => {
    e.preventDefault();
    signOut(auth)
      .then(() => {
        navigate("/auth");
        setIsNavCollapsed(true);
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  return (
    <header className="app-header">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Logo */}
        <NavLink className="logo" to="/">
          Recipe Finder
        </NavLink>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler d-lg-none"
          type="button"
          onClick={handleNavCollapse}
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
          style={{
            border: "none",
            background: "transparent",
            padding: "8px",
            cursor: "pointer"
          }}
        >
          <span className="navbar-toggler-icon-custom">
            ☰
          </span>
        </button>

        {/* Navigation Links */}
        <nav className={`nav-links ${isNavCollapsed ? 'd-none' : 'd-flex'} d-lg-flex`}>
          <NavLink 
            to="/" 
            end
            onClick={() => setIsNavCollapsed(true)}
            className={({ isActive }) => isActive ? "active" : ""}
          >
            Home
          </NavLink>
          
          <NavLink 
            to="/favorites"
            onClick={() => setIsNavCollapsed(true)}
            className={({ isActive }) => isActive ? "active" : ""}
          >
            Favorites
          </NavLink>
          
          <NavLink 
            to="/meal-planner"
            onClick={() => setIsNavCollapsed(true)}
            className={({ isActive }) => isActive ? "active" : ""}
          >
            Meal Planner
          </NavLink>
          
          <NavLink 
            to="/about"
            onClick={() => setIsNavCollapsed(true)}
            className={({ isActive }) => isActive ? "active" : ""}
          >
            About
          </NavLink>
          
          {/* Logout Link */}
          <a 
            href="/auth" 
            onClick={handleLogout}
            style={{ 
              textDecoration: "none",
              color: "#fff",
              fontWeight: "500",
              fontSize: "15px",
              transition: "0.2s",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
            onMouseLeave={(e) => e.target.style.background = "transparent"}
          >
            Logout
          </a>
        </nav>
      </div>
    </header>
  );
}