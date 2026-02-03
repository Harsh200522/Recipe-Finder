import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../config/firbase.js';
import '../style/login.css';
import { useNavigate } from "react-router-dom";

// React Icons
import {
  FaSignInAlt,
  FaUserPlus,
  FaFire,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import { MdEmail, MdPassword } from 'react-icons/md';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [message, setMessage] = useState('');
  const [currentFood, setCurrentFood] = useState('Japanese Miso');

  const navigate = useNavigate(); 
  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage('Login successful! Welcome back chef!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage('Registration successful! Start cooking amazing recipes!');
      }
    } catch (error) {
      let errorMessage = 'Something went wrong. Please try again.';

      switch (error.code) {
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Email already registered.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password must be at least 6 characters.';
          break;
        default:
          errorMessage = error.message;
      }

      setMessage(errorMessage);
    }
  };

  const handleToggleView = () => {
    setIsLoginView(!isLoginView);
    setMessage('');
    setEmail('');
    setPassword('');
  };

  // Food rotation for chef animation
  React.useEffect(() => {
    if (!isLoginView) {
      const foods = ["Japanese Miso", "Garden Vegetable", "Tomato Basil", "Spicy Curry"];
      let index = 0;
      
      const interval = setInterval(() => {
        index = (index + 1) % foods.length;
        setCurrentFood(foods[index]);
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [isLoginView]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* HEADER - Different animation based on view */}
        <div className="auth-header">
          <div className="cooking-animation-container">
            {isLoginView ? (
              // Pan animation for login
              <div className="kitchen-3d">
                <div className="pan-3d">
                  <div className="pan-surface"></div>
                  <div className="pan-rim"></div>
                  <div className="pan-handle"></div>
                  <div className="egg-3d"></div>
                </div>
                <div className="heat-effect"></div>
              </div>
            ) : (
              // Chef animation for registration
              <div className="chef-scene">
                <div className="wow w1">Wow!</div>
                <div className="wow w2">Wow!</div>

                <div className="chef-animation">
                  {/* <h1 className="main-title">Cooking with Passion</h1>
                  <p className="subtitle">Chef</p> */}

                  <div className="food-name">{currentFood}</div>

                  <div className="chef">
                    <div className="chef-hat">
                      <div className="hat-top"></div>
                      <div className="hat-base"></div>
                    </div>

                    <div className="chef-face">
                      <div className="eye left"></div>
                      <div className="eye right"></div>
                      <div className="smile"></div>
                    </div>

                    <div className="chef-body-container">
                      <div className="arm left">
                        <div className="spoon"><div className="spoon-head"></div></div>
                        <div className="hand"></div>
                      </div>

                      <div className="arm right">
                        <div className="hand"></div>
                      </div>

                      <div className="chef-body">
                        <div className="buttons">
                          <div className="button"></div>
                          <div className="button"></div>
                          <div className="button"></div>
                          <div className="button"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bowl-container">
                    <div className="steam" style={{ left: '40%', animationDelay: '0s' }}></div>
                    <div className="steam" style={{ left: '60%', animationDelay: '1.5s' }}></div>
                    
                    <div className="bowl-rim">
                      <div className="soup">
                        <div className="veg v1"></div>
                        <div className="veg v2"></div>
                        <div className="veg v3"></div>
                      </div>
                    </div>
                    <div className="bowl-bottom"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <h1 className="auth-title">
            {isLoginView ? 'Welcome Back Chef!' : 'Join Recipe Finder'}
          </h1>
          <p className="auth-subtitle">
            {isLoginView
              ? 'Sign in to discover amazing recipes'
              : 'Create an account and start cooking'}
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleAuth} className="auth-form">
          {/* EMAIL */}
          <div className="form-group">
            <label className="form-label">
              <MdEmail className="input-icon" />
              Email Address
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          {/* PASSWORD */}
          <div className="form-group">
            <label className="form-label">
              <MdPassword className="input-icon" />
              Password
            </label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              minLength="6"
            />
          </div>
          {/* Forgot Password */}
          {isLoginView && (
            <div className="forgot-container">
              <button
                type="button"
                className="forgot-link"
                onClick={() => navigate("/reset")}
              >
                Forgot Password?
              </button>
            </div>
          )}
          {/* BUTTON */}
          <button type="submit" className="auth-button">
            {isLoginView ? (
              <>
                <FaSignInAlt className="button-icon" />
                Sign In
              </>
            ) : (
              <>
                <FaFire className="button-icon" />
                Get Cooking
              </>
            )}
          </button>

          {/* MESSAGE */}
          {message && (
            <div
              className={`auth-message ${
                message.includes('successful') ? 'success' : 'error'
              }`}
            >
              {message.includes('successful') ? (
                <FaCheckCircle className="message-icon" />
              ) : (
                <FaExclamationTriangle className="message-icon" />
              )}
              <span>{message}</span>
            </div>
          )}

          {/* TOGGLE */}
          <div className="auth-toggle">
            <p>
              {isLoginView ? 'New to Recipe Finder?' : 'Already have an account?'}
              <button
                type="button"
                className="toggle-button"
                onClick={handleToggleView}
              >
                {isLoginView ? (
                  <>
                    Create Account <FaUserPlus />
                  </>
                ) : (
                  <>
                    Sign In <FaSignInAlt />
                  </>
                )}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;