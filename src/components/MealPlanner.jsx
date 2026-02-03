// src/components/MealPlanner.jsx
import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "../config/firbase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../style/mealplanner.css";
import videoSrc from "../video/Cartoon.mp4";
import { FaUtensils } from "react-icons/fa";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const meals = ["Breakfast", "Lunch", "Dinner"];

/* ---------- Helper: create empty planner ---------- */
const createEmptyPlanner = () => {
  const obj = {};
  days.forEach((d) => {
    obj[d] = {};
    meals.forEach((m) => (obj[d][m] = null));
  });
  return obj;
};

export default function MealPlanner() {
  const [planner, setPlanner] = useState(createEmptyPlanner());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  const initialPlannerRef = useRef(null);
  const navigate = useNavigate();

  /* =========================================================
     🚀 BLOCK REACT ROUTER NAVIGATION (REAL BLOCKER)
     ========================================================= */
  useEffect(() => {
    const handleRouteBlock = (e) => {
      if (!hasUnsavedChanges) return;

      const link = e.target.closest("a");

      // only block internal router links
      if (link && link.getAttribute("href")) {
        e.preventDefault();
        e.stopPropagation();

        Swal.fire({
          icon: "warning",
          title: "Unsaved Changes ⚠️",
          text: "Please save your planner before leaving.",
          confirmButtonText: "OK",
        });
      }
    };

    // IMPORTANT: capture phase = true (blocks BEFORE router)
    document.addEventListener("click", handleRouteBlock, true);

    return () => {
      document.removeEventListener("click", handleRouteBlock, true);
    };
  }, [hasUnsavedChanges]);

  /* =========================================================
     🚀 BLOCK REFRESH / CLOSE TAB
     ========================================================= */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!hasUnsavedChanges) return;

      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  /* ---------- Listen auth safely ---------- */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  /* ---------- Fetch planner ---------- */
  useEffect(() => {
    const fetchPlanner = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "MealPlanner", user.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const fetchedPlanner = snap.data().planner;
          setPlanner(fetchedPlanner);
          initialPlannerRef.current = JSON.parse(JSON.stringify(fetchedPlanner));
        } else {
          const emptyPlanner = createEmptyPlanner();
          setPlanner(emptyPlanner);
          initialPlannerRef.current = JSON.parse(JSON.stringify(emptyPlanner));
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to load planner", "error");
      }

      setLoading(false);
    };

    fetchPlanner();
  }, [user]);

  /* ---------- Check for unsaved changes ---------- */
  useEffect(() => {
    if (!initialPlannerRef.current) return;

    const currentPlannerStr = JSON.stringify(planner);
    const initialPlannerStr = JSON.stringify(initialPlannerRef.current);

    setHasUnsavedChanges(currentPlannerStr !== initialPlannerStr);
  }, [planner]);

  /* ---------- Save planner ---------- */
  const savePlanner = async () => {
    if (!user) {
      Swal.fire("Login Required", "Please login first", "warning");
      return;
    }

    setIsSaving(true);

    try {
      await setDoc(doc(db, "MealPlanner", user.uid), { planner });

      initialPlannerRef.current = JSON.parse(JSON.stringify(planner));
      setHasUnsavedChanges(false);
      setLastSavedTime(new Date());

      Swal.fire({
        title: "Saved Successfully! ✅",
        text: "Your meal plan has been saved.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire("Error", "Failed to save planner", "error");
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------- Add / Change meal ---------- */
 const assignMeal = async (day, meal) => {
  let selectedMeal = null;

  await Swal.fire({
    title: `🍴 ${day} - ${meal}`,
    html: `
      <input id="mealInput" class="swal2-input" placeholder="Search meal...">
      <div id="suggestions" style="
        max-height:200px;
        overflow-y:auto;
        text-align:left;
        margin-top:10px;
      "></div>
    `,
    showCancelButton: true,
    confirmButtonText: "Add",
    didOpen: () => {
      const input = document.getElementById("mealInput");
      const suggestionsDiv = document.getElementById("suggestions");

      let debounceTimer;

      input.addEventListener("input", () => {
        const query = input.value.trim();

        clearTimeout(debounceTimer);

        // small debounce (better UX)
        debounceTimer = setTimeout(async () => {
          if (!query) {
            suggestionsDiv.innerHTML = "";
            return;
          }

          try {
            const res = await fetch(
              `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`
            );

            const data = await res.json();

            if (!data.meals) {
              suggestionsDiv.innerHTML = "<p>No results</p>";
              return;
            }

            suggestionsDiv.innerHTML = "";

            data.meals.slice(0, 6).forEach((m) => {
              const item = document.createElement("div");

              item.style.cssText = `
                display:flex;
                align-items:center;
                gap:10px;
                padding:6px;
                cursor:pointer;
                border-radius:6px;
              `;

              item.innerHTML = `
                <img src="${m.strMealThumb}" width="40" height="40" style="border-radius:6px"/>
                <span>${m.strMeal}</span>
              `;

              item.onclick = () => {
                selectedMeal = {
                  idMeal: m.idMeal,
                  strMeal: m.strMeal,
                  strMealThumb: m.strMealThumb,
                };

                input.value = m.strMeal;
                suggestionsDiv.innerHTML = "";
              };

              suggestionsDiv.appendChild(item);
            });
          } catch {
            suggestionsDiv.innerHTML = "Error loading results";
          }
        }, 300);
      });
    },
    preConfirm: () => {
      if (!selectedMeal) {
        Swal.showValidationMessage("Please select a meal from suggestions");
      }
      return selectedMeal;
    },
  }).then((result) => {
    if (!result.isConfirmed) return;

    const m = result.value;

    setPlanner((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [meal]: m,
      },
    }));

    Swal.fire("Added ✅", `${m.strMeal} added successfully`, "success");
  });
};

  /* ---------- Remove meal ---------- */
  const removeMeal = (day, meal) => {
    Swal.fire({
      title: "Remove meal?",
      icon: "warning",
      showCancelButton: true,
    }).then((res) => {
      if (!res.isConfirmed) return;

      setPlanner((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          [meal]: null,
        },
      }));
    });
  };

  /* ---------- Reset all changes ---------- */
  const resetChanges = () => {
    Swal.fire({
      title: "Reset all changes?",
      text: "This will revert all unsaved changes.",
      icon: "warning",
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setPlanner(JSON.parse(JSON.stringify(initialPlannerRef.current)));
        setHasUnsavedChanges(false);
        Swal.fire("Reset!", "All changes have been reverted.", "success");
      }
    });
  };

  /* ---------- Loading ---------- */
  if (loading) {
    return <div className="loading">Loading planner...</div>;
  }

  return (
    <div className="meal-planner">
      <div className="video-banner">
        <video autoPlay loop muted playsInline className="top-video">
          <source src={videoSrc} type="video/mp4" />
        </video>

        <div className="video-overlay">
          <h1 className="planner-title">
            <FaUtensils className="planner-icon" />
              Weekly Meal Planner
          </h1>
        </div>
      </div>

      <div className="meal-content">

        <div className="save-status-bar">
          <div className="save-status-left">
            {hasUnsavedChanges && (
              <div className="unsaved-changes">
                <span className="unsaved-dot">●</span>
                Unsaved Changes
              </div>
            )}

            {lastSavedTime && !hasUnsavedChanges && (
              <div className="last-saved">
                Last saved:{" "}
                {lastSavedTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>

          <div className="save-actions">
            {hasUnsavedChanges && (
              <button onClick={resetChanges} className="reset-btn">
                Reset
              </button>
            )}

            <button
              onClick={savePlanner}
              className="save-btn"
              disabled={!hasUnsavedChanges}
            >
              Save Planner
            </button>
          </div>
        </div>

        <div className="meal-grid">
          {days.map((day) => (
            <div key={day} className="day-card">
              <h3>{day}</h3>

              {meals.map((meal) => (
                <div key={meal} className="meal-row">
                  <span className="meal-label">{meal}</span>

                  {planner[day]?.[meal] ? (
                    <div className="meal-details">
                      <img
                        src={planner[day][meal].strMealThumb}
                        alt={planner[day][meal].strMeal}
                      />
                      <span className="meal-name">
                        {planner[day][meal].strMeal}
                      </span>
                      <button
                        className="remove-btn"
                        onClick={() => removeMeal(day, meal)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="not-set">Not set</span>
                  )}

                  <button
                    className="add-btn"
                    onClick={() => assignMeal(day, meal)}
                  >
                    {planner[day]?.[meal] ? "Change" : "Add"}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
