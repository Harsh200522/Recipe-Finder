import React, { useState } from "react";
import { auth } from "../config/firbase";
import { sendPasswordResetEmail } from "firebase/auth";
import { FaEnvelope, FaKey, FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 const handleReset = async (e) => {
  e.preventDefault();

  if (!email) {
    setMessage("Please enter your email address");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin + "/auth",
    });

    setMessage("✅ Password reset link sent! Check your email 📩");

    setTimeout(() => navigate("/auth"), 2000);

  } catch (error) {
    console.error(error.code, error.message);
    setMessage(error.message);
  }
};



  const handleBack = () => {
    navigate("/auth");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Back Button */}
        <button onClick={handleBack} style={styles.backButton}>
          <FaChevronLeft style={styles.backIcon} />
          Back to Login
        </button>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <FaKey style={styles.keyIcon} />
          </div>
          <h2 style={styles.title}>Reset Your Password</h2>
          <p style={styles.subtitle}>
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleReset} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <FaEnvelope style={styles.inputIcon} />
              Email Address
            </label>
            <input
              type="email"
              placeholder="chef@recipefinder.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.submitButton}>
            Send Reset Link
          </button>
        </form>

        {/* Message */}
        {message && (
          <div 
            style={{
              ...styles.message,
              backgroundColor: message.includes("sent") ? "#d4edda" : "#f8d7da",
              color: message.includes("sent") ? "#155724" : "#721c24",
              borderColor: message.includes("sent") ? "#c3e6cb" : "#f5c6cb"
            }}
          >
            {message.includes("sent") ? "✅" : "⚠️"} {message}
          </div>
        )}

        {/* Additional Info */}
        <div style={styles.info}>
          <p style={styles.infoText}>
            <strong>Note:</strong> The reset link will expire in 1 hour.
          </p>
          <p style={styles.infoText}>
            Can't find the email? Check your spam folder.
          </p>
        </div>
      </div>

      {/* Large Rotating Background Elements */}
      <div style={styles.bgElement1}>🍳</div>
      <div style={styles.bgElement2}>🥘</div>
      <div style={styles.bgElement3}>🧑‍🍳</div>
      <div style={styles.bgElement4}>🍲</div>
      <div style={styles.bgElement5}>🥗</div>
      <div style={styles.bgElement6}>🔑</div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  card: {
    background: "rgba(255, 255, 255, 0.98)",
    borderRadius: "25px",
    padding: "40px 35px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
    width: "100%",
    maxWidth: "450px",
    backdropFilter: "blur(15px)",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    position: "relative",
    zIndex: "10",
  },
  backButton: {
    background: "rgba(255, 152, 0, 0.1)",
    border: "1px solid rgba(255, 152, 0, 0.3)",
    color: "#ff9800",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 15px",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    marginBottom: "25px",
  },
  backIcon: {
    fontSize: "14px",
    transition: "transform 0.3s ease",
  },
  header: {
    textAlign: "center",
    marginBottom: "35px",
  },
  iconContainer: {
    width: "90px",
    height: "90px",
    background: "linear-gradient(135deg, #ff9800 0%, #ff5722 100%)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 25px",
    boxShadow: "0 15px 30px rgba(255, 152, 0, 0.4)",
    animation: "pulseGlow 3s ease-in-out infinite",
  },
  keyIcon: {
    fontSize: "42px",
    color: "white",
    animation: "bounceKey 2s ease-in-out infinite",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#2c3e50",
    marginBottom: "12px",
    background: "linear-gradient(135deg, #ff9800, #ff5722)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "0.5px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    lineHeight: "1.6",
    maxWidth: "300px",
    margin: "0 auto",
  },
  form: {
    marginBottom: "30px",
  },
  inputGroup: {
    marginBottom: "28px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#555",
    marginBottom: "10px",
  },
  inputIcon: {
    fontSize: "18px",
    color: "#ff9800",
  },
  input: {
    width: "100%",
    padding: "18px 22px",
    fontSize: "16px",
    border: "2px solid #e0e0e0",
    borderRadius: "15px",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    backgroundColor: "#fafafa",
    color: "#333",
    outline: "none",
  },
  submitButton: {
    width: "100%",
    padding: "18px",
    fontSize: "18px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #ff9800 0%, #ff5722 100%)",
    color: "white",
    border: "none",
    borderRadius: "15px",
    cursor: "pointer",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    boxShadow: "0 10px 25px rgba(255, 152, 0, 0.4)",
    position: "relative",
    overflow: "hidden",
  },
  message: {
    padding: "18px",
    borderRadius: "12px",
    marginBottom: "25px",
    fontSize: "15px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    animation: "slideInUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.08)",
  },
  info: {
    marginTop: "30px",
    padding: "22px",
    backgroundColor: "rgba(255, 152, 0, 0.05)",
    borderRadius: "15px",
    border: "2px solid rgba(255, 152, 0, 0.1)",
    backdropFilter: "blur(5px)",
  },
  infoText: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "10px",
    lineHeight: "1.6",
  },
  
  // Large Rotating Background Elements
  bgElement1: {
    position: "absolute",
    top: "-10%",
    left: "-5%",
    fontSize: "280px",
    opacity: "0.07",
    animation: "rotateSlow 25s linear infinite",
    zIndex: "1",
    filter: "blur(3px)",
    pointerEvents: "none",
  },
  bgElement2: {
    position: "absolute",
    bottom: "-15%",
    right: "-8%",
    fontSize: "320px",
    opacity: "0.07",
    animation: "rotateReverse 30s linear infinite",
    zIndex: "1",
    filter: "blur(3px)",
    pointerEvents: "none",
    transform: "rotate(45deg)",
  },
  bgElement3: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "350px",
    opacity: "0.04",
    animation: "pulseRotate 40s linear infinite",
    zIndex: "1",
    filter: "blur(4px)",
    pointerEvents: "none",
  },
  bgElement4: {
    position: "absolute",
    top: "20%",
    right: "15%",
    fontSize: "180px",
    opacity: "0.06",
    animation: "rotateSlow 35s linear infinite",
    zIndex: "1",
    filter: "blur(2px)",
    pointerEvents: "none",
  },
  bgElement5: {
    position: "absolute",
    bottom: "30%",
    left: "12%",
    fontSize: "200px",
    opacity: "0.06",
    animation: "rotateReverse 28s linear infinite",
    zIndex: "1",
    filter: "blur(2px)",
    pointerEvents: "none",
  },
  bgElement6: {
    position: "absolute",
    top: "15%",
    left: "20%",
    fontSize: "150px",
    opacity: "0.05",
    animation: "floatRotate 22s ease-in-out infinite",
    zIndex: "1",
    filter: "blur(1.5px)",
    pointerEvents: "none",
  },
};

