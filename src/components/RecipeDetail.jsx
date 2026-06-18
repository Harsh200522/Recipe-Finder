import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SEO from "./SEO";
import { createRecipeSchema } from "./StructuredData";
import "../style/recipe-detail.css";

const RecipeDetail = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) {
        setError("No recipe ID provided.");
        setRecipe(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(
            id
          )}`
        );
        const data = await response.json();
        const meal = data?.meals?.[0];

        if (!meal) {
          setError("Recipe not found.");
          setRecipe(null);
        } else {
          const ingredients = [];
          for (let index = 1; index <= 20; index += 1) {
            const name = meal[`strIngredient${index}`];
            const measure = meal[`strMeasure${index}`];
            if (name && name.trim()) {
              ingredients.push(
                `${measure?.trim() || ""} ${name.trim()}`.trim()
              );
            }
          }

          const instructions = meal.strInstructions
            ? meal.strInstructions
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
            : [];

          setRecipe({
            id: meal.idMeal,
            name: meal.strMeal,
            image: meal.strMealThumb,
            description: meal.strCategory
              ? `${meal.strCategory} • ${meal.strArea}`
              : meal.strArea,
            category: meal.strCategory || "Recipe",
            cuisine: meal.strArea || "International",
            ingredients,
            instructions,
            prepTime: meal.strTags ? "PT15M" : "PT15M",
            cookTime: meal.strTags ? "PT30M" : "PT30M",
            totalTime: "PT45M",
            servings: 4,
            author: "Recipe Finder Team",
            nutrition: {
              calories: null,
              protein: null,
              carbs: null,
              fat: null,
              fiber: null,
            },
            keywords: [meal.strCategory, meal.strArea]
              .filter(Boolean)
              .map((value) => value.toLowerCase()),
            slug: meal.idMeal,
            datePublished: new Date().toISOString(),
            dateModified: new Date().toISOString(),
          });
        }
      } catch (fetchError) {
        setError("Unable to load recipe details.");
        setRecipe(null);
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) {
    return <div className="loading">Loading recipe details...</div>;
  }

  if (!recipe || error) {
    return (
      <div className="recipe-detail">
        <div className="notfound">
          <h1>Recipe Not Found</h1>
          <p>{error || "The requested recipe could not be loaded."}</p>
          <Link to="/" className="btn">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const recipeSchema = createRecipeSchema(recipe);

  return (
    <div className="recipe-detail">
      <SEO
        title={`${recipe.name} | Recipe Finder`}
        description={recipe.description}
        keywords={recipe.keywords.join(", ")}
        image={recipe.image}
        url={`/recipe/${recipe.id}`}
        type="article"
        schema={recipeSchema}
        author={recipe.author}
        publishedDate={recipe.datePublished}
        modifiedDate={recipe.dateModified}
      />

      <div className="recipe-hero">
        <div className="hero-left">
          <span className="recipe-meta">{recipe.description}</span>
          <h1>{recipe.name}</h1>
          <div className="recipe-meta">
            <span>{recipe.category}</span>
            <span> • </span>
            <span>{recipe.cuisine}</span>
          </div>
          <p>
            This recipe page loads details for MealDB recipes by ID. Use the
            route <code>/recipe/&lt;id&gt;</code>.
          </p>
          <Link to="/" className="btn">
            Back to Home
          </Link>
        </div>

        <div className="hero-right">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="recipe-image"
          />
        </div>
      </div>

      <div className="recipe-grid">
        <aside className="recipe-sidebar">
          <h3>Recipe Info</h3>
          <ul>
            <li>
              <strong>Category:</strong> {recipe.category}
            </li>
            <li>
              <strong>Cuisine:</strong> {recipe.cuisine}
            </li>
            <li>
              <strong>Servings:</strong> {recipe.servings}
            </li>
            <li>
              <strong>Prep Time:</strong> {recipe.prepTime}
            </li>
            <li>
              <strong>Cook Time:</strong> {recipe.cookTime}
            </li>
          </ul>
        </aside>

        <main className="recipe-main">
          <section className="ingredients">
            <h2>Ingredients</h2>
            <ul>
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </section>

          <section className="instructions">
            <h2>Instructions</h2>
            <ol>
              {recipe.instructions.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </section>
        </main>
      </div>
    </div>
  );
};

export default RecipeDetail;
