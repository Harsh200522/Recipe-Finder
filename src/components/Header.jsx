// src/components/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firbase.js";
import "../style/header.css"; // Keep your original CSS

export default function Header() {
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  const handleLogout = (e) => {
    e.preventDefault();
    signOut(auth)
      .then(() => {
        navigate("/auth");
        setIsNavCollapsed(true);
        setIsProfileDropdownOpen(false);
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
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
            to="/community"
            onClick={() => setIsNavCollapsed(true)}
            className={({ isActive }) => isActive ? "active" : ""}
          >
            My Recipes
          </NavLink>

          <NavLink
            to="/about"
            onClick={() => setIsNavCollapsed(true)}
            className={({ isActive }) => isActive ? "active" : ""}
          >
            About
          </NavLink>

          {/* Profile Dropdown - New */}
          <div className="profile-dropdown-container" ref={dropdownRef}>
            <button 
              className="profile-icon-btn"
              onClick={toggleProfileDropdown}
              aria-expanded={isProfileDropdownOpen}
              aria-label="Profile menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="profile-dropdown-menu">
                <div className="profile-dropdown-header">
                  <div className="profile-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="profile-info">
                    <div className="profile-name">User Profile</div>
                    <div className="profile-email">{auth.currentUser?.email || 'user@example.com'}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <NavLink 
                  to="/profile" 
                  className="dropdown-item"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsNavCollapsed(true);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Profile Settings
                </NavLink>
                {/* <NavLink 
                  to="/profile/edit" 
                  className="dropdown-item"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsNavCollapsed(true);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"></path>
                  </svg>
                  Edit Profile
                </NavLink> */}
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item logout-btn"
                  onClick={handleLogout}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}