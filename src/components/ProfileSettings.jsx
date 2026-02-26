import React, { useRef, useState } from 'react';
import {
    User,
    Mail,
    Lock,
    Bell,
    Globe,
    Save,
    Camera,
    Check,
    Loader,
    Eye,
    EyeOff
} from 'lucide-react';
import { db, auth } from "../config/firbase.js";
import {
    doc,
    setDoc,
    getDoc,
    updateDoc
} from "firebase/firestore";
import {
    updatePassword,
    deleteUser,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "firebase/auth";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { useBeforeUnload, useNavigate } from "react-router-dom";
import '../style/profileSetting.css';
import Swal from "sweetalert2";

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
});

const defaultProfileState = {
    name: '',
    email: '',
    bio: '',
    avatar: '',
    location: '',
    cookingLevel: '',
    favoriteCuisine: ''
};

const defaultPreferencesState = {
    dietaryRestrictions: [],
    allergies: [],
    measurementUnit: '',
    language: '',
    emailNotifications: false,
    pushNotifications: false,
    darkMode: false,
    saveHistory: false
};


const ProfileSettings = ({ isDarkMode, setIsDarkMode }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [customDietary, setCustomDietary] = useState('');
    const [customAllergy, setCustomAllergy] = useState('');

    const initialProfileRef = useRef(defaultProfileState);
    const initialPreferencesRef = useRef(defaultPreferencesState);
    const initialDarkModeRef = useRef(isDarkMode);
    const leaveDialogOpenRef = useRef(false);
    const navigate = useNavigate();
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const loadedProfile = { ...defaultProfileState, ...(data.profile || {}) };
                    const loadedPreferences = { ...defaultPreferencesState, ...(data.preferences || {}) };

                    setProfile(loadedProfile);
                    setPreferences(loadedPreferences);
                    setTwoFAEnabled(data.twoFactorEnabled || false);

                    initialProfileRef.current = loadedProfile;
                    initialPreferencesRef.current = loadedPreferences;
                    initialDarkModeRef.current = isDarkMode;
                    setInitialDataLoaded(true);
                } else {
                    initialProfileRef.current = defaultProfileState;
                    initialPreferencesRef.current = defaultPreferencesState;
                    initialDarkModeRef.current = isDarkMode;
                    setInitialDataLoaded(true);
                }

            } else {
                setInitialDataLoaded(true);
            }
        });

        return () => unsubscribe();
    }, []);

    // User profile state
    const [profile, setProfile] = useState(defaultProfileState);
    const getProviderId = () => {
        const user = auth.currentUser;
        if (!user || !user.providerData.length) return null;
        return user.providerData[0].providerId; // 'password', 'samsung.com', 'google.com', etc.
    };


    const handleEnable2FA = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            setTwoFALoading(true);

            const res = await fetch("http://localhost:5000/generate-2fa-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, uid: user.uid })
            });

            const data = await res.json();

            if (!res.ok || !data.success) throw new Error("Failed to send OTP");

            Toast.fire({ icon: "success", title: "OTP sent to your email!" });

        } catch (err) {
            console.error(err);
            Toast.fire({ icon: "error", title: "Failed to send OTP" });
        } finally {
            setTwoFALoading(false);
        }
    };

    const handleVerify2FA = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) return;

            const data = docSnap.data();
            const now = Date.now();

            if (otp === data.twoFactorOTP && now < data.twoFactorOTPExpires) {
                // OTP correct → enable 2FA
                await updateDoc(docRef, {
                    twoFactorEnabled: true,
                    twoFactorOTP: "",
                    twoFactorOTPExpires: 0
                });

                setTwoFAEnabled(true);
                setOtp("");

                Toast.fire({ icon: "success", title: "2FA Enabled!" });
            } else {
                Toast.fire({ icon: "error", title: "Invalid or expired OTP" });
            }
        } catch (err) {
            console.error(err);
            Toast.fire({ icon: "error", title: "Verification failed" });
        }
    };

    const handleDisable2FA = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const docRef = doc(db, "users", user.uid);
        await updateDoc(docRef, {
            twoFactorEnabled: false
        });

        setTwoFAEnabled(false);
        Toast.fire({ icon: "success", title: "2FA Disabled" });
    };



    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Preferences state
    const [preferences, setPreferences] = useState(defaultPreferencesState);

    const hasUnsavedChanges =
        initialDataLoaded &&
        (
            JSON.stringify(profile) !== JSON.stringify(initialProfileRef.current) ||
            JSON.stringify(preferences) !== JSON.stringify(initialPreferencesRef.current) ||
            isDarkMode !== initialDarkModeRef.current
        );

    useBeforeUnload((event) => {
        if (!hasUnsavedChanges) return;
        event.preventDefault();
        event.returnValue = "";
    });

    useEffect(() => {
        const handleLinkClick = (event) => {
            if (!hasUnsavedChanges || leaveDialogOpenRef.current) return;
            if (event.defaultPrevented) return;
            if (event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const anchor = event.target.closest("a[href]");
            if (!anchor) return;

            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

            const nextUrl = new URL(anchor.href, window.location.origin);
            if (nextUrl.origin !== window.location.origin) return;

            const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
            if (currentPath === nextPath) return;

            event.preventDefault();
            leaveDialogOpenRef.current = true;

            Swal.fire({
                icon: "warning",
                title: "Unsaved changes",
                text: "Please save first, otherwise your changes will not be stored.",
                showCancelButton: true,
                confirmButtonText: "Leave page",
                cancelButtonText: "Stay here",
            }).then((result) => {
                leaveDialogOpenRef.current = false;
                if (result.isConfirmed) {
                    navigate(nextPath);
                }
            });
        };

        document.addEventListener("click", handleLinkClick, true);
        return () => document.removeEventListener("click", handleLinkClick, true);
    }, [hasUnsavedChanges, navigate]);

    // Available options
    const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo', 'Low-Carb'];
    const allergyOptions = ['Nuts', 'Dairy', 'Eggs', 'Soy', 'Shellfish', 'Wheat'];
    const cookingLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
    const extractGoogleDriveFileId = (url) => {
        if (!url) return "";

        const trimmed = url.trim();
        const filePathMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (filePathMatch?.[1]) return filePathMatch[1];

        const directDrivePathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (directDrivePathMatch?.[1]) return directDrivePathMatch[1];

        const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idParamMatch?.[1]) return idParamMatch[1];

        return "";
    };

    const handleDriveImage = (url) => {
        if (!url) return;

        const fileId = extractGoogleDriveFileId(url);
        if (!fileId) {
            Toast.fire({
                icon: "error",
                title: "Invalid Google Drive link"
            });
            return;
        }

        const directUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        setProfile((prev) => ({
            ...prev,
            avatar: directUrl
        }));
    };


    const handleProfileChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handlePreferenceToggle = (key) => {
        setPreferences({
            ...preferences,
            [key]: !preferences[key]
        });
    };

    const togglePreferenceListItem = (key, option) => {
        setPreferences((prev) => {
            const currentItems = prev[key] || [];
            const updatedItems = currentItems.includes(option)
                ? currentItems.filter((item) => item !== option)
                : [...currentItems, option];

            return {
                ...prev,
                [key]: updatedItems
            };
        });
    };

    const handleDietaryChange = (option) => togglePreferenceListItem("dietaryRestrictions", option);

    const handleAllergyChange = (option) => togglePreferenceListItem("allergies", option);

    const handlePasswordUpdate = async () => {
        try {
            const user = auth.currentUser;

            // 🔴 Check authentication
            if (!user) {
                Toast.fire({
                    icon: "error",
                    title: "User not authenticated"
                });
                return;
            }

            // 🔴 Check empty fields
            if (
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword
            ) {
                Toast.fire({
                    icon: "warning",
                    title: "All password fields are required"
                });
                return;
            }

            // 🔴 Check password length
            if (passwordData.newPassword.length < 6) {
                Toast.fire({
                    icon: "warning",
                    title: "Password must be at least 6 characters"
                });
                return;
            }

            // 🔴 Check match
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                Toast.fire({
                    icon: "error",
                    title: "Passwords do not match"
                });
                return;
            }

            // ✅ Step 1: Reauthenticate with current password
            const credential = EmailAuthProvider.credential(
                user.email,
                passwordData.currentPassword
            );

            await reauthenticateWithCredential(user, credential);

            // ✅ Step 2: Update password
            await updatePassword(user, passwordData.newPassword);

            Toast.fire({
                icon: "success",
                title: "Password updated successfully"
            });

            // Clear fields
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

        } catch (error) {

            let message = "Something went wrong";

            if (error.code === "auth/wrong-password") {
                message = "Current password is incorrect";
            } else if (error.code === "auth/too-many-requests") {
                message = "Too many attempts. Try again later";
            } else if (error.code === "auth/requires-recent-login") {
                message = "Please login again and try";
            }

            Toast.fire({
                icon: "error",
                title: message
            });
        }
    };

    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });




    const handleSave = async () => {
        try {
            setIsLoading(true);

            const user = auth.currentUser;
            if (!user) return;

            await setDoc(doc(db, "users", user.uid), {
                profile,
                preferences,
                updatedAt: new Date()
            }, { merge: true });

            initialProfileRef.current = profile;
            initialPreferencesRef.current = preferences;
            initialDarkModeRef.current = isDarkMode;

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
        } finally {
            setIsLoading(false);
        }
    };


    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'preferences', label: 'Preferences', icon: Globe },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell }
    ];
    // =========================
    // 2FA State
    // =========================
    const [qrCode, setQrCode] = useState(null);
    const [twoFASecret, setTwoFASecret] = useState("");
    const [otp, setOtp] = useState("");
    const [twoFALoading, setTwoFALoading] = useState(false);
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);


    return (
        <div className="settings-container">
            <div className="settings-wrapper">
                {/* Header */}
                <div className="settings-header">
                    <h1>Profile Settings</h1>
                    <p>Manage your account preferences and personal information</p>
                </div>

                {/* Success Message */}
                {showSuccess && (
                    <div className="success-message">
                        <Check className="success-icon" />
                        Settings saved successfully!
                    </div>
                )}

                <div className="settings-card">
                    {/* Tabs */}
                    <div className="tabs-container">
                        <nav className="tabs-nav">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                    >
                                        <Icon className="tab-icon" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="content-area">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="profile-tab">
                                {/* Avatar */}
                                <div className="avatar-section">
                                    <div className="avatar-container">
                                        <img
                                            src={profile.avatar || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUmgrBOv_cpwabmIhfJ3-PWW0XOW6fhyjqEQ&s"}
                                            alt="Profile"
                                            className="avatar-image"
                                            onError={(e) => {
                                                e.target.src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUmgrBOv_cpwabmIhfJ3-PWW0XOW6fhyjqEQ&s";
                                            }}
                                        />
                                    </div>

                                    <div className="avatar-info">
                                        <h3>Profile Photo (Google Drive)</h3>
                                        <p>Paste your public Google Drive image link below</p>

                                        <input
                                            type="text"
                                            placeholder="Paste Google Drive share link"
                                            className="form-input"
                                            onBlur={(e) => handleDriveImage(e.target.value)}
                                        />
                                    </div>
                                </div>


                                {/* Form Fields */}
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={profile.name}
                                            onChange={handleProfileChange}
                                            placeholder="Enter your full name"
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profile.email}
                                            onChange={handleProfileChange}
                                            placeholder="Enter your email"
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={profile.location}
                                            onChange={handleProfileChange}
                                            placeholder="Enter your location"
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Cooking Level</label>
                                        <select
                                            name="cookingLevel"
                                            value={profile.cookingLevel}
                                            onChange={handleProfileChange}
                                            className="form-select"
                                        >
                                            <option value="">Select Cooking Level</option>
                                            {cookingLevels.map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label">Bio</label>
                                        <textarea
                                            name="bio"
                                            value={profile.bio}
                                            onChange={handleProfileChange}
                                            placeholder="Tell us about yourself..."
                                            rows="3"
                                            className="form-textarea"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === 'preferences' && (
                            <div className="preferences-tab">
                                {/* Dietary Restrictions */}
                                {/* Dietary Restrictions */}
                                <div className="preferences-section">
                                    <h3 className="section-title">Dietary Restrictions</h3>
                                    <div className="pills-container">
                                        {dietaryOptions.concat(preferences.dietaryRestrictions.filter(item => !dietaryOptions.includes(item))).map(option => (
                                            <button
                                                key={option}
                                                onClick={() => handleDietaryChange(option)}
                                                className={`pill-button ${preferences.dietaryRestrictions.includes(option) ? 'active' : ''}`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="custom-input">
                                        <input
                                            type="text"
                                            placeholder="Add custom dietary restriction"
                                            value={customDietary}
                                            onChange={(e) => setCustomDietary(e.target.value)}
                                            className="form-input"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                if (customDietary.trim() && !preferences.dietaryRestrictions.includes(customDietary.trim())) {
                                                    setPreferences({
                                                        ...preferences,
                                                        dietaryRestrictions: [...preferences.dietaryRestrictions, customDietary.trim()]
                                                    });
                                                    setCustomDietary('');
                                                }
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Allergies */}
                                <div className="preferences-section">
                                    <h3 className="section-title">Allergies</h3>
                                    <div className="pills-container">
                                        {allergyOptions.concat(preferences.allergies.filter(item => !allergyOptions.includes(item))).map(option => (
                                            <button
                                                key={option}
                                                onClick={() => handleAllergyChange(option)}
                                                className={`pill-button danger ${preferences.allergies.includes(option) ? 'active' : ''}`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="custom-input">
                                        <input
                                            type="text"
                                            placeholder="Add custom allergy"
                                            value={customAllergy}
                                            onChange={(e) => setCustomAllergy(e.target.value)}
                                            className="form-input"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                if (customAllergy.trim() && !preferences.allergies.includes(customAllergy.trim())) {
                                                    setPreferences({
                                                        ...preferences,
                                                        allergies: [...preferences.allergies, customAllergy.trim()]
                                                    });
                                                    setCustomAllergy('');
                                                }
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>


                                {/* General Preferences */}
                                <div className="preferences-section">
                                    <h3 className="section-title">General Preferences</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Measurement Unit</label>
                                            <select
                                                value={preferences.measurementUnit}
                                                onChange={(e) => setPreferences({ ...preferences, measurementUnit: e.target.value })}
                                                className="form-select"
                                            >
                                                <option value="">Select Measurement Unit</option>
                                                <option value="metric">Metric (g, ml, cm)</option>
                                                <option value="imperial">Imperial (oz, cups, inches)</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Language</label>
                                            <select
                                                value={preferences.language}
                                                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                                                className="form-select"
                                            >
                                                <option value="">Select Language</option>
                                                <option value="en">English</option>
                                                <option value="es">Spanish</option>
                                                <option value="fr">French</option>
                                                <option value="de">German</option>
                                                <option value="it">Italian</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Toggle Switches */}
                                <div className="preferences-section">

                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <h4>Dark Mode</h4>
                                            <p>Switch between light and dark themes</p>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                id="globalDarkMode"
                                                className="toggle-input"
                                                checked={isDarkMode}
                                                onChange={() => setIsDarkMode(!isDarkMode)}
                                            />
                                            <label htmlFor="globalDarkMode" className="toggle-label"></label>
                                        </div>
                                    </div>
                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <h4>Save Search History</h4>
                                            <p>Keep track of your recipe searches</p>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                className="toggle-input"
                                                id="saveHistory"
                                                checked={preferences.saveHistory}
                                                onChange={() => handlePreferenceToggle('saveHistory')}
                                            />
                                            <label htmlFor="saveHistory" className="toggle-label"></label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="security-tab">
                                <h3 className="section-title">Change Password</h3>

                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label className="form-label">Current Password</label>
                                        <div className="password-wrapper">
                                            <input
                                                type={showPassword.current ? "text" : "password"}
                                                name="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordChange}
                                                className="form-input"
                                            />
                                            <span
                                                className="password-toggle"
                                                onClick={() =>
                                                    setShowPassword({ ...showPassword, current: !showPassword.current })
                                                }
                                            >
                                                {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </span>
                                        </div>
                                    </div>


                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <div className="password-wrapper">
                                            <input
                                                type={showPassword.new ? "text" : "password"}
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                className="form-input"
                                            />
                                            <span
                                                className="password-toggle"
                                                onClick={() =>
                                                    setShowPassword({ ...showPassword, new: !showPassword.new })
                                                }
                                            >
                                                {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Confirm New Password</label>
                                        <div className="password-wrapper">
                                            <input
                                                type={showPassword.confirm ? "text" : "password"}
                                                name="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                className="form-input"
                                            />
                                            <span
                                                className="password-toggle"
                                                onClick={() =>
                                                    setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                                                }
                                            >
                                                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "-5px", marginBottom: "20px" }}>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handlePasswordUpdate}
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                </div>

                                {/* Two Factor Authentication Section */}
                                <div className="security-section">
                                    {!twoFAEnabled && (
                                        <button className="btn btn-primary" onClick={handleEnable2FA}>
                                            {twoFALoading ? "Sending OTP..." : "Enable Two-Factor Authentication"}
                                        </button>
                                    )}

                                    {!twoFAEnabled && (
                                        <div style={{ marginTop: "10px" }}>
                                            <input
                                                type="text"
                                                placeholder="Enter 6-digit code from email"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="form-input"
                                            />
                                            <button
                                                className="btn btn-primary"
                                                style={{ marginTop: "5px" }}
                                                onClick={handleVerify2FA}
                                            >
                                                Verify OTP
                                            </button>
                                        </div>
                                    )}

                                    {twoFAEnabled && (
                                        <button className="btn btn-danger" onClick={handleDisable2FA}>
                                            DisableTwo-Factor Authentication
                                        </button>
                                    )}
                                </div>

                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="notifications-tab">
                                <div className="notifications-section">
                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <h4>Email Notifications</h4>
                                            <p>Receive updates via email</p>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                className="toggle-input"
                                                id="emailNotifications"
                                                checked={preferences.emailNotifications}
                                                onChange={() => handlePreferenceToggle('emailNotifications')}
                                            />
                                            <label htmlFor="emailNotifications" className="toggle-label"></label>
                                        </div>
                                    </div>

                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <h4>Push Notifications</h4>
                                            <p>Receive notifications in your browser</p>
                                        </div>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                className="toggle-input"
                                                id="pushNotifications"
                                                checked={preferences.pushNotifications}
                                                onChange={() => handlePreferenceToggle('pushNotifications')}
                                            />
                                            <label htmlFor="pushNotifications" className="toggle-label"></label>
                                        </div>
                                    </div>
                                </div>

                                {/* Notification Preferences */}
                                <div className="notifications-section">
                                    <h4 className="section-subtitle">Notification Preferences</h4>
                                    <div className="checkbox-group">
                                        {['New Recipes', 'Weekly Meal Plans', 'Cooking Tips', 'Community Updates'].map((item) => (
                                            <label key={item} className="checkbox-item">
                                                <input type="checkbox" className="checkbox-input" />
                                                <span className="checkbox-label">{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="save-container">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="btn btn-primary"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="btn-icon btn-spinner" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="btn-icon" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="danger-zone">
                    <h2>Danger Zone</h2>
                    <div className="danger-content">
                        <div className="danger-text">
                            <p className="danger-title">Delete Account</p>
                            <p className="danger-description">Once you delete your account, there is no going back.</p>
                        </div>
                        <button
                            className="btn btn-danger"
                            onClick={async () => {
                                const user = auth.currentUser;
                                if (!user) return;
                                await deleteUser(user);
                                alert("Account deleted");
                            }}
                        >
                            Delete Account
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
