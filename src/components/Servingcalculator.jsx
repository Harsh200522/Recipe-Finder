// src/components/ServingCalculator.jsx
import React, { useState, useMemo } from "react";
import "../style/ServingCalculator.css";

/**
 * Parses a quantity string like "2", "1/2", "1.5", "2-3" into a float.
 * Returns null if no number is found.
 */
const parseQuantity = (str) => {
  if (!str) return null;
  const s = str.trim();

  // Fraction: "1/2", "3/4"
  const fractionMatch = s.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) return parseFloat(fractionMatch[1]) / parseFloat(fractionMatch[2]);

  // Mixed number: "1 1/2", "2 3/4"
  const mixedMatch = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch)
    return parseFloat(mixedMatch[1]) + parseFloat(mixedMatch[2]) / parseFloat(mixedMatch[3]);

  // Range: "2-3" → average
  const rangeMatch = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (rangeMatch)
    return (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;

  // Plain float/int
  const numMatch = s.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) return parseFloat(numMatch[1]);

  return null;
};

/**
 * Formats a float back to a readable string.
 * Tries to keep fractions clean.
 */
const formatQuantity = (num) => {
  if (num === null || isNaN(num)) return "";
  // Common fractions
  const fractions = [
    [1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"],
    [3 / 8, "⅜"], [1 / 2, "½"], [5 / 8, "⅝"],
    [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"],
  ];

  const whole = Math.floor(num);
  const decimal = num - whole;

  if (decimal < 0.05) return whole === 0 ? "" : String(whole);

  for (const [val, sym] of fractions) {
    if (Math.abs(decimal - val) < 0.07) {
      return whole === 0 ? sym : `${whole} ${sym}`;
    }
  }

  // Fallback: round to 2 decimal places
  return parseFloat(num.toFixed(2)).toString();
};

/**
 * Scales a measure string like "2 tbsp", "1/2 cup", "200g" by a factor.
 */
const scaleMeasure = (measure, factor) => {
  if (!measure || !measure.trim()) return measure;

  // Try to find leading number (int, float, fraction, mixed)
  const patterns = [
    // Mixed number: "1 1/2 cup"
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)\s*(.*)/,
  ];

  const match = measure.trim().match(patterns[0]);
  if (!match) return measure;

  const rawNum = match[1].trim();
  const unit = match[2].trim();
  const parsed = parseQuantity(rawNum);

  if (parsed === null) return measure;

  const scaled = parsed * factor;
  const formatted = formatQuantity(scaled);

  return unit ? `${formatted} ${unit}` : formatted;
};

/**
 * Parses "Ingredient - Measure" or just "Ingredient" strings.
 */
const parseIngredientLine = (line) => {
  if (!line) return { name: "", measure: "" };
  const parts = line.split(" - ");
  if (parts.length >= 2) {
    return { name: parts[0].trim(), measure: parts.slice(1).join(" - ").trim() };
  }
  return { name: line.trim(), measure: "" };
};

/**
 * Builds ingredients list from either:
 * - meal.ingredients (array of "Name - Measure" strings) — Favorites format
 * - meal.strIngredient1..20 + meal.strMeasure1..20 — MealDB / RecipeFinder format
 */
const buildIngredientsList = (meal) => {
  if (Array.isArray(meal?.ingredients) && meal.ingredients.length > 0) {
    return meal.ingredients
      .map((item) => parseIngredientLine(item))
      .filter((i) => i.name);
  }

  const list = [];
  for (let i = 1; i <= 20; i++) {
    const name = (meal?.[`strIngredient${i}`] || "").trim();
    const measure = (meal?.[`strMeasure${i}`] || "").trim();
    if (name) list.push({ name, measure });
  }
  return list;
};

export default function ServingCalculator({ meal, onClose }) {
  const [baseServings, setBaseServings] = useState(2);
  const [currentServings, setCurrentServings] = useState(2);

  const ingredients = useMemo(() => buildIngredientsList(meal), [meal]);
  const factor = currentServings / baseServings;

  const title = meal?.strMeal || meal?.strDrink || meal?.title || "Recipe";

  const decrement = () => {
    setCurrentServings((s) => Math.max(1, s - 1));
  };

  const increment = () => {
    setCurrentServings((s) => Math.min(99, s + 1));
  };

  const resetToBase = () => {
    setCurrentServings(baseServings);
  };

  return (
    <div className="sc-overlay" onClick={onClose}>
      <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sc-header">
          <div className="sc-header-text">
            <span className="sc-icon">🍴</span>
            <h2 className="sc-title">{title}</h2>
          </div>
          <button className="sc-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Serving control */}
        <div className="sc-serving-bar">
          <span className="sc-serving-label">Servings</span>
          <div className="sc-serving-controls">
            <button
              className="sc-btn sc-btn-minus"
              onClick={decrement}
              disabled={currentServings <= 1}
              aria-label="Decrease servings"
            >
              −
            </button>
            <span className="sc-serving-count">{currentServings}</span>
            <button
              className="sc-btn sc-btn-plus"
              onClick={increment}
              aria-label="Increase servings"
            >
              +
            </button>
          </div>
          {currentServings !== baseServings && (
            <button className="sc-reset" onClick={resetToBase}>
              Reset to {baseServings}
            </button>
          )}
          {currentServings !== baseServings && (
            <span className="sc-scale-badge">
              {factor > 1 ? `×${parseFloat(factor.toFixed(2))}` : `÷${parseFloat((1 / factor).toFixed(2))}`}
            </span>
          )}
        </div>

        {/* Ingredients list */}
        <div className="sc-ingredients">
          <h3 className="sc-section-title">Ingredients</h3>
          <ul className="sc-list">
            {ingredients.map((ing, i) => {
              const scaledMeasure = ing.measure
                ? scaleMeasure(ing.measure, factor)
                : "";
              const changed =
                currentServings !== baseServings && ing.measure && scaledMeasure !== ing.measure;

              return (
                <li key={i} className={`sc-item ${changed ? "sc-item--changed" : ""}`}>
                  <span className="sc-ing-name">{ing.name}</span>
                  {scaledMeasure && (
                    <span className="sc-ing-measure">
                      {scaledMeasure}
                      {changed && (
                        <span className="sc-original"> (was {ing.measure})</span>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
            {ingredients.length === 0 && (
              <li className="sc-empty">No ingredients found.</li>
            )}
          </ul>
        </div>

        <p className="sc-footer-note">
          Base recipe is for <strong>{baseServings}</strong> servings.
          Adjust above to scale all quantities automatically.
        </p>
      </div>
    </div>
  );
}