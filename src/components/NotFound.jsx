import React from "react";
import { Link } from "react-router-dom";
import "../style/NotFound.css";

export default function NotFound() {
    return (
        <div className="not-found-wrapper">
            {/* --- Astronaut Animation Background --- */}
            <div className="box-of-star1">
                <div className="star star-position1"></div>
                <div className="star star-position2"></div>
                <div className="star star-position3"></div>
                <div className="star star-position4"></div>
                <div className="star star-position5"></div>
                <div className="star star-position6"></div>
                <div className="star star-position7"></div>
            </div>
            <div className="box-of-star2">
                <div className="star star-position1"></div>
                <div className="star star-position2"></div>
                <div className="star star-position3"></div>
                <div className="star star-position4"></div>
                <div className="star star-position5"></div>
                <div className="star star-position6"></div>
                <div className="star star-position7"></div>
            </div>
            <div className="box-of-star3">
                <div className="star star-position1"></div>
                <div className="star star-position2"></div>
                <div className="star star-position3"></div>
                <div className="star star-position4"></div>
                <div className="star star-position5"></div>
                <div className="star star-position6"></div>
                <div className="star star-position7"></div>
            </div>
            <div className="box-of-star4">
                <div className="star star-position1"></div>
                <div className="star star-position2"></div>
                <div className="star star-position3"></div>
                <div className="star star-position4"></div>
                <div className="star star-position5"></div>
                <div className="star star-position6"></div>
                <div className="star star-position7"></div>
            </div>

            <div data-js="astro" className="astronaut">
                <div className="head"></div>
                <div className="arm arm-left"></div>
                <div className="arm arm-right"></div>
                <div className="body">
                    <div className="panel"></div>
                </div>
                <div className="leg leg-left"></div>
                <div className="leg leg-right"></div>
                <div className="schoolbag"></div>
            </div>

            {/* --- Error Content --- */}
            <div className="error-content">
                <h1 className="error-code">404</h1>
                <h2 className="error-title">Page Not Found</h2>
                <p className="error-message">
                    We're sorry, the page you are looking for does not exist or has been moved.
                </p>
                <Link to="/" className="back-home-btn">
                    Return to Mission Control
                </Link>
            </div>
        </div>
    );
}