const express = require("express");
const axios = require("axios");
const path = require("path");
const router = express.Router();
require("dotenv").config();

const apiKey = process.env.SPOONACULAR_API_KEY;

router.get("/random", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/randomrecipe.html"));
});


router.get("/api/random", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/random`,
      {
        params: { apiKey },
      }
    );
    const recipe = response.data.recipes[0];
    res.json({
      title: recipe.title,
      image: recipe.image,
      instructions: recipe.instructions,
      ingredients: recipe.extendedIngredients.map((i) => i.original),
      summary: recipe.summary, // <-- أضف هذا
      readyInMinutes: recipe.readyInMinutes, // <-- وأضف هذا
      id: recipe.id, // مهم للاستخدام في التفاصيل
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch random recipe" });
  }
});

router.get("/search", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/search.html"));
});

// API بحث بالوصفات بالاسم (باستخدام باراميتر q)
router.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query)
    return res.status(400).json({ error: "Query parameter 'q' is required" });

  try {
    // نستخدم API للبحث عن وصفات بالاسم
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/complexSearch`,
      {
        params: {
          apiKey,
          query,
          number: 10,
          addRecipeInformation: true, // لنجلب تفاصيل إضافية مثل الصورة
        },
      }
    );

    const recipes = response.data.map((recipe) => ({
      title: recipe.title,
      image: recipe.image,
      id: recipe.id,
      usedIngredients: recipe.usedIngredients,
      missedIngredients: recipe.missedIngredients,
    }));

    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

router.get("/api/by-ingredients", async (req, res) => {
  const ingredients = req.query.ingredients;
  if (!ingredients)
    return res.status(400).json({ error: "Ingredients query is required" });

  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/findByIngredients`,
      {
        params: {
          apiKey,
          ingredients, // مثلاً: "chicken,rice"
          number: 10,
        },
      }
    );

    const recipes = response.data.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      usedIngredients: recipe.usedIngredients,
      missedIngredients: recipe.missedIngredients,
    }));

    res.json(recipes);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

router.get("/favorites", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/favorites.html"));
});

router.get("/recp-details", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/recipe-details.html"));
});

router.get("/api/:id/information", async (req, res) => {
  const recipeId = req.params.id;

  try {
    const apiRes = await axios.get(
      `https://api.spoonacular.com/recipes/${recipeId}/information`,
      {
        params: { apiKey },
      }
    );
    res.json(apiRes.data);
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    res.status(500).json({ error: "Failed to fetch recipe details" });
  }
});

module.exports = router;