// Add CSS animations
if (typeof window !== 'undefined') {
  const styleSheet = document.styleSheets[0];
  
  // Rotating animations
  styleSheet.insertRule(`
    @keyframes rotateSlow {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.1); }
      100% { transform: rotate(360deg) scale(1); }
    }
  `, styleSheet.cssRules.length);

  styleSheet.insertRule(`
    @keyframes rotateReverse {
      0% { transform: rotate(360deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.1); }
      100% { transform: rotate(0deg) scale(1); }
    }
  `, styleSheet.cssRules.length);

  styleSheet.insertRule(`
    @keyframes pulseRotate {
      0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 0.04; }
      25% { transform: translate(-50%, -50%) rotate(90deg) scale(1.15); opacity: 0.06; }
      50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.2); opacity: 0.04; }
      75% { transform: translate(-50%, -50%) rotate(270deg) scale(1.15); opacity: 0.06; }
      100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); opacity: 0.04; }
    }
  `, styleSheet.cssRules.length);

  styleSheet.insertRule(`
    @keyframes floatRotate {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      25% { transform: translateY(-40px) rotate(90deg); }
      50% { transform: translateY(0px) rotate(180deg); }
      75% { transform: translateY(40px) rotate(270deg); }
    }
  `, styleSheet.cssRules.length);

  // Other animations
  styleSheet.insertRule(`
    @keyframes slideInUp {
      from { 
        opacity: 0; 
        transform: translateY(20px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
  `, styleSheet.cssRules.length);

  styleSheet.insertRule(`
    @keyframes pulseGlow {
      0%, 100% { 
        box-shadow: 0 15px 30px rgba(255, 152, 0, 0.4); 
      }
      50% { 
        box-shadow: 0 15px 40px rgba(255, 152, 0, 0.7); 
      }
    }
  `, styleSheet.cssRules.length);

  styleSheet.insertRule(`
    @keyframes bounceKey {
      0%, 100% { 
        transform: translateY(0); 
      }
      50% { 
        transform: translateY(-10px); 
      }
    }
  `, styleSheet.cssRules.length);

  // Hover effects
  styleSheet.insertRule(`
    input:hover, input:focus {
      border-color: #ff9800 !important;
      background-color: white !important;
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.15) !important;
      transform: translateY(-3px) !important;
    }
  `, styleSheet.cssRules.length);

  styleSheet.insertRule(`
    button[type="submit"]:hover {
      transform: translateY(-5px) !important;
      box-shadow: 0 15px 35px rgba(255, 87, 34, 0.5) !important;
    }
  `, styleSheet.cssRules.length);

  styleSheet.insertRule(`
    button[type="submit"]:active {
      transform: translateY(-2px) !important;
    }
  `, styleSheet.cssRules.length);
}

export default ResetPassword;